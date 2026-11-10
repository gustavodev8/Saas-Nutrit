-- LOCAL CANDIDATE ONLY: validate after the full replay in an isolated database.
-- Do not apply to a remote or production environment without separate approval.
-- Invitation links are explicit identity authorization; email/CPF are never matched.

CREATE TABLE public.patient_portal_link_invitations (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  workspace_id uuid NOT NULL
    REFERENCES public.workspaces(id) ON DELETE NO ACTION,
  patient_id bigint NOT NULL,
  created_by uuid NOT NULL,
  token_hash text NOT NULL UNIQUE
    CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_by uuid,
  accepted_at timestamptz,
  revoked_by uuid,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT patient_portal_link_invitations_patient_workspace_fkey
    FOREIGN KEY (workspace_id, patient_id)
    REFERENCES public.patients(workspace_id, id)
    ON DELETE CASCADE,
  CONSTRAINT patient_portal_link_invitations_expiry_check
    CHECK (expires_at > created_at AND expires_at <= created_at + interval '24 hours'),
  CONSTRAINT patient_portal_link_invitations_status_check
    CHECK (
      (status = 'pending' AND accepted_by IS NULL AND accepted_at IS NULL AND revoked_by IS NULL AND revoked_at IS NULL)
      OR (status = 'accepted' AND accepted_by IS NOT NULL AND accepted_at IS NOT NULL AND revoked_by IS NULL AND revoked_at IS NULL)
      OR (status = 'revoked' AND accepted_by IS NULL AND accepted_at IS NULL AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL)
    )
);

CREATE TABLE public.patient_portal_link_identity_history (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_linked_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.patient_portal_link_identity_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.patient_portal_link_identity_history
  FROM PUBLIC, anon, authenticated, service_role;

INSERT INTO public.patient_portal_link_identity_history (auth_user_id, first_linked_at)
SELECT link.auth_user_id, min(link.created_at)
FROM public.patient_portal_workspace_links AS link
GROUP BY link.auth_user_id
ON CONFLICT (auth_user_id) DO NOTHING;

CREATE UNIQUE INDEX patient_portal_link_invitations_one_pending_per_patient
  ON public.patient_portal_link_invitations (workspace_id, patient_id)
  WHERE status = 'pending';
CREATE INDEX patient_portal_link_invitations_expiry_idx
  ON public.patient_portal_link_invitations (expires_at)
  WHERE status = 'pending';
CREATE UNIQUE INDEX patient_portal_workspace_links_one_active_account_per_patient
  ON public.patient_portal_workspace_links (workspace_id, patient_id)
  WHERE status = 'active';

ALTER TABLE public.patient_portal_link_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.patient_portal_link_invitations
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.patient_portal_workspace_links
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.patient_portal_workspace_links TO authenticated;

CREATE FUNCTION public.create_patient_portal_link_invitation(
  p_workspace_id uuid,
  p_patient_id bigint,
  p_created_by uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_invitation_id uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
    OR p_workspace_id IS NULL
    OR p_patient_id IS NULL
    OR p_created_by IS NULL
    OR p_token_hash IS NULL
    OR p_token_hash !~ '^[a-f0-9]{64}$'
    OR p_expires_at IS NULL
    OR p_expires_at <= pg_catalog.now()
    OR p_expires_at > pg_catalog.now() + interval '24 hours' THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces AS workspace
    WHERE workspace.id = p_workspace_id
  ) THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members AS member
    WHERE member.workspace_id = p_workspace_id
      AND member.user_id = p_created_by
      AND member.role = 'owner'
      AND member.status = 'active'
  ) THEN
    RETURN NULL;
  END IF;

  PERFORM 1 FROM public.patients AS patient
  WHERE patient.id = p_patient_id
    AND patient.workspace_id = p_workspace_id
    AND patient.workspace_id IS NOT NULL
  FOR KEY SHARE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_workspace_id::text || ':' || p_patient_id::text, 0)
  );

  IF EXISTS (
    SELECT 1 FROM public.patient_portal_workspace_links AS link
    WHERE link.workspace_id = p_workspace_id
      AND link.patient_id = p_patient_id
      AND link.status = 'active'
  ) THEN
    RETURN NULL;
  END IF;

  UPDATE public.patient_portal_link_invitations AS invitation
  SET status = 'revoked', revoked_by = p_created_by,
      revoked_at = pg_catalog.now(), updated_at = pg_catalog.now()
  WHERE invitation.workspace_id = p_workspace_id
    AND invitation.patient_id = p_patient_id
    AND invitation.status = 'pending';

  INSERT INTO public.patient_portal_link_invitations (
    workspace_id, patient_id, created_by, token_hash, expires_at
  ) VALUES (
    p_workspace_id, p_patient_id, p_created_by, p_token_hash, p_expires_at
  )
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
END;
$function$;

CREATE FUNCTION public.accept_patient_portal_link_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_token_hash text;
  v_invitation_id uuid;
  v_workspace_id uuid;
  v_patient_id bigint;
  v_invitation public.patient_portal_link_invitations%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated'
    OR v_auth_user_id IS NULL
    OR p_token IS NULL
    OR p_token !~ '^[a-f0-9]{64}$' THEN
    RETURN NULL;
  END IF;

  v_token_hash := pg_catalog.encode(extensions.digest(p_token, 'sha256'), 'hex');

  SELECT invitation.id, invitation.workspace_id, invitation.patient_id
  INTO v_invitation_id, v_workspace_id, v_patient_id
  FROM public.patient_portal_link_invitations AS invitation
  WHERE invitation.token_hash = v_token_hash;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  PERFORM 1 FROM public.patients AS patient
  WHERE patient.id = v_patient_id
    AND patient.workspace_id = v_workspace_id
    AND patient.workspace_id IS NOT NULL
  FOR KEY SHARE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_workspace_id::text || ':' || v_patient_id::text, 0)
  );

  SELECT invitation.* INTO v_invitation
  FROM public.patient_portal_link_invitations AS invitation
  WHERE invitation.id = v_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_invitation.status = 'accepted' THEN
    IF v_invitation.accepted_by = v_auth_user_id AND EXISTS (
      SELECT 1 FROM public.patient_portal_workspace_links AS link
      WHERE link.auth_user_id = v_auth_user_id
        AND link.workspace_id = v_invitation.workspace_id
        AND link.patient_id = v_invitation.patient_id
        AND link.status = 'active'
    ) THEN
      RETURN v_invitation.workspace_id;
    END IF;
    RETURN NULL;
  END IF;

  IF v_invitation.status <> 'pending'
    OR v_invitation.expires_at <= pg_catalog.now()
    OR NOT EXISTS (
      SELECT 1 FROM public.workspaces AS workspace
      WHERE workspace.id = v_invitation.workspace_id
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = v_invitation.patient_id
        AND patient.workspace_id = v_invitation.workspace_id
        AND patient.workspace_id IS NOT NULL
    ) THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.patient_portal_workspace_links AS link
    WHERE link.workspace_id = v_invitation.workspace_id
      AND link.patient_id = v_invitation.patient_id
      AND link.status = 'active'
      AND link.auth_user_id <> v_auth_user_id
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.patient_portal_workspace_links (
    auth_user_id, workspace_id, patient_id, status, revoked_at, updated_at
  ) VALUES (
    v_auth_user_id, v_invitation.workspace_id, v_invitation.patient_id,
    'active', NULL, pg_catalog.now()
  )
  ON CONFLICT (auth_user_id, workspace_id, patient_id)
  DO UPDATE SET status = 'active', revoked_at = NULL, updated_at = pg_catalog.now();

  INSERT INTO public.patient_portal_link_identity_history (auth_user_id, first_linked_at)
  VALUES (v_auth_user_id, pg_catalog.now())
  ON CONFLICT (auth_user_id) DO NOTHING;

  UPDATE public.patient_portal_link_invitations
  SET status = 'accepted', accepted_by = v_auth_user_id,
      accepted_at = pg_catalog.now(), updated_at = pg_catalog.now()
  WHERE id = v_invitation.id AND status = 'pending';

  RETURN v_invitation.workspace_id;
END;
$function$;

CREATE FUNCTION public.revoke_patient_portal_workspace_link(
  p_workspace_id uuid,
  p_patient_id bigint,
  p_auth_user_id uuid,
  p_revoked_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
    OR p_workspace_id IS NULL
    OR p_patient_id IS NULL
    OR p_auth_user_id IS NULL
    OR p_revoked_by IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces AS workspace
    WHERE workspace.id = p_workspace_id
  ) THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members AS member
    WHERE member.workspace_id = p_workspace_id
      AND member.user_id = p_revoked_by
      AND member.role = 'owner'
      AND member.status = 'active'
  ) THEN
    RETURN false;
  END IF;

  PERFORM 1 FROM public.patients AS patient
  WHERE patient.id = p_patient_id
    AND patient.workspace_id = p_workspace_id
    AND patient.workspace_id IS NOT NULL
  FOR KEY SHARE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_workspace_id::text || ':' || p_patient_id::text, 0)
  );

  UPDATE public.patient_portal_link_invitations AS invitation
  SET status = 'revoked', revoked_by = p_revoked_by,
      revoked_at = pg_catalog.now(), updated_at = pg_catalog.now()
  WHERE invitation.workspace_id = p_workspace_id
    AND invitation.patient_id = p_patient_id
    AND invitation.status = 'pending';

  UPDATE public.patient_portal_workspace_links AS link
  SET status = 'revoked', revoked_at = pg_catalog.now(), updated_at = pg_catalog.now()
  WHERE link.workspace_id = p_workspace_id
    AND link.patient_id = p_patient_id
    AND link.auth_user_id = p_auth_user_id
    AND link.status = 'active';

  RETURN EXISTS (
    SELECT 1 FROM public.patient_portal_link_invitations AS invitation
    WHERE invitation.workspace_id = p_workspace_id
      AND invitation.patient_id = p_patient_id
      AND invitation.status = 'revoked'
      AND invitation.revoked_by = p_revoked_by
  ) OR EXISTS (
    SELECT 1 FROM public.patient_portal_workspace_links AS link
    WHERE link.workspace_id = p_workspace_id
      AND link.patient_id = p_patient_id
      AND link.auth_user_id = p_auth_user_id
      AND link.status = 'revoked'
  );
END;
$function$;

CREATE FUNCTION public.list_patient_portal_workspace_links(
  p_workspace_id uuid,
  p_patient_id bigint,
  p_requested_by uuid
)
RETURNS TABLE(auth_user_id uuid, linked_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
    OR p_workspace_id IS NULL
    OR p_patient_id IS NULL
    OR p_requested_by IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.workspace_members AS member
      WHERE member.workspace_id = p_workspace_id
        AND member.user_id = p_requested_by
        AND member.role = 'owner'
        AND member.status = 'active'
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = p_patient_id
        AND patient.workspace_id = p_workspace_id
    ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT link.auth_user_id, link.created_at
  FROM public.patient_portal_workspace_links AS link
  WHERE link.workspace_id = p_workspace_id
    AND link.patient_id = p_patient_id
    AND link.status = 'active'
  ORDER BY link.created_at, link.auth_user_id;
END;
$function$;

CREATE FUNCTION public.list_my_active_patient_portal_workspace_links()
RETURNS TABLE(
  workspace_id uuid,
  workspace_name text,
  patient_id text,
  patient_name text,
  linked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_auth_user_id uuid := auth.uid();
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR v_auth_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT workspace.id, workspace.name, patient.id::text, patient.name, link.created_at
  FROM public.patient_portal_workspace_links AS link
  JOIN public.workspaces AS workspace ON workspace.id = link.workspace_id
  JOIN public.patients AS patient
    ON patient.id = link.patient_id AND patient.workspace_id = link.workspace_id
  WHERE link.auth_user_id = v_auth_user_id
    AND link.status = 'active'
  ORDER BY workspace.name, patient.name, link.created_at;
END;
$function$;

CREATE FUNCTION public.has_my_patient_portal_workspace_link_history()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() IS NOT DISTINCT FROM 'authenticated'
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (
      SELECT 1
      FROM public.patient_portal_link_identity_history AS history
      WHERE history.auth_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.patient_portal_workspace_links AS link
        WHERE link.auth_user_id = auth.uid()
      )
    );
$function$;

REVOKE ALL ON FUNCTION public.create_patient_portal_link_invitation(uuid, bigint, uuid, text, timestamptz)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.accept_patient_portal_link_invitation(text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.revoke_patient_portal_workspace_link(uuid, bigint, uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.list_patient_portal_workspace_links(uuid, bigint, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.list_my_active_patient_portal_workspace_links()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_my_patient_portal_workspace_link_history()
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_patient_portal_link_invitation(uuid, bigint, uuid, text, timestamptz)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_patient_portal_link_invitation(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_patient_portal_workspace_link(uuid, bigint, uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.list_patient_portal_workspace_links(uuid, bigint, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.list_my_active_patient_portal_workspace_links()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_my_patient_portal_workspace_link_history()
  TO authenticated;

-- Invitations are issued only by trusted server-side code. The invitee accepts
-- with their own authenticated identity; client writes to workspace tables stay disabled.
CREATE TABLE public.workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_email text NOT NULL CHECK (
    invited_email = pg_catalog.lower(pg_catalog.btrim(invited_email))
    AND invited_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  workspace_name text NOT NULL CHECK (char_length(pg_catalog.btrim(workspace_name)) BETWEEN 1 AND 120),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  expires_at timestamptz NOT NULL,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at timestamptz,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CHECK (
    (status = 'accepted' AND accepted_by IS NOT NULL AND accepted_at IS NOT NULL AND workspace_id IS NOT NULL)
    OR (status <> 'accepted' AND accepted_by IS NULL AND accepted_at IS NULL AND workspace_id IS NULL)
  )
);

CREATE UNIQUE INDEX workspace_invitations_one_pending_email
  ON public.workspace_invitations (invited_email)
  WHERE status = 'pending';
CREATE INDEX workspace_invitations_expires_at_idx
  ON public.workspace_invitations (expires_at)
  WHERE status = 'pending';

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.workspace_invitations FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.create_workspace_invitation(
  p_email text,
  p_workspace_name text,
  p_token_hash text,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_email, '')));
  v_invitation_id uuid;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) IS DISTINCT FROM 'service_role'
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR p_workspace_name IS NULL
    OR pg_catalog.char_length(pg_catalog.btrim(p_workspace_name)) NOT BETWEEN 1 AND 120
    OR p_token_hash IS NULL
    OR p_token_hash !~ '^[a-f0-9]{64}$'
    OR p_expires_at IS NULL
    OR p_expires_at < pg_catalog.now() + interval '1 minute'
    OR p_expires_at > pg_catalog.now() + interval '30 days' THEN
    RETURN NULL;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('workspace-invitation:' || v_email, 0)
  );

  UPDATE public.workspace_invitations
  SET status = 'revoked'
  WHERE invited_email = v_email AND status = 'pending';

  INSERT INTO public.workspace_invitations (
    invited_email, workspace_name, token_hash, expires_at
  ) VALUES (
    v_email, pg_catalog.btrim(p_workspace_name), p_token_hash, p_expires_at
  )
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
EXCEPTION WHEN unique_violation THEN
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_workspace_invitation(text, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_workspace_invitation(text, text, text, timestamptz)
  TO service_role;

CREATE FUNCTION public.accept_workspace_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_email_confirmed_at timestamptz;
  v_invitation public.workspace_invitations%ROWTYPE;
  v_workspace_id uuid;
  v_role text := coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
BEGIN
  IF v_role IS DISTINCT FROM 'authenticated'
    OR v_user_id IS NULL
    OR p_token IS NULL
    OR p_token !~ '^[a-fA-F0-9]{64}$' THEN
    RETURN NULL;
  END IF;

  SELECT pg_catalog.lower(pg_catalog.btrim(user_record.email)), user_record.email_confirmed_at
  INTO v_email, v_email_confirmed_at
  FROM auth.users AS user_record
  WHERE user_record.id = v_user_id;

  IF NOT FOUND OR v_email_confirmed_at IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_invitation
  FROM public.workspace_invitations AS invitation
  WHERE invitation.token_hash = pg_catalog.encode(
    extensions.digest(pg_catalog.lower(p_token), 'sha256'), 'hex'
  )
  FOR UPDATE;

  IF NOT FOUND OR v_invitation.invited_email <> v_email THEN
    RETURN NULL;
  END IF;

  IF v_invitation.status = 'accepted'
    AND v_invitation.accepted_by = v_user_id
    AND v_invitation.workspace_id IS NOT NULL THEN
    RETURN v_invitation.workspace_id;
  END IF;

  IF v_invitation.status <> 'pending'
    OR v_invitation.expires_at <= pg_catalog.now() THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.workspaces (name)
  VALUES (v_invitation.workspace_name)
  RETURNING id INTO v_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (v_workspace_id, v_user_id, 'owner', 'active');

  UPDATE public.workspace_invitations
  SET status = 'accepted',
      accepted_by = v_user_id,
      accepted_at = pg_catalog.now(),
      workspace_id = v_workspace_id
  WHERE id = v_invitation.id;

  RETURN v_workspace_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_workspace_invitation(text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(text)
  TO authenticated;

COMMENT ON TABLE public.workspace_invitations IS
  'Private one-time invitations. The raw token is never stored; clients cannot read or write invitation rows.';
COMMENT ON FUNCTION public.create_workspace_invitation(text, text, text, timestamptz) IS
  'Creates or replaces a pending invitation. Trusted service-role callers store only a hash of a random token.';
COMMENT ON FUNCTION public.accept_workspace_invitation(text) IS
  'Atomically creates a workspace and active owner membership for the authenticated, email-confirmed invitee; retries return the same workspace.';

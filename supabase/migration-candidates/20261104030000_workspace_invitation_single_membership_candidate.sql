-- Candidate only: serialize invitation issuance/acceptance and enforce the
-- pilot contract of one active workspace membership per authenticated user.
-- Do not apply remotely as part of this implementation task.

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT member.user_id
    FROM public.workspace_members AS member
    WHERE member.status = 'active'
    GROUP BY member.user_id
    HAVING pg_catalog.count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one active workspace per user: duplicate active memberships exist';
  END IF;
END;
$preflight$;

CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_one_active_workspace_per_user
  ON public.workspace_members (user_id)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.create_workspace_invitation(
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

  IF EXISTS (
    SELECT 1
    FROM public.workspace_members AS member
    JOIN auth.users AS user_record ON user_record.id = member.user_id
    WHERE member.status = 'active'
      AND pg_catalog.lower(pg_catalog.btrim(user_record.email)) = v_email
  ) THEN
    RETURN NULL;
  END IF;

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

CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(p_token text)
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
  v_active_email_memberships integer;
  v_active_user_memberships integer;
  v_active_user_workspace text;
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
  WHERE user_record.id = v_user_id
  FOR SHARE;

  IF NOT FOUND OR v_email_confirmed_at IS NULL OR v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Keep lock order stable: email first (shared with create RPC), then user.
  -- The invitation row is locked only after these advisory locks to avoid
  -- deadlocks against issuance, which locks the email before touching rows.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('workspace-invitation:' || v_email, 0)
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('workspace-membership-user:' || v_user_id::text, 0)
  );

  SELECT * INTO v_invitation
  FROM public.workspace_invitations AS invitation
  WHERE invitation.token_hash = pg_catalog.encode(
    extensions.digest(pg_catalog.lower(p_token), 'sha256'), 'hex'
  )
  FOR UPDATE;

  IF NOT FOUND OR v_invitation.invited_email <> v_email THEN
    RETURN NULL;
  END IF;

  SELECT
    pg_catalog.count(*)::integer,
    pg_catalog.count(*) FILTER (WHERE member.user_id = v_user_id)::integer,
    pg_catalog.max(member.workspace_id::text) FILTER (WHERE member.user_id = v_user_id)
  INTO v_active_email_memberships, v_active_user_memberships, v_active_user_workspace
  FROM public.workspace_members AS member
  JOIN auth.users AS user_record ON user_record.id = member.user_id
  WHERE member.status = 'active'
    AND pg_catalog.lower(pg_catalog.btrim(user_record.email)) = v_email;

  IF v_invitation.status = 'accepted'
    AND v_invitation.accepted_by = v_user_id
    AND v_invitation.workspace_id IS NOT NULL
    AND v_active_email_memberships = 1
    AND v_active_user_memberships = 1
    AND v_active_user_workspace = v_invitation.workspace_id::text THEN
    RETURN v_invitation.workspace_id;
  END IF;

  IF v_invitation.status <> 'pending'
    OR v_invitation.expires_at <= pg_catalog.now()
    OR v_active_email_memberships <> 0 THEN
    RETURN NULL;
  END IF;

  BEGIN
    INSERT INTO public.workspaces (name)
    VALUES (v_invitation.workspace_name)
    RETURNING id INTO v_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
    VALUES (v_workspace_id, v_user_id, 'owner', 'active');
  EXCEPTION WHEN unique_violation THEN
    RETURN NULL;
  END;

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

COMMENT ON FUNCTION public.create_workspace_invitation(text, text, text, timestamptz) IS
  'Creates or replaces a pending invitation only when its normalized email has no active workspace membership.';
COMMENT ON FUNCTION public.accept_workspace_invitation(text) IS
  'Atomically accepts an email-confirmed invitation with serialized email/user guards; only one active membership per account is allowed, and retry of the same accepted invitation is idempotent.';

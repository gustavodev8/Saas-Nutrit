-- Candidate only: validate an invitation before creating a new Auth account.
-- Auth's before-user-created hook only consumes allow/error output, so a trigger
-- also strips the transient token before user_metadata is persisted.

CREATE SCHEMA IF NOT EXISTS saas_private;
REVOKE ALL ON SCHEMA saas_private FROM PUBLIC, anon, authenticated, service_role, supabase_auth_admin;
GRANT USAGE ON SCHEMA saas_private TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION saas_private.before_user_created_workspace_invitation(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_token text := event #>> '{user,user_metadata,workspace_invitation_token}';
  v_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(event #>> '{user,email}', '')));
BEGIN
  IF pg_catalog.jsonb_typeof(event) IS DISTINCT FROM 'object'
    OR pg_catalog.jsonb_typeof(event #> '{user}') IS DISTINCT FROM 'object'
    OR pg_catalog.jsonb_typeof(event #> '{user,user_metadata}') IS DISTINCT FROM 'object'
    OR v_token IS NULL
    OR v_token !~ '^[a-fA-F0-9]{64}$'
    OR pg_catalog.char_length(v_email) > 320
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RETURN pg_catalog.jsonb_build_object(
      'error', pg_catalog.jsonb_build_object(
        'http_code', 400,
        'message', 'Unable to create account with these invitation details.'
      )
    );
  END IF;

  PERFORM 1
  FROM public.workspace_invitations AS invitation
  WHERE invitation.token_hash = pg_catalog.encode(
      extensions.digest(pg_catalog.lower(v_token), 'sha256'), 'hex'
    )
    AND invitation.invited_email = v_email
    AND invitation.status = 'pending'
    AND invitation.expires_at > pg_catalog.now()
  FOR SHARE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'error', pg_catalog.jsonb_build_object(
        'http_code', 400,
        'message', 'Unable to create account with these invitation details.'
      )
    );
  END IF;

  RETURN pg_catalog.jsonb_set(
    event,
    '{user,user_metadata}',
    (event #> '{user,user_metadata}') - 'workspace_invitation_token',
    false
  );
END;
$function$;

REVOKE ALL ON FUNCTION saas_private.before_user_created_workspace_invitation(jsonb)
  FROM PUBLIC, anon, authenticated, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION saas_private.before_user_created_workspace_invitation(jsonb)
  TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION saas_private.strip_workspace_invitation_token_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.raw_user_meta_data IS NOT NULL
    AND NEW.raw_user_meta_data ? 'workspace_invitation_token' THEN
    NEW.raw_user_meta_data := NEW.raw_user_meta_data - 'workspace_invitation_token';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION saas_private.strip_workspace_invitation_token_from_auth_user()
  FROM PUBLIC, anon, authenticated, service_role, supabase_auth_admin;

DROP TRIGGER IF EXISTS strip_workspace_invitation_token_before_auth_user_insert ON auth.users;
CREATE TRIGGER strip_workspace_invitation_token_before_auth_user_insert
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION saas_private.strip_workspace_invitation_token_from_auth_user();

CREATE OR REPLACE FUNCTION public.validate_workspace_invitation_before_signup(
  p_token text,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_email, '')));
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-fA-F0-9]{64}$' THEN
    RETURN false;
  END IF;

  IF pg_catalog.char_length(v_email) > 320
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_invitations AS invitation
    WHERE invitation.token_hash = pg_catalog.encode(
      extensions.digest(pg_catalog.lower(p_token), 'sha256'), 'hex'
    )
      AND invitation.invited_email = v_email
      AND invitation.status = 'pending'
      AND invitation.expires_at > pg_catalog.now()
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_workspace_invitation_before_signup(text, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_workspace_invitation_before_signup(text, text)
  TO anon, authenticated;

COMMENT ON FUNCTION public.validate_workspace_invitation_before_signup(text, text) IS
  'Returns only whether a pending, unexpired workspace invitation matches a normalized email; never returns invitation fields or stores the raw token.';

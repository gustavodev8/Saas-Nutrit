-- Local pgTAP candidate test. Run after its paired candidate migration.
BEGIN;
SELECT plan(34);

INSERT INTO public.workspace_invitations (invited_email, workspace_name, token_hash, status, expires_at)
VALUES
  ('signup-invite@example.test', 'Valid invite', encode(extensions.digest(repeat('a', 64), 'sha256'), 'hex'), 'pending', now() + interval '7 days'),
  ('signup-invite@example.test', 'Expired invite', encode(extensions.digest(repeat('b', 64), 'sha256'), 'hex'), 'pending', now() - interval '1 minute'),
  ('signup-invite@example.test', 'Revoked invite', encode(extensions.digest(repeat('c', 64), 'sha256'), 'hex'), 'revoked', now() + interval '7 days');

SELECT ok(
  (SELECT prorettype = 'jsonb'::regtype FROM pg_proc
   WHERE oid = 'saas_private.before_user_created_workspace_invitation(jsonb)'::regprocedure),
  'Auth hook accepts and returns a JSONB event'
);
SELECT ok(
  (SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] FROM pg_proc
   WHERE oid = 'saas_private.before_user_created_workspace_invitation(jsonb)'::regprocedure),
  'Auth hook is SECURITY DEFINER with an empty search_path'
);
SELECT is(
  (SELECT pg_catalog.pg_get_userbyid(proowner) FROM pg_catalog.pg_proc
   WHERE oid = 'saas_private.before_user_created_workspace_invitation(jsonb)'::regprocedure),
  'postgres',
  'Auth hook is owned by postgres'
);
SELECT ok(
  (SELECT pg_catalog.has_table_privilege(
     pg_catalog.pg_get_userbyid(proowner),
     'public.workspace_invitations',
     'SELECT'
   )
   FROM pg_catalog.pg_proc
   WHERE oid = 'saas_private.before_user_created_workspace_invitation(jsonb)'::regprocedure),
  'Auth hook owner can SELECT workspace invitations'
);
SELECT ok(
  has_function_privilege('supabase_auth_admin', 'saas_private.before_user_created_workspace_invitation(jsonb)', 'EXECUTE'),
  'supabase_auth_admin can execute the Auth hook'
);
SELECT ok(
  NOT has_function_privilege('anon', 'saas_private.before_user_created_workspace_invitation(jsonb)', 'EXECUTE'),
  'anon cannot execute the Auth hook'
);
SELECT ok(
  NOT has_function_privilege('authenticated', 'saas_private.before_user_created_workspace_invitation(jsonb)', 'EXECUTE'),
  'authenticated cannot execute the Auth hook'
);
SELECT ok(
  NOT has_function_privilege('service_role', 'saas_private.before_user_created_workspace_invitation(jsonb)', 'EXECUTE'),
  'service_role cannot execute the Auth hook'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc AS function_record
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      coalesce(function_record.proacl, pg_catalog.acldefault('f', function_record.proowner))
    ) AS privilege
    WHERE function_record.oid = 'saas_private.before_user_created_workspace_invitation(jsonb)'::regprocedure
      AND privilege.grantee = 0
      AND privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute the Auth hook'
);
SELECT ok(
  has_schema_privilege('supabase_auth_admin', 'saas_private', 'USAGE'),
  'supabase_auth_admin can resolve the private Auth hook schema'
);
SELECT ok(NOT has_schema_privilege('anon', 'saas_private', 'USAGE'), 'anon cannot use the private schema');
SELECT ok(NOT has_schema_privilege('authenticated', 'saas_private', 'USAGE'), 'authenticated cannot use the private schema');
SELECT ok(NOT has_schema_privilege('service_role', 'saas_private', 'USAGE'), 'service_role cannot use the private schema');
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_namespace AS schema_record
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      coalesce(schema_record.nspacl, pg_catalog.acldefault('n', schema_record.nspowner))
    ) AS privilege
    WHERE schema_record.nspname = 'saas_private'
      AND privilege.grantee = 0
      AND privilege.privilege_type = 'USAGE'
  ),
  'PUBLIC cannot use the private schema'
);

SELECT set_config(
  'test.valid_hook_result',
  saas_private.before_user_created_workspace_invitation(
    pg_catalog.jsonb_build_object(
      'metadata', pg_catalog.jsonb_build_object('name', 'before-user-created'),
      'user', pg_catalog.jsonb_build_object(
        'email', 'SIGNUP-INVITE@example.test',
        'user_metadata', pg_catalog.jsonb_build_object(
          'display_name', 'Fixture User',
          'workspace_invitation_token', repeat('A', 64)
        )
      )
    )
  )::text,
  true
);
SELECT set_config(
  'test.invalid_token_hook_result',
  saas_private.before_user_created_workspace_invitation(
    pg_catalog.jsonb_build_object(
      'user', pg_catalog.jsonb_build_object(
        'email', 'signup-invite@example.test',
        'user_metadata', pg_catalog.jsonb_build_object('workspace_invitation_token', 'invalid')
      )
    )
  )::text,
  true
);
SELECT set_config(
  'test.missing_token_hook_result',
  saas_private.before_user_created_workspace_invitation(
    pg_catalog.jsonb_build_object(
      'user', pg_catalog.jsonb_build_object('email', 'signup-invite@example.test', 'user_metadata', '{}'::jsonb)
    )
  )::text,
  true
);
SELECT set_config(
  'test.email_mismatch_hook_result',
  saas_private.before_user_created_workspace_invitation(
    pg_catalog.jsonb_build_object(
      'user', pg_catalog.jsonb_build_object(
        'email', 'different@example.test',
        'user_metadata', pg_catalog.jsonb_build_object('workspace_invitation_token', repeat('a', 64))
      )
    )
  )::text,
  true
);
SELECT set_config(
  'test.expired_hook_result',
  saas_private.before_user_created_workspace_invitation(
    pg_catalog.jsonb_build_object(
      'user', pg_catalog.jsonb_build_object(
        'email', 'signup-invite@example.test',
        'user_metadata', pg_catalog.jsonb_build_object('workspace_invitation_token', repeat('b', 64))
      )
    )
  )::text,
  true
);
SELECT set_config(
  'test.revoked_hook_result',
  saas_private.before_user_created_workspace_invitation(
    pg_catalog.jsonb_build_object(
      'user', pg_catalog.jsonb_build_object(
        'email', 'signup-invite@example.test',
        'user_metadata', pg_catalog.jsonb_build_object('workspace_invitation_token', repeat('c', 64))
      )
    )
  )::text,
  true
);
SELECT is(
  current_setting('test.valid_hook_result')::jsonb,
  pg_catalog.jsonb_build_object(
    'metadata', pg_catalog.jsonb_build_object('name', 'before-user-created'),
    'user', pg_catalog.jsonb_build_object(
      'email', 'SIGNUP-INVITE@example.test',
      'user_metadata', pg_catalog.jsonb_build_object('display_name', 'Fixture User')
    )
  ),
  'valid hook event is returned with token removed and other metadata preserved'
);
SELECT is(
  current_setting('test.invalid_token_hook_result')::jsonb -> 'error',
  pg_catalog.jsonb_build_object('http_code', 400, 'message', 'Unable to create account with these invitation details.'),
  'invalid token receives a generic rejection'
);
SELECT is(
  current_setting('test.missing_token_hook_result')::jsonb -> 'error',
  pg_catalog.jsonb_build_object('http_code', 400, 'message', 'Unable to create account with these invitation details.'),
  'missing token receives a generic rejection'
);
SELECT is(
  current_setting('test.email_mismatch_hook_result')::jsonb -> 'error',
  pg_catalog.jsonb_build_object('http_code', 400, 'message', 'Unable to create account with these invitation details.'),
  'email mismatch receives a generic rejection'
);
SELECT is(
  current_setting('test.expired_hook_result')::jsonb -> 'error',
  pg_catalog.jsonb_build_object('http_code', 400, 'message', 'Unable to create account with these invitation details.'),
  'expired invitation receives a generic rejection'
);
SELECT is(
  current_setting('test.revoked_hook_result')::jsonb -> 'error',
  pg_catalog.jsonb_build_object('http_code', 400, 'message', 'Unable to create account with these invitation details.'),
  'revoked invitation receives a generic rejection'
);

INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000501',
  'signup-hook-trigger@example.test',
  'authenticated',
  'authenticated',
  'local-test-only',
  now(),
  pg_catalog.jsonb_build_object('display_name', 'Fixture User', 'workspace_invitation_token', repeat('a', 64))
);
SELECT ok(
  NOT ((SELECT raw_user_meta_data FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000501') ? 'workspace_invitation_token'),
  'BEFORE INSERT trigger prevents the raw invitation token from persisting in Auth metadata'
);
SELECT is(
  (SELECT raw_user_meta_data ->> 'display_name' FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000501'),
  'Fixture User',
  'BEFORE INSERT trigger preserves unrelated Auth metadata'
);

SELECT ok(
  (SELECT prorettype = 'boolean'::regtype FROM pg_proc
   WHERE oid = 'public.validate_workspace_invitation_before_signup(text,text)'::regprocedure),
  'validation RPC returns only a boolean'
);
SELECT ok(
  (SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] FROM pg_proc
   WHERE oid = 'public.validate_workspace_invitation_before_signup(text,text)'::regprocedure),
  'validation RPC is SECURITY DEFINER with an empty search_path'
);
SELECT ok(
  has_function_privilege('anon', 'public.validate_workspace_invitation_before_signup(text,text)', 'EXECUTE'),
  'anon can validate before signup'
);
SELECT ok(
  has_function_privilege('authenticated', 'public.validate_workspace_invitation_before_signup(text,text)', 'EXECUTE'),
  'authenticated can validate an invitation'
);
SELECT ok(
  NOT has_function_privilege('service_role', 'public.validate_workspace_invitation_before_signup(text,text)', 'EXECUTE'),
  'service_role has no execute grant on the validation RPC'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc AS function_record
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      coalesce(function_record.proacl, pg_catalog.acldefault('f', function_record.proowner))
    ) AS privilege
    WHERE function_record.oid = 'public.validate_workspace_invitation_before_signup(text,text)'::regprocedure
      AND privilege.grantee = 0
      AND privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC has no execute grant on the validation RPC'
);

SELECT is(
  public.validate_workspace_invitation_before_signup(repeat('A', 64), '  SIGNUP-INVITE@example.test  '),
  true,
  'matching pending invitation accepts normalized email and case-insensitive token'
);
SELECT is(
  public.validate_workspace_invitation_before_signup(repeat('a', 64), 'different@example.test'),
  false,
  'email that does not match the invitation is rejected'
);
SELECT is(
  public.validate_workspace_invitation_before_signup('not-a-64-character-token', 'signup-invite@example.test'),
  false,
  'token that is not exactly 64 hexadecimal characters is rejected'
);
SELECT is(
  public.validate_workspace_invitation_before_signup(repeat('b', 64), 'signup-invite@example.test'),
  false,
  'expired pending invitation is rejected'
);
SELECT is(
  public.validate_workspace_invitation_before_signup(repeat('c', 64), 'signup-invite@example.test'),
  false,
  'revoked invitation is rejected'
);
SELECT is(
  public.validate_workspace_invitation_before_signup(repeat('a', 64), 'not-an-email'),
  false,
  'malformed email is rejected'
);

SELECT * FROM finish();
ROLLBACK;

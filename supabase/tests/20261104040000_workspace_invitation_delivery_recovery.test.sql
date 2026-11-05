-- Local pgTAP candidate test. Run after its paired migration on the named scratch only.
BEGIN;
SELECT plan(24);

INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES
  ('00000000-0000-0000-0000-000000000401', 'invite-recovery@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000402', 'invite-race-recovery@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000403', 'already-member-recovery@example.test', 'authenticated', 'authenticated', 'x', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workspaces (id, name)
VALUES
  ('00000000-0000-0000-0000-0000000004a1', 'Existing workspace'),
  ('00000000-0000-0000-0000-0000000004a3', 'Second workspace');

INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES ('00000000-0000-0000-0000-0000000004a1', '00000000-0000-0000-0000-000000000403', 'owner', 'active');

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'workspace_members_one_active_workspace_per_user'
      AND indexdef ILIKE '%UNIQUE%'
  ),
  'unique index enforces one active workspace per auth user'
);
SELECT throws_ok(
  $sql$INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
       VALUES ('00000000-0000-0000-0000-0000000004a3', '00000000-0000-0000-0000-000000000403', 'owner', 'active')$sql$,
  '23505', NULL,
  'database rejects a second active membership for the same user'
);
SELECT ok(
  (SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] FROM pg_proc
   WHERE oid = 'public.create_workspace_invitation(text,text,text,timestamptz)'::regprocedure),
  'create RPC remains SECURITY DEFINER with an empty search_path'
);
SELECT ok(
  (SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] FROM pg_proc
   WHERE oid = 'public.accept_workspace_invitation(text)'::regprocedure),
  'accept RPC remains SECURITY DEFINER with an empty search_path'
);
SELECT ok(has_function_privilege('service_role', 'public.create_workspace_invitation(text,text,text,timestamptz)', 'EXECUTE'), 'service_role can create invitations');
SELECT ok(has_function_privilege('authenticated', 'public.accept_workspace_invitation(text)', 'EXECUTE'), 'authenticated can accept invitations');
SELECT ok(NOT has_function_privilege('authenticated', 'public.create_workspace_invitation(text,text,text,timestamptz)', 'EXECUTE'), 'authenticated cannot create invitations');
SELECT ok(NOT has_function_privilege('service_role', 'public.accept_workspace_invitation(text)', 'EXECUTE'), 'service_role cannot accept invitations');

SELECT set_config('request.jwt.claim.role', 'service_role', true);
SET LOCAL ROLE service_role;
SELECT set_config(
  'test.recovery_invitation_first',
  public.create_workspace_invitation(
    'invite-recovery@example.test', 'First name', encode(extensions.digest(repeat('a', 64), 'sha256'), 'hex'), now() + interval '7 days'
  )::text,
  true
);
SELECT ok(current_setting('test.recovery_invitation_first') ~ '^[0-9a-f-]{36}$', 'first invitation is created');

SELECT set_config(
  'test.recovery_invitation_second',
  public.create_workspace_invitation(
    ' INVITE-RECOVERY@example.test ', 'Second name', encode(extensions.digest(repeat('b', 64), 'sha256'), 'hex'), now() + interval '7 days'
  )::text,
  true
);
SELECT ok(current_setting('test.recovery_invitation_second') ~ '^[0-9a-f-]{36}$', 'second invitation is created for the normalized email');
RESET ROLE;

SELECT is(
  (SELECT status FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(repeat('a', 64), 'sha256'), 'hex')),
  'pending', 'first invite remains pending after reissue'
);
SELECT is(
  (SELECT status FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(repeat('b', 64), 'sha256'), 'hex')),
  'pending', 'second invite is pending after reissue'
);
SELECT is(
  (SELECT count(*)::integer FROM public.workspace_invitations
   WHERE invited_email = 'invite-recovery@example.test' AND status = 'pending' AND expires_at > now()),
  2, 'both invitation links are simultaneously unexpired and pending'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;
SELECT set_config(
  'test.recovery_accepted_workspace',
  public.accept_workspace_invitation(repeat('a', 64))::text,
  true
);
SELECT ok(current_setting('test.recovery_accepted_workspace') ~ '^[0-9a-f-]{36}$', 'first valid invite accepts successfully');
RESET ROLE;
SELECT ok(
  (SELECT status = 'accepted' AND accepted_by = '00000000-0000-0000-0000-000000000401'::uuid
          AND workspace_id::text = current_setting('test.recovery_accepted_workspace')
   FROM public.workspace_invitations
   WHERE token_hash = encode(extensions.digest(repeat('a', 64), 'sha256'), 'hex')),
  'accepted invitation is bound to the accepting user and workspace'
);
SELECT is(
  (SELECT status FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(repeat('b', 64), 'sha256'), 'hex')),
  'revoked', 'sibling pending invitation is revoked atomically after acceptance'
);
SET LOCAL ROLE authenticated;
SELECT is(public.accept_workspace_invitation(repeat('b', 64)), NULL::uuid, 'revoked sibling token cannot be accepted');
SELECT is(
  public.accept_workspace_invitation(repeat('a', 64))::text,
  current_setting('test.recovery_accepted_workspace'), 'retry of accepted invitation returns the same workspace'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::integer FROM public.workspace_members
   WHERE user_id = '00000000-0000-0000-0000-000000000401' AND status = 'active'),
  1, 'acceptance leaves exactly one active membership'
);

SELECT set_config('request.jwt.claim.role', 'service_role', true);
SET LOCAL ROLE service_role;
SELECT is(
  public.create_workspace_invitation(
    'invite-recovery@example.test', 'Another workspace', encode(extensions.digest(repeat('c', 64), 'sha256'), 'hex'), now() + interval '7 days'
  ), NULL::uuid, 'new invitation is refused after active membership exists'
);
SELECT set_config(
  'test.recovery_race_invitation',
  public.create_workspace_invitation(
    'invite-race-recovery@example.test', 'Race workspace', encode(extensions.digest(repeat('d', 64), 'sha256'), 'hex'), now() + interval '7 days'
  )::text,
  true
);
SELECT ok(current_setting('test.recovery_race_invitation') ~ '^[0-9a-f-]{36}$', 'invite is created before a membership exists');
RESET ROLE;

INSERT INTO public.workspaces (id, name)
VALUES ('00000000-0000-0000-0000-0000000004a2', 'Race preexisting membership');
INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES ('00000000-0000-0000-0000-0000000004a2', '00000000-0000-0000-0000-000000000402', 'owner', 'active');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000402', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;
SELECT is(public.accept_workspace_invitation(repeat('d', 64)), NULL::uuid, 'acceptance is rejected if membership appeared after issuance');
SELECT is(
  (SELECT count(*)::integer FROM public.workspace_members
   WHERE user_id = '00000000-0000-0000-0000-000000000402' AND status = 'active'),
  1, 'rejected acceptance preserves the existing sole active membership'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.role', 'service_role', true);
SET LOCAL ROLE service_role;
SELECT is(
  public.create_workspace_invitation(
    'already-member-recovery@example.test', 'Not allowed', encode(extensions.digest(repeat('e', 64), 'sha256'), 'hex'), now() + interval '7 days'
  ), NULL::uuid, 'invitation creation is refused for an email already attached to active membership'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;

-- Local pgTAP candidate test only. Run after its paired candidate migration.
BEGIN;
SELECT plan(18);

INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES
  ('00000000-0000-0000-0000-000000000301', 'invite-repeat@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000302', 'invite-race@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000303', 'already-member@example.test', 'authenticated', 'authenticated', 'x', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workspaces (id, name)
VALUES
  ('00000000-0000-0000-0000-0000000003a1', 'Existing workspace'),
  ('00000000-0000-0000-0000-0000000003a3', 'Second workspace');

INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES ('00000000-0000-0000-0000-0000000003a1', '00000000-0000-0000-0000-000000000303', 'owner', 'active');

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
       VALUES ('00000000-0000-0000-0000-0000000003a3', '00000000-0000-0000-0000-000000000303', 'owner', 'active')$sql$,
  '23505',
  NULL,
  'database rejects a second active membership for the same user'
);

SELECT set_config('request.jwt.claim.role', 'service_role', true);
SET LOCAL ROLE service_role;

SELECT set_config(
  'test.repeat_invitation_first',
  public.create_workspace_invitation(
    'invite-repeat@example.test', 'First name', encode(extensions.digest(repeat('a', 64), 'sha256'), 'hex'), now() + interval '7 days'
  )::text,
  true
);
SELECT ok(current_setting('test.repeat_invitation_first') ~ '^[0-9a-f-]{36}$', 'initial invitation is created');

SELECT set_config(
  'test.repeat_invitation_second',
  public.create_workspace_invitation(
    ' INVITE-REPEAT@example.test ', 'Updated name', encode(extensions.digest(repeat('b', 64), 'sha256'), 'hex'), now() + interval '7 days'
  )::text,
  true
);
SELECT ok(current_setting('test.repeat_invitation_second') ~ '^[0-9a-f-]{36}$', 'reissued invitation is created for the normalized email');

RESET ROLE;
SELECT is(
  (SELECT status FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(repeat('a', 64), 'sha256'), 'hex')),
  'pending',
  'previous invitation remains pending after reissue'
);
SELECT is(
  (SELECT status FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(repeat('b', 64), 'sha256'), 'hex')),
  'pending',
  'new invitation is pending after reissue'
);
SELECT is(
  (SELECT count(*)::integer FROM public.workspace_invitations
   WHERE invited_email = 'invite-repeat@example.test' AND status = 'pending' AND expires_at > now()),
  2,
  'both invitation links remain valid and pending after reissue'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000301', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;
SELECT set_config(
  'test.accepted_workspace',
  public.accept_workspace_invitation(repeat('a', 64))::text,
  true
);
SELECT ok(current_setting('test.accepted_workspace') ~ '^[0-9a-f-]{36}$', 'an earlier still-pending invite can be accepted');
RESET ROLE;
SELECT is(
  (SELECT status FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(repeat('a', 64), 'sha256'), 'hex')),
  'accepted',
  'accepted invitation is marked accepted'
);
SELECT is(
  (SELECT status FROM public.workspace_invitations WHERE token_hash = encode(extensions.digest(repeat('b', 64), 'sha256'), 'hex')),
  'revoked',
  'acceptance revokes the sibling pending invitation'
);
SET LOCAL ROLE authenticated;
SELECT is(
  public.accept_workspace_invitation(repeat('b', 64)),
  NULL::uuid,
  'revoked sibling token cannot be accepted'
);
SELECT is(
  public.accept_workspace_invitation(repeat('a', 64))::text,
  current_setting('test.accepted_workspace'),
  'retry of the accepted invite returns the same workspace'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::integer FROM public.workspace_members WHERE user_id = '00000000-0000-0000-0000-000000000301' AND status = 'active'),
  1,
  'repeated acceptance leaves exactly one active membership'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.role', 'service_role', true);
SET LOCAL ROLE service_role;
SELECT is(
  public.create_workspace_invitation(
    'invite-repeat@example.test', 'Second workspace', encode(extensions.digest(repeat('c', 64), 'sha256'), 'hex'), now() + interval '7 days'
  ),
  NULL::uuid,
  'new invite is refused after the account already has active membership'
);
RESET ROLE;

SELECT set_config(
  'test.race_invitation',
  public.create_workspace_invitation(
    'invite-race@example.test', 'Race workspace', encode(extensions.digest(repeat('d', 64), 'sha256'), 'hex'), now() + interval '7 days'
  )::text,
  true
);
SELECT ok(current_setting('test.race_invitation') ~ '^[0-9a-f-]{36}$', 'invite is created before a membership exists');

INSERT INTO public.workspaces (id, name)
VALUES ('00000000-0000-0000-0000-0000000003a2', 'Race preexisting membership');
INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES ('00000000-0000-0000-0000-0000000003a2', '00000000-0000-0000-0000-000000000302', 'owner', 'active');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000302', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;
SELECT is(
  public.accept_workspace_invitation(repeat('d', 64)),
  NULL::uuid,
  'acceptance is rejected if a membership appeared after invitation issuance'
);
SELECT is(
  (SELECT count(*)::integer FROM public.workspace_members WHERE user_id = '00000000-0000-0000-0000-000000000302' AND status = 'active'),
  1,
  'preexisting active membership remains the only membership after rejected acceptance'
);
RESET ROLE;

SELECT set_config('request.jwt.claim.role', 'service_role', true);
SET LOCAL ROLE service_role;
SELECT is(
  public.create_workspace_invitation(
    'already-member@example.test', 'Not allowed', encode(extensions.digest(repeat('e', 64), 'sha256'), 'hex'), now() + interval '7 days'
  ),
  NULL::uuid,
  'invitation creation is refused for an email already attached to active membership'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;

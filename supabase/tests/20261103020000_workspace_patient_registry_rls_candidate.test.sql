-- LOCAL CANDIDATE TEST ONLY: promote with its paired migration after review.
BEGIN;

SELECT plan(51);

INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'pilot-owner-a@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000202', 'pilot-owner-b@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000203', 'pilot-unassigned@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000204', 'pilot-assistant@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000205', 'pilot-suspended@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000207', 'legacy-admin@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000208', 'legacy@example.test', 'authenticated', 'authenticated', 'x', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_emails (email, note)
VALUES ('legacy-admin@example.test', 'temporary pgTAP fixture');

INSERT INTO public.workspaces (id, name)
VALUES
  ('00000000-0000-0000-0000-0000000002a1', 'Pilot A'),
  ('00000000-0000-0000-0000-0000000002b1', 'Pilot B');

INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES
  ('00000000-0000-0000-0000-0000000002a1', '00000000-0000-0000-0000-000000000201', 'owner', 'active'),
  ('00000000-0000-0000-0000-0000000002b1', '00000000-0000-0000-0000-000000000202', 'nutritionist', 'active'),
  ('00000000-0000-0000-0000-0000000002a1', '00000000-0000-0000-0000-000000000204', 'assistant', 'active'),
  ('00000000-0000-0000-0000-0000000002a1', '00000000-0000-0000-0000-000000000205', 'owner', 'suspended');

INSERT INTO public.patients (name, email, phone, workspace_id)
VALUES
  ('Legacy patient', 'legacy@example.test', '000', NULL),
  ('Patient A', 'a@example.test', '111', '00000000-0000-0000-0000-0000000002a1'),
  ('Patient B', 'b@example.test', '222', '00000000-0000-0000-0000-0000000002b1');

INSERT INTO public.patient_portal_accounts (
  patient_id, auth_user_id, login, login_normalized, auth_email
)
SELECT
  id,
  '00000000-0000-0000-0000-000000000208',
  'pilot-portal-208',
  'pilot-portal-208',
  'pilot-portal-208@example.test'
FROM public.patients
WHERE email = 'legacy@example.test';

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_class AS relation
    JOIN pg_namespace AS schema ON schema.oid = relation.relnamespace
    WHERE schema.nspname = 'public'
      AND relation.relname = 'patients'
      AND relation.relrowsecurity
  ),
  'RLS is enabled on public.patients'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patients' AND policyname = 'workspace_patients_select_active_member'),
  'workspace SELECT policy exists'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patients' AND policyname = 'workspace_patients_insert_active_member'),
  'workspace INSERT policy exists'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patients' AND policyname = 'workspace_patients_update_active_member'),
  'workspace UPDATE policy exists'
);
SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patients' AND policyname LIKE 'workspace_patients%delete%'),
  'workspace pilot adds no DELETE policy'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patients'
      AND policyname = 'admin_all_patients'
      AND 'authenticated' = ANY (roles)
      AND qual ILIKE '%is_admin_email%'
      AND qual ILIKE '%workspace_id IS NULL%'
      AND with_check ILIKE '%is_admin_email%'
      AND with_check ILIKE '%workspace_id IS NULL%'
  ),
  'legacy admin policy is restricted to NULL workspace rows'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patients'
      AND policyname = 'patient_self_read_patients'
      AND cmd = 'SELECT'
      AND qual ILIKE '%current_patient_id%'
      AND qual NOT ILIKE '%is_admin_email%'
  ),
  'patient portal policy retains self-read without allowlist-wide visibility'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patients'
      AND permissive = 'PERMISSIVE'
      AND roles && ARRAY['authenticated', 'anon', 'public']::name[]
      AND policyname NOT IN (
        'admin_all_patients', 'patient_self_read_patients',
        'workspace_patients_select_active_member',
        'workspace_patients_insert_active_member',
        'workspace_patients_update_active_member'
      )
  ),
  'no unexpected permissive client policy can widen patient access'
);
SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'patients' AND ('anon' = ANY (roles) OR 'public' = ANY (roles))),
  'no public or anonymous patient policy exists'
);
SELECT ok(
  has_table_privilege('authenticated', 'public.patients', 'SELECT')
  AND has_table_privilege('authenticated', 'public.patients', 'INSERT')
  AND has_table_privilege('authenticated', 'public.patients', 'UPDATE')
  AND has_table_privilege('authenticated', 'public.patients', 'DELETE'),
  'authenticated retains SELECT, INSERT, UPDATE, and DELETE'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.patients', 'TRUNCATE')
  AND NOT has_table_privilege('authenticated', 'public.patients', 'REFERENCES')
  AND NOT has_table_privilege('authenticated', 'public.patients', 'TRIGGER')
  AND NOT has_table_privilege('authenticated', 'public.patients', 'MAINTAIN'),
  'authenticated lacks TRUNCATE, REFERENCES, TRIGGER, and MAINTAIN'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.patients', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.patients', 'INSERT')
  AND NOT has_table_privilege('anon', 'public.patients', 'UPDATE')
  AND NOT has_table_privilege('anon', 'public.patients', 'DELETE')
  AND NOT has_table_privilege('anon', 'public.patients', 'TRUNCATE')
  AND NOT has_table_privilege('anon', 'public.patients', 'REFERENCES')
  AND NOT has_table_privilege('anon', 'public.patients', 'TRIGGER')
  AND NOT has_table_privilege('anon', 'public.patients', 'MAINTAIN'),
  'anon has no effective supported table privileges, including inherited PUBLIC grants'
);

SET LOCAL ROLE authenticated;

-- A: sole active owner sees only own workspace and can insert there.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', true);
SELECT set_config('request.jwt.claim.email', '', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000201","email":"","role":"authenticated"}', true);
SELECT is(auth.uid(), '00000000-0000-0000-0000-000000000201'::uuid, 'owner A identity claims agree');
SELECT is((SELECT count(*)::int FROM public.patients), 1, 'owner A sees one patient');
SELECT is((SELECT count(*)::int FROM public.patients WHERE workspace_id IS NULL), 0, 'owner A cannot see legacy NULL patient');
SELECT lives_ok($sql$INSERT INTO public.patients (name, email, phone, workspace_id) VALUES ('Created A', 'created-a@example.test', '333', '00000000-0000-0000-0000-0000000002a1')$sql$, 'owner A can insert in own workspace');
SELECT throws_ok($sql$INSERT INTO public.patients (name, workspace_id) VALUES ('Invalid A', '00000000-0000-0000-0000-0000000002b1')$sql$, '42501', NULL, 'owner A cannot insert in another workspace');
SELECT throws_ok($sql$INSERT INTO public.patients (name, workspace_id) VALUES ('Legacy spoof A', NULL)$sql$, '42501', NULL, 'owner A cannot insert a legacy NULL row');

-- B: nutritionist in a distinct workspace is isolated from A.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000202', true);
SELECT set_config('request.jwt.claim.email', '', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000202","email":"","role":"authenticated"}', true);
SELECT is(auth.uid(), '00000000-0000-0000-0000-000000000202'::uuid, 'nutritionist B identity claims agree');
SELECT is((SELECT count(*)::int FROM public.patients), 1, 'nutritionist B sees one patient');
SELECT is((SELECT count(*)::int FROM public.patients WHERE workspace_id = '00000000-0000-0000-0000-0000000002a1'), 0, 'nutritionist B cannot see workspace A');
SELECT lives_ok($sql$UPDATE public.patients SET name = 'Patient B edited' WHERE workspace_id = '00000000-0000-0000-0000-0000000002b1'$sql$, 'nutritionist B can update own patient');
SELECT throws_ok($sql$UPDATE public.patients SET workspace_id = '00000000-0000-0000-0000-0000000002a1' WHERE workspace_id = '00000000-0000-0000-0000-0000000002b1'$sql$, '42501', NULL, 'workspace move is rejected');

-- C: users without membership or with a disallowed role/status have no access.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000203', true);
SELECT set_config('request.jwt.claim.email', '', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000203","email":"","role":"authenticated"}', true);
SELECT is(auth.uid(), '00000000-0000-0000-0000-000000000203'::uuid, 'unassigned identity claims agree');
SELECT is((SELECT count(*)::int FROM public.patients), 0, 'unassigned user sees no patients');
SELECT throws_ok($sql$INSERT INTO public.patients (name, workspace_id) VALUES ('Invalid unassigned', '00000000-0000-0000-0000-0000000002a1')$sql$, '42501', NULL, 'unassigned user cannot insert');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000204', true);
SELECT set_config('request.jwt.claim.email', '', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000204","email":"","role":"authenticated"}', true);
SELECT is(auth.uid(), '00000000-0000-0000-0000-000000000204'::uuid, 'assistant identity claims agree');
SELECT is((SELECT count(*)::int FROM public.patients), 0, 'assistant sees no patients');
SELECT throws_ok($sql$INSERT INTO public.patients (name, workspace_id) VALUES ('Invalid assistant', '00000000-0000-0000-0000-0000000002a1')$sql$, '42501', NULL, 'assistant cannot insert');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000205', true);
SELECT set_config('request.jwt.claim.email', '', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000205","email":"","role":"authenticated"}', true);
SELECT is(auth.uid(), '00000000-0000-0000-0000-000000000205'::uuid, 'suspended identity claims agree');
SELECT is((SELECT count(*)::int FROM public.patients), 0, 'suspended user sees no patients');
SELECT throws_ok($sql$INSERT INTO public.patients (name, workspace_id) VALUES ('Invalid suspended', '00000000-0000-0000-0000-0000000002a1')$sql$, '42501', NULL, 'suspended user cannot insert');
-- An allowlisted platform/project owner without membership retains legacy
-- access only. Workspace data requires the same active membership as anyone else.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000207', true);
SELECT set_config('request.jwt.claim.email', 'legacy-admin@example.test', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000207","email":"legacy-admin@example.test","role":"authenticated"}', true);
SELECT is(auth.uid(), '00000000-0000-0000-0000-000000000207'::uuid, 'legacy admin identity claims agree without membership');
SELECT is((SELECT count(*)::int FROM public.patients WHERE workspace_id IS NULL), 1, 'legacy admin sees legacy NULL patient');
SELECT is((SELECT count(*)::int FROM public.patients WHERE workspace_id IS NOT NULL), 0, 'legacy admin without membership cannot see workspace patients');
SELECT lives_ok($sql$INSERT INTO public.patients (name, email, phone, workspace_id) VALUES ('Legacy admin patient', 'admin-patient@example.test', '999', NULL)$sql$, 'legacy admin retains legacy NULL write behavior');
SELECT lives_ok($sql$UPDATE public.patients SET name = 'Legacy patient edited' WHERE email = 'legacy@example.test' AND workspace_id IS NULL$sql$, 'legacy admin can update legacy NULL patient');
SELECT is((SELECT count(*)::int FROM public.patients WHERE name = 'Legacy patient edited' AND workspace_id IS NULL), 1, 'legacy admin update is visible on legacy row');
SELECT throws_ok($sql$INSERT INTO public.patients (name, workspace_id) VALUES ('Admin workspace spoof', '00000000-0000-0000-0000-0000000002a1')$sql$, '42501', NULL, 'legacy admin without membership cannot insert workspace patient');
WITH changed AS (
  UPDATE public.patients
  SET name = 'Admin cross-workspace edit'
  WHERE email = 'b@example.test'
  RETURNING 1
)
SELECT is((SELECT count(*)::int FROM changed), 0, 'legacy admin without membership cannot update workspace patient');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000208', true);
SELECT set_config('request.jwt.claim.email', 'legacy@example.test', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000208","email":"legacy@example.test","role":"authenticated"}', true);
SELECT is(auth.uid(), '00000000-0000-0000-0000-000000000208'::uuid, 'patient portal identity claims agree');
SELECT is((SELECT count(*)::int FROM public.patients), 1, 'patient portal retains access to own patient row only');
SELECT is((SELECT count(*)::int FROM public.patients WHERE email = 'legacy@example.test'), 1, 'patient portal row is matched by its own email identity');

RESET ROLE;
INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES ('00000000-0000-0000-0000-0000000002a1', '00000000-0000-0000-0000-000000000207', 'nutritionist', 'active');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000207', true);
SELECT set_config('request.jwt.claim.email', 'legacy-admin@example.test', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000207","email":"legacy-admin@example.test","role":"authenticated"}', true);
SELECT is(auth.uid(), '00000000-0000-0000-0000-000000000207'::uuid, 'legacy admin identity claims agree with own membership');
SELECT is((SELECT count(*)::int FROM public.patients WHERE workspace_id = '00000000-0000-0000-0000-0000000002a1'), 2, 'legacy admin with membership sees both patients in own workspace');
SELECT is((SELECT count(*)::int FROM public.patients WHERE workspace_id = '00000000-0000-0000-0000-0000000002b1'), 0, 'legacy admin membership does not expose another workspace');
SELECT lives_ok($sql$INSERT INTO public.patients (name, workspace_id) VALUES ('Admin own workspace patient', '00000000-0000-0000-0000-0000000002a1')$sql$, 'legacy admin can insert in own workspace membership');
SELECT lives_ok($sql$UPDATE public.patients SET name = 'Patient A edited by member admin' WHERE email = 'a@example.test'$sql$, 'legacy admin can update own workspace patient');
SELECT is((SELECT count(*)::int FROM public.patients WHERE name = 'Patient A edited by member admin'), 1, 'own-workspace update is visible');
SELECT throws_ok($sql$INSERT INTO public.patients (name, workspace_id) VALUES ('Admin cross-workspace insert', '00000000-0000-0000-0000-0000000002b1')$sql$, '42501', NULL, 'legacy admin cannot insert in another workspace');
WITH changed AS (
  UPDATE public.patients
  SET name = 'Admin cross-workspace edit'
  WHERE email = 'b@example.test'
  RETURNING 1
)
SELECT is((SELECT count(*)::int FROM changed), 0, 'legacy admin cannot update another workspace patient');

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;

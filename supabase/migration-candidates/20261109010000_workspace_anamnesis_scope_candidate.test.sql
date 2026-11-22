-- LOCAL CANDIDATE TEST ONLY. Run only in an isolated database after the paired
-- candidate has been reviewed. All fixtures are synthetic and rolled back.
BEGIN;

SELECT plan(36);

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.anamnesis'::regclass), 'RLS remains enabled');
SELECT ok(EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anamnesis' AND column_name = 'workspace_id' AND data_type = 'uuid' AND is_nullable = 'YES'), 'workspace_id is nullable UUID');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.anamnesis'::regclass AND conname = 'anamnesis_workspace_patient_fkey'), 'composite patient foreign key exists');
SELECT ok(EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.anamnesis_workspace_patient_idx'::regclass), 'workspace patient index exists');
SELECT ok(has_table_privilege('authenticated', 'public.anamnesis', 'SELECT') AND has_table_privilege('authenticated', 'public.anamnesis', 'INSERT') AND has_table_privilege('authenticated', 'public.anamnesis', 'UPDATE') AND NOT has_table_privilege('authenticated', 'public.anamnesis', 'DELETE') AND NOT has_table_privilege('authenticated', 'public.anamnesis', 'TRUNCATE') AND NOT has_table_privilege('authenticated', 'public.anamnesis', 'REFERENCES') AND NOT has_table_privilege('authenticated', 'public.anamnesis', 'TRIGGER') AND NOT has_table_privilege('authenticated', 'public.anamnesis', 'MAINTAIN'), 'authenticated has only supported table write privileges');
SELECT ok(NOT has_table_privilege('anon', 'public.anamnesis', 'SELECT') AND NOT has_table_privilege('anon', 'public.anamnesis', 'INSERT') AND NOT has_table_privilege('anon', 'public.anamnesis', 'UPDATE') AND NOT has_table_privilege('anon', 'public.anamnesis', 'DELETE') AND NOT has_table_privilege('anon', 'public.anamnesis', 'TRUNCATE') AND NOT has_table_privilege('anon', 'public.anamnesis', 'REFERENCES') AND NOT has_table_privilege('anon', 'public.anamnesis', 'TRIGGER') AND NOT EXISTS (SELECT 1 FROM pg_class AS relation CROSS JOIN LATERAL aclexplode(coalesce(relation.relacl, acldefault('r', relation.relowner))) AS privilege WHERE relation.oid = 'public.anamnesis'::regclass AND privilege.grantee = 0 AND privilege.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')), 'anon and PUBLIC have no anamnesis table privileges');
SELECT ok(has_sequence_privilege('authenticated', 'public.anamnesis_id_seq', 'USAGE') AND NOT has_sequence_privilege('authenticated', 'public.anamnesis_id_seq', 'SELECT') AND NOT has_sequence_privilege('authenticated', 'public.anamnesis_id_seq', 'UPDATE'), 'authenticated has USAGE-only sequence privilege');
SELECT ok(NOT has_sequence_privilege('anon', 'public.anamnesis_id_seq', 'USAGE') AND NOT has_sequence_privilege('anon', 'public.anamnesis_id_seq', 'SELECT') AND NOT has_sequence_privilege('anon', 'public.anamnesis_id_seq', 'UPDATE') AND NOT EXISTS (SELECT 1 FROM pg_class AS relation CROSS JOIN LATERAL aclexplode(coalesce(relation.relacl, acldefault('S', relation.relowner))) AS privilege WHERE relation.oid = 'public.anamnesis_id_seq'::regclass AND privilege.grantee = 0 AND privilege.privilege_type IN ('USAGE', 'SELECT', 'UPDATE')), 'anon and PUBLIC cannot use anamnesis sequence');
SELECT ok(EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anamnesis' AND policyname = 'admin_all_anamnesis' AND qual ILIKE '%workspace_id IS NULL%' AND with_check ILIKE '%workspace_id IS NULL%'), 'legacy admin policy is NULL-workspace only');
SELECT ok(EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anamnesis' AND policyname = 'workspace_anamnesis_select_active_member' AND cmd = 'SELECT'), 'workspace SELECT policy exists');
SELECT ok(EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anamnesis' AND policyname = 'workspace_anamnesis_insert_active_member' AND cmd = 'INSERT'), 'workspace INSERT policy exists');
SELECT ok(EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anamnesis' AND policyname = 'workspace_anamnesis_update_active_member' AND cmd = 'UPDATE'), 'workspace UPDATE policy exists');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anamnesis' AND policyname = 'workspace_anamnesis_delete_active_member' AND cmd = 'DELETE') AND NOT has_table_privilege('authenticated', 'public.anamnesis', 'DELETE'), 'workspace DELETE is not granted');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anamnesis' AND roles && ARRAY['public', 'anon']::name[]), 'no public or anon anamnesis policy remains');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'anamnesis' AND permissive = 'PERMISSIVE' AND roles && ARRAY['authenticated', 'anon', 'public']::name[] AND policyname NOT IN ('admin_all_anamnesis', 'workspace_anamnesis_select_active_member', 'workspace_anamnesis_insert_active_member', 'workspace_anamnesis_update_active_member', 'workspace_anamnesis_delete_active_member')), 'no broad unknown policy can OR-bypass RLS');

-- Synthetic rows and sessions are deliberately isolated in this transaction.
INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES
  ('00000000-0000-0000-0000-000000000401', 'anamnesis-owner-a@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000402', 'anamnesis-owner-b@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000403', 'anamnesis-unassigned@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000404', 'anamnesis-assistant@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000405', 'anamnesis-platform-admin@example.test', 'authenticated', 'authenticated', 'x', now());
INSERT INTO public.admin_emails (email, note)
VALUES ('anamnesis-platform-admin@example.test', 'synthetic platform-admin isolation fixture');
INSERT INTO public.workspaces (id, name) VALUES
  ('00000000-0000-0000-0000-0000000004a1', 'Anamnesis A'),
  ('00000000-0000-0000-0000-0000000004b1', 'Anamnesis B');
INSERT INTO public.workspace_members (workspace_id, user_id, role, status) VALUES
  ('00000000-0000-0000-0000-0000000004a1', '00000000-0000-0000-0000-000000000401', 'owner', 'active'),
  ('00000000-0000-0000-0000-0000000004b1', '00000000-0000-0000-0000-000000000402', 'nutritionist', 'active'),
  ('00000000-0000-0000-0000-0000000004a1', '00000000-0000-0000-0000-000000000404', 'assistant', 'active');
INSERT INTO public.patients (id, name, workspace_id) VALUES
  (910000000000000001, 'Anamnesis legacy fixture', NULL),
  (910000000000000002, 'Anamnesis patient A', '00000000-0000-0000-0000-0000000004a1'),
  (910000000000000003, 'Anamnesis patient B', '00000000-0000-0000-0000-0000000004b1'),
  (910000000000000004, 'Anamnesis patient B without form', '00000000-0000-0000-0000-0000000004b1');
INSERT INTO public.anamnesis (id, patient_id, workspace_id, structured_data) VALUES
  (920000000000000001, 910000000000000001, NULL, '{"goal_primary":"outro"}'),
  (920000000000000002, 910000000000000002, '00000000-0000-0000-0000-0000000004a1', '{"goal_primary":"saude_geral"}'),
  (920000000000000003, 910000000000000003, '00000000-0000-0000-0000-0000000004b1', '{"goal_primary":"performance"}');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 1 FROM public.anamnesis WHERE workspace_id = '00000000-0000-0000-0000-0000000004a1'), 'workspace A reads only its own anamnese');
SELECT ok((SELECT count(*) = 0 FROM public.anamnesis WHERE workspace_id = '00000000-0000-0000-0000-0000000004b1'), 'workspace A cannot read workspace B');
SELECT ok((SELECT count(*) = 0 FROM public.anamnesis WHERE workspace_id IS NULL), 'workspace A cannot read legacy rows');
SELECT ok((SELECT count(*) = 1 FROM public.anamnesis WHERE workspace_id = '00000000-0000-0000-0000-0000000004a1' AND patient_id = 910000000000000002), 'workspace A sees the matching patient only');
SELECT throws_ok($sql$INSERT INTO public.anamnesis (id, workspace_id, patient_id, structured_data) VALUES (920000000000000007, '00000000-0000-0000-0000-0000000004a1', 910000000000000003, '{}')$sql$, NULL, NULL, 'workspace A cannot insert a patient from workspace B');
SELECT throws_ok($sql$UPDATE public.anamnesis SET workspace_id = '00000000-0000-0000-0000-0000000004b1' WHERE workspace_id = '00000000-0000-0000-0000-0000000004a1'$sql$, NULL, NULL, 'workspace A cannot move a row to workspace B');

RESET ROLE;
INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES ('00000000-0000-0000-0000-0000000004b1', '00000000-0000-0000-0000-000000000401', 'nutritionist', 'active');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000401', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000401","role":"authenticated","email":"anamnesis-owner-a@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 0 FROM public.anamnesis), 'member with multiple active workspaces cannot read anamnesis');
SELECT throws_ok($sql$INSERT INTO public.anamnesis (id, workspace_id, patient_id, structured_data) VALUES (920000000000000008, '00000000-0000-0000-0000-0000000004a1', 910000000000000002, '{}')$sql$, NULL, NULL, 'member with multiple active workspaces cannot insert anamnesis');

RESET ROLE;
DELETE FROM public.workspace_members
WHERE workspace_id = '00000000-0000-0000-0000-0000000004b1'
  AND user_id = '00000000-0000-0000-0000-000000000401';
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000402', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 1 FROM public.anamnesis WHERE workspace_id = '00000000-0000-0000-0000-0000000004b1'), 'workspace B reads its own anamnese');
SELECT ok((SELECT count(*) = 0 FROM public.anamnesis WHERE workspace_id = '00000000-0000-0000-0000-0000000004a1'), 'workspace B cannot read workspace A');
INSERT INTO public.anamnesis (id, patient_id, workspace_id, structured_data)
VALUES (920000000000000004, 910000000000000004, '00000000-0000-0000-0000-0000000004b1', '{"goal_primary":"outro"}');
SELECT ok((SELECT count(*) = 1 FROM public.anamnesis WHERE id = 920000000000000004), 'workspace B inserts its own anamnese');
UPDATE public.anamnesis SET structured_data = '{"goal_primary":"saude_geral"}' WHERE id = 920000000000000004;
SELECT ok((SELECT structured_data ->> 'goal_primary' = 'saude_geral' FROM public.anamnesis WHERE id = 920000000000000004), 'workspace B updates its own anamnese');
SELECT throws_ok($sql$INSERT INTO public.anamnesis (id, workspace_id, patient_id, structured_data) VALUES (920000000000000005, '00000000-0000-0000-0000-0000000004b1', 910000000000000002, '{}')$sql$, NULL, NULL, 'workspace B cannot insert a patient from workspace A');
SELECT throws_ok($sql$UPDATE public.anamnesis SET patient_id = 910000000000000002 WHERE id = 920000000000000003$sql$, NULL, NULL, 'workspace B cannot update a row to a patient from workspace A');
SELECT throws_ok($sql$DELETE FROM public.anamnesis WHERE id = 920000000000000002$sql$, '42501', NULL, 'workspace B cannot delete an anamnesis row');

RESET ROLE;
SELECT ok((SELECT count(*) = 1 FROM public.anamnesis WHERE id = 920000000000000002), 'workspace A anamnesis remains after workspace B delete is denied');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000404', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 0 FROM public.anamnesis), 'assistant cannot read anamnese');
SELECT throws_ok($sql$INSERT INTO public.anamnesis (id, workspace_id, patient_id, structured_data) VALUES (920000000000000006, '00000000-0000-0000-0000-0000000004a1', 910000000000000002, '{}')$sql$, NULL, NULL, 'assistant cannot insert anamnese');

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000405', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000405","role":"authenticated","email":"anamnesis-platform-admin@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 1 FROM public.anamnesis WHERE workspace_id IS NULL), 'legacy platform admin can read legacy anamnese');
SELECT ok((SELECT count(*) = 0 FROM public.anamnesis WHERE workspace_id IS NOT NULL), 'legacy platform admin cannot read workspace anamnese');

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000403', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000403","role":"authenticated","email":"anamnesis-unassigned@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 0 FROM public.anamnesis), 'user without membership sees no anamnese');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;

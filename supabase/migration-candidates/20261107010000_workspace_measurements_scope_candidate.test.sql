-- LOCAL CANDIDATE TEST ONLY. Run in an isolated Supabase test database after
-- its paired candidate. Fixtures are synthetic and rolled back at the end.
BEGIN;

SELECT plan(60);

INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES
  ('00000000-0000-0000-0000-000000000301', 'measure-owner-a@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000302', 'measure-nutritionist-b@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000303', 'measure-unassigned@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000304', 'measure-assistant@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000305', 'measure-suspended@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000307', 'measure-legacy-admin@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000308', 'measure-portal@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000309', 'measure-workspace-portal@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000000310', 'measure-ambiguous@example.test', 'authenticated', 'authenticated', 'x', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_emails (email, note)
VALUES ('measure-legacy-admin@example.test', 'temporary measurements pgTAP fixture');

INSERT INTO public.workspaces (id, name)
VALUES
  ('00000000-0000-0000-0000-0000000003a1', 'Measurements A'),
  ('00000000-0000-0000-0000-0000000003b1', 'Measurements B');

INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES
  ('00000000-0000-0000-0000-0000000003a1', '00000000-0000-0000-0000-000000000301', 'owner', 'active'),
  ('00000000-0000-0000-0000-0000000003b1', '00000000-0000-0000-0000-000000000302', 'nutritionist', 'active'),
  ('00000000-0000-0000-0000-0000000003a1', '00000000-0000-0000-0000-000000000304', 'assistant', 'active'),
  ('00000000-0000-0000-0000-0000000003a1', '00000000-0000-0000-0000-000000000305', 'owner', 'suspended');

-- Temporarily remove the known single-active-membership guard when present so
-- this transaction can prove the RLS policies independently fail closed for
-- ambiguous membership. The surrounding test transaction rolls this DDL back.
DROP INDEX IF EXISTS public.workspace_members_one_active_workspace_per_user;
INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES
  ('00000000-0000-0000-0000-0000000003a1', '00000000-0000-0000-0000-000000000310', 'nutritionist', 'active'),
  ('00000000-0000-0000-0000-0000000003b1', '00000000-0000-0000-0000-000000000310', 'nutritionist', 'active');

INSERT INTO public.patients (id, name, email, phone, workspace_id)
VALUES
  (900000000000000001, 'Legacy measurement patient', 'measure-legacy@example.test', '000', NULL),
  (900000000000000002, 'Measurement patient A', 'measure-a@example.test', '111', '00000000-0000-0000-0000-0000000003a1'),
  (900000000000000003, 'Measurement patient B', 'measure-b@example.test', '222', '00000000-0000-0000-0000-0000000003b1');

INSERT INTO public.measurements (patient_id, assessment_date, weight, notes, workspace_id)
VALUES (900000000000000001, DATE '2026-11-01', 71.25, 'legacy fixture unchanged', NULL);
INSERT INTO public.measurements (patient_id, assessment_date, weight, notes, workspace_id)
VALUES (900000000000000001, DATE '2026-11-01', 68.25, 'legacy delete fixture', NULL);
INSERT INTO public.measurements (patient_id, assessment_date, weight, notes, workspace_id)
VALUES (900000000000000002, DATE '2026-11-02', 82.50, 'workspace A fixture', '00000000-0000-0000-0000-0000000003a1');
INSERT INTO public.measurements (patient_id, assessment_date, weight, notes, workspace_id)
VALUES (900000000000000003, DATE '2026-11-03', 63.75, 'workspace B fixture', '00000000-0000-0000-0000-0000000003b1');
-- MATCH SIMPLE permits a NULL workspace_id; these rows intentionally model
-- the dangerous mismatch that legacy RLS must reject by checking the parent.
INSERT INTO public.measurements (patient_id, assessment_date, weight, notes, workspace_id)
VALUES (900000000000000002, DATE '2026-11-03', 82.75, 'null workspace linked to tenant patient', NULL);
SELECT set_config(
  'test.measurements_workspace_b_id',
  (SELECT id::text FROM public.measurements WHERE notes = 'workspace B fixture'),
  true
);

INSERT INTO public.patient_portal_accounts (
  patient_id, auth_user_id, login, login_normalized, auth_email
)
SELECT id, '00000000-0000-0000-0000-000000000308', 'measure-portal-308',
       'measure-portal-308', 'measure-portal-308@example.test'
FROM public.patients WHERE email = 'measure-legacy@example.test';
INSERT INTO public.patient_portal_accounts (
  patient_id, auth_user_id, login, login_normalized, auth_email
)
SELECT id, '00000000-0000-0000-0000-000000000309', 'measure-portal-309',
       'measure-portal-309', 'measure-portal-309@example.test'
FROM public.patients WHERE email = 'measure-a@example.test';

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.measurements'::regclass),
  'RLS remains enabled on measurements'
);
SELECT ok(
  (SELECT attnotnull FROM pg_attribute
   WHERE attrelid = 'public.measurements'::regclass
     AND attname = 'patient_id' AND NOT attisdropped),
  'patient_id is NOT NULL after the no-NULL preflight'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.patients'::regclass),
  'RLS remains enabled on patients after granting SELECT'
);
SELECT ok(
  has_table_privilege('authenticated', 'public.patients', 'SELECT'),
  'authenticated has effective SELECT privilege on patients for RLS-filtered parent checks'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.patients', 'SELECT'),
  'anon still cannot SELECT patients'
);
SELECT ok(
  has_table_privilege('authenticated', 'public.patients', 'SELECT')
  AND has_table_privilege('authenticated', 'public.patients', 'INSERT')
  AND has_table_privilege('authenticated', 'public.patients', 'UPDATE')
  AND has_table_privilege('authenticated', 'public.patients', 'DELETE'),
  'authenticated has effective CRUD table privileges on patients'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.patients', 'TRUNCATE')
  AND NOT has_table_privilege('authenticated', 'public.patients', 'REFERENCES')
  AND NOT has_table_privilege('authenticated', 'public.patients', 'TRIGGER')
  AND NOT has_table_privilege('authenticated', 'public.patients', 'MAINTAIN'),
  'authenticated lacks non-CRUD table privileges on patients'
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
  'anon has no effective table privileges on patients'
);
WITH raw_policies AS (
  SELECT policyname, cmd, permissive, roles,
         regexp_replace(lower(qual), '[[:space:]()]', '', 'g') AS qual_raw,
         regexp_replace(lower(with_check), '[[:space:]()]', '', 'g') AS check_raw
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'patients'
), normalized_policies AS (
  SELECT policyname, cmd, permissive, roles,
         replace(replace(replace(qual_stage, 'selectauth.uidasuid', 'auth.uid'),
                         'selectauth.uid', 'auth.uid'), 'ascountfrom', 'from') AS qual_norm,
         replace(replace(replace(check_stage, 'selectauth.uidasuid', 'auth.uid'),
                         'selectauth.uid', 'auth.uid'), 'ascountfrom', 'from') AS check_norm
  FROM (
    SELECT policyname, cmd, permissive, roles,
      replace(replace(replace(replace(replace(qual_raw, 'public.', ''),
        '::text', ''), 'asmember', 'member'), 'asactive_member', 'active_member'),
        '=anyarray[', 'in[') AS qual_stage,
      replace(replace(replace(replace(replace(check_raw, 'public.', ''),
        '::text', ''), 'asmember', 'member'), 'asactive_member', 'active_member'),
        '=anyarray[', 'in[') AS check_stage
    FROM raw_policies
  ) AS stages
), expected(policyname, cmd, qual_norm, check_norm) AS (
  VALUES
    (
      'workspace_patients_select_active_member', 'SELECT',
      'workspace_idisnotnullandexistsselect1fromworkspace_membersmemberwheremember.workspace_id=patients.workspace_idandmember.user_id=auth.uidandmember.rolein[''owner'',''nutritionist'']andmember.status=''active''andselectcount*fromworkspace_membersactive_memberwhereactive_member.user_id=auth.uidandactive_member.status=''active''=1',
      NULL::text
    ),
    (
      'workspace_patients_insert_active_member', 'INSERT',
      NULL::text,
      'workspace_idisnotnullandexistsselect1fromworkspace_membersmemberwheremember.workspace_id=patients.workspace_idandmember.user_id=auth.uidandmember.rolein[''owner'',''nutritionist'']andmember.status=''active''andselectcount*fromworkspace_membersactive_memberwhereactive_member.user_id=auth.uidandactive_member.status=''active''=1'
    ),
    (
      'workspace_patients_update_active_member', 'UPDATE',
      'workspace_idisnotnullandexistsselect1fromworkspace_membersmemberwheremember.workspace_id=patients.workspace_idandmember.user_id=auth.uidandmember.rolein[''owner'',''nutritionist'']andmember.status=''active''andselectcount*fromworkspace_membersactive_memberwhereactive_member.user_id=auth.uidandactive_member.status=''active''=1',
      'workspace_idisnotnullandexistsselect1fromworkspace_membersmemberwheremember.workspace_id=patients.workspace_idandmember.user_id=auth.uidandmember.rolein[''owner'',''nutritionist'']andmember.status=''active''andselectcount*fromworkspace_membersactive_memberwhereactive_member.user_id=auth.uidandactive_member.status=''active''=1'
    )
)
SELECT ok(
  coalesce(
    actual.cmd = expected.cmd
    AND actual.permissive = 'PERMISSIVE'
    AND actual.roles = ARRAY['authenticated']::name[]
    AND actual.qual_norm IS NOT DISTINCT FROM expected.qual_norm
    AND actual.check_norm IS NOT DISTINCT FROM expected.check_norm,
    false
  ),
  'patients catalog predicate matches exact reviewed contract: ' || expected.policyname
)
FROM expected
LEFT JOIN normalized_policies AS actual USING (policyname)
ORDER BY expected.policyname;
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'measurements' AND policyname = 'workspace_measurements_select_active_member' AND cmd = 'SELECT'),
  'workspace SELECT policy exists'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'measurements' AND policyname = 'workspace_measurements_insert_active_member' AND cmd = 'INSERT'),
  'workspace INSERT policy exists'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'measurements' AND policyname = 'workspace_measurements_update_active_member' AND cmd = 'UPDATE'),
  'workspace UPDATE policy exists'
);
SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'measurements' AND policyname LIKE 'workspace_measurements%delete%'),
  'workspace candidate adds no DELETE policy'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'measurements'
      AND policyname = 'admin_all_measurements'
      AND qual ILIKE '%is_admin_email%' AND qual ILIKE '%workspace_id IS NULL%'
      AND with_check ILIKE '%is_admin_email%' AND with_check ILIKE '%workspace_id IS NULL%'
  ),
  'allowlist admin can manage only legacy NULL measurements'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'measurements'
      AND policyname = 'patient_self_read_measurements' AND cmd = 'SELECT'
      AND qual ILIKE '%current_patient_id%' AND qual ILIKE '%workspace_id IS NULL%'
      AND qual NOT ILIKE '%is_admin_email%'
  ),
  'portal self-read is limited to legacy measurements'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'measurements'
      AND permissive = 'PERMISSIVE'
      AND roles && ARRAY['authenticated', 'anon', 'public']::name[]
      AND policyname NOT IN (
        'admin_all_measurements', 'patient_self_read_measurements',
        'workspace_measurements_select_active_member',
        'workspace_measurements_insert_active_member',
        'workspace_measurements_update_active_member'
      )
  ),
  'no broad permissive legacy policy can OR-bypass workspace rules'
);
CREATE ROLE workspace_measurements_test_inherited_policy_role NOLOGIN;
GRANT workspace_measurements_test_inherited_policy_role TO authenticated;
CREATE POLICY qa_inherited_measurements_policy
  ON public.measurements AS PERMISSIVE FOR SELECT
  TO workspace_measurements_test_inherited_policy_role USING (true);
SELECT ok(
  pg_has_role(
    'authenticated'::regrole,
    'workspace_measurements_test_inherited_policy_role'::regrole,
    'MEMBER'
  )
  AND EXISTS (
    SELECT 1
    FROM pg_policy AS policy
    CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid)
    WHERE policy.polrelid = 'public.measurements'::regclass
      AND policy.polname = 'qa_inherited_measurements_policy'
      AND CASE WHEN policy_role.role_oid = 0 THEN true
               ELSE pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')
          END
  ),
  'preflight role test detects a permissive policy inherited by authenticated'
);
DROP POLICY qa_inherited_measurements_policy ON public.measurements;
REVOKE workspace_measurements_test_inherited_policy_role FROM authenticated;
DROP ROLE workspace_measurements_test_inherited_policy_role;
CREATE POLICY qa_public_measurements_policy
  ON public.measurements AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);
SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policy AS policy
    CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid)
    WHERE policy.polrelid = 'public.measurements'::regclass
      AND policy.polname = 'qa_public_measurements_policy'
      AND CASE WHEN policy_role.role_oid = 0 THEN true
               ELSE pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')
          END
  ),
  'preflight role test treats PUBLIC policy OID 0 as applicable'
);
DROP POLICY qa_public_measurements_policy ON public.measurements;
SELECT ok(
  (SELECT count(*) = 3
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'measurements'
     AND policyname IN (
       'workspace_measurements_select_active_member',
       'workspace_measurements_insert_active_member',
       'workspace_measurements_update_active_member'
     )
     AND coalesce(qual, '') || ' ' || coalesce(with_check, '') ILIKE '%count%'
     AND coalesce(qual, '') || ' ' || coalesce(with_check, '') ILIKE '%role%owner%'
     AND coalesce(qual, '') || ' ' || coalesce(with_check, '') ILIKE '%nutritionist%'
     AND coalesce(qual, '') || ' ' || coalesce(with_check, '') ILIKE '%status%active%'
     AND coalesce(qual, '') || ' ' || coalesce(with_check, '') ILIKE '%count%=%1%'
  ),
  'workspace policies require exactly one active membership and an owner/nutritionist role'
);
SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'measurements' AND ('anon' = ANY(roles) OR 'public' = ANY(roles))),
  'no anon or PUBLIC policy remains'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_workspace_patient_fkey'
      AND convalidated = false
  ),
  'composite workspace-patient FK is installed NOT VALID'
);
SELECT ok(
  has_table_privilege('authenticated', 'public.measurements', 'SELECT')
  AND has_table_privilege('authenticated', 'public.measurements', 'INSERT')
  AND has_table_privilege('authenticated', 'public.measurements', 'UPDATE')
  AND has_table_privilege('authenticated', 'public.measurements', 'DELETE'),
  'authenticated has effective CRUD table privileges'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.measurements', 'TRUNCATE')
  AND NOT has_table_privilege('authenticated', 'public.measurements', 'REFERENCES')
  AND NOT has_table_privilege('authenticated', 'public.measurements', 'TRIGGER')
  AND NOT has_table_privilege('authenticated', 'public.measurements', 'MAINTAIN'),
  'authenticated lacks non-CRUD table privileges'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.measurements', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.measurements', 'INSERT')
  AND NOT has_table_privilege('anon', 'public.measurements', 'UPDATE')
  AND NOT has_table_privilege('anon', 'public.measurements', 'DELETE'),
  'anon has no effective CRUD table privileges'
);
SELECT ok(
  pg_get_serial_sequence('public.measurements', 'id') IS NOT NULL
  AND has_sequence_privilege('authenticated', pg_get_serial_sequence('public.measurements', 'id'), 'USAGE')
  AND NOT has_sequence_privilege('authenticated', pg_get_serial_sequence('public.measurements', 'id'), 'SELECT')
  AND NOT has_sequence_privilege('authenticated', pg_get_serial_sequence('public.measurements', 'id'), 'UPDATE')
  AND NOT has_sequence_privilege('anon', pg_get_serial_sequence('public.measurements', 'id'), 'USAGE')
  AND NOT has_sequence_privilege('anon', pg_get_serial_sequence('public.measurements', 'id'), 'SELECT')
  AND NOT has_sequence_privilege('anon', pg_get_serial_sequence('public.measurements', 'id'), 'UPDATE'),
  'authenticated has only sequence USAGE and anon has no sequence privileges'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000301', true);
SELECT set_config('request.jwt.claim.email', '', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000301","email":"","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements), 1, 'sole active owner sees only own workspace measurement');
SELECT is((SELECT count(*)::int FROM public.patients WHERE workspace_id = '00000000-0000-0000-0000-0000000003b1'), 0, 'patients SELECT grant does not expose another workspace');
SELECT is((SELECT count(*)::int FROM public.measurements WHERE notes = 'null workspace linked to tenant patient'), 0, 'workspace owner cannot see NULL-scoped row linked to tenant patient');
SELECT lives_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, weight, workspace_id) VALUES (900000000000000002, DATE '2026-11-04', 70, '00000000-0000-0000-0000-0000000003a1')$sql$, 'owner inserts measurement in own workspace');
SELECT throws_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, weight, workspace_id) VALUES (900000000000000003, DATE '2026-11-04', 70, '00000000-0000-0000-0000-0000000003b1')$sql$, '42501', NULL, 'owner cannot insert in another workspace');
SELECT throws_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, workspace_id) VALUES (900000000000000001, DATE '2026-11-04', NULL)$sql$, '42501', NULL, 'workspace owner cannot insert legacy NULL measurement');
SELECT lives_ok($sql$UPDATE public.measurements SET weight = 72 WHERE notes = 'workspace A fixture'$sql$, 'owner updates measurement in own workspace');
WITH changed AS (UPDATE public.measurements SET weight = 99 WHERE notes = 'workspace B fixture' RETURNING 1)
SELECT is((SELECT count(*)::int FROM changed), 0, 'owner cannot update another workspace measurement');
SELECT is((SELECT weight FROM public.measurements WHERE notes = 'workspace A fixture'), 72::numeric, 'authorized UPDATE persists the new measurement value');
WITH changed AS (DELETE FROM public.measurements WHERE notes = 'workspace A fixture' RETURNING 1)
SELECT is((SELECT count(*)::int FROM changed), 0, 'workspace owner has no DELETE policy');
WITH deleted AS (
  DELETE FROM public.measurements
  WHERE id = current_setting('test.measurements_workspace_b_id')::bigint
  RETURNING 1
)
SELECT is((SELECT count(*)::int FROM deleted), 0, 'workspace A direct DELETE of workspace B row is filtered by RLS');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000302', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000302","email":"","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements), 1, 'active nutritionist sees own workspace measurement');
SELECT is((SELECT count(*)::int FROM public.measurements WHERE workspace_id = '00000000-0000-0000-0000-0000000003a1'), 0, 'nutritionist cannot see another workspace');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000303', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000303","email":"","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements), 0, 'unassigned user sees no measurements');
SELECT throws_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, workspace_id) VALUES (900000000000000002, DATE '2026-11-04', '00000000-0000-0000-0000-0000000003a1')$sql$, '42501', NULL, 'unassigned user cannot insert');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000304', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000304","email":"","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements), 0, 'assistant role sees no measurements');
SELECT throws_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, workspace_id) VALUES (900000000000000002, DATE '2026-11-04', '00000000-0000-0000-0000-0000000003a1')$sql$, '42501', NULL, 'assistant cannot insert');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000305', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000305","email":"","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements), 0, 'suspended membership sees no measurements');
SELECT throws_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, workspace_id) VALUES (900000000000000002, DATE '2026-11-04', '00000000-0000-0000-0000-0000000003a1')$sql$, '42501', NULL, 'suspended member cannot insert');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000307', true);
SELECT set_config('request.jwt.claim.email', 'measure-legacy-admin@example.test', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000307","email":"measure-legacy-admin@example.test","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements WHERE patient_id = 900000000000000001 AND workspace_id IS NULL), 2, 'platform allowlist sees its legacy measurement fixtures');
SELECT is((SELECT count(*)::int FROM public.measurements WHERE workspace_id IS NOT NULL), 0, 'platform allowlist without membership cannot see workspace measurements');
SELECT is((SELECT count(*)::int FROM public.measurements WHERE notes = 'null workspace linked to tenant patient'), 0, 'legacy admin cannot see NULL-scoped measurement with workspace patient parent');
SELECT lives_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, weight, workspace_id) VALUES (900000000000000001, DATE '2026-11-05', 69, NULL)$sql$, 'platform allowlist retains legacy NULL insert');
WITH deleted AS (DELETE FROM public.measurements WHERE notes = 'legacy delete fixture' RETURNING 1)
SELECT is((SELECT count(*)::int FROM deleted), 1, 'legacy allowlist FOR ALL policy retains DELETE on legacy rows');
SELECT throws_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, weight, workspace_id) VALUES (900000000000000002, DATE '2026-11-05', 69, NULL)$sql$, '42501', NULL, 'legacy admin cannot insert NULL-scoped measurement for workspace patient');
SELECT throws_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, workspace_id) VALUES (900000000000000002, DATE '2026-11-05', '00000000-0000-0000-0000-0000000003a1')$sql$, '42501', NULL, 'platform allowlist alone cannot insert workspace measurement');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000308', true);
SELECT set_config('request.jwt.claim.email', 'measure-portal@example.test', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000308","email":"measure-portal@example.test","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements), 2, 'portal user sees both own legacy measurements');
SELECT is((SELECT count(*)::int FROM public.measurements WHERE workspace_id IS NOT NULL), 0, 'portal user cannot see workspace measurement without workspace link');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000309', true);
SELECT set_config('request.jwt.claim.email', 'measure-workspace-portal@example.test', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000309","email":"measure-workspace-portal@example.test","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements), 0, 'portal linked to workspace patient cannot see workspace or NULL-scoped tenant measurements');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000310', true);
SELECT set_config('request.jwt.claim.email', '', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000310","email":"","role":"authenticated"}', true);
SELECT is((SELECT count(*)::int FROM public.measurements), 0, 'user with two active workspace memberships is denied SELECT');
SELECT throws_ok($sql$INSERT INTO public.measurements (patient_id, assessment_date, weight, workspace_id) VALUES (900000000000000002, DATE '2026-11-05', 77, '00000000-0000-0000-0000-0000000003a1')$sql$, '42501', NULL, 'user with ambiguous active memberships is denied INSERT');

RESET ROLE;
SELECT throws_ok(
  $sql$INSERT INTO public.measurements (patient_id, assessment_date, weight, workspace_id) VALUES (900000000000000003, DATE '2026-11-06', 66, '00000000-0000-0000-0000-0000000003a1')$sql$,
  '23503', NULL,
  'composite FK rejects patient from another workspace'
);
SELECT is(
  (SELECT count(*)::int FROM public.measurements WHERE notes = 'legacy fixture unchanged' AND workspace_id IS NULL AND weight = 71.25),
  1,
  'legacy fixture values and NULL workspace scope remain unchanged'
);

SELECT * FROM finish();
ROLLBACK;

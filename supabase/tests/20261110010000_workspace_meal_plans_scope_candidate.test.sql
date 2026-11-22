-- LOCAL pgTAP TEST ONLY. Run only after the paired candidate is applied to an
-- isolated database. All fixtures use explicit IDs and are rolled back.
-- The rollback assertion checks rows, children and audit entries only. PostgreSQL
-- sequences are not transactional and are deliberately not asserted here.
-- The custom-role fixture is created, exercised, revoked and dropped inside
-- this transaction before any A/B data fixture is installed.

BEGIN;
SELECT plan(107);

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.meal_plans'::regclass), 'meal_plans RLS is enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.meals'::regclass), 'meals RLS is enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.meal_foods'::regclass), 'meal_foods RLS is enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.patient_audit_logs'::regclass), 'patient_audit_logs RLS is enabled');
SELECT ok(EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.meals'::regclass AND attname = 'workspace_id' AND atttypid = 'uuid'::regtype AND NOT attnotnull), 'meals.workspace_id is nullable UUID');
SELECT ok(EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.meal_foods'::regclass AND attname = 'workspace_id' AND atttypid = 'uuid'::regtype AND NOT attnotnull), 'meal_foods.workspace_id is nullable UUID');
SELECT ok(EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.measurements'::regclass AND attname = 'workspace_id' AND atttypid = 'uuid'::regtype), 'measurement lineage has workspace scope');
SELECT ok(EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.meals'::regclass AND attname = 'alternative_meals' AND atttypid = 'jsonb'::regtype), 'alternative_meals JSONB is preserved');
SELECT ok(EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.meals'::regclass AND attname = 'substitution_items' AND atttypid = 'jsonb'::regtype), 'substitution_items JSONB is preserved');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.meals'::regclass AND conname = 'meals_workspace_plan_fkey'), 'meals has workspace/plan composite FK');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.meal_foods'::regclass AND conname = 'meal_foods_workspace_meal_fkey'), 'meal_foods has workspace/meal composite FK');
SELECT ok(EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.patient_audit_logs'::regclass AND attname = 'workspace_id' AND atttypid = 'uuid'::regtype AND NOT attnotnull), 'audit workspace_id is nullable UUID');
SELECT ok(EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.patient_audit_logs'::regclass AND conname = 'patient_audit_logs_workspace_patient_fkey'), 'audit has workspace/patient composite FK');
SELECT ok(EXISTS (
  SELECT 1
  FROM pg_constraint constraint_record
  WHERE constraint_record.conrelid = 'public.patient_audit_logs'::regclass
    AND constraint_record.conname = 'patient_audit_logs_workspace_patient_fkey'
    AND constraint_record.confdeltype = 'n'
    AND (SELECT array_agg(attribute.attname::text ORDER BY key_position.ordinality)
         FROM unnest(constraint_record.confdelsetcols) WITH ORDINALITY AS key_position(attnum, ordinality)
         JOIN pg_attribute attribute
           ON attribute.attrelid = constraint_record.conrelid
          AND attribute.attnum = key_position.attnum
          AND NOT attribute.attisdropped) = ARRAY['patient_id']::text[]
), 'audit FK sets only patient_id NULL on delete');
SELECT ok(EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.meals_workspace_plan_idx'::regclass), 'meals workspace/plan index exists');
SELECT ok(EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.meal_foods_workspace_meal_idx'::regclass), 'meal_foods workspace/meal index exists');
SELECT ok((SELECT bool_and(has_table_privilege('authenticated', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') AND NOT has_table_privilege('authenticated', 'public.' || table_name, 'TRUNCATE') AND NOT has_table_privilege('authenticated', 'public.' || table_name, 'REFERENCES') AND NOT has_table_privilege('authenticated', 'public.' || table_name, 'TRIGGER') AND NOT has_table_privilege('authenticated', 'public.' || table_name, 'MAINTAIN')) FROM unnest(ARRAY['meal_plans','meals','meal_foods','patient_audit_logs']::text[]) AS tables(table_name)), 'authenticated retains legacy CRUD but no elevated table privileges');
SELECT ok((SELECT bool_and(NOT has_table_privilege('anon', 'public.' || table_name, privilege_name)) FROM unnest(ARRAY['meal_plans','meals','meal_foods','patient_audit_logs']::text[]) AS tables(table_name) CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']::text[]) AS privileges(privilege_name)), 'anon has no table privileges');
SELECT ok((SELECT bool_and(NOT has_sequence_privilege('anon', 'public.' || sequence_name, 'USAGE') AND NOT has_sequence_privilege('anon', 'public.' || sequence_name, 'SELECT') AND NOT has_sequence_privilege('anon', 'public.' || sequence_name, 'UPDATE')) FROM unnest(ARRAY['meal_plans_id_seq','meals_id_seq','meal_foods_id_seq','patient_audit_logs_id_seq']::text[]) AS sequences(sequence_name)), 'anon has no sequence privileges');
SELECT ok((SELECT bool_and(has_sequence_privilege('authenticated', 'public.' || sequence_name, 'USAGE') AND NOT has_sequence_privilege('authenticated', 'public.' || sequence_name, 'SELECT') AND NOT has_sequence_privilege('authenticated', 'public.' || sequence_name, 'UPDATE') AND has_sequence_privilege('service_role', 'public.' || sequence_name, 'USAGE') AND NOT has_sequence_privilege('service_role', 'public.' || sequence_name, 'SELECT') AND NOT has_sequence_privilege('service_role', 'public.' || sequence_name, 'UPDATE')) FROM unnest(ARRAY['meal_plans_id_seq','meals_id_seq','meal_foods_id_seq','patient_audit_logs_id_seq']::text[]) AS sequences(sequence_name)), 'authenticated and backend have USAGE-only sequence privileges');
SELECT ok((SELECT count(*) = 4 FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('meal_plans', 'meals', 'meal_foods', 'patient_audit_logs') AND policyname IN ('admin_all_meal_plans', 'admin_all_meals', 'admin_all_meal_foods', 'admin_all_patient_audit_logs')), 'legacy admin policies exist for all audited tables');
SELECT ok((SELECT count(*) = 3 FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('meal_plans', 'meals', 'meal_foods') AND policyname IN ('patient_self_read_meal_plans', 'patient_self_read_meals', 'patient_self_read_meal_foods')), 'legacy patient policies exist for all three tables');
SELECT ok((SELECT count(*) = 4 FROM pg_policies WHERE schemaname = 'public' AND policyname IN ('workspace_meal_plans_select_active_member', 'workspace_meals_select_active_member', 'workspace_meal_foods_select_active_member', 'workspace_patient_audit_logs_select_active_member')), 'workspace SELECT policies exist; no direct write policies');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('meal_plans', 'meals', 'meal_foods', 'patient_audit_logs') AND roles && ARRAY['authenticated']::name[] AND cmd IN ('INSERT', 'UPDATE', 'DELETE') AND policyname NOT IN ('admin_all_meal_plans', 'admin_all_meals', 'admin_all_meal_foods', 'admin_all_patient_audit_logs')), 'authenticated has no workspace table write policy');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('meal_plans', 'meals', 'meal_foods', 'patient_audit_logs') AND roles && ARRAY['public', 'anon']::name[]), 'no public or anon policy remains');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policy AS policy JOIN pg_class AS relation ON relation.oid = policy.polrelid JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid) WHERE namespace.nspname = 'public' AND relation.relname IN ('meal_plans', 'meals', 'meal_foods', 'patient_audit_logs') AND policy.polpermissive AND (policy_role.role_oid = 0 OR policy_role.role_oid IN ('anon'::regrole, 'authenticated'::regrole) OR pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')) AND policy.polname NOT IN ('admin_all_meal_plans', 'admin_all_meals', 'admin_all_meal_foods', 'admin_all_patient_audit_logs', 'patient_self_read_meal_plans', 'patient_self_read_meals', 'patient_self_read_meal_foods', 'workspace_meal_plans_select_active_member', 'workspace_meals_select_active_member', 'workspace_meal_foods_select_active_member', 'workspace_patient_audit_logs_select_active_member')), 'no inherited custom client policy exists');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policy AS policy JOIN pg_class AS relation ON relation.oid = policy.polrelid JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid) WHERE namespace.nspname = 'public' AND relation.relname IN ('meal_plans', 'meals', 'meal_foods', 'patient_audit_logs') AND policy.polpermissive AND (policy_role.role_oid = 0 OR policy_role.role_oid IN ('anon'::regrole, 'authenticated'::regrole) OR pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER') OR pg_has_role('anon'::regrole, policy_role.role_oid, 'MEMBER')) AND policy.polname NOT IN ('admin_all_meal_plans', 'admin_all_meals', 'admin_all_meal_foods', 'admin_all_patient_audit_logs', 'patient_self_read_meal_plans', 'patient_self_read_meals', 'patient_self_read_meal_foods', 'workspace_meal_plans_select_active_member', 'workspace_meals_select_active_member', 'workspace_meal_foods_select_active_member', 'workspace_patient_audit_logs_select_active_member')), 'no inherited custom client policy exists for authenticated or anon');
SELECT ok(has_function_privilege('authenticated', 'public.save_workspace_meal_plan(uuid,bigint,bigint,jsonb,jsonb,text)', 'EXECUTE') AND NOT has_function_privilege('anon', 'public.save_workspace_meal_plan(uuid,bigint,bigint,jsonb,jsonb,text)', 'EXECUTE'), 'save RPC is authenticated-only');
SELECT ok((SELECT pg_get_userbyid(p.proowner) = 'postgres' FROM pg_proc p WHERE p.oid = 'public.save_workspace_meal_plan(uuid,bigint,bigint,jsonb,jsonb,text)'::regprocedure), 'save RPC has trusted postgres owner');

CREATE TEMP TABLE acl_probe (id integer);
ALTER TABLE acl_probe ENABLE ROW LEVEL SECURITY;
CREATE POLICY acl_probe_anon_custom_policy ON acl_probe FOR SELECT TO anon USING (true);
GRANT SELECT ON acl_probe TO anon;
SELECT ok(has_table_privilege('anon', 'pg_temp.acl_probe', 'SELECT'), 'fixture observes effective anon grant');
SELECT ok(EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acl_probe_anon_custom_policy' AND 'anon' = ANY(roles)), 'fixture observes anon policy role');
REVOKE SELECT ON acl_probe FROM anon;
DROP POLICY acl_probe_anon_custom_policy ON acl_probe;
DROP TABLE acl_probe;
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acl_probe_anon_custom_policy'), 'temporary anon fixture leaves no policy residue');

CREATE ROLE meal_plan_acl_probe_role NOLOGIN;
GRANT meal_plan_acl_probe_role TO authenticated, anon;
GRANT TRUNCATE ON TABLE public.meal_plans TO meal_plan_acl_probe_role;
GRANT SELECT ON SEQUENCE public.meal_plans_id_seq TO meal_plan_acl_probe_role;
CREATE POLICY meal_plan_acl_probe_policy ON public.meal_plans
  FOR SELECT TO meal_plan_acl_probe_role USING (true);
SELECT ok(
  pg_has_role('authenticated'::regrole, 'meal_plan_acl_probe_role'::regrole, 'MEMBER')
  AND pg_has_role('anon'::regrole, 'meal_plan_acl_probe_role'::regrole, 'MEMBER'),
  'custom ACL role is inherited by authenticated and anon'
);
SELECT ok(EXISTS (
  SELECT 1
  FROM pg_policy policy_record
  JOIN pg_class relation ON relation.oid = policy_record.polrelid
  CROSS JOIN LATERAL unnest(policy_record.polroles) AS policy_role(role_oid)
  WHERE relation.oid = 'public.meal_plans'::regclass
    AND policy_record.polname = 'meal_plan_acl_probe_policy'
    AND policy_role.role_oid = 'meal_plan_acl_probe_role'::regrole
    AND pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')
    AND pg_has_role('anon'::regrole, policy_role.role_oid, 'MEMBER')
), 'custom ACL policy is visible through inherited client roles');
SELECT ok(
  has_table_privilege('authenticated', 'public.meal_plans', 'TRUNCATE')
  AND has_table_privilege('anon', 'public.meal_plans', 'TRUNCATE'),
  'custom ACL role grants effective table privilege to both client roles'
);
SELECT ok(
  has_sequence_privilege('authenticated', 'public.meal_plans_id_seq', 'SELECT')
  AND has_sequence_privilege('anon', 'public.meal_plans_id_seq', 'SELECT'),
  'custom ACL role grants effective sequence privilege to both client roles'
);
SELECT throws_ok($sql$
DO $preflight_probe$
BEGIN
  IF has_table_privilege('authenticated', 'public.meal_plans', 'TRUNCATE')
     OR has_table_privilege('anon', 'public.meal_plans', 'TRUNCATE')
     OR has_sequence_privilege('authenticated', 'public.meal_plans_id_seq', 'SELECT')
     OR has_sequence_privilege('anon', 'public.meal_plans_id_seq', 'SELECT')
     OR EXISTS (
       SELECT 1
       FROM pg_policy policy_record
       JOIN pg_class relation ON relation.oid = policy_record.polrelid
       CROSS JOIN LATERAL unnest(policy_record.polroles) AS policy_role(role_oid)
       WHERE relation.oid = 'public.meal_plans'::regclass
         AND policy_record.polname = 'meal_plan_acl_probe_policy'
         AND (
           pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')
           OR pg_has_role('anon'::regrole, policy_role.role_oid, 'MEMBER')
         )
     )
  THEN
    RAISE EXCEPTION 'effective inherited client ACL would fail preflight';
  END IF;
END
$preflight_probe$;
$sql$, NULL, NULL, 'preflight rejects inherited custom-role ACLs');
REVOKE ALL PRIVILEGES ON TABLE public.meal_plans FROM meal_plan_acl_probe_role;
REVOKE ALL PRIVILEGES ON SEQUENCE public.meal_plans_id_seq FROM meal_plan_acl_probe_role;
DROP POLICY meal_plan_acl_probe_policy ON public.meal_plans;
REVOKE meal_plan_acl_probe_role FROM authenticated, anon;
DROP ROLE meal_plan_acl_probe_role;
SELECT ok(
  NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'meal_plan_acl_probe_role')
  AND NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'meal_plan_acl_probe_policy'),
  'custom ACL fixture leaves no role or policy residue before A/B'
);

INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at) VALUES
  ('00000000-0000-0000-0000-000000001001', 'meal-a@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000001002', 'meal-b@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000001003', 'meal-assistant@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000001004', 'meal-admin@example.test', 'authenticated', 'authenticated', 'x', now()),
  ('00000000-0000-0000-0000-000000001005', 'meal-patient@example.test', 'authenticated', 'authenticated', 'x', now());
INSERT INTO public.admin_emails (email, note) VALUES ('meal-admin@example.test', 'synthetic meal-plan fixture');
INSERT INTO public.workspaces (id, name) VALUES
  ('00000000-0000-0000-0000-0000000010a1', 'Meal A'),
  ('00000000-0000-0000-0000-0000000010b1', 'Meal B');
INSERT INTO public.workspace_members (workspace_id, user_id, role, status) VALUES
  ('00000000-0000-0000-0000-0000000010a1', '00000000-0000-0000-0000-000000001001', 'owner', 'active'),
  ('00000000-0000-0000-0000-0000000010b1', '00000000-0000-0000-0000-000000001002', 'nutritionist', 'active'),
  ('00000000-0000-0000-0000-0000000010a1', '00000000-0000-0000-0000-000000001003', 'assistant', 'active');
INSERT INTO public.patients (id, name, email, workspace_id) VALUES
  (930000000000000001, 'Meal legacy patient', 'meal-patient@example.test', NULL),
  (930000000000000002, 'Meal patient A', 'meal-a-patient@example.test', '00000000-0000-0000-0000-0000000010a1'),
  (930000000000000003, 'Meal patient B', 'meal-b-patient@example.test', '00000000-0000-0000-0000-0000000010b1'),
  (930000000000000005, 'Meal patient A2', 'meal-a2-patient@example.test', '00000000-0000-0000-0000-0000000010a1');
INSERT INTO public.patient_portal_accounts (patient_id, auth_user_id, login, login_normalized, auth_email, is_active)
VALUES (930000000000000001, '00000000-0000-0000-0000-000000001005', 'meal-patient@example.test', 'meal-patient@example.test', 'meal-patient@example.test', true);
INSERT INTO public.measurements (id, patient_id, assessment_date, weight, workspace_id) VALUES
  (970000000000000001, 930000000000000002, DATE '2026-11-10', 70, '00000000-0000-0000-0000-0000000010a1'),
  (970000000000000002, 930000000000000003, DATE '2026-11-10', 80, '00000000-0000-0000-0000-0000000010b1'),
  (970000000000000003, 930000000000000005, DATE '2026-11-10', 65, '00000000-0000-0000-0000-0000000010a1');
INSERT INTO public.meal_plans (id, patient_id, workspace_id, title, measurement_id) VALUES
  (940000000000000001, 930000000000000001, NULL, 'Legacy plan'),
  (940000000000000002, 930000000000000002, '00000000-0000-0000-0000-0000000010a1', 'Plan A', 970000000000000001),
  (940000000000000003, 930000000000000003, '00000000-0000-0000-0000-0000000010b1', 'Plan B', 970000000000000002);
INSERT INTO public.patient_audit_logs (id, patient_id, patient_name, section_key, section_label, action, entity_type, entity_id, summary, workspace_id)
VALUES (980000000000000007, 930000000000000001, 'Meal legacy patient', 'plano_alimentar', 'Plano alimentar', 'update', 'meal_plan', 940000000000000002, 'Legacy patient points to workspace plan', NULL);
SELECT throws_ok($sql$
DO $preflight_audit_entity_probe$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.patient_audit_logs AS audit
    WHERE EXISTS (
      SELECT 1 FROM public.meal_plans AS plan
      WHERE audit.entity_type = 'meal_plan'
        AND audit.entity_id = plan.id
        AND plan.workspace_id IS NOT NULL
    )
  ) THEN
    RAISE EXCEPTION 'audit points to a workspace meal entity';
  END IF;
END
$preflight_audit_entity_probe$;
$sql$, NULL, NULL, 'preflight rejects a legacy patient audit pointing to workspace entity');
DELETE FROM public.patient_audit_logs WHERE id = 980000000000000007;
INSERT INTO public.patient_audit_logs (id, patient_id, patient_name, section_key, section_label, action, entity_type, entity_id, summary, workspace_id)
VALUES (980000000000000001, 930000000000000001, 'Meal legacy patient', 'plano_alimentar', 'Plano alimentar', 'update', 'meal_plan', 940000000000000001, 'Legacy audit', NULL);
INSERT INTO public.patient_audit_logs (id, patient_id, patient_name, section_key, section_label, action, entity_type, entity_id, summary, workspace_id)
VALUES
  (980000000000000002, 930000000000000002, 'Meal patient A', 'plano_alimentar', 'Plano alimentar', 'update', 'meal_plan', 940000000000000002, 'Ambiguous legacy audit', NULL),
  (980000000000000003, NULL, 'Orphan legacy patient', 'plano_alimentar', 'Plano alimentar', 'delete', 'meal_plan', 940000000000000001, 'Orphan legacy audit', NULL);
INSERT INTO public.patients (id, name, email, workspace_id)
VALUES (930000000000000004, 'Meal deleted patient A', 'meal-deleted-a@example.test', '00000000-0000-0000-0000-0000000010a1');
INSERT INTO public.patient_audit_logs (id, patient_id, patient_name, section_key, section_label, action, entity_type, entity_id, summary, workspace_id)
VALUES (980000000000000006, 930000000000000004, 'Meal deleted patient A', 'plano_alimentar', 'Plano alimentar', 'update', 'meal_plan', NULL, 'Audit survives patient deletion', '00000000-0000-0000-0000-0000000010a1');
INSERT INTO public.meals (id, plan_id, workspace_id, meal_name, alternative_meals, substitution_items) VALUES
  (950000000000000001, 940000000000000001, NULL, 'Legacy breakfast', '[{"meal_name":"Option 2","foods":[]}]', '[]');
INSERT INTO public.meal_foods (id, meal_id, workspace_id, food_name, quantity) VALUES
  (960000000000000001, 950000000000000001, NULL, 'Legacy oats', 40);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001001","role":"authenticated","email":"meal-a@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 1 FROM public.meal_plans WHERE workspace_id = '00000000-0000-0000-0000-0000000010a1'), 'A reads own plan');
SELECT ok((SELECT count(*) = 0 FROM public.meal_plans WHERE workspace_id = '00000000-0000-0000-0000-0000000010b1'), 'A cannot read B plan by ID');
SELECT ok((SELECT count(*) = 0 FROM public.meal_plans WHERE workspace_id IS NULL), 'A cannot read legacy plan');
SELECT throws_ok($sql$INSERT INTO public.meal_plans (id, patient_id, workspace_id, title) VALUES (940000000000000004, 930000000000000002, '00000000-0000-0000-0000-0000000010a1', 'direct')$sql$, NULL, NULL, 'A cannot write meal_plans directly');
UPDATE public.meal_plans SET title = 'direct' WHERE id = 940000000000000002;
SELECT ok((SELECT title = 'Plan A' FROM public.meal_plans WHERE id = 940000000000000002), 'A direct update returns no rows and leaves the plan unchanged');
DELETE FROM public.meal_plans WHERE id = 940000000000000002;
SELECT ok(EXISTS (SELECT 1 FROM public.meal_plans WHERE id = 940000000000000002 AND title = 'Plan A'), 'A direct delete returns no rows and leaves the plan present');
SELECT throws_ok($sql$INSERT INTO public.meal_plans (id, patient_id, workspace_id, title) VALUES (940000000000000005, 930000000000000003, '00000000-0000-0000-0000-0000000010b1', 'cross')$sql$, NULL, NULL, 'A cannot insert B plan');
SELECT throws_ok($sql$INSERT INTO public.meals (id, plan_id, workspace_id, meal_name) VALUES (950000000000000005, 940000000000000003, '00000000-0000-0000-0000-0000000010a1', 'cross')$sql$, NULL, NULL, 'A cannot attach meal to B plan');
SELECT throws_ok($sql$INSERT INTO public.meal_foods (id, meal_id, workspace_id, food_name) VALUES (960000000000000005, 950000000000000001, '00000000-0000-0000-0000-0000000010a1', 'cross')$sql$, NULL, NULL, 'A cannot attach food to a legacy meal');
UPDATE public.meal_plans SET workspace_id = '00000000-0000-0000-0000-0000000010b1' WHERE id = 940000000000000002;
SELECT ok((SELECT workspace_id = '00000000-0000-0000-0000-0000000010a1' FROM public.meal_plans WHERE id = 940000000000000002), 'A cannot move the plan to workspace B');
SELECT is(public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010a1', 930000000000000002, 940000000000000002, '{"title":"Plan A atomic"}', '[{"meal_name":"A atomic","alternative_meals":[{"meal_name":"Option 2","foods":[]}],"substitution_items":[],"foods":[{"food_name":"Rice","quantity":"100","unit":"g","calories":"130"}]}]'::jsonb, 'manual'), 940000000000000002::bigint, 'A saves header, meals, foods and alternatives through RPC');
SELECT ok((SELECT measurement_id = 970000000000000001 FROM public.meal_plans WHERE id = 940000000000000002) AND (SELECT count(*) = 1 FROM public.meals WHERE plan_id = 940000000000000002 AND workspace_id = '00000000-0000-0000-0000-0000000010a1') AND (SELECT count(*) = 1 FROM public.meal_foods food JOIN public.meals meal ON meal.id = food.meal_id WHERE meal.plan_id = 940000000000000002 AND food.workspace_id = '00000000-0000-0000-0000-0000000010a1'), 'A atomic save preserves the omitted valid measurement and persists the complete child graph');

RESET ROLE;
UPDATE public.meal_plans
SET measurement_id = 970000000000000002
WHERE id = 940000000000000002;
SELECT throws_ok($sql$
DO $measurement_lineage_preflight_probe$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.meal_plans AS plan
    WHERE plan.measurement_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.measurements AS measurement
        WHERE measurement.id = plan.measurement_id
          AND measurement.workspace_id IS NOT DISTINCT FROM plan.workspace_id
          AND measurement.patient_id = plan.patient_id
      )
  ) THEN
    RAISE EXCEPTION 'existing meal plan measurement reference has invalid workspace or patient';
  END IF;
END
$measurement_lineage_preflight_probe$;
$sql$, 'P0001', 'existing meal plan measurement reference has invalid workspace or patient', 'measurement lineage preflight rejects a synthetic cross-scope reference');
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001001","role":"authenticated","email":"meal-a@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok($sql$
  SELECT public.save_workspace_meal_plan(
    '00000000-0000-0000-0000-0000000010a1',
    930000000000000002,
    940000000000000002,
    '{"title":"must remain unchanged"}'::jsonb,
    '[{"meal_name":"must not replace children","foods":[]}]'::jsonb,
    'manual'
  )
$sql$, 'P0001', 'measurement does not belong to patient/workspace', 'UPDATE with omitted measurement_id rejects an invalid current measurement link');
SELECT ok(
  (SELECT title = 'Plan A atomic' AND measurement_id = 970000000000000002 FROM public.meal_plans WHERE id = 940000000000000002)
  AND (SELECT count(*) = 1 FROM public.meals WHERE plan_id = 940000000000000002 AND meal_name = 'A atomic')
  AND (SELECT count(*) = 1 FROM public.meal_foods food JOIN public.meals meal ON meal.id = food.meal_id WHERE meal.plan_id = 940000000000000002 AND food.food_name = 'Rice')
  AND (SELECT count(*) = 1 FROM public.patient_audit_logs WHERE entity_type = 'meal_plan' AND entity_id = 940000000000000002 AND workspace_id = '00000000-0000-0000-0000-0000000010a1'),
  'rejected omitted-measurement update preserves header, measurement, children and audit'
);
RESET ROLE;
UPDATE public.meal_plans
SET measurement_id = 970000000000000001
WHERE id = 940000000000000002;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001001","role":"authenticated","email":"meal-a@example.test"}', true);
SET LOCAL ROLE authenticated;

SELECT ok(NOT EXISTS (SELECT 1 FROM public.meal_plans plan JOIN public.meals meal ON meal.plan_id = plan.id WHERE plan.workspace_id IS NOT NULL AND meal.workspace_id IS NULL), 'no workspace plan has an unscoped meal after migration');
SELECT ok(NOT EXISTS (SELECT 1 FROM public.meals meal JOIN public.meal_foods food ON food.meal_id = meal.id WHERE meal.workspace_id IS NOT NULL AND food.workspace_id IS NULL), 'no workspace meal has an unscoped food after migration');
SELECT ok((SELECT alternative_meals -> 0 ->> 'meal_name' FROM public.meals WHERE plan_id = 940000000000000002) = 'Option 2', 'A preserves alternative_meals format');
SELECT ok((SELECT count(*) = 1 FROM public.patient_audit_logs WHERE entity_type = 'meal_plan' AND entity_id = 940000000000000002), 'A atomic save emits audit');
SELECT ok((SELECT count(*) = 1 FROM public.patient_audit_logs WHERE entity_id = 940000000000000002 AND workspace_id = '00000000-0000-0000-0000-0000000010a1' AND patient_id = 930000000000000002), 'A audit row belongs to A workspace');
SELECT ok((SELECT count(*) = 0 FROM public.patient_audit_logs WHERE workspace_id = '00000000-0000-0000-0000-0000000010b1'), 'A cannot read B audit rows');
SELECT throws_ok($sql$SELECT public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010a1', 930000000000000002, 940000000000000002, '{"title":"null meals"}', NULL::jsonb, 'manual')$sql$, NULL, NULL, 'NULL p_meals fails before replacement');
SELECT ok((SELECT title = 'Plan A atomic' FROM public.meal_plans WHERE id = 940000000000000002) AND (SELECT count(*) = 1 FROM public.meals WHERE plan_id = 940000000000000002) AND (SELECT count(*) = 1 FROM public.meal_foods food JOIN public.meals meal ON meal.id = food.meal_id WHERE meal.plan_id = 940000000000000002) AND (SELECT count(*) = 1 FROM public.patient_audit_logs WHERE entity_id = 940000000000000002 AND workspace_id = '00000000-0000-0000-0000-0000000010a1'), 'NULL p_meals leaves header, children and audit unchanged');
SELECT throws_ok($sql$SELECT public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010a1', 930000000000000002, 940000000000000002, '{"measurement_id":"970000000000000002"}', '[]'::jsonb, 'manual')$sql$, NULL, NULL, 'workspace A rejects measurement from workspace B');
SELECT throws_ok($sql$SELECT public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010a1', 930000000000000002, 940000000000000002, '{"measurement_id":"970000000000000003"}', '[]'::jsonb, 'manual')$sql$, NULL, NULL, 'workspace A rejects another patient measurement from the same workspace');
SELECT throws_ok($sql$SELECT public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010a1', 930000000000000002, 940000000000000002, '{"title":"must rollback"}', '[{"meal_name":"bad","foods":[{"food_name":"bad","quantity":"not-a-number"}]}]'::jsonb, 'manual')$sql$, NULL, NULL, 'A rejects malformed child payload');
SELECT ok((SELECT title = 'Plan A atomic' FROM public.meal_plans WHERE id = 940000000000000002) AND (SELECT count(*) = 1 FROM public.meals WHERE plan_id = 940000000000000002) AND (SELECT count(*) = 1 FROM public.meal_foods food JOIN public.meals meal ON meal.id = food.meal_id WHERE meal.plan_id = 940000000000000002) AND (SELECT count(*) = 1 FROM public.patient_audit_logs WHERE entity_type = 'meal_plan' AND entity_id = 940000000000000002), 'failed atomic save rolls back header, children and audit');
SELECT is(public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010a1', 930000000000000002, 940000000000000002, '{"title":"Plan A atomic","measurement_id":null}'::jsonb, '[{"meal_name":"A atomic","alternative_meals":[{"meal_name":"Option 2","foods":[]}],"substitution_items":[],"foods":[{"food_name":"Rice","quantity":"100","unit":"g","calories":"130"}]}]'::jsonb, 'manual'), 940000000000000002::bigint, 'explicit JSON null is accepted to clear a measurement link');
SELECT ok((SELECT measurement_id IS NULL FROM public.meal_plans WHERE id = 940000000000000002) AND (SELECT count(*) = 1 FROM public.meals WHERE plan_id = 940000000000000002 AND meal_name = 'A atomic') AND (SELECT count(*) = 1 FROM public.meal_foods food JOIN public.meals meal ON meal.id = food.meal_id WHERE meal.plan_id = 940000000000000002 AND food.food_name = 'Rice'), 'explicit null clears measurement without losing the meal graph');

RESET ROLE;
DELETE FROM public.patients WHERE id = 930000000000000004;
SELECT ok((SELECT patient_id IS NULL AND workspace_id = '00000000-0000-0000-0000-0000000010a1' FROM public.patient_audit_logs WHERE id = 980000000000000006), 'patient deletion nulls only audit patient_id and preserves workspace');
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001001","role":"authenticated","email":"meal-a@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 1 FROM public.patient_audit_logs WHERE id = 980000000000000006 AND patient_id IS NULL AND workspace_id = '00000000-0000-0000-0000-0000000010a1'), 'workspace A reads its patient-less audit row');

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001002","role":"authenticated","email":"meal-b@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 1 FROM public.meal_plans WHERE workspace_id = '00000000-0000-0000-0000-0000000010b1'), 'B reads own plan');
SELECT ok((SELECT count(*) = 0 FROM public.meal_plans WHERE workspace_id = '00000000-0000-0000-0000-0000000010a1'), 'B cannot read A plan by ID');
SELECT throws_ok($sql$INSERT INTO public.meal_plans (id, patient_id, workspace_id, title) VALUES (940000000000000006, 930000000000000003, '00000000-0000-0000-0000-0000000010b1', 'direct')$sql$, NULL, NULL, 'B cannot write meal_plans directly');
UPDATE public.meal_plans SET title = 'direct' WHERE id = 940000000000000003;
SELECT ok((SELECT title = 'Plan B' FROM public.meal_plans WHERE id = 940000000000000003), 'B direct update returns no rows and leaves the plan unchanged');
DELETE FROM public.meal_plans WHERE id = 940000000000000003;
SELECT ok(EXISTS (SELECT 1 FROM public.meal_plans WHERE id = 940000000000000003 AND title = 'Plan B'), 'B direct delete returns no rows and leaves the plan present');
SELECT is(public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010b1', 930000000000000003, 940000000000000003, '{"title":"Plan B atomic"}', '[{"meal_name":"B meal","alternative_meals":[],"substitution_items":[],"foods":[{"food_name":"Beans","quantity":"80","unit":"g","calories":"90"}]}]'::jsonb, 'manual'), 940000000000000003::bigint, 'B saves own plan and child graph through RPC');
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001001","role":"authenticated","email":"meal-a@example.test"}', true);
SET LOCAL ROLE authenticated;
CREATE TEMP TABLE round_trip_audit_count (count_before integer NOT NULL);
INSERT INTO round_trip_audit_count (count_before)
SELECT count(*)
FROM public.patient_audit_logs
WHERE entity_type = 'meal_plan'
  AND entity_id = 940000000000000002
  AND action = 'update'
  AND workspace_id = '00000000-0000-0000-0000-0000000010a1';
SELECT is(public.save_workspace_meal_plan(
  '00000000-0000-0000-0000-0000000010a1',
  930000000000000002,
  940000000000000002,
  '{"title":"Plan A edited","notes":"round trip"}'::jsonb,
  '[
    {"meal_name":"A edited","alternative_meals":[{"meal_name":"Option 2 edited","time_suggestion":"08:30","notes":"preserve option","foods":[]}],"substitution_items":[{"food_name":"Sweet potato","quantity":"100","unit":"g","replaces_food":"Rice"}],"foods":[{"food_name":"Oats","quantity":"60","unit":"g","calories":"228"}]},
    {"meal_name":"A edited snack","alternative_meals":[],"substitution_items":[],"foods":[{"food_name":"Yogurt","quantity":"170","unit":"g","calories":"100"}]}
  ]'::jsonb,
  'manual'
), 940000000000000002::bigint, 'A edits the existing plan through the RPC');
SELECT ok((SELECT title = 'Plan A edited' FROM public.meal_plans WHERE id = 940000000000000002), 'A update changes only its plan header');
SELECT ok(
  (SELECT count(*) = 2 FROM public.meals WHERE plan_id = 940000000000000002 AND workspace_id = '00000000-0000-0000-0000-0000000010a1')
  AND (SELECT count(*) = 2 FROM public.meal_foods food JOIN public.meals meal ON meal.id = food.meal_id WHERE meal.plan_id = 940000000000000002 AND food.workspace_id = '00000000-0000-0000-0000-0000000010a1')
  AND NOT EXISTS (SELECT 1 FROM public.meals WHERE plan_id = 940000000000000002 AND meal_name = 'A atomic')
  AND NOT EXISTS (SELECT 1 FROM public.meal_foods WHERE food_name = 'Rice'),
  'A update replaces the complete child graph without retaining stale children'
);
SELECT ok((SELECT alternative_meals = '[{"meal_name":"Option 2 edited","time_suggestion":"08:30","notes":"preserve option","foods":[]}]'::jsonb FROM public.meals WHERE plan_id = 940000000000000002 AND meal_name = 'A edited'), 'A round-trip preserves alternative_meals JSONB');
SELECT ok((SELECT substitution_items = '[{"food_name":"Sweet potato","quantity":"100","unit":"g","replaces_food":"Rice"}]'::jsonb FROM public.meals WHERE plan_id = 940000000000000002 AND meal_name = 'A edited'), 'A round-trip preserves substitution_items JSONB');
SELECT ok(
  (
    SELECT count(*) = (SELECT count_before + 1 FROM round_trip_audit_count)
    FROM public.patient_audit_logs
    WHERE entity_type = 'meal_plan'
      AND entity_id = 940000000000000002
      AND action = 'update'
      AND workspace_id = '00000000-0000-0000-0000-0000000010a1'
  ),
  'A round-trip emits one update audit row'
);
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001002","role":"authenticated","email":"meal-b@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok(
  (SELECT title = 'Plan B atomic' FROM public.meal_plans WHERE id = 940000000000000003)
  AND (SELECT count(*) = 1 FROM public.meals WHERE plan_id = 940000000000000003 AND workspace_id = '00000000-0000-0000-0000-0000000010b1')
  AND (SELECT count(*) = 1 FROM public.meal_foods food JOIN public.meals meal ON meal.id = food.meal_id WHERE meal.plan_id = 940000000000000003 AND food.workspace_id = '00000000-0000-0000-0000-0000000010b1'),
  'B remains unchanged after A round-trip'
);
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001001","role":"authenticated","email":"meal-a@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok($sql$SELECT public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010b1', 930000000000000003, 940000000000000003, '{"title":"A cross-write B"}', '[]'::jsonb, 'manual')$sql$, NULL, NULL, 'A cannot cross-write B through the RPC');
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001002","role":"authenticated","email":"meal-b@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 1 FROM public.meals WHERE plan_id = 940000000000000003 AND workspace_id = '00000000-0000-0000-0000-0000000010b1') AND (SELECT count(*) = 1 FROM public.meal_foods food JOIN public.meals meal ON meal.id = food.meal_id WHERE meal.plan_id = 940000000000000003 AND food.workspace_id = '00000000-0000-0000-0000-0000000010b1'), 'B reads its updated children');
SELECT ok((SELECT count(*) = 1 FROM public.patient_audit_logs WHERE entity_id = 940000000000000003 AND workspace_id = '00000000-0000-0000-0000-0000000010b1' AND patient_id = 930000000000000003), 'B sees its own workspace audit');
SELECT ok((SELECT count(*) = 0 FROM public.patient_audit_logs WHERE workspace_id = '00000000-0000-0000-0000-0000000010a1'), 'B cannot read A audit rows');
SELECT throws_ok($sql$INSERT INTO public.meal_foods (id, meal_id, workspace_id, food_name) VALUES (960000000000000007, 950000000000000001, '00000000-0000-0000-0000-0000000010b1', 'cross')$sql$, NULL, NULL, 'B cannot attach food across workspace');
SELECT throws_ok($sql$SELECT public.save_workspace_meal_plan('00000000-0000-0000-0000-0000000010a1', 930000000000000002, 940000000000000002, '{}', '[]'::jsonb, 'manual')$sql$, NULL, NULL, 'B cannot invoke RPC for A');

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001003","role":"authenticated","email":"meal-assistant@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 0 FROM public.meal_plans), 'assistant cannot read workspace plans');
SELECT throws_ok($sql$INSERT INTO public.meal_plans (id, patient_id, workspace_id, title) VALUES (940000000000000007, 930000000000000002, '00000000-0000-0000-0000-0000000010a1', 'assistant')$sql$, NULL, NULL, 'assistant cannot insert a workspace plan');

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001004","role":"authenticated","email":"meal-admin@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok((SELECT count(*) = 1 FROM public.meal_plans WHERE workspace_id IS NULL), 'legacy admin reads legacy plan');
SELECT ok((SELECT count(*) = 1 FROM public.meals WHERE workspace_id IS NULL), 'legacy admin reads legacy meals');
SELECT ok((SELECT count(*) = 1 FROM public.meal_foods WHERE workspace_id IS NULL), 'legacy admin reads legacy foods');
SELECT ok((SELECT count(*) = 1 FROM public.patient_audit_logs WHERE workspace_id IS NULL AND patient_id = 930000000000000001), 'legacy admin reads legacy audit');
SELECT ok((SELECT count(*) = 0 FROM public.patient_audit_logs WHERE workspace_id IS NULL AND patient_id = 930000000000000002), 'legacy admin excludes audit linked to a workspace patient');
SELECT ok((SELECT count(*) = 1 FROM public.patient_audit_logs WHERE workspace_id IS NULL AND patient_id IS NULL), 'legacy admin preserves orphan audit history');
SELECT ok((SELECT count(*) = 0 FROM public.patient_audit_logs WHERE id = 980000000000000006), 'legacy admin cannot read workspace audit after patient deletion');
INSERT INTO public.meal_plans (id, patient_id, workspace_id, title) VALUES (940000000000000009, 930000000000000001, NULL, 'Legacy admin write');
INSERT INTO public.meals (id, plan_id, workspace_id, meal_name, alternative_meals, substitution_items) VALUES (950000000000000009, 940000000000000009, NULL, 'Legacy admin meal', '[]', '[]');
INSERT INTO public.meal_foods (id, meal_id, workspace_id, food_name, quantity) VALUES (960000000000000009, 950000000000000009, NULL, 'Legacy admin food', 10);
INSERT INTO public.patient_audit_logs (id, patient_id, patient_name, section_key, section_label, action, entity_type, entity_id, summary, workspace_id) VALUES (980000000000000004, 930000000000000001, 'Meal legacy patient', 'plano_alimentar', 'Plano alimentar', 'create', 'meal_plan', 940000000000000009, 'Legacy admin audit', NULL);
UPDATE public.meal_plans SET title = 'Legacy admin write updated' WHERE id = 940000000000000009;
UPDATE public.meals SET meal_name = 'Legacy admin meal updated' WHERE id = 950000000000000009;
UPDATE public.meal_foods SET food_name = 'Legacy admin food updated', quantity = 20 WHERE id = 960000000000000009;
UPDATE public.patient_audit_logs SET summary = 'Legacy admin audit updated' WHERE id = 980000000000000004;
SELECT ok((SELECT title = 'Legacy admin write updated' FROM public.meal_plans WHERE id = 940000000000000009) AND (SELECT meal_name = 'Legacy admin meal updated' FROM public.meals WHERE id = 950000000000000009) AND (SELECT food_name = 'Legacy admin food updated' FROM public.meal_foods WHERE id = 960000000000000009) AND (SELECT summary = 'Legacy admin audit updated' FROM public.patient_audit_logs WHERE id = 980000000000000004), 'legacy admin updates the complete NULL-workspace graph');
DELETE FROM public.meal_foods WHERE id = 960000000000000009;
DELETE FROM public.meals WHERE id = 950000000000000009;
DELETE FROM public.meal_plans WHERE id = 940000000000000009;
DELETE FROM public.patient_audit_logs WHERE id = 980000000000000004;
SELECT ok(NOT EXISTS (SELECT 1 FROM public.meal_plans WHERE id = 940000000000000009) AND NOT EXISTS (SELECT 1 FROM public.meals WHERE id = 950000000000000009) AND NOT EXISTS (SELECT 1 FROM public.meal_foods WHERE id = 960000000000000009) AND NOT EXISTS (SELECT 1 FROM public.patient_audit_logs WHERE id = 980000000000000004), 'legacy admin deletes the complete NULL-workspace graph');
INSERT INTO public.meal_plans (id, patient_id, workspace_id, title) VALUES (940000000000000010, 930000000000000001, NULL, 'Legacy reinsert plan');
INSERT INTO public.meals (id, plan_id, workspace_id, meal_name, alternative_meals, substitution_items) VALUES (950000000000000010, 940000000000000010, NULL, 'Legacy reinsert meal', '[]', '[]');
INSERT INTO public.meal_foods (id, meal_id, workspace_id, food_name, quantity) VALUES (960000000000000010, 950000000000000010, NULL, 'Legacy reinsert food', 30);
INSERT INTO public.patient_audit_logs (id, patient_id, patient_name, section_key, section_label, action, entity_type, entity_id, summary, workspace_id) VALUES (980000000000000005, 930000000000000001, 'Meal legacy patient', 'plano_alimentar', 'Plano alimentar', 'create', 'meal_plan', 940000000000000010, 'Legacy reinsert audit', NULL);
SELECT ok((SELECT count(*) = 1 FROM public.meal_plans WHERE id = 940000000000000010 AND workspace_id IS NULL) AND (SELECT count(*) = 1 FROM public.meals WHERE id = 950000000000000010 AND plan_id = 940000000000000010 AND workspace_id IS NULL) AND (SELECT count(*) = 1 FROM public.meal_foods WHERE id = 960000000000000010 AND meal_id = 950000000000000010 AND workspace_id IS NULL) AND (SELECT count(*) = 1 FROM public.patient_audit_logs WHERE id = 980000000000000005 AND workspace_id IS NULL), 'legacy admin can reinsert the complete NULL-workspace graph');
SELECT ok((SELECT count(*) = 0 FROM public.meal_plans WHERE workspace_id IS NOT NULL), 'legacy admin cannot read workspace plans');

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001005', true);
SELECT set_config('request.jwt.claim.email', 'meal-patient@example.test', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001005","role":"authenticated","email":"meal-patient@example.test"}', true);
SET LOCAL ROLE authenticated;
SELECT ok(
  auth.uid() = '00000000-0000-0000-0000-000000001005'::uuid
  AND public.current_patient_id() = 930000000000000001
  AND public.current_patient_owns_plan(940000000000000001)
  AND public.current_patient_owns_meal(950000000000000001),
  'patient portal identity and ownership helpers resolve the synthetic account'
);
SELECT ok((SELECT count(*) = 1 FROM public.meal_plans WHERE id = 940000000000000001 AND patient_id = 930000000000000001 AND workspace_id IS NULL), 'patient portal retains the linked legacy plan read');
SELECT ok((SELECT count(*) = 1 FROM public.meals WHERE id = 950000000000000001 AND plan_id = 940000000000000001 AND workspace_id IS NULL), 'patient portal retains the linked legacy meal read');
SELECT ok((SELECT count(*) = 1 FROM public.meal_foods WHERE id = 960000000000000001 AND meal_id = 950000000000000001 AND workspace_id IS NULL), 'patient portal retains the linked legacy food read');
SELECT ok((SELECT count(*) = 0 FROM public.meal_plans WHERE workspace_id IS NOT NULL), 'patient portal cannot read workspace plans through legacy policy');

SELECT * FROM finish();
ROLLBACK;

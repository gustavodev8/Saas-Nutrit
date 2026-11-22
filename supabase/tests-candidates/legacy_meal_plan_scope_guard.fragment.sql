-- Local pgTAP fragment. Never run stand-alone or against a linked project.
-- Host: supabase/tests/20261110010000_workspace_meal_plans_scope_candidate.test.sql.
-- In memory only: increment plan(101) to plan(102); insert this fragment
-- immediately BEFORE "SELECT * FROM finish();". Keep the host BEGIN/ROLLBACK.
-- Requires both the workspace candidate and historical admin RPC in the scratch.
-- Apply the guard inside that same TEMP test transaction (see invocation).
-- PowerShell, from the repo root, after confirming 59342 is the disposable local scratch:
-- $h = Get-Content -Raw -Encoding UTF8 supabase/tests/20261110010000_workspace_meal_plans_scope_candidate.test.sql
-- $d = (git show c659c50:supabase/migrations/20261202000000_admin_meal_aggregate_atomic_saves_candidate.sql) -join "`n"
-- $g = Get-Content -Raw -Encoding UTF8 supabase/migration-candidates/20261202010000_legacy_meal_plan_scope_guard_candidate.sql
-- $f = Get-Content -Raw -Encoding UTF8 supabase/tests-candidates/legacy_meal_plan_scope_guard.fragment.sql
-- if ([regex]::Matches($h,'(?m)^SELECT plan\(101\);\r?$').Count -ne 1 -or [regex]::Matches($h,'(?m)^SELECT \* FROM finish\(\);\r?$').Count -ne 1 -or $h.TrimEnd() -notmatch 'ROLLBACK;$' -or $d -notmatch 'CREATE OR REPLACE FUNCTION public.save_admin_meal_plan_aggregate') { throw 'Unexpected historical suite or RPC' }
-- $sql = $h.Replace('SELECT plan(101);', "`n$d`n$g`nSELECT plan(102);").Replace('SELECT * FROM finish();', "$f`nSELECT * FROM finish();")
-- $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
-- $tap = $sql | psql -X -qAt -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 59342 -U postgres -d postgres -f -
-- $rc = $LASTEXITCODE; $tap
-- if ($rc -ne 0 -or ($tap -match '^not ok\b') -or -not ($tap -match '^ok 102\b')) { throw 'Compatibility suite failed' }
RESET ROLE;
-- Reuse the host admin, two workspaces, legacy patient, legacy and workspace plans.
-- A synthetic historical plan below reproduces a retained cross-patient measurement.
INSERT INTO public.patients(id, name, workspace_id)
VALUES (930000000000000077, 'Compatibility legacy patient', NULL);
INSERT INTO public.measurements(id, patient_id, assessment_date, weight, workspace_id)
VALUES (970000000000000077, 930000000000000077, DATE '2026-11-10', 70, NULL),
       (970000000000000078, 930000000000000001, DATE '2026-11-10', 70, NULL);
INSERT INTO public.meal_plans(id, patient_id, workspace_id, title, measurement_id)
VALUES (940000000000000077, 930000000000000001, NULL, 'Historical bad lineage', 970000000000000077);
DO $fixture$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.meal_plans WHERE id = 940000000000000002
                 AND workspace_id = '00000000-0000-0000-0000-0000000010a1') THEN
    RAISE EXCEPTION 'expected workspace fixture is missing';
  END IF;
END;
$fixture$;

-- The preceding portal tests set both per-claim GUCs and the JSON claims.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001004', true);
SELECT set_config('request.jwt.claim.email', 'meal-admin@example.test', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001004","role":"authenticated","email":"meal-admin@example.test"}', true);
SET LOCAL ROLE authenticated;

SELECT lives_ok($probe$
DO $compat$
DECLARE
  c record;
  r jsonb;
  legacy CONSTANT bigint := 940000000000000001;
  ws CONSTANT bigint := 940000000000000002;
  patient CONSTANT bigint := 930000000000000001;
  own_measure CONSTANT bigint := 970000000000000078;
BEGIN
  IF current_user <> 'authenticated' OR public.is_admin_email() IS NOT TRUE THEN
    RAISE EXCEPTION 'incorrect allowlisted fixture identity';
  END IF;
  FOR c IN SELECT * FROM (VALUES
    ('workspace header', ws, '{"title":"forbidden"}'::jsonb, false),
    ('workspace children', ws, NULL::jsonb, true),
    ('workspace return only', ws, NULL::jsonb, false),
    ('invalid retained measurement', 940000000000000077::bigint, NULL::jsonb, true),
    ('unknown plan', -1::bigint, NULL::jsonb, false),
    ('workspace patient', NULL::bigint, '{"patient_id":930000000000000002}'::jsonb, false),
    ('unknown patient', NULL::bigint, '{"patient_id":-1}'::jsonb, false),
    ('reassign patient', legacy, '{"patient_id":930000000000000077}'::jsonb, false),
    ('create other legacy measurement', NULL::bigint, jsonb_build_object('patient_id',patient,'measurement_id',970000000000000077), false),
    ('create workspace measurement', NULL::bigint, jsonb_build_object('patient_id',patient,'measurement_id',970000000000000001), false),
    ('edit other legacy measurement', legacy, '{"measurement_id":970000000000000077}'::jsonb, true),
    ('edit workspace measurement', legacy, '{"measurement_id":970000000000000001}'::jsonb, false),
    ('unknown measurement', legacy, '{"measurement_id":-1}'::jsonb, false)
  ) AS cases(label, plan_id, payload, replace_meals)
  LOOP
    BEGIN
      PERFORM public.save_admin_meal_plan_aggregate(c.plan_id, c.payload, '[]', c.replace_meals);
      RAISE EXCEPTION 'unexpected success: %', c.label;
    EXCEPTION WHEN insufficient_privilege THEN
      IF SQLERRM <> 'legacy meal plan access denied' THEN
        RAISE EXCEPTION 'wrong denial for %: %', c.label, SQLERRM;
      END IF;
    END;
  END LOOP;

  r := public.save_admin_meal_plan_aggregate(NULL, jsonb_build_object('patient_id',patient,'measurement_id',own_measure), '[]', false);
  IF (r->>'id') IS NULL OR (r->>'measurement_id')::bigint IS DISTINCT FROM own_measure THEN
    RAISE EXCEPTION 'valid legacy create failed';
  END IF;
  r := public.save_admin_meal_plan_aggregate(legacy,
    jsonb_build_object('title','Compatibility edit','measurement_id',own_measure),
    '[{"meal_name":"Compatibility meal","foods":[{"food_name":"Compatibility food","quantity":12}]}]', true);
  IF (r->>'id')::bigint IS DISTINCT FROM legacy OR NOT EXISTS (
    SELECT 1 FROM public.meal_plans p JOIN public.meals m ON m.plan_id = p.id
    JOIN public.meal_foods f ON f.meal_id = m.id
    WHERE p.id = legacy AND p.patient_id = patient AND p.workspace_id IS NULL
      AND p.title = 'Compatibility edit' AND p.measurement_id = own_measure
      AND m.meal_name = 'Compatibility meal' AND f.food_name = 'Compatibility food' AND f.quantity = 12
  ) THEN RAISE EXCEPTION 'legacy aggregate edit was not persisted'; END IF;
  r := public.save_admin_meal_plan_aggregate(legacy, '{"notes":"keep lineage"}', '[]', false);
  IF (r->>'measurement_id')::bigint IS DISTINCT FROM own_measure THEN
    RAISE EXCEPTION 'legacy edit lost retained measurement';
  END IF;
END;
$compat$;
$probe$, 'allowlisted legacy aggregate: scoped and unknown IDs denied identically, valid legacy graph remains editable');

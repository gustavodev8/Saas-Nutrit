-- Synthetic RLS smoke test. No DDL, external calls, or sequence use.
-- Every fixture is created in this transaction and rolled back at the end.
BEGIN;
\o /dev/null

SELECT set_config('test.smoke_user_a', gen_random_uuid()::text, true);
SELECT set_config('test.smoke_user_b', gen_random_uuid()::text, true);
SELECT set_config('test.smoke_workspace_a', gen_random_uuid()::text, true);
SELECT set_config('test.smoke_workspace_b', gen_random_uuid()::text, true);
SELECT set_config('test.smoke_patient_a', (-8000000000000000000 - floor(random() * 1000000000000)::bigint)::text, true);
SELECT set_config('test.smoke_patient_b', (-8000000000000000000 - floor(random() * 1000000000000)::bigint)::text, true);
SELECT set_config('test.smoke_measurement_a', (-8000000000000000000 - floor(random() * 1000000000000)::bigint)::text, true);
SELECT set_config('test.smoke_measurement_b', (-8000000000000000000 - floor(random() * 1000000000000)::bigint)::text, true);
SELECT set_config('test.smoke_result_1', 'not ok', true);
SELECT set_config('test.smoke_result_2', 'not ok', true);
SELECT set_config('test.smoke_result_3', 'not ok', true);
SELECT set_config('test.smoke_result_4', 'not ok', true);
SELECT set_config('test.smoke_result_5', 'not ok', true);
SELECT set_config('test.smoke_result_6', 'not ok', true);
SELECT set_config('test.smoke_result_7', 'not ok', true);
SELECT set_config('test.smoke_result_8', 'not ok', true);
SELECT set_config('test.smoke_result_9', 'not ok', true);
SELECT set_config('test.smoke_result_10', 'not ok', true);

INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES
  (current_setting('test.smoke_user_a')::uuid, 'smoke-' || current_setting('test.smoke_user_a') || '@example.invalid', 'authenticated', 'authenticated', 'smoke-only', now()),
  (current_setting('test.smoke_user_b')::uuid, 'smoke-' || current_setting('test.smoke_user_b') || '@example.invalid', 'authenticated', 'authenticated', 'smoke-only', now());

INSERT INTO public.workspaces (id, name)
VALUES
  (current_setting('test.smoke_workspace_a')::uuid, 'Temporary RLS smoke A'),
  (current_setting('test.smoke_workspace_b')::uuid, 'Temporary RLS smoke B');

INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES
  (current_setting('test.smoke_workspace_a')::uuid, current_setting('test.smoke_user_a')::uuid, 'owner', 'active'),
  (current_setting('test.smoke_workspace_b')::uuid, current_setting('test.smoke_user_b')::uuid, 'nutritionist', 'active');

INSERT INTO public.patients (id, name, email, phone, workspace_id)
OVERRIDING SYSTEM VALUE
VALUES
  (current_setting('test.smoke_patient_a')::bigint, 'Synthetic RLS A', 'smoke-patient-a-' || current_setting('test.smoke_user_a') || '@example.invalid', '000', current_setting('test.smoke_workspace_a')::uuid),
  (current_setting('test.smoke_patient_b')::bigint, 'Synthetic RLS B', 'smoke-patient-b-' || current_setting('test.smoke_user_b') || '@example.invalid', '000', current_setting('test.smoke_workspace_b')::uuid);

INSERT INTO public.measurements (id, patient_id, assessment_date, weight, notes, workspace_id)
OVERRIDING SYSTEM VALUE
VALUES
  (current_setting('test.smoke_measurement_a')::bigint, current_setting('test.smoke_patient_a')::bigint, current_date, 70, 'synthetic RLS smoke A', current_setting('test.smoke_workspace_a')::uuid),
  (current_setting('test.smoke_measurement_b')::bigint, current_setting('test.smoke_patient_b')::bigint, current_date, 71, 'synthetic RLS smoke B', current_setting('test.smoke_workspace_b')::uuid);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.smoke_user_a'), true);
SELECT set_config('request.jwt.claim.email', 'smoke-' || current_setting('test.smoke_user_a') || '@example.invalid', true);
SELECT set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('test.smoke_user_a'), 'email', 'smoke-' || current_setting('test.smoke_user_a') || '@example.invalid', 'role', 'authenticated')::text, true);

DO $smoke$
DECLARE
  affected integer;
  denied boolean;
BEGIN
  IF (SELECT count(*) FROM public.measurements) = 1
     AND EXISTS (SELECT 1 FROM public.measurements WHERE id = current_setting('test.smoke_measurement_a')::bigint)
     AND NOT EXISTS (SELECT 1 FROM public.measurements WHERE id = current_setting('test.smoke_measurement_b')::bigint) THEN
    PERFORM set_config('test.smoke_result_1', 'ok', true);
  END IF;

  INSERT INTO public.measurements (id, patient_id, assessment_date, weight, notes, workspace_id)
  OVERRIDING SYSTEM VALUE
  VALUES ((current_setting('test.smoke_measurement_a')::bigint - 1), current_setting('test.smoke_patient_a')::bigint, current_date, 72, 'synthetic RLS smoke own insert', current_setting('test.smoke_workspace_a')::uuid);
  PERFORM set_config('test.smoke_result_2', 'ok', true);

  UPDATE public.measurements SET weight = 73 WHERE id = current_setting('test.smoke_measurement_a')::bigint;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected = 1 THEN PERFORM set_config('test.smoke_result_3', 'ok', true); END IF;

  UPDATE public.measurements SET weight = 74 WHERE id = current_setting('test.smoke_measurement_b')::bigint;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected = 0 THEN PERFORM set_config('test.smoke_result_4', 'ok', true); END IF;

  DELETE FROM public.measurements WHERE id = current_setting('test.smoke_measurement_a')::bigint;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected = 0 THEN PERFORM set_config('test.smoke_result_5', 'ok', true); END IF;

  DELETE FROM public.measurements WHERE id = current_setting('test.smoke_measurement_b')::bigint;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected = 0 THEN PERFORM set_config('test.smoke_result_6', 'ok', true); END IF;

  denied := false;
  BEGIN
    INSERT INTO public.measurements (id, patient_id, assessment_date, weight, workspace_id)
    OVERRIDING SYSTEM VALUE
    VALUES (current_setting('test.smoke_measurement_b')::bigint - 1, current_setting('test.smoke_patient_b')::bigint, current_date, 75, current_setting('test.smoke_workspace_b')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN
    denied := true;
  END;
  IF denied THEN PERFORM set_config('test.smoke_result_7', 'ok', true); END IF;

  denied := false;
  BEGIN
    INSERT INTO public.measurements (id, patient_id, assessment_date, weight, workspace_id)
    OVERRIDING SYSTEM VALUE
    VALUES (current_setting('test.smoke_measurement_a')::bigint - 2, current_setting('test.smoke_patient_b')::bigint, current_date, 76, current_setting('test.smoke_workspace_a')::uuid);
  EXCEPTION WHEN foreign_key_violation THEN
    denied := true;
  END;
  IF denied THEN PERFORM set_config('test.smoke_result_8', 'ok', true); END IF;

  PERFORM set_config('request.jwt.claim.sub', current_setting('test.smoke_user_b'), true);
  PERFORM set_config('request.jwt.claim.email', 'smoke-' || current_setting('test.smoke_user_b') || '@example.invalid', true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('test.smoke_user_b'), 'email', 'smoke-' || current_setting('test.smoke_user_b') || '@example.invalid', 'role', 'authenticated')::text, true);

  IF (SELECT count(*) FROM public.measurements) = 1
     AND EXISTS (SELECT 1 FROM public.measurements WHERE id = current_setting('test.smoke_measurement_b')::bigint)
     AND NOT EXISTS (SELECT 1 FROM public.measurements WHERE id = current_setting('test.smoke_measurement_a')::bigint) THEN
    PERFORM set_config('test.smoke_result_9', 'ok', true);
  END IF;

  UPDATE public.measurements SET weight = 77 WHERE id = current_setting('test.smoke_measurement_a')::bigint;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected = 0 THEN PERFORM set_config('test.smoke_result_10', 'ok', true); END IF;
END;
$smoke$;

RESET ROLE;
SELECT
  CASE current_setting('test.smoke_result_1') WHEN 'ok' THEN 'ok 1 - workspace A sees only its own measurement' ELSE 'not ok 1 - workspace A sees only its own measurement' END AS tap1,
  CASE current_setting('test.smoke_result_2') WHEN 'ok' THEN 'ok 2 - workspace A can insert its own measurement' ELSE 'not ok 2 - workspace A can insert its own measurement' END AS tap2,
  CASE current_setting('test.smoke_result_3') WHEN 'ok' THEN 'ok 3 - workspace A can update its own measurement' ELSE 'not ok 3 - workspace A can update its own measurement' END AS tap3,
  CASE current_setting('test.smoke_result_4') WHEN 'ok' THEN 'ok 4 - workspace A cannot update workspace B measurement' ELSE 'not ok 4 - workspace A cannot update workspace B measurement' END AS tap4,
  CASE current_setting('test.smoke_result_5') WHEN 'ok' THEN 'ok 5 - workspace A cannot delete its measurement' ELSE 'not ok 5 - workspace A cannot delete its measurement' END AS tap5,
  CASE current_setting('test.smoke_result_6') WHEN 'ok' THEN 'ok 6 - workspace A cannot delete workspace B measurement' ELSE 'not ok 6 - workspace A cannot delete workspace B measurement' END AS tap6,
  CASE current_setting('test.smoke_result_7') WHEN 'ok' THEN 'ok 7 - cross-workspace insert is denied by RLS' ELSE 'not ok 7 - cross-workspace insert is denied by RLS' END AS tap7,
  CASE current_setting('test.smoke_result_8') WHEN 'ok' THEN 'ok 8 - mismatched workspace and patient is rejected by composite FK' ELSE 'not ok 8 - mismatched workspace and patient is rejected by composite FK' END AS tap8,
  CASE current_setting('test.smoke_result_9') WHEN 'ok' THEN 'ok 9 - workspace B sees only its own measurement' ELSE 'not ok 9 - workspace B sees only its own measurement' END AS tap9,
  CASE current_setting('test.smoke_result_10') WHEN 'ok' THEN 'ok 10 - workspace B cannot update workspace A measurement' ELSE 'not ok 10 - workspace B cannot update workspace A measurement' END AS tap10
\gset
ROLLBACK;
\o
\echo 1..10
\echo :tap1
\echo :tap2
\echo :tap3
\echo :tap4
\echo :tap5
\echo :tap6
\echo :tap7
\echo :tap8
\echo :tap9
\echo :tap10

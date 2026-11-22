-- LOCAL pgTAP review only. Run after the paired candidate and the reviewed
-- workspace-patient registry candidate in a complete, provenance-checked DB.
BEGIN;

SELECT plan(29);

INSERT INTO public.bookings (
  booking_group_id, session_number, total_sessions, client_name, client_email,
  appointment_date, appointment_time, type, status, payment_status,
  workspace_id
)
VALUES
  ('pg-test-single-group', 1, 1, 'Test Single', 'single@example.test', '2099-01-01', '09:00', 'online', 'pending', 'pending', NULL),
  ('pg-test-multi-group', 1, 2, 'Test Multi', 'multi@example.test', '2099-01-02', '09:00', 'online', 'pending', 'pending', NULL),
  ('pg-test-multi-group', 2, 2, 'Test Multi', 'multi@example.test', '2099-01-03', '09:00', 'online', 'pending', 'pending', NULL),
  ('pg-test-mixed-group', 1, 2, 'Test Mixed', 'mixed@example.test', '2099-01-04', '09:00', 'online', 'pending', 'pending', NULL),
  ('pg-test-mixed-group', 2, 2, 'Test Mixed', 'mixed@example.test', '2099-01-05', '09:00', 'online', 'pending', 'pending', '00000000-0000-0000-0000-00000000b001'),
  ('pg-test-conflict-group', 1, 1, 'Test Conflict', 'conflict@example.test', '2099-01-06', '09:00', 'online', 'cancelled', 'cancelled', NULL);

SELECT is(
  (SELECT count(*)::int
   FROM (VALUES
     ('anamnesis'), ('bookings'), ('consultation_records'), ('lab_exams'),
     ('lab_results'), ('meal_foods'), ('meal_plans'), ('meals'),
     ('measurements'), ('patient_audit_logs'), ('patient_exam_request_items'),
     ('patient_exam_requests'), ('patient_exam_results'), ('patient_photos'),
     ('patient_reports'), ('payment_logs'), ('prescription_block_items'),
     ('prescription_blocks'), ('prescriptions')
   ) AS target(table_name)
   JOIN pg_class AS relation
     ON relation.oid = to_regclass('public.' || target.table_name)
   JOIN pg_attribute AS attribute
     ON attribute.attrelid = relation.oid
    AND attribute.attname = 'workspace_id'
    AND NOT attribute.attisdropped
   WHERE attribute.atttypid = 'uuid'::regtype
     AND NOT attribute.attnotnull
     AND NOT attribute.atthasdef),
  19,
  'all 19 clinical tables have a nullable UUID workspace marker with no default'
);

SELECT is(
  (SELECT count(*)::int
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN (
       'anamnesis', 'bookings', 'consultation_records', 'lab_exams',
       'lab_results', 'meal_foods', 'meal_plans', 'meals', 'measurements',
       'patient_audit_logs', 'patient_exam_request_items',
       'patient_exam_requests', 'patient_exam_results', 'patient_photos',
       'patient_reports', 'payment_logs', 'prescription_block_items',
       'prescription_blocks', 'prescriptions'
     )
     AND policyname = 'admin_all_' || tablename
     AND cmd = 'ALL'
     AND roles = ARRAY['authenticated']::name[]
     AND lower(qual) LIKE '%is_admin_email%'
     AND lower(qual) LIKE '%workspace_id%is null%'
     AND lower(with_check) LIKE '%is_admin_email%'
     AND lower(with_check) LIKE '%workspace_id%is null%'),
  19,
  'allowlist policies are restricted to legacy NULL-workspace rows'
);

SELECT is(
  (SELECT count(*)::int
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN (
       'anamnesis', 'bookings', 'consultation_records', 'lab_exams',
       'lab_results', 'meal_foods', 'meal_plans', 'meals', 'measurements',
       'patient_audit_logs', 'patient_exam_request_items',
       'patient_exam_requests', 'patient_exam_results', 'patient_photos',
       'patient_reports', 'payment_logs', 'prescription_block_items',
       'prescription_blocks', 'prescriptions'
     )
     AND (policyname LIKE 'workspace_%'
       OR coalesce(qual, '') ILIKE '%workspace_members%'
       OR coalesce(with_check, '') ILIKE '%workspace_members%')),
  0,
  'membership does not grant access to these 19 clinical tables'
);

SELECT is(
  (SELECT count(*)::int
   FROM pg_policies
   WHERE schemaname = 'public'
     AND policyname LIKE 'patient_self_read_%'
     AND tablename IN (
       'patients', 'measurements', 'meal_plans', 'meals', 'meal_foods',
       'patient_reports', 'patient_exam_requests',
       'patient_exam_request_items', 'patient_exam_results', 'bookings',
       'consultation_records'
     )
     AND cmd = 'SELECT'
     AND 'authenticated' = ANY(roles)
     AND position('is_admin_email' IN lower(qual)) = 0),
  10,
  'all 10 portal self-read policies have no global allowlist branch'
);

SELECT ok(
  (SELECT lower(qual) LIKE '%id =%current_patient_id%'
          AND position('is_admin_email' IN lower(qual)) = 0
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'patients'
     AND policyname = 'patient_self_read_patients'),
  'patient portal remains limited to its authenticated patient identity'
);

SELECT ok(
  (SELECT lower(qual) LIKE '%patient_id =%current_patient_id%'
          AND position('client_email' IN lower(qual)) = 0
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'bookings'
     AND policyname = 'patient_self_read_bookings'),
  'booking portal requires exact patient_id link, not email'
);

SELECT ok(
  (SELECT lower(qual) LIKE '%booking_id%'
          AND lower(qual) LIKE '%booking.patient_id%current_patient_id%'
          AND position('client_email' IN lower(qual)) = 0
          AND position('booking_group' IN lower(qual)) = 0
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'consultation_records'
     AND policyname = 'patient_self_read_consultation_records'),
  'consultation portal requires an exact booking and patient relation'
);

SELECT ok(
  (SELECT prosecdef
          AND position('patient_portal_accounts' IN lower(pg_get_functiondef(oid))) > 0
          AND position('auth.uid()' IN lower(pg_get_functiondef(oid))) > 0
          AND position('is_active' IN lower(pg_get_functiondef(oid))) > 0
          AND position('client_email' IN lower(pg_get_functiondef(oid))) = 0
   FROM pg_proc
   WHERE oid = 'public.current_patient_id()'::regprocedure),
  'portal identity helper is based on an active auth-user account link'
);

SELECT ok(
  (SELECT lower(qual) LIKE '%workspace_id%is null%'
          AND lower(with_check) LIKE '%workspace_id%is null%'
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'patients'
     AND policyname = 'admin_all_patients'),
  'existing patient candidate keeps allowlist access on legacy rows only'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bookings'
      AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  ),
  'bookings has no anonymous or PUBLIC policy'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.bookings', 'INSERT')
  AND NOT has_table_privilege('anon', 'public.bookings', 'UPDATE')
  AND NOT has_table_privilege('anon', 'public.bookings', 'DELETE')
  AND NOT has_table_privilege('anon', 'public.bookings', 'TRUNCATE')
  AND NOT has_table_privilege('anon', 'public.bookings', 'REFERENCES')
  AND NOT has_table_privilege('anon', 'public.bookings', 'TRIGGER'),
  'bookings has no effective anonymous write privileges'
);

SELECT ok(
  (SELECT conname = 'consultation_records_booking_id_fkey'
          AND contype = 'f'
          AND conkey = ARRAY[(SELECT attnum FROM pg_attribute
                              WHERE attrelid = 'public.consultation_records'::regclass
                                AND attname = 'booking_id' AND NOT attisdropped)]::smallint[]
          AND confkey = ARRAY[(SELECT attnum FROM pg_attribute
                               WHERE attrelid = 'public.bookings'::regclass
                                 AND attname = 'id' AND NOT attisdropped)]::smallint[]
          AND confdeltype = 'r'
          AND NOT condeferrable
          AND NOT condeferred
   FROM pg_constraint
   WHERE conrelid = 'public.consultation_records'::regclass
     AND confrelid = 'public.bookings'::regclass
     AND conname = 'consultation_records_booking_id_fkey'),
  'consultation booking FK has exact key columns and ON DELETE RESTRICT'
);

SELECT ok(
  (SELECT prosecdef
          AND proconfig @> ARRAY['search_path=pg_catalog, public']::text[]
   FROM pg_proc
   WHERE oid = 'public.confirm_legacy_booking_group(text,text)'::regprocedure),
  'booking group confirmation is SECURITY DEFINER with a fixed search_path'
);

SELECT ok(
  has_function_privilege('service_role', 'public.confirm_legacy_booking_group(text,text)', 'EXECUTE'),
  'service_role can execute the booking group confirmation RPC'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.confirm_legacy_booking_group(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.confirm_legacy_booking_group(text,text)', 'EXECUTE'),
  'anon and authenticated cannot execute the privileged booking group RPC'
);

SELECT is(
  public.confirm_legacy_booking_group('pg-test-single-group', 'pix')->>'status',
  'confirmed',
  'single-session legacy group confirms'
);
SELECT is(
  (public.confirm_legacy_booking_group('pg-test-single-group', 'pix')->>'count')::int,
  1,
  'single-session response reports its exact row count'
);
SELECT is(
  (SELECT count(*)::int FROM public.bookings
   WHERE booking_group_id = 'pg-test-single-group'
     AND status = 'confirmed' AND payment_status = 'paid' AND payment_method = 'pix'),
  1,
  'single-session booking is persisted with confirmed payment state'
);

SELECT is(
  public.confirm_legacy_booking_group('pg-test-multi-group', 'card')->>'status',
  'confirmed',
  'valid multi-session legacy group confirms atomically'
);
SELECT is(
  (public.confirm_legacy_booking_group('pg-test-multi-group', 'card')->>'count')::int,
  2,
  'multi-session response reports every group row'
);
SELECT is(
  (SELECT count(*)::int FROM public.bookings
   WHERE booking_group_id = 'pg-test-multi-group'
     AND status = 'confirmed' AND payment_status = 'paid' AND payment_method = 'card'),
  2,
  'all sessions in a multi-session group are confirmed together'
);

SELECT is(
  public.confirm_legacy_booking_group('pg-test-multi-group', 'pix')->>'status',
  'already_confirmed',
  'repeating a successful call returns the idempotent outcome'
);
SELECT is(
  (public.confirm_legacy_booking_group('pg-test-multi-group', 'pix')->'booking_ids'),
  (SELECT pg_catalog.to_jsonb(pg_catalog.array_agg(id ORDER BY id))
   FROM public.bookings WHERE booking_group_id = 'pg-test-multi-group'),
  'idempotent response identifies the same complete session set'
);

SELECT is(
  public.confirm_legacy_booking_group('pg-test-mixed-group', 'pix')->>'status',
  'not_legacy',
  'mixed legacy/workspace group is rejected'
);
SELECT is(
  (SELECT count(*)::int FROM public.bookings
   WHERE booking_group_id = 'pg-test-mixed-group' AND payment_status = 'pending'),
  2,
  'rejected mixed group is left unchanged'
);

SELECT is(
  public.confirm_legacy_booking_group('pg-test-absent-group', 'pix')->>'status',
  'not_found',
  'absent group has an explicit not_found outcome'
);
SELECT is(
  (public.confirm_legacy_booking_group('pg-test-absent-group', 'pix')->>'count')::int,
  0,
  'absent group reports zero affected rows'
);

SELECT is(
  public.confirm_legacy_booking_group('pg-test-conflict-group', 'pix')->>'status',
  'conflict',
  'non-pending group is rejected without mutation'
);
SELECT is(
  (SELECT count(*)::int FROM public.bookings
   WHERE booking_group_id = 'pg-test-conflict-group'
     AND status = 'cancelled' AND payment_status = 'cancelled'),
  1,
  'conflict row remains unchanged'
);

SELECT * FROM finish();
ROLLBACK;

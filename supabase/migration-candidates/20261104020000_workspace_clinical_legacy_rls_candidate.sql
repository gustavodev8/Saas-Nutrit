-- LOCAL CANDIDATE ONLY. Requires the reviewed workspace-patient registry
-- candidate and the consultation booking FK candidate. No rows are backfilled,
-- deleted, reassigned, or otherwise changed by this candidate.

DO $workspace_clinical_rls_preflight$
DECLARE
  target_table text;
  target_policy text;
  normalized_qual text;
  normalized_check text;
  portal_table text;
  portal_policy text;
  expected_qual text;
BEGIN
  IF to_regclass('public.workspaces') IS NULL
     OR to_regclass('public.workspace_members') IS NULL
     OR to_regclass('public.patients') IS NULL
     OR to_regclass('public.patient_portal_accounts') IS NULL THEN
    RAISE EXCEPTION 'workspace clinical RLS prerequisites are missing';
  END IF;

  FOREACH target_table IN ARRAY ARRAY[
    'anamnesis', 'bookings', 'consultation_records', 'lab_exams',
    'lab_results', 'meal_foods', 'meal_plans', 'meals', 'measurements',
    'patient_audit_logs', 'patient_exam_request_items',
    'patient_exam_requests', 'patient_exam_results', 'patient_photos',
    'patient_reports', 'payment_logs', 'prescription_block_items',
    'prescription_blocks', 'prescriptions'
  ] LOOP
    IF to_regclass(format('public.%I', target_table)) IS NULL THEN
      RAISE EXCEPTION 'required clinical table public.% is missing', target_table;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_class AS relation
      WHERE relation.oid = to_regclass(format('public.%I', target_table))
        AND relation.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on public.%', target_table;
    END IF;

    target_policy := 'admin_all_' || target_table;
    IF (SELECT count(*) FROM pg_policies
        WHERE schemaname = 'public' AND tablename = target_table
          AND policyname = target_policy AND cmd = 'ALL'
          AND permissive = 'PERMISSIVE'
          AND roles = ARRAY['authenticated']::name[]) <> 1 THEN
      RAISE EXCEPTION 'unexpected or missing % policy on public.%', target_policy, target_table;
    END IF;

    SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g'),
           regexp_replace(lower(with_check), '[[:space:]()]', '', 'g')
      INTO normalized_qual, normalized_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = target_table
      AND policyname = target_policy;
    IF normalized_qual NOT IN ('public.is_admin_email', 'is_admin_email')
       OR normalized_check NOT IN ('public.is_admin_email', 'is_admin_email') THEN
      RAISE EXCEPTION 'unexpected % predicate on public.%', target_policy, target_table;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
        AND (('anon' = ANY(roles)) OR ('public' = ANY(roles)))
    ) THEN
      RAISE EXCEPTION 'anonymous/public policy drift on public.%', target_table;
    END IF;

    IF target_table = 'bookings' AND (
      has_table_privilege('anon', 'public.bookings', 'INSERT')
      OR has_table_privilege('anon', 'public.bookings', 'UPDATE')
      OR has_table_privilege('anon', 'public.bookings', 'DELETE')
      OR has_table_privilege('anon', 'public.bookings', 'TRUNCATE')
      OR has_table_privilege('anon', 'public.bookings', 'REFERENCES')
      OR has_table_privilege('anon', 'public.bookings', 'TRIGGER')
    ) THEN
      RAISE EXCEPTION 'anonymous effective write privilege exists on public.bookings';
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
        AND 'authenticated' = ANY(roles)
        AND policyname NOT IN (target_policy,
          CASE WHEN target_table IN (
            'patients', 'measurements', 'meal_plans', 'meals', 'meal_foods',
            'patient_reports', 'patient_exam_requests',
            'patient_exam_request_items', 'patient_exam_results', 'bookings',
            'consultation_records'
          ) THEN 'patient_self_read_' || CASE target_table
            WHEN 'patient_reports' THEN 'reports'
            WHEN 'patient_exam_requests' THEN 'exam_requests'
            WHEN 'patient_exam_request_items' THEN 'exam_request_items'
            WHEN 'patient_exam_results' THEN 'exam_results'
            ELSE target_table
          END ELSE '' END)
    ) THEN
      RAISE EXCEPTION 'unexpected authenticated policy on public.%', target_table;
    END IF;
  END LOOP;

  -- The prior patient candidate must already constrain the allowlist and keep
  -- portal self-read free of its former global-admin branch.
  SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g'),
         regexp_replace(lower(with_check), '[[:space:]()]', '', 'g')
    INTO normalized_qual, normalized_check
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'patients'
    AND policyname = 'admin_all_patients' AND cmd = 'ALL'
    AND permissive = 'PERMISSIVE'
    AND roles = ARRAY['authenticated']::name[];
  IF normalized_qual NOT IN (
      'public.is_admin_emailandworkspace_idisnull',
      'is_admin_emailandworkspace_idisnull'
    ) OR normalized_check NOT IN (
      'public.is_admin_emailandworkspace_idisnull',
      'is_admin_emailandworkspace_idisnull'
    ) THEN
    RAISE EXCEPTION 'patients admin policy is not the reviewed legacy-only candidate';
  END IF;

  -- Fail closed if current_patient_id is still email-derived instead of tied
  -- to an active authenticated portal account.
  IF to_regprocedure('public.current_patient_id()') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM pg_proc AS function
       WHERE function.oid = 'public.current_patient_id()'::regprocedure
         AND function.prosecdef
         AND position('patient_portal_accounts' IN lower(pg_get_functiondef(function.oid))) > 0
         AND position('auth.uid()' IN lower(pg_get_functiondef(function.oid))) > 0
         AND position('is_active' IN lower(pg_get_functiondef(function.oid))) > 0
         AND position('client_email' IN lower(pg_get_functiondef(function.oid))) = 0
     ) THEN
    RAISE EXCEPTION 'current_patient_id is not backed by an active verified auth link';
  END IF;

  -- Existing patient-self policy definitions must match the reviewed legacy
  -- forms. They are replaced below with exact-link-only predicates.
  FOR portal_table, portal_policy, expected_qual IN
    SELECT * FROM (VALUES
      ('measurements', 'patient_self_read_measurements', 'public.is_admin_email() or patient_id = public.current_patient_id()'),
      ('meal_plans', 'patient_self_read_meal_plans', 'public.is_admin_email() or patient_id = public.current_patient_id()'),
      ('meals', 'patient_self_read_meals', 'public.is_admin_email() or public.current_patient_owns_plan(plan_id)'),
      ('meal_foods', 'patient_self_read_meal_foods', 'public.is_admin_email() or public.current_patient_owns_meal(meal_id)'),
      ('patient_reports', 'patient_self_read_reports', 'public.is_admin_email() or patient_id = public.current_patient_id()'),
      ('patient_exam_requests', 'patient_self_read_exam_requests', 'public.is_admin_email() or patient_id = public.current_patient_id()'),
      ('patient_exam_request_items', 'patient_self_read_exam_request_items', 'public.is_admin_email() or public.current_patient_owns_exam_request(request_id)'),
      ('patient_exam_results', 'patient_self_read_exam_results', 'public.is_admin_email() or public.current_patient_owns_exam_request(request_id)')
    ) AS expected(table_name, policy_name, predicate)
  LOOP
    SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g')
      INTO normalized_qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = portal_table
      AND policyname = portal_policy AND cmd = 'SELECT'
      AND permissive = 'PERMISSIVE'
      AND roles = ARRAY['authenticated']::name[];
    IF normalized_qual IS NULL
       OR normalized_qual <> regexp_replace(lower(expected_qual), '[[:space:]()]', '', 'g') THEN
      RAISE EXCEPTION 'unexpected or missing % policy on public.%', portal_policy, portal_table;
    END IF;
  END LOOP;

  SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g')
    INTO normalized_qual
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'bookings'
    AND policyname = 'patient_self_read_bookings' AND cmd = 'SELECT'
    AND permissive = 'PERMISSIVE'
    AND roles = ARRAY['authenticated']::name[];
  IF normalized_qual NOT IN (
    'public.is_admin_emailorpatient_id=public.current_patient_idorlowercoalesceclient_email,''=public.current_user_email',
    'public.is_admin_emailorpatient_id=public.current_patient_idorlowercoalesceclient_email,''=public.current_patient_contact_email'
  ) THEN
    RAISE EXCEPTION 'unexpected or missing patient_self_read_bookings policy';
  END IF;

  SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g')
    INTO normalized_qual
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'consultation_records'
    AND policyname = 'patient_self_read_consultation_records' AND cmd = 'SELECT'
    AND permissive = 'PERMISSIVE'
    AND roles = ARRAY['authenticated']::name[];
  IF normalized_qual NOT IN (
    'public.is_admin_emailorlowercoalesceclient_email,''=public.current_user_emailorpublic.current_patient_can_access_booking_groupbooking_group_id',
    'public.is_admin_emailorlowercoalesceclient_email,''=public.current_patient_contact_emailorpublic.current_patient_can_access_booking_groupbooking_group_id'
  ) THEN
    RAISE EXCEPTION 'unexpected or missing patient_self_read_consultation_records policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.consultation_records'::regclass
      AND attname = 'booking_id' AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint AS constraint_catalog
    WHERE constraint_catalog.conrelid = 'public.consultation_records'::regclass
      AND constraint_catalog.confrelid = 'public.bookings'::regclass
      AND constraint_catalog.contype = 'f'
      AND constraint_catalog.conname = 'consultation_records_booking_id_fkey'
      AND constraint_catalog.conkey = ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.consultation_records'::regclass
          AND attname = 'booking_id' AND NOT attisdropped
      )]::smallint[]
      AND constraint_catalog.confkey = ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.bookings'::regclass
          AND attname = 'id' AND NOT attisdropped
      )]::smallint[]
      AND constraint_catalog.confdeltype = 'r'
      AND NOT constraint_catalog.condeferrable
      AND NOT constraint_catalog.condeferred
  ) THEN
    RAISE EXCEPTION 'consultation_records requires the exact RESTRICT booking_id foreign key';
  END IF;
END
$workspace_clinical_rls_preflight$;

-- All added markers remain NULL for every existing row. Tables that already
-- have the marker were added by the earlier expand-only workspace candidate.
DO $workspace_clinical_scope_columns$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'anamnesis', 'bookings', 'consultation_records', 'lab_exams',
    'lab_results', 'meal_foods', 'meal_plans', 'meals', 'measurements',
    'patient_audit_logs', 'patient_exam_request_items',
    'patient_exam_requests', 'patient_exam_results', 'patient_photos',
    'patient_reports', 'payment_logs', 'prescription_block_items',
    'prescription_blocks', 'prescriptions'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', target_table))
        AND attname = 'workspace_id' AND NOT attisdropped
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN workspace_id uuid', target_table);
    ELSIF NOT EXISTS (
      SELECT 1 FROM pg_attribute AS attribute
      WHERE attribute.attrelid = to_regclass(format('public.%I', target_table))
        AND attribute.attname = 'workspace_id'
        AND attribute.atttypid = 'uuid'::regtype
        AND NOT attribute.attnotnull
        AND attribute.atthasdef = false
        AND NOT attribute.attisdropped
    ) THEN
      RAISE EXCEPTION 'workspace_id on public.% is not nullable UUID without a default', target_table;
    END IF;
  END LOOP;
END
$workspace_clinical_scope_columns$;

DO $workspace_clinical_admin_policies$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'anamnesis', 'bookings', 'consultation_records', 'lab_exams',
    'lab_results', 'meal_foods', 'meal_plans', 'meals', 'measurements',
    'patient_audit_logs', 'patient_exam_request_items',
    'patient_exam_requests', 'patient_exam_results', 'patient_photos',
    'patient_reports', 'payment_logs', 'prescription_block_items',
    'prescription_blocks', 'prescriptions'
  ] LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', 'admin_all_' || target_table, target_table);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin_email() AND workspace_id IS NULL) WITH CHECK (public.is_admin_email() AND workspace_id IS NULL)',
      'admin_all_' || target_table, target_table
    );
  END LOOP;
END
$workspace_clinical_admin_policies$;

-- Remove only the allowlist branches from patient portal policies. Direct
-- patient_id and parent-FK checks remain; booking/email/group inference does
-- not. A consultation without an exact linked booking remains stored but hidden
-- from portal users.
DROP POLICY patient_self_read_measurements ON public.measurements;
CREATE POLICY patient_self_read_measurements ON public.measurements
  FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

DROP POLICY patient_self_read_meal_plans ON public.meal_plans;
CREATE POLICY patient_self_read_meal_plans ON public.meal_plans
  FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

DROP POLICY patient_self_read_meals ON public.meals;
CREATE POLICY patient_self_read_meals ON public.meals
  FOR SELECT TO authenticated
  USING (public.current_patient_owns_plan(plan_id));

DROP POLICY patient_self_read_meal_foods ON public.meal_foods;
CREATE POLICY patient_self_read_meal_foods ON public.meal_foods
  FOR SELECT TO authenticated
  USING (public.current_patient_owns_meal(meal_id));

DROP POLICY patient_self_read_reports ON public.patient_reports;
CREATE POLICY patient_self_read_reports ON public.patient_reports
  FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

DROP POLICY patient_self_read_exam_requests ON public.patient_exam_requests;
CREATE POLICY patient_self_read_exam_requests ON public.patient_exam_requests
  FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

DROP POLICY patient_self_read_exam_request_items ON public.patient_exam_request_items;
CREATE POLICY patient_self_read_exam_request_items ON public.patient_exam_request_items
  FOR SELECT TO authenticated
  USING (public.current_patient_owns_exam_request(request_id));

DROP POLICY patient_self_read_exam_results ON public.patient_exam_results;
CREATE POLICY patient_self_read_exam_results ON public.patient_exam_results
  FOR SELECT TO authenticated
  USING (public.current_patient_owns_exam_request(request_id));

DROP POLICY patient_self_read_bookings ON public.bookings;
CREATE POLICY patient_self_read_bookings ON public.bookings
  FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

DROP POLICY patient_self_read_consultation_records ON public.consultation_records;
CREATE POLICY patient_self_read_consultation_records ON public.consultation_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings AS booking
      WHERE booking.id = consultation_records.booking_id
        AND booking.patient_id = public.current_patient_id()
    )
  );

COMMENT ON POLICY admin_all_patient_audit_logs ON public.patient_audit_logs IS
  'Legacy allowlist scope only; NULL workspace rows are retained without inferring ownership from patient_name or actor_email.';
COMMENT ON POLICY admin_all_payment_logs ON public.payment_logs IS
  'Legacy allowlist scope only; no patient/workspace ownership is inferred from payment customer fields.';
COMMENT ON POLICY patient_self_read_consultation_records ON public.consultation_records IS
  'Portal access requires an exact consultation booking_id to a booking linked by patient_id; orphan rows remain stored and are not portal-visible.';

-- Confirm an entire consultation group in one transaction. The table lock
-- prevents concurrent inserts/updates from changing group membership while
-- it is validated and updated. Non-legacy and invalid-state groups are no-ops.
CREATE OR REPLACE FUNCTION public.confirm_legacy_booking_group(
  p_booking_group_id text,
  p_payment_method text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_booking record;
  v_booking_ids bigint[] := ARRAY[]::bigint[];
  v_updated_ids bigint[] := ARRAY[]::bigint[];
  v_count integer := 0;
  v_all_legacy boolean := true;
  v_all_pending boolean := true;
  v_all_paid boolean := true;
BEGIN
  IF p_booking_group_id IS NULL
     OR pg_catalog.length(pg_catalog.btrim(p_booking_group_id)) = 0
     OR pg_catalog.length(p_booking_group_id) > 120
     OR p_payment_method IS NULL
     OR p_payment_method NOT IN ('pix', 'card') THEN
    RAISE EXCEPTION 'invalid booking group confirmation input'
      USING ERRCODE = '22023';
  END IF;

  LOCK TABLE public.bookings IN SHARE ROW EXCLUSIVE MODE;

  FOR v_booking IN
    SELECT booking.id, booking.workspace_id, booking.status,
           booking.payment_status
    FROM public.bookings AS booking
    WHERE booking.booking_group_id = p_booking_group_id
    ORDER BY booking.id
    FOR UPDATE
  LOOP
    v_count := v_count + 1;
    v_booking_ids := pg_catalog.array_append(v_booking_ids, v_booking.id);
    v_all_legacy := v_all_legacy AND v_booking.workspace_id IS NULL;
    v_all_pending := v_all_pending
      AND coalesce(v_booking.status, 'pending') = 'pending'
      AND v_booking.payment_status = 'pending';
    v_all_paid := v_all_paid
      AND v_booking.status = 'confirmed'
      AND v_booking.payment_status = 'paid';
  END LOOP;

  IF v_count = 0 THEN
    RETURN pg_catalog.jsonb_build_object(
      'status', 'not_found', 'count', 0, 'booking_ids', '[]'::jsonb
    );
  END IF;

  IF NOT v_all_legacy THEN
    RETURN pg_catalog.jsonb_build_object(
      'status', 'not_legacy', 'count', v_count, 'booking_ids', '[]'::jsonb
    );
  END IF;

  IF v_all_paid THEN
    RETURN pg_catalog.jsonb_build_object(
      'status', 'already_confirmed',
      'count', v_count,
      'booking_ids', pg_catalog.to_jsonb(v_booking_ids)
    );
  END IF;

  IF NOT v_all_pending THEN
    RETURN pg_catalog.jsonb_build_object(
      'status', 'conflict', 'count', v_count, 'booking_ids', '[]'::jsonb
    );
  END IF;

  FOR v_booking IN
    UPDATE public.bookings AS booking
    SET status = 'confirmed',
        payment_status = 'paid',
        payment_method = p_payment_method
    WHERE booking.id = ANY (v_booking_ids)
      AND booking.workspace_id IS NULL
    RETURNING booking.id
  LOOP
    v_updated_ids := pg_catalog.array_append(v_updated_ids, v_booking.id);
  END LOOP;

  IF pg_catalog.cardinality(v_updated_ids) <> v_count THEN
    RAISE EXCEPTION 'booking group changed during atomic confirmation'
      USING ERRCODE = '40001';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'status', 'confirmed',
    'count', v_count,
    'booking_ids', pg_catalog.to_jsonb(v_updated_ids)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.confirm_legacy_booking_group(text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_legacy_booking_group(text, text)
  TO service_role;

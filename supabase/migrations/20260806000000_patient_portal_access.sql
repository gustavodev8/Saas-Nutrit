-- Patient portal read access via Supabase Auth email identity.
-- Patients can sign in with the same email stored in public.patients
-- and read only their own clinical data.

CREATE OR REPLACE FUNCTION public.current_patient_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id::bigint
  FROM public.patients p
  WHERE lower(coalesce(p.email, '')) = public.current_user_email()
  ORDER BY p.created_at DESC NULLS LAST, p.id DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_patient_owns_plan(plan_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meal_plans mp
    WHERE mp.id = plan_id
      AND mp.patient_id = public.current_patient_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.current_patient_owns_meal(meal_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meals m
    JOIN public.meal_plans mp ON mp.id = m.plan_id
    WHERE m.id = meal_id
      AND mp.patient_id = public.current_patient_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.current_patient_owns_exam_request(request_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_exam_requests per
    WHERE per.id = request_id
      AND per.patient_id = public.current_patient_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.current_patient_can_access_booking_group(group_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.booking_group_id = group_id
      AND (
        b.patient_id = public.current_patient_id()
        OR lower(coalesce(b.client_email, '')) = public.current_user_email()
      )
  )
$$;

REVOKE ALL ON FUNCTION public.current_patient_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_patient_owns_plan(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_patient_owns_meal(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_patient_owns_exam_request(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_patient_can_access_booking_group(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_patient_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_patient_owns_plan(bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_patient_owns_meal(bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_patient_owns_exam_request(bigint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_patient_can_access_booking_group(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "patient_self_read_patients" ON public.patients;
CREATE POLICY "patient_self_read_patients"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR id = public.current_patient_id()
  );

DROP POLICY IF EXISTS "patient_self_read_measurements" ON public.measurements;
CREATE POLICY "patient_self_read_measurements"
  ON public.measurements
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR patient_id = public.current_patient_id()
  );

DROP POLICY IF EXISTS "patient_self_read_meal_plans" ON public.meal_plans;
CREATE POLICY "patient_self_read_meal_plans"
  ON public.meal_plans
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR patient_id = public.current_patient_id()
  );

DROP POLICY IF EXISTS "patient_self_read_meals" ON public.meals;
CREATE POLICY "patient_self_read_meals"
  ON public.meals
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR public.current_patient_owns_plan(plan_id)
  );

DROP POLICY IF EXISTS "patient_self_read_meal_foods" ON public.meal_foods;
CREATE POLICY "patient_self_read_meal_foods"
  ON public.meal_foods
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR public.current_patient_owns_meal(meal_id)
  );

DROP POLICY IF EXISTS "patient_self_read_reports" ON public.patient_reports;
CREATE POLICY "patient_self_read_reports"
  ON public.patient_reports
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR patient_id = public.current_patient_id()
  );

DROP POLICY IF EXISTS "patient_self_read_exam_requests" ON public.patient_exam_requests;
CREATE POLICY "patient_self_read_exam_requests"
  ON public.patient_exam_requests
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR patient_id = public.current_patient_id()
  );

DROP POLICY IF EXISTS "patient_self_read_exam_request_items" ON public.patient_exam_request_items;
CREATE POLICY "patient_self_read_exam_request_items"
  ON public.patient_exam_request_items
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR public.current_patient_owns_exam_request(request_id)
  );

DROP POLICY IF EXISTS "patient_self_read_exam_results" ON public.patient_exam_results;
CREATE POLICY "patient_self_read_exam_results"
  ON public.patient_exam_results
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR public.current_patient_owns_exam_request(request_id)
  );

DROP POLICY IF EXISTS "patient_self_read_bookings" ON public.bookings;
CREATE POLICY "patient_self_read_bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR patient_id = public.current_patient_id()
    OR lower(coalesce(client_email, '')) = public.current_user_email()
  );

DROP POLICY IF EXISTS "patient_self_read_consultation_records" ON public.consultation_records;
CREATE POLICY "patient_self_read_consultation_records"
  ON public.consultation_records
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR lower(coalesce(client_email, '')) = public.current_user_email()
    OR public.current_patient_can_access_booking_group(booking_group_id)
  );

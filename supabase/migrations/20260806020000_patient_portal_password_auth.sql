CREATE TABLE IF NOT EXISTS public.patient_portal_accounts (
  id bigserial PRIMARY KEY,
  patient_id bigint NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  auth_user_id uuid UNIQUE,
  login text NOT NULL,
  login_normalized text NOT NULL UNIQUE,
  auth_email text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  password_set_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.patient_portal_accounts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.patient_portal_accounts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_portal_accounts TO authenticated;

DROP POLICY IF EXISTS "admin_manage_patient_portal_accounts" ON public.patient_portal_accounts;
CREATE POLICY "admin_manage_patient_portal_accounts"
  ON public.patient_portal_accounts
  FOR ALL
  TO authenticated
  USING (public.is_admin_email())
  WITH CHECK (public.is_admin_email());

DROP POLICY IF EXISTS "patient_read_own_portal_account" ON public.patient_portal_accounts;
CREATE POLICY "patient_read_own_portal_account"
  ON public.patient_portal_accounts
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.current_patient_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ppa.patient_id::bigint
  FROM public.patient_portal_accounts ppa
  WHERE ppa.auth_user_id = auth.uid()
    AND ppa.is_active = true
  ORDER BY ppa.updated_at DESC NULLS LAST, ppa.id DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_patient_contact_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(p.email, ''))
  FROM public.patients p
  WHERE p.id = public.current_patient_id()
  LIMIT 1
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
        OR lower(coalesce(b.client_email, '')) = public.current_patient_contact_email()
      )
  )
$$;

REVOKE ALL ON FUNCTION public.current_patient_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_patient_contact_email() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_patient_can_access_booking_group(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_patient_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_patient_contact_email() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_patient_can_access_booking_group(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "patient_self_read_bookings" ON public.bookings;
CREATE POLICY "patient_self_read_bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR patient_id = public.current_patient_id()
    OR lower(coalesce(client_email, '')) = public.current_patient_contact_email()
  );

DROP POLICY IF EXISTS "patient_self_read_consultation_records" ON public.consultation_records;
CREATE POLICY "patient_self_read_consultation_records"
  ON public.consultation_records
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_email()
    OR lower(coalesce(client_email, '')) = public.current_patient_contact_email()
    OR public.current_patient_can_access_booking_group(booking_group_id)
  );

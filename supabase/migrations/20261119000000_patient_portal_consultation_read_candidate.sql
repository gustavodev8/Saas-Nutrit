-- LOCAL CANDIDATE ONLY. Requires workspace-scoped consultation records and
-- explicit patient portal workspace links. No email-based authorization.

CREATE OR REPLACE FUNCTION private.can_read_workspace_consultation_record(
  p_booking_id bigint,
  p_record_workspace_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() = 'authenticated'
    AND (SELECT auth.uid()) IS NOT NULL
    AND p_booking_id IS NOT NULL
    AND p_record_workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.bookings AS booking
      JOIN public.patients AS patient
        ON patient.id = booking.patient_id
       AND patient.workspace_id = booking.workspace_id
      JOIN public.patient_portal_workspace_links AS portal_link
        ON portal_link.workspace_id = patient.workspace_id
       AND portal_link.patient_id = patient.id
      WHERE booking.id = p_booking_id
        AND booking.workspace_id = p_record_workspace_id
        AND portal_link.auth_user_id = (SELECT auth.uid())
        AND portal_link.status = 'active'
    )
$function$;

REVOKE ALL ON FUNCTION private.can_read_workspace_consultation_record(bigint, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.can_read_workspace_consultation_record(bigint, uuid)
  TO authenticated;

CREATE POLICY patient_portal_read_workspace_consultations
  ON public.consultation_records
  FOR SELECT
  TO authenticated
  USING (private.can_read_workspace_consultation_record(booking_id, workspace_id));

COMMENT ON FUNCTION private.can_read_workspace_consultation_record(bigint, uuid) IS
  'Portal read requires an active auth-user/patient/workspace link and the exact booking in that same workspace; email is not authorization.';

CREATE OR REPLACE FUNCTION public.can_read_legacy_consultation_record(p_booking_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() = 'authenticated'
    AND p_booking_id IS NOT NULL
    AND public.current_patient_id() IS NOT NULL
    AND NOT public.has_my_patient_portal_workspace_link_history()
    AND EXISTS (
      SELECT 1
      FROM public.bookings AS booking
      JOIN public.patients AS patient ON patient.id = booking.patient_id
      WHERE booking.id = p_booking_id
        AND booking.workspace_id IS NULL
        AND patient.workspace_id IS NULL
        AND booking.patient_id = public.current_patient_id()
    )
$function$;

COMMENT ON FUNCTION public.can_read_legacy_consultation_record(bigint) IS
  'Legacy consultation reads require an exact legacy patient booking and are closed after the identity acquires any workspace-link history.';

-- LOCAL CANDIDATE ONLY: this profile read does not authorize clinical-table access.
-- It exposes a minimal contact profile only while the caller has an active link.

CREATE FUNCTION public.get_my_linked_patient_profile(
  p_workspace_id uuid,
  p_patient_id bigint
)
RETURNS TABLE (
  patient_id bigint,
  patient_name text,
  patient_email text,
  patient_phone text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT patient.id, patient.name, patient.email, patient.phone
  FROM public.patients AS patient
  WHERE patient.id = p_patient_id
    AND patient.workspace_id = p_workspace_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_portal_workspace_links AS link
      WHERE link.auth_user_id = auth.uid()
        AND link.workspace_id = patient.workspace_id
        AND link.patient_id = patient.id
        AND link.status = 'active'
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_linked_patient_profile(uuid, bigint)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_linked_patient_profile(uuid, bigint)
  TO authenticated;

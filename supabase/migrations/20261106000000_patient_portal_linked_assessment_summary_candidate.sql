-- LOCAL CANDIDATE ONLY: exposes only the latest assessment date through an active link.

CREATE FUNCTION public.get_my_linked_patient_latest_assessment(
  p_workspace_id uuid,
  p_patient_id bigint
)
RETURNS TABLE (assessment_date date)
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
  SELECT measurement.assessment_date
  FROM public.measurements AS measurement
  JOIN public.patients AS patient ON patient.id = measurement.patient_id
  WHERE patient.id = p_patient_id
    AND patient.workspace_id = p_workspace_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_portal_workspace_links AS link
      WHERE link.auth_user_id = auth.uid()
        AND link.workspace_id = patient.workspace_id
        AND link.patient_id = patient.id
        AND link.status = 'active'
    )
  ORDER BY measurement.assessment_date DESC, measurement.created_at DESC NULLS LAST, measurement.id DESC
  LIMIT 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_linked_patient_latest_assessment(uuid, bigint)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_linked_patient_latest_assessment(uuid, bigint)
  TO authenticated;

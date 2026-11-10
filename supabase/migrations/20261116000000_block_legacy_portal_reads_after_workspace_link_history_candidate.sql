-- LOCAL CANDIDATE ONLY: close the direct-RLS fallback after explicit SaaS link history.
-- This is additive because the earlier clinical RLS candidate has been replayed locally.

CREATE OR REPLACE FUNCTION public.can_read_legacy_clinical_patient(p_patient_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() = 'authenticated'
    AND p_patient_id IS NOT NULL
    AND p_patient_id = public.current_patient_id()
    AND NOT public.has_my_patient_portal_workspace_link_history()
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = p_patient_id AND patient.workspace_id IS NULL
    )
$function$;

DROP POLICY IF EXISTS legacy_patient_self_read_patients ON public.patients;
CREATE POLICY legacy_patient_self_read_patients
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (public.can_read_legacy_clinical_patient(id));

COMMENT ON FUNCTION public.can_read_legacy_clinical_patient(bigint) IS
  'Legacy portal reads are allowed only until this auth identity has any explicit workspace-link history.';

-- LOCAL CANDIDATE ONLY. Preserve prior migration history and align the RPC
-- result with whether either the pending invitation or active link changed.
CREATE OR REPLACE FUNCTION public.revoke_patient_portal_workspace_link(
  p_workspace_id uuid,
  p_patient_id bigint,
  p_auth_user_id uuid,
  p_revoked_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_invitation_rows integer;
  v_link_rows integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
    OR p_workspace_id IS NULL
    OR p_patient_id IS NULL
    OR p_auth_user_id IS NULL
    OR p_revoked_by IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces AS workspace
    WHERE workspace.id = p_workspace_id
  ) THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members AS member
    WHERE member.workspace_id = p_workspace_id
      AND member.user_id = p_revoked_by
      AND member.role = 'owner'
      AND member.status = 'active'
  ) THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.patients AS patient
    WHERE patient.id = p_patient_id
      AND patient.workspace_id = p_workspace_id
      AND patient.workspace_id IS NOT NULL
  ) THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_workspace_id::text || ':' || p_patient_id::text, 0)
  );

  UPDATE public.patient_portal_link_invitations AS invitation
  SET status = 'revoked', revoked_by = p_revoked_by,
      revoked_at = pg_catalog.now(), updated_at = pg_catalog.now()
  WHERE invitation.workspace_id = p_workspace_id
    AND invitation.patient_id = p_patient_id
    AND invitation.status = 'pending';
  GET DIAGNOSTICS v_invitation_rows = ROW_COUNT;

  UPDATE public.patient_portal_workspace_links AS link
  SET status = 'revoked', revoked_at = pg_catalog.now(), updated_at = pg_catalog.now()
  WHERE link.workspace_id = p_workspace_id
    AND link.patient_id = p_patient_id
    AND link.auth_user_id = p_auth_user_id
    AND link.status = 'active';
  GET DIAGNOSTICS v_link_rows = ROW_COUNT;

  RETURN v_invitation_rows > 0 OR v_link_rows > 0;
END;
$function$;

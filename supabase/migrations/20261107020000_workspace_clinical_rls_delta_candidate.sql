-- LOCAL CANDIDATE ONLY. Supersedes the un-applied broad 20261107000000
-- candidate. Remote 20261107010000 is the immutable measurements baseline.
-- This migration adds only shared RLS helpers and scoped audit policies. It
-- does not alter measurements, reset policies, change table ACLs, or backfill.

DO $preflight$
DECLARE
  measurement_workspace_type oid;
BEGIN
  IF to_regclass('public.patients') IS NULL
     OR to_regclass('public.workspace_members') IS NULL
     OR to_regclass('public.patient_portal_workspace_links') IS NULL
     OR to_regclass('public.patient_audit_logs') IS NULL
     OR to_regclass('public.measurements') IS NULL THEN
    RAISE EXCEPTION 'clinical RLS delta prerequisites missing';
  END IF;

  IF to_regprocedure('public.current_patient_id()') IS NULL
     OR to_regprocedure('public.is_admin_email()') IS NULL THEN
    RAISE EXCEPTION 'reviewed patient identity helpers are missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = to_regprocedure('public.current_patient_id()')
      AND prorettype = 'int8'::regtype
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = to_regprocedure('public.is_admin_email()')
      AND prorettype = 'bool'::regtype
  ) THEN
    RAISE EXCEPTION 'reviewed patient identity helper return types differ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_audit_logs'
      AND policyname = 'workspace_patient_audit_logs_read'
      AND (cmd <> 'SELECT' OR roles <> ARRAY['authenticated']::name[] OR qual IS NULL)
  ) OR EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_audit_logs'
      AND policyname = 'workspace_patient_audit_logs_insert'
      AND (cmd <> 'INSERT' OR roles <> ARRAY['authenticated']::name[] OR with_check IS NULL)
  ) THEN
    RAISE EXCEPTION 'existing scoped audit policy name has an unexpected shape';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.patients'::regclass AND attname = 'workspace_id'
      AND atttypid = 'uuid'::regtype AND NOT attnotnull AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.workspace_members'::regclass AND attname = 'workspace_id'
      AND atttypid = 'uuid'::regtype AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.workspace_members'::regclass AND attname = 'user_id'
      AND atttypid = 'uuid'::regtype AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.workspace_members'::regclass AND attname = 'role'
      AND atttypid = 'text'::regtype AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.workspace_members'::regclass AND attname = 'status'
      AND atttypid = 'text'::regtype AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.patient_portal_workspace_links'::regclass AND attname = 'auth_user_id'
      AND atttypid = 'uuid'::regtype AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.patient_portal_workspace_links'::regclass AND attname = 'status'
      AND atttypid = 'text'::regtype AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.patient_audit_logs'::regclass AND attname = 'patient_id'
      AND atttypid = 'int8'::regtype AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'clinical RLS delta prerequisite column shape differs';
  END IF;

  SELECT atttypid INTO measurement_workspace_type
  FROM pg_attribute
  WHERE attrelid = 'public.measurements'::regclass AND attname = 'workspace_id'
    AND NOT attisdropped;
  IF measurement_workspace_type IS DISTINCT FROM 'uuid'::regtype::oid
     OR NOT EXISTS (
       SELECT 1 FROM pg_class WHERE oid = 'public.measurements'::regclass AND relrowsecurity
     ) OR NOT EXISTS (
       SELECT 1 FROM pg_class WHERE oid = 'public.patient_audit_logs'::regclass AND relrowsecurity
     ) THEN
    RAISE EXCEPTION 'immutable measurements baseline shape is absent';
  END IF;

  -- Verify the applied baseline remains present. No measurement policy is
  -- modified by this candidate, and unknown or additional policies are kept.
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
       AND tablename = 'measurements'
       AND roles = ARRAY['authenticated']::name[]
       AND (policyname, cmd) IN (
         ('workspace_measurements_select_active_member', 'SELECT'),
         ('workspace_measurements_insert_active_member', 'INSERT'),
         ('workspace_measurements_update_active_member', 'UPDATE')
       )) <> 3 THEN
    RAISE EXCEPTION 'immutable 20261107010000 measurements policy baseline differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indexrelid = to_regclass('public.workspace_members_one_active_workspace_per_user')
      AND i.indisunique AND i.indisvalid AND i.indnkeyatts = 1
      AND pg_get_indexdef(i.indexrelid) ILIKE '%(user_id)%'
      AND pg_get_expr(i.indpred, i.indrelid) ILIKE '%status%active%'
  ) THEN
    RAISE EXCEPTION 'exact active-workspace membership index is missing or invalid';
  END IF;

END
$preflight$;

CREATE OR REPLACE FUNCTION public.has_my_patient_portal_workspace_link_history()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.patient_portal_workspace_links AS link
      WHERE link.auth_user_id = auth.uid()
    )
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_clinical_patient_scope(
  p_patient_id bigint,
  p_workspace_id uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND p_patient_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = p_patient_id
        AND patient.workspace_id IS NOT DISTINCT FROM p_workspace_id
        AND (
          (p_workspace_id IS NULL AND public.is_admin_email())
          OR (p_workspace_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members AS member
            WHERE member.workspace_id = p_workspace_id
              AND member.user_id = auth.uid()
              AND member.role IN ('owner', 'nutritionist')
              AND member.status = 'active'
              AND (SELECT count(*) FROM public.workspace_members AS active_member
                   WHERE active_member.user_id = auth.uid()
                     AND active_member.status = 'active') = 1
          ))
        )
    )
$function$;

CREATE OR REPLACE FUNCTION public.can_read_legacy_clinical_patient(p_patient_id bigint)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
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

REVOKE ALL ON FUNCTION public.has_my_patient_portal_workspace_link_history() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.can_manage_clinical_patient_scope(bigint, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.can_read_legacy_clinical_patient(bigint) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_my_patient_portal_workspace_link_history() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_clinical_patient_scope(bigint, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_legacy_clinical_patient(bigint) TO authenticated;

DO $audit_policies$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                 AND tablename = 'patient_audit_logs'
                 AND policyname = 'workspace_patient_audit_logs_read') THEN
    EXECUTE $policy$
      CREATE POLICY workspace_patient_audit_logs_read
        ON public.patient_audit_logs FOR SELECT TO authenticated
        USING (patient_id IS NOT NULL AND public.can_manage_clinical_patient_scope(
          patient_id,
          (SELECT patient.workspace_id FROM public.patients AS patient
           WHERE patient.id = patient_audit_logs.patient_id)
        ))
    $policy$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                 AND tablename = 'patient_audit_logs'
                 AND policyname = 'workspace_patient_audit_logs_insert') THEN
    EXECUTE $policy$
      CREATE POLICY workspace_patient_audit_logs_insert
        ON public.patient_audit_logs FOR INSERT TO authenticated
        WITH CHECK (patient_id IS NOT NULL AND public.can_manage_clinical_patient_scope(
          patient_id,
          (SELECT patient.workspace_id FROM public.patients AS patient
           WHERE patient.id = patient_audit_logs.patient_id)
        ))
    $policy$;
  END IF;
END
$audit_policies$;

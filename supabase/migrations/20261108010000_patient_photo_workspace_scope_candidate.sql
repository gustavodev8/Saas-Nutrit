-- LOCAL CANDIDATE ONLY. Adds workspace ownership for patient photos without
-- backfilling legacy rows. Must precede 20261109000000 private photo storage.
-- Existing admin access is restricted to NULL-workspace legacy rows; active
-- workspace members manage only photos whose patient belongs to their scope.

DO $patient_photo_workspace_preflight$
DECLARE
  v_policy_count integer;
BEGIN
  IF to_regclass('public.patient_photos') IS NULL
     OR to_regclass('public.patients') IS NULL
     OR to_regclass('public.workspaces') IS NULL
     OR to_regclass('public.workspace_members') IS NULL THEN
    RAISE EXCEPTION 'patient photo workspace prerequisites are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.patients'::regclass AND attname = 'workspace_id'
      AND atttypid = 'uuid'::regtype AND NOT attnotnull AND NOT attisdropped
  ) OR to_regprocedure('public.can_manage_clinical_patient_scope(bigint,uuid)') IS NULL THEN
    RAISE EXCEPTION 'patient workspace scope helper or column is missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.patient_photos'::regclass AND attname = 'workspace_id'
      AND NOT attisdropped
  ) OR EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.patient_photos'::regclass
      AND conname IN ('patient_photos_workspace_id_fkey', 'patient_photos_workspace_patient_fkey')
  ) OR EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.patient_photos'::regclass
      AND tgname = 'patient_photos_derive_workspace' AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'patient photo workspace scope appears partially installed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE oid = 'public.patient_photos'::regclass AND relrowsecurity
  ) OR NOT has_table_privilege('authenticated', 'public.patient_photos', 'SELECT')
    OR NOT has_table_privilege('authenticated', 'public.patient_photos', 'INSERT')
    OR NOT has_table_privilege('authenticated', 'public.patient_photos', 'UPDATE')
    OR NOT has_table_privilege('authenticated', 'public.patient_photos', 'DELETE')
    OR has_table_privilege('anon', 'public.patient_photos', 'SELECT')
    OR has_table_privilege('anon', 'public.patient_photos', 'INSERT')
    OR has_table_privilege('anon', 'public.patient_photos', 'UPDATE')
    OR has_table_privilege('anon', 'public.patient_photos', 'DELETE') THEN
    RAISE EXCEPTION 'patient photo RLS or ACL baseline differs';
  END IF;

  SELECT count(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'patient_photos'
    AND (
      (policyname = 'admin_all_patient_photos' AND cmd = 'ALL'
       AND permissive = 'PERMISSIVE'
       AND roles = ARRAY['authenticated']::name[]
       AND qual = 'is_admin_email()' AND with_check = 'is_admin_email()')
      OR
      (policyname = 'service_only_photos' AND cmd = 'ALL'
       AND permissive = 'PERMISSIVE'
       AND roles = ARRAY['service_role']::name[]
       AND qual = 'true' AND with_check = 'true')
    );
  IF v_policy_count <> 2 OR (SELECT count(*) FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'patient_photos') <> 2 THEN
    RAISE EXCEPTION 'patient photo policy baseline differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index AS idx
    WHERE idx.indexrelid = to_regclass('public.patients_workspace_id_id_key')
      AND idx.indisunique AND idx.indisvalid
      AND pg_get_indexdef(idx.indexrelid) ILIKE '%(workspace_id, id)%'
  ) THEN
    RAISE EXCEPTION 'patients(workspace_id,id) unique key is missing or invalid';
  END IF;

  IF EXISTS (SELECT 1 FROM public.patient_photos) THEN
    RAISE NOTICE 'Existing patient photos remain legacy-owned; no workspace backfill will run.';
  END IF;
END
$patient_photo_workspace_preflight$;

ALTER TABLE public.patient_photos ADD COLUMN workspace_id uuid;

ALTER TABLE public.patient_photos
  ADD CONSTRAINT patient_photos_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
  ON DELETE NO ACTION NOT VALID;

ALTER TABLE public.patient_photos
  ADD CONSTRAINT patient_photos_workspace_patient_fkey
  FOREIGN KEY (workspace_id, patient_id)
  REFERENCES public.patients(workspace_id, id)
  MATCH SIMPLE ON DELETE CASCADE NOT VALID;

ALTER TABLE public.patient_photos
  VALIDATE CONSTRAINT patient_photos_workspace_id_fkey;
ALTER TABLE public.patient_photos
  VALIDATE CONSTRAINT patient_photos_workspace_patient_fkey;

CREATE INDEX patient_photos_workspace_patient_idx
  ON public.patient_photos (workspace_id, patient_id);

CREATE OR REPLACE FUNCTION public.derive_patient_photo_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_parent_workspace_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
      RAISE EXCEPTION 'patient photo workspace scope is immutable'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.patient_id IS NOT DISTINCT FROM OLD.patient_id THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT patient.workspace_id INTO v_parent_workspace_id
  FROM public.patients AS patient
  WHERE patient.id = NEW.patient_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'patient photo parent does not exist'
      USING ERRCODE = '23503';
  END IF;

  IF TG_OP = 'UPDATE' AND v_parent_workspace_id IS DISTINCT FROM OLD.workspace_id THEN
    RAISE EXCEPTION 'patient photo cannot move between workspace scopes'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.workspace_id IS NOT NULL
    AND NEW.workspace_id IS DISTINCT FROM v_parent_workspace_id THEN
    RAISE EXCEPTION 'patient photo workspace does not match its patient'
      USING ERRCODE = '42501';
  END IF;

  NEW.workspace_id := v_parent_workspace_id;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.derive_patient_photo_workspace()
  FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER patient_photos_derive_workspace
  BEFORE INSERT OR UPDATE ON public.patient_photos
  FOR EACH ROW EXECUTE FUNCTION public.derive_patient_photo_workspace();

DROP POLICY admin_all_patient_photos ON public.patient_photos;
CREATE POLICY admin_all_patient_photos
  ON public.patient_photos FOR ALL TO authenticated
  USING (workspace_id IS NULL AND public.is_admin_email())
  WITH CHECK (workspace_id IS NULL AND public.is_admin_email());

CREATE POLICY workspace_manage_patient_photos
  ON public.patient_photos FOR ALL TO authenticated
  USING (public.can_manage_clinical_patient_scope(patient_id, workspace_id))
  WITH CHECK (public.can_manage_clinical_patient_scope(patient_id, workspace_id));

COMMENT ON COLUMN public.patient_photos.workspace_id IS
  'Derived from patients.workspace_id. Existing rows remain NULL until separately reviewed.';

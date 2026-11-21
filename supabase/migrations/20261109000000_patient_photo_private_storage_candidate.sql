-- Candidate only. Requires the workspace clinical scope candidate to be present.
-- This migration deliberately does not modify the shared `images` bucket.
-- Signed URLs are bearer tokens and remain usable until their short expiry after revocation.

ALTER TABLE public.patient_photos
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path text;

ALTER TABLE public.patient_photos
  ALTER COLUMN url DROP NOT NULL;

DO $patient_photo_storage_constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.patient_photos'::regclass
      AND conname = 'patient_photos_storage_metadata_pair_check'
  ) THEN
    ALTER TABLE public.patient_photos
      ADD CONSTRAINT patient_photos_storage_metadata_pair_check CHECK (
        (storage_bucket IS NULL AND storage_path IS NULL)
        OR (
          storage_bucket = 'clinical-patient-photos'
          AND workspace_id IS NOT NULL
          AND url IS NULL
          AND storage_path ~* (
            '^clinical/' || workspace_id::text || '/patients/' || patient_id::text
            || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
          )
        )
      );
  END IF;
END
$patient_photo_storage_constraints$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-patient-photos',
  'clinical-patient-photos',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.can_access_patient_photo_object(p_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $function$
DECLARE
  path_parts text[];
  target_workspace uuid;
  target_patient_id bigint;
BEGIN
  IF p_name IS NULL OR p_name !~* (
    '^clinical/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    || '/patients/[0-9]{1,18}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
  ) THEN
    RETURN false;
  END IF;

  path_parts := string_to_array(p_name, '/');
  target_workspace := path_parts[2]::uuid;
  target_patient_id := path_parts[4]::bigint;

  RETURN public.can_manage_clinical_patient_scope(target_patient_id, target_workspace);
END
$function$;

REVOKE ALL ON FUNCTION private.can_access_patient_photo_object(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_access_patient_photo_object(text)
  TO authenticated;

DROP POLICY IF EXISTS workspace_patient_photos_private_select ON storage.objects;
DROP POLICY IF EXISTS workspace_patient_photos_private_insert ON storage.objects;
DROP POLICY IF EXISTS workspace_patient_photos_private_update ON storage.objects;
DROP POLICY IF EXISTS workspace_patient_photos_private_delete ON storage.objects;

CREATE POLICY workspace_patient_photos_private_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'clinical-patient-photos'
    AND private.can_access_patient_photo_object(name)
  );

CREATE POLICY workspace_patient_photos_private_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'clinical-patient-photos'
    AND private.can_access_patient_photo_object(name)
  );

CREATE POLICY workspace_patient_photos_private_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'clinical-patient-photos'
    AND private.can_access_patient_photo_object(name)
  )
  WITH CHECK (
    bucket_id = 'clinical-patient-photos'
    AND private.can_access_patient_photo_object(name)
  );

CREATE POLICY workspace_patient_photos_private_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'clinical-patient-photos'
    AND private.can_access_patient_photo_object(name)
  );

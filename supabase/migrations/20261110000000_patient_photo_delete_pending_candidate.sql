-- Candidate only. Existing rows remain active; the default affects new rows only.
-- A durable pending marker makes private-photo cleanup retryable across client failures.
ALTER TABLE public.patient_photos
  ADD COLUMN IF NOT EXISTS deletion_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deletion_path text;

DO $patient_photo_deletion_path_check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.patient_photos'::regclass
      AND conname = 'patient_photos_deletion_state_check'
  ) THEN
    ALTER TABLE public.patient_photos
      ADD CONSTRAINT patient_photos_deletion_state_check CHECK (
        (NOT deletion_pending AND deletion_path IS NULL)
        OR (
          deletion_pending
          AND url IS NULL
          AND storage_bucket IS NULL
          AND storage_path IS NULL
          AND workspace_id IS NOT NULL
          AND deletion_path ~* (
            '^clinical/' || workspace_id::text || '/patients/' || patient_id::text
            || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
          )
        )
      );
  END IF;
END
$patient_photo_deletion_path_check$;

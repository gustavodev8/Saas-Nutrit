-- Local candidate only. Every consultation linked to a booking is unique,
-- including historical rows without a workspace. Unlinked history is retained.
DO $consultation_booking_unique_preflight$
DECLARE
  v_existing_index oid;
BEGIN
  IF to_regclass('public.consultation_records') IS NULL THEN
    RAISE EXCEPTION 'consultation workspace candidate prerequisite is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.consultation_records'::regclass
      AND attname = 'workspace_id'
      AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.consultation_records'::regclass
      AND attname = 'booking_id'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'consultation workspace candidate prerequisite is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.consultation_records
    WHERE booking_id IS NOT NULL
    GROUP BY booking_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'NO-GO: duplicate consultation records exist for a booking; manual disposition required';
  END IF;

  v_existing_index := to_regclass('public.consultation_records_booking_id_uidx');
  IF v_existing_index IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_catalog.pg_index AS idx
       WHERE idx.indexrelid = v_existing_index
         AND idx.indrelid = 'public.consultation_records'::regclass
         AND idx.indisunique
         AND idx.indisvalid
         AND idx.indisready
         AND idx.indnatts = 1
         AND idx.indnkeyatts = 1
         AND idx.indkey[0] = (
           SELECT attnum::smallint
           FROM pg_catalog.pg_attribute
           WHERE attrelid = 'public.consultation_records'::regclass
             AND attname = 'booking_id'
             AND NOT attisdropped
         )
         AND pg_catalog.pg_get_expr(idx.indpred, idx.indrelid) = '(booking_id IS NOT NULL)'
     ) THEN
    RAISE EXCEPTION 'Existing consultation_records_booking_id_uidx has an unexpected definition';
  END IF;
END
$consultation_booking_unique_preflight$;

CREATE UNIQUE INDEX IF NOT EXISTS consultation_records_booking_id_uidx
  ON public.consultation_records (booking_id)
  WHERE booking_id IS NOT NULL;

-- Local candidate only. Keep consultation history attached to its exact booking.
DO $consultation_booking_fk_preflight$
DECLARE
  v_existing oid;
  v_booking_id_attnum smallint;
  v_consultation_booking_id_attnum smallint;
BEGIN
  IF to_regclass('public.bookings') IS NULL
     OR to_regclass('public.consultation_records') IS NULL THEN
    RAISE EXCEPTION 'consultation booking FK prerequisite is missing';
  END IF;

  SELECT attnum::smallint INTO v_consultation_booking_id_attnum
  FROM pg_catalog.pg_attribute
  WHERE attrelid = 'public.consultation_records'::regclass
    AND attname = 'booking_id'
    AND NOT attisdropped;

  SELECT attnum::smallint INTO v_booking_id_attnum
  FROM pg_catalog.pg_attribute
  WHERE attrelid = 'public.bookings'::regclass
    AND attname = 'id'
    AND NOT attisdropped;

  IF v_booking_id_attnum IS NULL OR v_consultation_booking_id_attnum IS NULL THEN
    RAISE EXCEPTION 'consultation booking FK key columns are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS index_catalog
    WHERE index_catalog.indrelid = 'public.bookings'::regclass
      AND index_catalog.indisunique
      AND index_catalog.indisvalid
      AND index_catalog.indisready
      AND index_catalog.indnatts = 1
      AND index_catalog.indnkeyatts = 1
      AND index_catalog.indpred IS NULL
      AND index_catalog.indkey[0] = v_booking_id_attnum
  ) THEN
    RAISE EXCEPTION 'consultation booking FK target is not a unique booking ID';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.consultation_records AS record
    LEFT JOIN public.bookings AS booking ON booking.id = record.booking_id
    WHERE record.booking_id IS NULL
       OR booking.id IS NULL
       OR record.booking_group_id IS DISTINCT FROM booking.booking_group_id
  ) THEN
    RAISE EXCEPTION 'NO-GO: consultation records contain missing or mismatched exact bookings';
  END IF;

  SELECT constraint_catalog.oid INTO v_existing
  FROM pg_catalog.pg_constraint AS constraint_catalog
  WHERE constraint_catalog.conrelid = 'public.consultation_records'::regclass
    AND constraint_catalog.conname = 'consultation_records_booking_id_fkey';
  IF v_existing IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS constraint_catalog
    WHERE constraint_catalog.oid = v_existing
      AND constraint_catalog.conrelid = 'public.consultation_records'::regclass
      AND constraint_catalog.confrelid = 'public.bookings'::regclass
      AND constraint_catalog.contype = 'f'
      AND constraint_catalog.confdeltype = 'r'
      AND constraint_catalog.conkey = ARRAY[v_consultation_booking_id_attnum]
      AND constraint_catalog.confkey = ARRAY[v_booking_id_attnum]
      AND NOT constraint_catalog.condeferrable
      AND NOT constraint_catalog.condeferred
  ) THEN
    RAISE EXCEPTION 'Existing consultation booking FK has an unexpected definition';
  END IF;

  IF v_existing IS NULL THEN
    ALTER TABLE public.consultation_records
      ADD CONSTRAINT consultation_records_booking_id_fkey
      FOREIGN KEY (booking_id)
      REFERENCES public.bookings (id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END
$consultation_booking_fk_preflight$;

DO $consultation_booking_fk_validate$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS constraint_catalog
    WHERE constraint_catalog.conrelid = 'public.consultation_records'::regclass
      AND constraint_catalog.conname = 'consultation_records_booking_id_fkey'
      AND constraint_catalog.contype = 'f'
      AND NOT constraint_catalog.convalidated
  ) THEN
    ALTER TABLE public.consultation_records
      VALIDATE CONSTRAINT consultation_records_booking_id_fkey;
  END IF;
END
$consultation_booking_fk_validate$;

COMMENT ON CONSTRAINT consultation_records_booking_id_fkey
  ON public.consultation_records IS
  'Preserves the exact booking referenced by a consultation record; booking deletion is restricted.';

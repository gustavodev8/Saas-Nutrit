-- Local containment candidate. Legacy consultation rows with missing bookings
-- remain untouched; resolve them from authoritative evidence before validating
-- the booking foreign key or applying the later workspace migration chain.
DO $consultation_booking_guard_preflight$
DECLARE
  v_booking_id_attnum smallint;
  v_consultation_booking_id_attnum smallint;
  v_existing_fk oid;
  v_existing_check oid;
BEGIN
  IF to_regclass('public.bookings') IS NULL
     OR to_regclass('public.consultation_records') IS NULL THEN
    RAISE EXCEPTION 'consultation booking guard prerequisite is missing';
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
    RAISE EXCEPTION 'consultation booking guard key columns are missing';
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
    RAISE EXCEPTION 'consultation booking guard target is not a unique booking ID';
  END IF;

  SELECT constraint_catalog.oid INTO v_existing_fk
  FROM pg_catalog.pg_constraint AS constraint_catalog
  WHERE constraint_catalog.conrelid = 'public.consultation_records'::regclass
    AND constraint_catalog.conname = 'consultation_records_booking_id_fkey';

  IF v_existing_fk IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS constraint_catalog
    WHERE constraint_catalog.oid = v_existing_fk
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

  SELECT constraint_catalog.oid INTO v_existing_check
  FROM pg_catalog.pg_constraint AS constraint_catalog
  WHERE constraint_catalog.conrelid = 'public.consultation_records'::regclass
    AND constraint_catalog.conname = 'consultation_records_booking_id_not_null_check';

  IF v_existing_check IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint AS constraint_catalog
    WHERE constraint_catalog.oid = v_existing_check
      AND constraint_catalog.contype = 'c'
      AND pg_catalog.pg_get_expr(constraint_catalog.conbin, constraint_catalog.conrelid)
        = '(booking_id IS NOT NULL)'
  ) THEN
    RAISE EXCEPTION 'Existing consultation booking not-null check has an unexpected definition';
  END IF;

  IF v_existing_check IS NULL THEN
    ALTER TABLE public.consultation_records
      ADD CONSTRAINT consultation_records_booking_id_not_null_check
      CHECK (booking_id IS NOT NULL)
      NOT VALID;
  END IF;

  IF v_existing_fk IS NULL THEN
    ALTER TABLE public.consultation_records
      ADD CONSTRAINT consultation_records_booking_id_fkey
      FOREIGN KEY (booking_id)
      REFERENCES public.bookings (id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END
$consultation_booking_guard_preflight$;

ALTER TABLE public.consultation_records
  VALIDATE CONSTRAINT consultation_records_booking_id_not_null_check;

COMMENT ON CONSTRAINT consultation_records_booking_id_fkey
  ON public.consultation_records IS
  'Prevents new invalid consultation booking links and protects referenced bookings; legacy orphans remain pending reconciliation, so this foreign key is intentionally not validated yet.';

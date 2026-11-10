-- Candidate only. Keep the single historical duplicate legacy key and prevent future reuse.
DO $booking_workspace_index_preflight$
DECLARE
  v_index_definition text;
  v_columns name[];
BEGIN
  IF pg_catalog.to_regclass('public.bookings') IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_attribute
      WHERE attrelid = 'public.bookings'::regclass
        AND attname = 'workspace_id'
        AND atttypid = 'uuid'::regtype
        AND NOT attisdropped
    ) THEN
    RAISE EXCEPTION 'workspace booking preflight failed: bookings.workspace_id uuid is required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE booking_group_id IS NULL
      OR pg_catalog.btrim(booking_group_id) = ''
      OR session_number IS NULL
      OR total_sessions IS NULL
      OR session_number < 1
      OR total_sessions < session_number
  ) THEN
    RAISE EXCEPTION 'workspace booking preflight failed: incomplete group/session keys require manual review';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE workspace_id IS NOT NULL
    GROUP BY workspace_id, booking_group_id, session_number
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'workspace booking preflight failed: duplicate workspace/group/session keys require manual review';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE status = 'confirmed'
      AND appointment_date IS NOT NULL
      AND appointment_time IS NOT NULL
      AND type IS NOT NULL
      AND appointment_time::text ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
    GROUP BY workspace_id, appointment_date,
      pg_catalog.to_char(appointment_time::text::time, 'HH24:MI'), type
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'workspace booking preflight failed: confirmed minute-level slot duplicates require manual review';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE (status IS NULL OR status NOT IN ('cancelled', 'no_show'))
      AND (appointment_time IS NULL OR appointment_time::text !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$')
  ) THEN
    RAISE EXCEPTION 'workspace booking preflight failed: active malformed appointment times require manual review';
  END IF;

  SELECT pg_catalog.pg_get_indexdef(index.indexrelid),
         ARRAY(
           SELECT attribute.attname
           FROM pg_catalog.unnest(index.indkey) WITH ORDINALITY AS key(attnum, ordinality)
           JOIN pg_catalog.pg_attribute AS attribute
             ON attribute.attrelid = index.indrelid
            AND attribute.attnum = key.attnum
           WHERE key.ordinality <= index.indnkeyatts
           ORDER BY key.ordinality
         )
  INTO v_index_definition, v_columns
  FROM pg_catalog.pg_index AS index
  WHERE index.indexrelid = pg_catalog.to_regclass('public.uniq_confirmed_booking_slot')
    AND index.indrelid = 'public.bookings'::regclass
    AND index.indisunique;

  IF v_index_definition IS NULL
    OR v_columns IS DISTINCT FROM ARRAY['appointment_date', 'appointment_time', 'type']::name[]
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_index AS index
      WHERE index.indexrelid = pg_catalog.to_regclass('public.uniq_confirmed_booking_slot')
        AND pg_catalog.pg_get_expr(index.indpred, index.indrelid) = '(status = ''confirmed''::text)'
    ) THEN
    RAISE EXCEPTION 'workspace booking preflight failed: expected global confirmed-slot index definition was not found';
  END IF;
END;
$booking_workspace_index_preflight$;

CREATE UNIQUE INDEX bookings_workspace_group_session_uidx
  ON public.bookings (workspace_id, booking_group_id, session_number)
  WHERE workspace_id IS NOT NULL;

-- Legacy rows may already contain duplicate group/session keys. Keep them intact,
-- reserve every existing legacy key once, and reject future reuse transactionally.
CREATE TABLE private.legacy_booking_group_session_keys (
  booking_group_id text NOT NULL,
  session_number integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  PRIMARY KEY (booking_group_id, session_number)
);
ALTER TABLE private.legacy_booking_group_session_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.legacy_booking_group_session_keys FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.legacy_booking_group_session_keys
  FROM PUBLIC, anon, authenticated, service_role;

INSERT INTO private.legacy_booking_group_session_keys (booking_group_id, session_number)
SELECT DISTINCT booking_group_id, session_number
FROM public.bookings
WHERE workspace_id IS NULL;

CREATE FUNCTION public.enforce_legacy_booking_group_session_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_inserted integer;
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.workspace_id IS NOT DISTINCT FROM NEW.workspace_id
    AND OLD.booking_group_id IS NOT DISTINCT FROM NEW.booking_group_id
    AND OLD.session_number IS NOT DISTINCT FROM NEW.session_number THEN
    RETURN NEW;
  END IF;

  IF NEW.workspace_id IS NULL THEN
    INSERT INTO private.legacy_booking_group_session_keys (booking_group_id, session_number)
    VALUES (NEW.booking_group_id, NEW.session_number)
    ON CONFLICT (booking_group_id, session_number) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    IF v_inserted = 0 THEN
      RAISE EXCEPTION 'Legacy booking group/session key already exists'
        USING ERRCODE = '23505',
          CONSTRAINT = 'legacy_booking_group_session_keys_pkey';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_legacy_booking_group_session_key()
  FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER enforce_legacy_booking_group_session_key
  BEFORE INSERT OR UPDATE OF workspace_id, booking_group_id, session_number
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_legacy_booking_group_session_key();

COMMENT ON TABLE private.legacy_booking_group_session_keys IS
  'Private reservations enforcing unique future legacy booking group/session keys; historical duplicates remain unchanged.';
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_group_session_key_check
  CHECK (
    booking_group_id IS NOT NULL
    AND pg_catalog.btrim(booking_group_id) <> ''
    AND session_number IS NOT NULL
    AND total_sessions IS NOT NULL
    AND session_number > 0
    AND total_sessions >= session_number
  ) NOT VALID;

ALTER TABLE public.bookings
  VALIDATE CONSTRAINT bookings_group_session_key_check;

DROP INDEX public.uniq_confirmed_booking_slot;

CREATE UNIQUE INDEX uniq_confirmed_booking_slot_workspace
  ON public.bookings (workspace_id, appointment_date, appointment_time, type)
  WHERE status = 'confirmed' AND workspace_id IS NOT NULL;

CREATE UNIQUE INDEX uniq_confirmed_booking_slot_legacy
  ON public.bookings (appointment_date, appointment_time, type)
  WHERE status = 'confirmed' AND workspace_id IS NULL;

CREATE FUNCTION public._public_booking_slot_is_available(
  p_date date,
  p_time text,
  p_type text,
  p_workspace_id uuid,
  p_group_id text,
  p_session_number integer,
  p_exclude_booking_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_time time;
BEGIN
  IF p_date IS NULL
    OR p_time IS NULL
    OR p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
    OR p_type IS NULL THEN
    RETURN false;
  END IF;

  v_time := p_time::time;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      coalesce(p_workspace_id::text, 'legacy') || '|'
        || p_date::text || '|' || pg_catalog.to_char(v_time, 'HH24:MI') || '|' || p_type,
      0
    )
  );

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.bookings AS occupied
    WHERE occupied.workspace_id IS NOT DISTINCT FROM p_workspace_id
      AND occupied.appointment_date = p_date
      AND CASE
        WHEN occupied.appointment_time::text ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
          THEN pg_catalog.to_char(occupied.appointment_time::text::time, 'HH24:MI')
            = pg_catalog.to_char(v_time, 'HH24:MI')
        ELSE true
      END
      AND occupied.type = p_type
      AND NOT (
        (p_exclude_booking_id IS NOT NULL AND occupied.id = p_exclude_booking_id)
        OR (
          p_group_id IS NOT NULL
          AND occupied.booking_group_id = p_group_id
          AND occupied.session_number = p_session_number
        )
      )
      AND (occupied.status IS NULL OR occupied.status NOT IN ('cancelled', 'no_show'))
      AND (
        occupied.status IS DISTINCT FROM 'pending'
        OR occupied.created_at IS NULL
        OR occupied.created_at >= pg_catalog.now() - interval '30 minutes'
      )
  );
END;
$function$;

-- Preserve the existing Fillipe public-booking RPC contract in the legacy NULL scope.
CREATE OR REPLACE FUNCTION public._public_booking_slot_is_available(
  p_date date,
  p_time text,
  p_type text,
  p_group_id text,
  p_session_number integer,
  p_exclude_booking_id bigint
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT public._public_booking_slot_is_available(
    p_date,
    p_time,
    p_type,
    NULL::uuid,
    p_group_id,
    p_session_number,
    p_exclude_booking_id
  );
$function$;

REVOKE ALL ON FUNCTION public._public_booking_slot_is_available(date, text, text, uuid, text, integer, bigint)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public._public_booking_slot_is_available(date, text, text, text, integer, bigint)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_booking_slot_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_time time;
BEGIN
  IF NEW.status IS NULL THEN
    RAISE EXCEPTION 'Booking status is required' USING ERRCODE = '23514';
  END IF;

  IF NEW.appointment_time IS NULL
    OR NEW.appointment_time::text !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' THEN
    RAISE EXCEPTION 'Appointment time is invalid' USING ERRCODE = '23514';
  END IF;

  v_time := NEW.appointment_time::text::time;

  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
    ''
  ) = 'anon' THEN
    IF NEW.status IS DISTINCT FROM 'pending'
      OR NEW.payment_status IS DISTINCT FROM 'pending'
      OR NEW.payment_method IS NULL
      OR NEW.payment_method NOT IN ('pix', 'card') THEN
      RAISE EXCEPTION 'Anonymous bookings must start as pending paid bookings' USING ERRCODE = '42501';
    END IF;

    IF NEW.appointment_date < CURRENT_DATE
      OR NOT EXISTS (
        SELECT 1 FROM public.availability_slots AS slot
        WHERE slot.date = NEW.appointment_date
          AND CASE
            WHEN slot.start_time::text ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
              THEN slot.start_time::text::time = v_time
            ELSE false
          END
          AND slot.type = NEW.type
          AND slot.active IS TRUE
      ) THEN
      RAISE EXCEPTION 'Appointment slot is unavailable' USING ERRCODE = '23P01';
    END IF;
  END IF;

  IF NEW.status IN ('cancelled', 'no_show') THEN
    RETURN NEW;
  END IF;

  IF NOT public._public_booking_slot_is_available(
    NEW.appointment_date,
    NEW.appointment_time::text,
    NEW.type,
    NEW.workspace_id,
    NEW.booking_group_id,
    NEW.session_number,
    NEW.id
  ) THEN
    RAISE EXCEPTION 'Appointment slot is unavailable' USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_booking_slot_conflict() FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER bookings_guard_slot_before_update ON public.bookings;
CREATE TRIGGER bookings_guard_slot_before_update
  BEFORE UPDATE OF appointment_date, appointment_time, type, status, booking_group_id, session_number, workspace_id
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_slot_conflict();

COMMENT ON INDEX public.bookings_workspace_group_session_uidx IS
  'Workspace-scoped booking key; legacy group/session keys are reserved privately.';
COMMENT ON INDEX public.uniq_confirmed_booking_slot_workspace IS
  'Prevents confirmed slot collisions within one workspace.';
COMMENT ON INDEX public.uniq_confirmed_booking_slot_legacy IS
  'Preserves global confirmed-slot uniqueness for legacy bookings without a workspace.';

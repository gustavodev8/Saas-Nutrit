-- Phase A: additive public workspace booking hardening.
--
-- Safe rollout order:
--   1. Apply this additive migration. Existing anon policies remain untouched.
--   2. Deploy the backwards-compatible create-workspace-booking-payment Edge Function.
--   3. Deploy the RPC-based public booking UI and smoke test both legacy and slug clients.
--   4. Only then apply 20261206000000_workspace_public_booking_contract_candidate.sql.
--
-- Required Edge Function secrets before step 2:
--   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MP_ACCESS_TOKEN,
--   SAAS_RATE_LIMIT_HMAC_SECRET.
-- The function must fail closed when its rate-limit secret or RPC is unavailable.

DO $preflight$
BEGIN
  IF to_regclass('public.workspace_booking_settings') IS NULL
    OR to_regclass('public.workspace_booking_services') IS NULL
    OR to_regclass('public.workspace_booking_availability') IS NULL
    OR to_regclass('public.workspace_booking_blocked_dates') IS NULL
    OR to_regclass('public.workspace_bookings') IS NULL
    OR to_regprocedure('public.create_workspace_booking_atomic(uuid,uuid,text,text,text,date,time,integer,integer,integer,integer,integer)') IS NULL THEN
    RAISE EXCEPTION 'workspace public booking hardening preflight failed: required booking objects are missing';
  END IF;
END;
$preflight$;

-- Minimal public reads. These functions intentionally exclude workspace IDs,
-- PIX keys, booking rows and all patient data.
CREATE OR REPLACE FUNCTION public.get_public_workspace_booking_profile(p_slug text)
RETURNS TABLE (
  slug text,
  presentation_name text,
  bio text,
  min_notice_hours integer,
  max_advance_days integer,
  active_days integer[],
  blocked_dates date[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  WITH settings AS (
    SELECT
      setting.workspace_id,
      setting.slug,
      setting.presentation_name,
      setting.bio,
      setting.min_notice_hours,
      setting.max_advance_days
    FROM public.workspace_booking_settings AS setting
    WHERE setting.slug = p_slug
      AND setting.active = true
    LIMIT 1
  )
  SELECT
    settings.slug,
    settings.presentation_name,
    settings.bio,
    settings.min_notice_hours,
    settings.max_advance_days,
    COALESCE((
      SELECT array_agg(DISTINCT availability.day_of_week ORDER BY availability.day_of_week)
      FROM public.workspace_booking_availability AS availability
      WHERE availability.workspace_id = settings.workspace_id
        AND availability.active = true
    ), ARRAY[]::integer[]),
    COALESCE((
      SELECT array_agg(blocked.blocked_date ORDER BY blocked.blocked_date)
      FROM public.workspace_booking_blocked_dates AS blocked
      WHERE blocked.workspace_id = settings.workspace_id
        AND blocked.blocked_date BETWEEN CURRENT_DATE AND CURRENT_DATE + settings.max_advance_days
    ), ARRAY[]::date[])
  FROM settings;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_workspace_booking_services(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price_cents integer,
  duration_min integer,
  sort_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    service.id,
    service.name,
    service.description,
    service.price_cents,
    service.duration_min,
    service.sort_order
  FROM public.workspace_booking_settings AS setting
  JOIN public.workspace_booking_services AS service
    ON service.workspace_id = setting.workspace_id
  WHERE setting.slug = p_slug
    AND setting.active = true
    AND service.active = true
  ORDER BY service.sort_order, service.created_at;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_workspace_booking_slots(
  p_slug text,
  p_service_id uuid,
  p_booking_date date
)
RETURNS TABLE (slot_time time)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_settings public.workspace_booking_settings%ROWTYPE;
  v_duration_min integer;
  v_slot_interval_min integer;
  v_buffer_minutes integer;
BEGIN
  SELECT setting.*
  INTO v_settings
  FROM public.workspace_booking_settings AS setting
  WHERE setting.slug = p_slug
    AND setting.active = true
  LIMIT 1;

  IF NOT FOUND
    OR p_booking_date < CURRENT_DATE
    OR p_booking_date > CURRENT_DATE + v_settings.max_advance_days
  THEN
    RETURN;
  END IF;

  SELECT service.duration_min
  INTO v_duration_min
  FROM public.workspace_booking_services AS service
  WHERE service.id = p_service_id
    AND service.workspace_id = v_settings.workspace_id
    AND service.active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.workspace_booking_blocked_dates AS blocked
    WHERE blocked.workspace_id = v_settings.workspace_id
      AND blocked.blocked_date = p_booking_date
  ) THEN
    RETURN;
  END IF;

  v_slot_interval_min := GREATEST(COALESCE(v_settings.slot_interval_min, v_duration_min), 1);
  v_buffer_minutes := GREATEST(COALESCE(v_settings.buffer_minutes, 0), 0);

  RETURN QUERY
  WITH candidate_slots AS (
    SELECT DISTINCT make_time(candidate.minute_of_day / 60, candidate.minute_of_day % 60, 0) AS start_time
    FROM public.workspace_booking_availability AS availability
    CROSS JOIN LATERAL generate_series(
      extract(hour FROM availability.start_time)::integer * 60 + extract(minute FROM availability.start_time)::integer,
      extract(hour FROM availability.end_time)::integer * 60 + extract(minute FROM availability.end_time)::integer - v_duration_min,
      v_slot_interval_min
    ) AS candidate(minute_of_day)
    WHERE availability.workspace_id = v_settings.workspace_id
      AND availability.active = true
      AND availability.day_of_week = extract(dow FROM p_booking_date)::integer
  )
  SELECT candidate_slots.start_time
  FROM candidate_slots
  WHERE p_booking_date + candidate_slots.start_time >= now() + make_interval(hours => v_settings.min_notice_hours)
    AND NOT EXISTS (
      SELECT 1
      FROM public.workspace_bookings AS booking
      WHERE booking.workspace_id = v_settings.workspace_id
        AND booking.booking_date = p_booking_date
        AND (
          booking.status IN ('paid', 'confirmed', 'completed')
          OR (
            booking.status = 'pending_payment'
            AND booking.created_at > now() - make_interval(mins => 15)
          )
        )
        AND (
          extract(hour FROM candidate_slots.start_time)::integer * 60
          + extract(minute FROM candidate_slots.start_time)::integer
        ) < (
          extract(hour FROM booking.booking_time)::integer * 60
          + extract(minute FROM booking.booking_time)::integer
          + COALESCE(booking.service_duration_min, 60)
          + v_buffer_minutes
        )
        AND (
          extract(hour FROM candidate_slots.start_time)::integer * 60
          + extract(minute FROM candidate_slots.start_time)::integer
          + v_duration_min
        ) > (
          extract(hour FROM booking.booking_time)::integer * 60
          + extract(minute FROM booking.booking_time)::integer
        )
    )
  ORDER BY candidate_slots.start_time;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_workspace_booking_payment_status(
  p_booking_id uuid,
  p_payment_id text
)
RETURNS TABLE (status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT booking.status
  FROM public.workspace_bookings AS booking
  WHERE booking.id = p_booking_id
    AND booking.mp_payment_id = p_payment_id
  LIMIT 1;
$function$;

-- The final booking authority repeats every scheduling rule inside the advisory
-- lock. The Edge Function validates for early feedback; this function remains the
-- race-safe enforcement point for legacy and new callers alike.
CREATE OR REPLACE FUNCTION public.create_workspace_booking_atomic(
  p_workspace_id uuid,
  p_service_id uuid,
  p_patient_name text,
  p_patient_email text,
  p_patient_phone text,
  p_booking_date date,
  p_booking_time time,
  p_service_duration_min int,
  p_total_amount_cents int,
  p_platform_fee_cents int,
  p_repasse_amount_cents int,
  p_pending_ttl_min int default 15
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_settings public.workspace_booking_settings%ROWTYPE;
  v_service public.workspace_booking_services%ROWTYPE;
  v_new_start integer;
  v_new_end integer;
  v_buffer_minutes integer;
  v_expected_fee integer;
  v_id uuid;
BEGIN
  IF p_workspace_id IS NULL
    OR p_service_id IS NULL
    OR p_booking_date IS NULL
    OR p_booking_time IS NULL
    OR p_pending_ttl_min NOT BETWEEN 1 AND 60
    OR p_patient_name IS NULL OR length(btrim(p_patient_name)) NOT BETWEEN 1 AND 160
    OR p_patient_email IS NULL OR length(btrim(p_patient_email)) NOT BETWEEN 3 AND 254
  THEN
    RAISE EXCEPTION 'BOOKING_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_workspace_id::text || p_booking_date::text, 0)
  );

  SELECT setting.*
  INTO v_settings
  FROM public.workspace_booking_settings AS setting
  WHERE setting.workspace_id = p_workspace_id
    AND setting.active = true
  FOR KEY SHARE;

  IF NOT FOUND
    OR p_booking_date < CURRENT_DATE
    OR p_booking_date > CURRENT_DATE + v_settings.max_advance_days
    OR p_booking_date + p_booking_time < now() + make_interval(hours => v_settings.min_notice_hours)
  THEN
    RAISE EXCEPTION 'BOOKING_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  SELECT service.*
  INTO v_service
  FROM public.workspace_booking_services AS service
  WHERE service.id = p_service_id
    AND service.workspace_id = p_workspace_id
    AND service.active = true
  FOR KEY SHARE;

  IF NOT FOUND
    OR p_service_duration_min IS DISTINCT FROM v_service.duration_min
    OR p_total_amount_cents IS DISTINCT FROM v_service.price_cents
  THEN
    RAISE EXCEPTION 'BOOKING_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  v_expected_fee := round(v_service.price_cents * 0.05)::integer;
  IF p_platform_fee_cents IS DISTINCT FROM v_expected_fee
    OR p_repasse_amount_cents IS DISTINCT FROM v_service.price_cents - v_expected_fee
  THEN
    RAISE EXCEPTION 'BOOKING_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.workspace_booking_blocked_dates AS blocked
    WHERE blocked.workspace_id = p_workspace_id
      AND blocked.blocked_date = p_booking_date
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.workspace_booking_availability AS availability
    WHERE availability.workspace_id = p_workspace_id
      AND availability.active = true
      AND availability.day_of_week = extract(dow FROM p_booking_date)::integer
      AND p_booking_time >= availability.start_time
      AND p_booking_time + make_interval(mins => v_service.duration_min) <= availability.end_time
      AND mod(
        extract(hour FROM p_booking_time)::integer * 60
        + extract(minute FROM p_booking_time)::integer
        - extract(hour FROM availability.start_time)::integer * 60
        - extract(minute FROM availability.start_time)::integer,
        GREATEST(COALESCE(v_settings.slot_interval_min, v_service.duration_min), 1)
      ) = 0
  ) THEN
    RAISE EXCEPTION 'BOOKING_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  v_new_start := extract(hour FROM p_booking_time)::integer * 60 + extract(minute FROM p_booking_time)::integer;
  v_new_end := v_new_start + v_service.duration_min;
  v_buffer_minutes := GREATEST(COALESCE(v_settings.buffer_minutes, 0), 0);

  IF EXISTS (
    SELECT 1
    FROM public.workspace_bookings AS booking
    WHERE booking.workspace_id = p_workspace_id
      AND booking.booking_date = p_booking_date
      AND (
        booking.status IN ('paid', 'confirmed', 'completed')
        OR (
          booking.status = 'pending_payment'
          AND booking.created_at > now() - make_interval(mins => p_pending_ttl_min)
        )
      )
      AND v_new_start < (
        extract(hour FROM booking.booking_time)::integer * 60
        + extract(minute FROM booking.booking_time)::integer
        + COALESCE(booking.service_duration_min, 60)
        + v_buffer_minutes
      )
      AND v_new_end > (
        extract(hour FROM booking.booking_time)::integer * 60
        + extract(minute FROM booking.booking_time)::integer
      )
  ) THEN
    RAISE EXCEPTION 'BOOKING_CONFLICT' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.workspace_bookings(
    workspace_id,
    service_id,
    patient_name,
    patient_email,
    patient_phone,
    booking_date,
    booking_time,
    status,
    total_amount_cents,
    platform_fee_cents,
    repasse_amount_cents,
    service_duration_min
  ) VALUES (
    p_workspace_id,
    p_service_id,
    btrim(p_patient_name),
    lower(btrim(p_patient_email)),
    nullif(btrim(p_patient_phone), ''),
    p_booking_date,
    p_booking_time,
    'pending_payment',
    v_service.price_cents,
    v_expected_fee,
    v_service.price_cents - v_expected_fee,
    v_service.duration_min
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_public_workspace_booking_profile(text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_public_workspace_booking_services(text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_public_workspace_booking_slots(text, uuid, date)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_public_workspace_booking_payment_status(uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_workspace_booking_atomic(uuid, uuid, text, text, text, date, time, integer, integer, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_workspace_booking_profile(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_workspace_booking_services(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_workspace_booking_slots(text, uuid, date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_workspace_booking_payment_status(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_workspace_booking_atomic(uuid, uuid, text, text, text, date, time, integer, integer, integer, integer, integer)
  TO service_role;

COMMENT ON FUNCTION public.get_public_workspace_booking_profile(text) IS
  'Minimal public booking profile. It intentionally excludes workspace IDs and payment credentials.';
COMMENT ON FUNCTION public.get_public_workspace_booking_slots(text, uuid, date) IS
  'Returns only currently selectable slot start times; no booking rows or patient data are exposed.';

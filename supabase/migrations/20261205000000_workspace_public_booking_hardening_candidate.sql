-- Public workspace booking hardening candidate.
--
-- Deployment contract:
--   1. Deploy the matching public booking UI and Edge Function in the same release.
--   2. Apply this migration once those clients are ready to call these RPCs.
-- Applying this migration by itself intentionally disables the old direct anon reads.
-- No patient data is returned by any function below.

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

REVOKE ALL ON FUNCTION public.get_public_workspace_booking_profile(text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_public_workspace_booking_services(text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_public_workspace_booking_slots(text, uuid, date)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_public_workspace_booking_payment_status(uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_public_workspace_booking_profile(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_workspace_booking_services(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_workspace_booking_slots(text, uuid, date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_workspace_booking_payment_status(uuid, text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "booking_settings_anon_read" ON public.workspace_booking_settings;
DROP POLICY IF EXISTS "booking_services_anon_read" ON public.workspace_booking_services;
DROP POLICY IF EXISTS "booking_availability_anon_read" ON public.workspace_booking_availability;
DROP POLICY IF EXISTS "blocked_dates_anon_read" ON public.workspace_booking_blocked_dates;
DROP POLICY IF EXISTS "bookings_anon_slots_read" ON public.workspace_bookings;
DROP POLICY IF EXISTS "bookings_anon_insert" ON public.workspace_bookings;

REVOKE ALL ON TABLE public.workspace_booking_settings FROM anon;
REVOKE ALL ON TABLE public.workspace_booking_services FROM anon;
REVOKE ALL ON TABLE public.workspace_booking_availability FROM anon;
REVOKE ALL ON TABLE public.workspace_booking_blocked_dates FROM anon;
REVOKE ALL ON TABLE public.workspace_bookings FROM anon;

COMMENT ON FUNCTION public.get_public_workspace_booking_profile(text) IS
  'Minimal public booking profile. It intentionally excludes workspace IDs and payment credentials.';
COMMENT ON FUNCTION public.get_public_workspace_booking_slots(text, uuid, date) IS
  'Returns only currently selectable slot start times; no booking rows or patient data are exposed.';
COMMENT ON FUNCTION public.get_public_workspace_booking_payment_status(uuid, text) IS
  'Returns only a status when both the opaque booking UUID and Mercado Pago payment ID match.';

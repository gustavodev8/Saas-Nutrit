-- Phase B: contract public workspace booking access only after Phase A is live.
--
-- Preconditions:
--   * The Phase A booking functions are present.
--   * The backwards-compatible Edge Function is deployed.
--   * The RPC-based public UI is deployed and smoke-tested for a legacy
--     { workspace_id } client and a new { workspace_slug } client.
--   * No public client directly reads or inserts the workspace booking tables.
--   * A documented cache coexistence period has elapsed: force refresh or
--     equivalent cache invalidation is in place, and browser/CDN checks verify
--     that no old bundles still issue direct anon table reads.
--
-- This migration intentionally performs the destructive ACL contraction separately.

DO $preflight$
BEGIN
  IF to_regprocedure('public.get_public_workspace_booking_profile(text)') IS NULL
    OR to_regprocedure('public.get_public_workspace_booking_services(text)') IS NULL
    OR to_regprocedure('public.get_public_workspace_booking_slots(text,uuid,date)') IS NULL
    OR to_regprocedure('public.get_public_workspace_booking_payment_status(uuid,text)') IS NULL
    OR to_regprocedure('public.create_workspace_booking_atomic(uuid,uuid,text,text,text,date,time,integer,integer,integer,integer,integer)') IS NULL THEN
    RAISE EXCEPTION
      'workspace public booking contract preflight failed: Phase A functions are missing';
  END IF;
END;
$preflight$;

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

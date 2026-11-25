-- Phase B: contract public workspace booking access only after Phase A is live.
--
-- Preconditions:
--   * 20261205000000 has been applied.
--   * The backwards-compatible Edge Function is deployed.
--   * The RPC-based public UI is deployed and smoke-tested for a legacy
--     { workspace_id } client and a new { workspace_slug } client.
--   * No public client directly reads or inserts the workspace booking tables.
--   * A documented cache coexistence period has elapsed: force refresh or
--     equivalent cache invalidation is in place, and browser/CDN checks verify
--     that no old bundles still issue direct anon table reads.
--
-- This migration intentionally performs the destructive ACL contraction separately.

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

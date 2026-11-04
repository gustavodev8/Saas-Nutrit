-- Compatibility hardening: preserve the existing public booking INSERT path
-- while removing table privileges that are not governed by row-level security.
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN
ON TABLE public.bookings
FROM PUBLIC, anon, authenticated;

-- This operational snapshot has no in-repository consumer. Keep it available
-- only to the trusted backend role until a legitimate caller is established.
REVOKE EXECUTE
ON FUNCTION public.system_health_snapshot()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.system_health_snapshot()
TO service_role;

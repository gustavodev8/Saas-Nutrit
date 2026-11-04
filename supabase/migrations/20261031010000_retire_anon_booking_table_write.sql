-- Contract phase: apply only after submit-public-booking is deployed, the
-- frontend invokes it, and the new booking flow has passed a production smoke test.
-- Existing open clients using direct table inserts will stop working after this.
REVOKE ALL ON TABLE public.bookings FROM anon;
REVOKE INSERT (
  booking_group_id, session_number, total_sessions, client_name, client_email,
  client_phone, client_cpf, plan_name, plan_index, appointment_date,
  appointment_time, type, status, payment_status, payment_method, notes
) ON public.bookings FROM anon;
REVOKE ALL ON SEQUENCE public.bookings_id_seq FROM anon;

DROP POLICY IF EXISTS public_insert_bookings ON public.bookings;
DROP POLICY IF EXISTS anon_insert_bookings ON public.bookings;

REVOKE ALL ON FUNCTION public.submit_public_booking_group(jsonb, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_booking_group(jsonb, text, text, text)
  TO service_role;

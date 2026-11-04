-- Expand phase: keep legacy pending paid inserts available until the new Edge
-- Function and frontend are deployed. The contract migration revokes direct writes.
-- Keep this SECURITY DEFINER body small and review every future SQL change:
-- Supabase migrations create functions as the migration owner (normally postgres).
DROP FUNCTION public.public_unavailable_booking_slots(date, text, text);

CREATE TABLE public.public_booking_entitlements (
  payment_id text PRIMARY KEY REFERENCES public.payment_logs(payment_id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  customer_email text NOT NULL,
  customer_cpf_hash text NOT NULL CHECK (customer_cpf_hash ~ '^[a-f0-9]{64}$'),
  issued_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  consumed_at timestamptz,
  booking_group_id text UNIQUE
);

CREATE UNIQUE INDEX public_booking_entitlements_email_unique
  ON public.public_booking_entitlements (pg_catalog.lower(customer_email));
CREATE UNIQUE INDEX public_booking_entitlements_cpf_unique
  ON public.public_booking_entitlements (customer_cpf_hash);
ALTER TABLE public.public_booking_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_booking_entitlements FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.issue_public_booking_entitlement(p_payment_id text, p_token_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_payment public.payment_logs%ROWTYPE;
  v_inserted integer;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) IS DISTINCT FROM 'service_role'
    OR p_payment_id IS NULL
    OR p_token_hash IS NULL
    OR p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_payment
  FROM public.payment_logs
  WHERE payment_id = p_payment_id
    AND status = 'approved'
    AND product_index IS NOT NULL
    AND customer_email IS NOT NULL
    AND customer_cpf_hash ~ '^[a-f0-9]{64}$';
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('booking-benefit:cpf:' || v_payment.customer_cpf_hash, 0)
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('booking-benefit:email:' || pg_catalog.lower(v_payment.customer_email), 0)
  );

  IF EXISTS (
    SELECT 1 FROM public.payment_logs AS prior
    WHERE prior.payment_id <> p_payment_id
      AND prior.status = 'approved'
      AND prior.product_index IS NOT NULL
      AND (
        prior.customer_cpf_hash = v_payment.customer_cpf_hash
        OR pg_catalog.lower(pg_catalog.btrim(prior.customer_email)) = pg_catalog.lower(pg_catalog.btrim(v_payment.customer_email))
      )
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.public_booking_entitlements (
    payment_id, token_hash, customer_email, customer_cpf_hash
  ) VALUES (
    p_payment_id, p_token_hash,
    pg_catalog.lower(pg_catalog.btrim(v_payment.customer_email)),
    v_payment.customer_cpf_hash
  )
  ON CONFLICT (payment_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 1 THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.public_booking_entitlements AS entitlement
    WHERE entitlement.payment_id = p_payment_id
      AND entitlement.token_hash = p_token_hash
  );
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END;
$function$;

REVOKE ALL ON FUNCTION public.issue_public_booking_entitlement(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_public_booking_entitlement(text, text) TO service_role;

CREATE FUNCTION public.finalize_product_payment(
  p_payment_id text,
  p_customer_name text,
  p_customer_email text,
  p_customer_cpf_hash text,
  p_product_name text,
  p_product_index integer,
  p_amount numeric,
  p_pdf_url text,
  p_token_hash text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_updated integer;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) IS DISTINCT FROM 'service_role'
    OR p_payment_id IS NULL
    OR pg_catalog.char_length(p_payment_id) NOT BETWEEN 1 AND 120
    OR p_customer_email IS NULL
    OR p_customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR p_customer_cpf_hash IS NOT NULL AND p_customer_cpf_hash !~ '^[a-f0-9]{64}$'
    OR p_product_name IS NULL
    OR pg_catalog.char_length(p_product_name) NOT BETWEEN 1 AND 300
    OR p_product_index IS NULL
    OR p_product_index < 0
    OR p_amount IS NULL
    OR p_amount <= 0
    OR (p_token_hash IS NOT NULL AND p_token_hash !~ '^[a-f0-9]{64}$') THEN
    RETURN false;
  END IF;

  UPDATE public.payment_logs
  SET customer_name = p_customer_name,
      customer_email = pg_catalog.lower(pg_catalog.btrim(p_customer_email)),
      customer_cpf_hash = p_customer_cpf_hash,
      product_name = p_product_name,
      product_index = p_product_index,
      amount = p_amount,
      pdf_url = p_pdf_url,
      status = 'approved',
      updated_at = pg_catalog.now()
  WHERE payment_id = p_payment_id
    AND status = 'processing';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 1 THEN
    RETURN false;
  END IF;

  IF p_token_hash IS NOT NULL THEN
    PERFORM public.issue_public_booking_entitlement(p_payment_id, p_token_hash);
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_product_payment(text, text, text, text, text, integer, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_product_payment(text, text, text, text, text, integer, numeric, text, text) TO service_role;

CREATE FUNCTION public.public_product_booking_entitlement_status(p_payment_id text, p_token_hash text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_payment_status text;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) IS DISTINCT FROM 'service_role'
    OR p_payment_id IS NULL
    OR p_token_hash IS NULL
    OR p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN 'pending';
  END IF;

  SELECT status INTO v_payment_status
  FROM public.payment_logs
  WHERE payment_id = p_payment_id;

  IF v_payment_status IS DISTINCT FROM 'approved' THEN
    RETURN 'pending';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.public_booking_entitlements AS entitlement
    WHERE entitlement.payment_id = p_payment_id
      AND entitlement.token_hash = p_token_hash
      AND entitlement.consumed_at IS NULL
  ) THEN
    RETURN 'available';
  END IF;

  RETURN 'unavailable';
END;
$function$;

REVOKE ALL ON FUNCTION public.public_product_booking_entitlement_status(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_product_booking_entitlement_status(text, text) TO service_role;

CREATE FUNCTION public.public_unavailable_booking_slots(
  p_date date,
  p_type text,
  p_exclude_group_id text DEFAULT NULL
)
RETURNS TABLE (appointment_time text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT b.appointment_time::text
  FROM public.bookings AS b
  WHERE p_date >= CURRENT_DATE
    AND p_type IN ('online', 'presencial')
    AND b.appointment_date = p_date
    AND b.type = p_type
    AND (b.status IS NULL OR b.status NOT IN ('cancelled', 'no_show'))
    AND (
      b.status IS DISTINCT FROM 'pending'
      OR b.created_at IS NULL
      OR b.created_at >= pg_catalog.now() - interval '30 minutes'
    )
    AND (p_exclude_group_id IS NULL OR b.booking_group_id IS DISTINCT FROM p_exclude_group_id);
$function$;

REVOKE ALL ON FUNCTION public.public_unavailable_booking_slots(date, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_unavailable_booking_slots(date, text, text) FROM anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_unavailable_booking_slots(date, text, text) TO anon, authenticated;

CREATE FUNCTION public._public_booking_slot_is_available(
  p_date date,
  p_time text,
  p_type text,
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
      p_date::text || '|' || pg_catalog.to_char(v_time, 'HH24:MI') || '|' || p_type,
      0
    )
  );

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.bookings AS occupied
    WHERE occupied.appointment_date = p_date
      AND CASE
        WHEN occupied.appointment_time::text ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
          THEN pg_catalog.date_trunc('minute', occupied.appointment_time::text::time)
            = pg_catalog.date_trunc('minute', v_time)
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

REVOKE ALL ON FUNCTION public._public_booking_slot_is_available(date, text, text, text, integer, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._public_booking_slot_is_available(date, text, text, text, integer, bigint) FROM anon, authenticated, service_role;

CREATE FUNCTION public.enforce_booking_slot_conflict()
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
    nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
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
    NEW.booking_group_id,
    NEW.session_number,
    NEW.id
  ) THEN
    RAISE EXCEPTION 'Appointment slot is unavailable' USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_booking_slot_conflict() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_booking_slot_conflict() FROM anon, authenticated, service_role;

CREATE TRIGGER bookings_guard_slot_before_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_slot_conflict();

CREATE TRIGGER bookings_guard_slot_before_update
  BEFORE UPDATE OF appointment_date, appointment_time, type, status, booking_group_id, session_number
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_slot_conflict();

CREATE FUNCTION public.submit_public_booking_group(
  p_bookings jsonb,
  p_city text,
  p_entitlement_payment_id text DEFAULT NULL,
  p_entitlement_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_group_id text;
  v_input_count integer;
  v_group_count integer;
  v_total_sessions_count integer;
  v_distinct_session_count integer;
  v_existing_count integer;
  v_matching_count integer;
  v_is_free_booking boolean;
  v_contains_free_booking boolean;
  v_entitlement public.public_booking_entitlements%ROWTYPE;
  v_booking record;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) IS DISTINCT FROM 'service_role'
    OR jsonb_typeof(p_bookings) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_bookings) NOT BETWEEN 1 AND 20
    OR char_length(coalesce(p_city, '')) > 120 THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_bookings) AS item(value)
    WHERE jsonb_typeof(item.value) IS DISTINCT FROM 'object'
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_bookings) AS item(value)
    WHERE coalesce(item.value ->> 'appointment_time', '')
      !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_bookings) AS item(value)
    CROSS JOIN LATERAL jsonb_object_keys(item.value) AS key(name)
    WHERE key.name <> ALL (ARRAY[
      'booking_group_id', 'session_number', 'total_sessions', 'client_name',
      'client_email', 'client_phone', 'client_cpf', 'plan_name', 'plan_index',
      'appointment_date', 'appointment_time', 'type', 'status', 'payment_status',
      'payment_method', 'notes'
    ])
  ) THEN
    RETURN false;
  END IF;

  SELECT
    count(*)::integer,
    count(DISTINCT request.booking_group_id)::integer,
    count(DISTINCT request.total_sessions)::integer,
    count(DISTINCT request.session_number)::integer,
    min(request.booking_group_id)
  INTO
    v_input_count,
    v_group_count,
    v_total_sessions_count,
    v_distinct_session_count,
    v_group_id
  FROM jsonb_to_recordset(p_bookings) AS request(
    booking_group_id text,
    session_number integer,
    total_sessions integer,
    client_name text,
    client_email text,
    client_phone text,
    client_cpf text,
    plan_name text,
    plan_index integer,
    appointment_date date,
    appointment_time text,
    type text,
    status text,
    payment_status text,
    payment_method text,
    notes text
  );

  IF v_input_count IS DISTINCT FROM jsonb_array_length(p_bookings)
    OR v_group_count <> 1
    OR v_total_sessions_count <> 1
    OR v_distinct_session_count <> v_input_count THEN
    RETURN false;
  END IF;

  SELECT bool_and(request.status = 'confirmed'
    AND request.payment_status = 'free'
    AND request.payment_method = 'free'),
    bool_or(request.payment_status = 'free' OR request.payment_method = 'free'
      OR request.status = 'confirmed')
  INTO v_is_free_booking, v_contains_free_booking
  FROM jsonb_to_recordset(p_bookings) AS request(
    status text, payment_status text, payment_method text
  );
  v_is_free_booking := coalesce(v_is_free_booking, false);
  v_contains_free_booking := coalesce(v_contains_free_booking, false);

  IF v_contains_free_booking AND NOT v_is_free_booking THEN
    RETURN false;
  END IF;

  IF v_is_free_booking THEN
    IF p_entitlement_payment_id IS NULL
      OR p_entitlement_token IS NULL
      OR p_entitlement_token !~ '^[A-Fa-f0-9]{32}$'
      OR v_input_count <> 1 THEN
      RETURN false;
    END IF;

    SELECT * INTO v_entitlement
    FROM public.public_booking_entitlements AS entitlement
    WHERE entitlement.payment_id = p_entitlement_payment_id
      AND entitlement.token_hash = pg_catalog.encode(
        extensions.digest(pg_catalog.lower(p_entitlement_token), 'sha256'), 'hex'
      )
      AND EXISTS (
        SELECT 1 FROM public.payment_logs AS payment
        WHERE payment.payment_id = entitlement.payment_id
          AND payment.status = 'approved'
          AND payment.product_index IS NOT NULL
      )
    FOR UPDATE;

    IF NOT FOUND
      OR (v_entitlement.consumed_at IS NOT NULL
        AND v_entitlement.booking_group_id IS DISTINCT FROM v_group_id) THEN
      RETURN false;
    END IF;
  ELSIF p_entitlement_payment_id IS NOT NULL OR p_entitlement_token IS NOT NULL THEN
    RETURN false;
  END IF;

  FOR v_booking IN
    SELECT *
    FROM jsonb_to_recordset(p_bookings) AS request(
      booking_group_id text,
      session_number integer,
      total_sessions integer,
      client_name text,
      client_email text,
      client_phone text,
      client_cpf text,
      plan_name text,
      plan_index integer,
      appointment_date date,
      appointment_time text,
      type text,
      status text,
      payment_status text,
      payment_method text,
      notes text
    )
  LOOP
    IF v_booking.booking_group_id IS DISTINCT FROM v_group_id
      OR char_length(btrim(v_booking.booking_group_id)) NOT BETWEEN 8 AND 100
      OR v_booking.session_number IS NULL
      OR v_booking.total_sessions IS NULL
      OR v_booking.session_number NOT BETWEEN 1 AND v_booking.total_sessions
      OR v_booking.total_sessions < 1
      OR v_booking.client_name IS NULL
      OR char_length(btrim(v_booking.client_name)) NOT BETWEEN 1 AND 200
      OR v_booking.client_email IS NULL
      OR char_length(v_booking.client_email) > 254
      OR position('@' IN v_booking.client_email) < 2
      OR v_booking.client_phone IS NULL
      OR char_length(v_booking.client_phone) > 40
      OR (v_booking.client_cpf IS NOT NULL AND v_booking.client_cpf !~ '^[0-9]{11}$')
      OR v_booking.plan_name IS NULL
      OR char_length(btrim(v_booking.plan_name)) NOT BETWEEN 1 AND 200
      OR v_booking.plan_index IS NULL
      OR v_booking.plan_index < 0
      OR v_booking.appointment_date IS NULL
      OR v_booking.appointment_date < current_date
      OR v_booking.appointment_time IS NULL
      OR v_booking.appointment_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      OR v_booking.type IS NULL
      OR v_booking.type NOT IN ('online', 'presencial')
      OR (v_booking.type = 'presencial' AND char_length(btrim(coalesce(p_city, ''))) = 0)
      OR char_length(coalesce(v_booking.notes, '')) > 20000
      OR v_booking.status IS NULL
      OR v_booking.payment_status IS NULL
      OR v_booking.payment_method IS NULL
      OR (v_is_free_booking AND (
        v_booking.session_number <> 1
        OR v_booking.total_sessions <> 1
        OR v_booking.plan_index <> 0
        OR v_booking.plan_name <> 'Consulta gratuita (20 min)'
        OR v_booking.type <> 'online'
      ))
      OR NOT (
        (
          v_booking.status = 'pending'
          AND v_booking.payment_status = 'pending'
          AND v_booking.payment_method IN ('pix', 'card')
        )
        OR (
          v_booking.status = 'confirmed'
          AND v_booking.payment_status = 'free'
          AND v_booking.payment_method = 'free'
        )
      ) THEN
      RETURN false;
    END IF;
  END LOOP;

  IF v_is_free_booking AND EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_bookings) AS request(client_email text, client_cpf text)
    WHERE pg_catalog.lower(pg_catalog.btrim(request.client_email)) <> v_entitlement.customer_email
      OR request.client_cpf IS NULL
      OR pg_catalog.encode(extensions.digest(request.client_cpf, 'sha256'), 'hex')
        <> v_entitlement.customer_cpf_hash
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_bookings) AS request(
      booking_group_id text,
      session_number integer
    )
    GROUP BY request.session_number
    HAVING count(*) > 1
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_bookings) AS first_request(
      appointment_date date,
      appointment_time text,
      type text,
      session_number integer
    )
    JOIN jsonb_to_recordset(p_bookings) AS second_request(
      appointment_date date,
      appointment_time text,
      type text,
      session_number integer
    )
      ON second_request.appointment_date = first_request.appointment_date
      AND second_request.appointment_time = first_request.appointment_time
      AND second_request.type = first_request.type
      AND second_request.session_number > first_request.session_number
  ) THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_group_id, 0)
  );

  FOR v_booking IN
    SELECT request.appointment_date, request.appointment_time, request.type
    FROM jsonb_to_recordset(p_bookings) AS request(
      appointment_date date,
      appointment_time text,
      type text
    )
    ORDER BY request.appointment_date, request.appointment_time, request.type
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        v_booking.appointment_date::text || '|' ||
        v_booking.appointment_time::text || '|' || v_booking.type,
        0
      )
    );
  END LOOP;

  SELECT count(existing.booking_group_id)::integer
  INTO v_existing_count
  FROM public.bookings AS existing
  WHERE existing.booking_group_id = v_group_id;

  WITH requested AS (
    SELECT *
    FROM jsonb_to_recordset(p_bookings) AS request(
      booking_group_id text,
      session_number integer,
      total_sessions integer,
      client_name text,
      client_email text,
      client_phone text,
      client_cpf text,
      plan_name text,
      plan_index integer,
      appointment_date date,
      appointment_time text,
      type text,
      status text,
      payment_status text,
      payment_method text,
      notes text
    )
  )
  SELECT count(existing.booking_group_id)::integer
  INTO v_matching_count
  FROM requested
  JOIN public.bookings AS existing
    ON existing.booking_group_id = requested.booking_group_id
    AND existing.session_number = requested.session_number
  WHERE existing.total_sessions IS NOT DISTINCT FROM requested.total_sessions
    AND existing.client_name IS NOT DISTINCT FROM requested.client_name
    AND existing.client_email IS NOT DISTINCT FROM requested.client_email
    AND existing.client_phone IS NOT DISTINCT FROM requested.client_phone
    AND existing.client_cpf IS NOT DISTINCT FROM requested.client_cpf
    AND existing.plan_name IS NOT DISTINCT FROM requested.plan_name
    AND existing.plan_index IS NOT DISTINCT FROM requested.plan_index
    AND existing.appointment_date IS NOT DISTINCT FROM requested.appointment_date
    AND CASE
      WHEN existing.appointment_time::text ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
        THEN existing.appointment_time::text::time = requested.appointment_time::time
      ELSE false
    END
    AND existing.type IS NOT DISTINCT FROM requested.type
    AND existing.status IS NOT DISTINCT FROM requested.status
    AND existing.payment_status IS NOT DISTINCT FROM requested.payment_status
    AND existing.payment_method IS NOT DISTINCT FROM requested.payment_method
    AND existing.notes IS NOT DISTINCT FROM requested.notes
    AND existing.patient_id IS NULL
    AND existing.completed_at IS NULL;

  IF v_existing_count <> v_matching_count THEN
    RETURN false;
  END IF;

  IF EXISTS (
    WITH requested AS (
      SELECT *
      FROM jsonb_to_recordset(p_bookings) AS request(
        booking_group_id text,
        session_number integer,
        appointment_date date,
    appointment_time text,
        type text
      )
    )
    SELECT 1
    FROM requested
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.bookings AS existing
      WHERE existing.booking_group_id = requested.booking_group_id
        AND existing.session_number = requested.session_number
    )
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.availability_slots AS slot
          WHERE slot.date = requested.appointment_date
            AND CASE
              WHEN slot.start_time::text ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
                THEN slot.start_time::text::time = requested.appointment_time::time
              ELSE false
            END
            AND slot.type = requested.type
            AND slot.active IS TRUE
            AND (requested.type = 'online' OR slot.city = p_city)
        )
        OR NOT public._public_booking_slot_is_available(
          requested.appointment_date,
          requested.appointment_time,
          requested.type,
          requested.booking_group_id,
          requested.session_number,
          NULL
        )
      )
  ) THEN
    RETURN false;
  END IF;

  BEGIN
    FOR v_booking IN
      SELECT request.*
      FROM jsonb_to_recordset(p_bookings) AS request(
        booking_group_id text,
        session_number integer,
        total_sessions integer,
        client_name text,
        client_email text,
        client_phone text,
        client_cpf text,
        plan_name text,
        plan_index integer,
        appointment_date date,
        appointment_time text,
        type text,
        status text,
        payment_status text,
        payment_method text,
        notes text
      )
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.bookings AS existing
        WHERE existing.booking_group_id = request.booking_group_id
          AND existing.session_number = request.session_number
      )
    LOOP
      INSERT INTO public.bookings (
        booking_group_id, session_number, total_sessions, client_name,
        client_email, client_phone, client_cpf, plan_name, plan_index,
        appointment_date, appointment_time, type, status, payment_status,
        payment_method, notes
      ) VALUES (
        v_booking.booking_group_id, v_booking.session_number, v_booking.total_sessions,
        v_booking.client_name, v_booking.client_email, v_booking.client_phone,
        v_booking.client_cpf, v_booking.plan_name, v_booking.plan_index,
        v_booking.appointment_date, v_booking.appointment_time, v_booking.type,
        v_booking.status, v_booking.payment_status, v_booking.payment_method,
        v_booking.notes
      );
    END LOOP;
  EXCEPTION WHEN unique_violation THEN
    RETURN false;
  END;

  IF v_is_free_booking AND v_entitlement.consumed_at IS NULL THEN
    UPDATE public.public_booking_entitlements
    SET consumed_at = pg_catalog.now(), booking_group_id = v_group_id
    WHERE payment_id = p_entitlement_payment_id;
  END IF;

  RETURN true;
EXCEPTION
  WHEN data_exception THEN
    RETURN false;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_public_booking_group(jsonb, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_booking_group(jsonb, text, text, text) FROM anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_public_booking_group(jsonb, text, text, text) TO service_role;

COMMENT ON FUNCTION public.submit_public_booking_group(jsonb, text, text, text) IS
  'Validates and atomically submits bookings; free bookings require a server-issued, single-use purchase entitlement.';


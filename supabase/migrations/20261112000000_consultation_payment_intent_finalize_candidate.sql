-- Candidate payment finalization and enriched booking contract.
-- Depends on 20261111000000_consultation_payment_intents_candidate.sql.

ALTER TABLE public.consultation_payment_intents
  ADD COLUMN provider_status text CHECK (
    provider_status IS NULL OR provider_status IN (
      'pending', 'in_process', 'rejected', 'cancelled', 'approved'
    )
  );
ALTER TABLE public.consultation_payment_intents
  ADD COLUMN booking_snapshot_hash text CHECK (
    booking_snapshot_hash IS NULL OR booking_snapshot_hash ~ '^[a-f0-9]{64}$'
  );

ALTER TABLE public.public_booking_checkout_capabilities
  ADD COLUMN payment_intent_id uuid REFERENCES public.consultation_payment_intents(id) ON DELETE SET NULL;
ALTER TABLE public.public_booking_checkout_capabilities
  ADD COLUMN guard_version bigint NOT NULL DEFAULT 0;

CREATE FUNCTION public.guard_active_consultation_payment_booking_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_old_group text;
  v_new_group text;
  v_lock_group text;
  v_active_intent_id uuid;
  v_active_intent public.consultation_payment_intents%ROWTYPE;
  v_capability_intent_id uuid;
  v_finalizing_intent_id text := pg_catalog.current_setting(
    'nutri.finalizing_consultation_payment_intent', true
  );
  v_role text := coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
    ''
  );
BEGIN
  IF TG_OP <> 'INSERT' THEN v_old_group := OLD.booking_group_id; END IF;
  IF TG_OP <> 'DELETE' THEN v_new_group := NEW.booking_group_id; END IF;

  FOR v_lock_group IN
    SELECT DISTINCT group_id
    FROM pg_catalog.unnest(ARRAY[v_old_group, v_new_group]) AS groups(group_id)
    WHERE group_id IS NOT NULL
    ORDER BY group_id
  LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('consultation-checkout:' || v_lock_group, 0)
    );
  END LOOP;

  FOR v_lock_group IN
    SELECT DISTINCT group_id
    FROM pg_catalog.unnest(ARRAY[v_old_group, v_new_group]) AS groups(group_id)
    WHERE group_id IS NOT NULL
    ORDER BY group_id
  LOOP
    FOR v_capability_intent_id IN
      UPDATE public.public_booking_checkout_capabilities AS capability
      SET guard_version = capability.guard_version + 1
      WHERE capability.booking_group_id = v_lock_group
      RETURNING capability.payment_intent_id
    LOOP
      IF v_capability_intent_id IS NOT NULL THEN
        v_active_intent_id := v_capability_intent_id;
        EXIT;
      END IF;
    END LOOP;
    IF v_active_intent_id IS NOT NULL THEN EXIT; END IF;
  END LOOP;

  IF v_active_intent_id IS NOT NULL AND NOT (
    v_role = 'service_role'
    AND TG_OP = 'UPDATE'
    AND v_old_group IS NOT DISTINCT FROM v_new_group
    AND v_finalizing_intent_id IS NOT DISTINCT FROM v_active_intent_id::text
    AND OLD.status IS NOT DISTINCT FROM 'pending'
    AND OLD.payment_status IS NOT DISTINCT FROM 'pending'
    AND NEW.status IS NOT DISTINCT FROM 'confirmed'
    AND NEW.payment_status IS NOT DISTINCT FROM 'paid'
    AND (pg_catalog.to_jsonb(NEW) - ARRAY['status', 'payment_status', 'payment_method'])
      IS NOT DISTINCT FROM
        (pg_catalog.to_jsonb(OLD) - ARRAY['status', 'payment_status', 'payment_method'])
  ) THEN
    RAISE EXCEPTION 'booking group is locked by a payment intent'
      USING ERRCODE = '55000';
  END IF;

  IF v_active_intent_id IS NOT NULL THEN
    SELECT intent.* INTO v_active_intent
    FROM public.consultation_payment_intents AS intent
    WHERE intent.id = v_active_intent_id;
    IF NOT FOUND OR v_active_intent.provider_status IS DISTINCT FROM 'approved'
      OR v_active_intent.status NOT IN ('creating', 'pending')
      OR NEW.payment_method IS DISTINCT FROM v_active_intent.payment_method THEN
      RAISE EXCEPTION 'booking group payment intent is not eligible for finalization'
        USING ERRCODE = '55000';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_active_consultation_payment_booking_mutation()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER guard_active_consultation_payment_booking_mutation
  BEFORE INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_active_consultation_payment_booking_mutation();

CREATE FUNCTION public.create_consultation_payment_intent_v2(
  p_booking_group_id text,
  p_capability_hash text,
  p_idempotency_key text,
  p_expected_amount_cents bigint,
  p_payment_method text,
  p_expected_plan_name text
)
RETURNS TABLE (
  intent_id uuid,
  workspace_id uuid,
  booking_group_id text,
  amount_cents bigint,
  currency text,
  payment_method text,
  status text,
  provider_payment_id text,
  customer_email text,
  customer_name text,
  plan_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_group_id text := pg_catalog.btrim(p_booking_group_id);
  v_expected_plan text := pg_catalog.btrim(p_expected_plan_name);
  v_now timestamptz := pg_catalog.now();
  v_row_count bigint;
  v_workspace_count bigint;
  v_email_count bigint;
  v_name_count bigint;
  v_plan_count bigint;
  v_method_count bigint;
  v_existing_count bigint;
  v_snapshot_hash text;
  v_group_payable boolean;
  v_has_existing boolean := false;
  v_workspace_id uuid;
  v_email text;
  v_name text;
  v_plan text;
  v_capability public.public_booking_checkout_capabilities%ROWTYPE;
  v_intent public.consultation_payment_intents%ROWTYPE;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
    ''
  ) IS DISTINCT FROM 'service_role'
    OR v_group_id IS NULL
    OR pg_catalog.char_length(v_group_id) NOT BETWEEN 8 AND 120
    OR p_capability_hash IS NULL OR p_capability_hash !~ '^[a-f0-9]{64}$'
    OR p_idempotency_key IS NULL OR p_idempotency_key !~ '^[a-f0-9]{64}$'
    OR p_expected_amount_cents IS NULL OR p_expected_amount_cents <= 0
    OR p_payment_method IS NULL OR p_payment_method NOT IN ('pix', 'card')
    OR v_expected_plan IS NULL OR v_expected_plan = '' THEN
    RETURN;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('consultation-checkout:' || v_group_id, 0)
  );

  -- Use the same intent-then-bookings lock order as finalization to avoid a
  -- deadlock between an idempotent checkout retry and a concurrent webhook.
  SELECT pg_catalog.count(*) INTO v_existing_count
  FROM public.consultation_payment_intents AS intent
  WHERE intent.booking_group_id = v_group_id
    AND intent.idempotency_key = p_idempotency_key;
  IF v_existing_count > 1 THEN
    RETURN;
  ELSIF v_existing_count = 1 THEN
    SELECT intent.* INTO v_intent
    FROM public.consultation_payment_intents AS intent
    WHERE intent.booking_group_id = v_group_id
      AND intent.idempotency_key = p_idempotency_key
    FOR UPDATE;
    v_has_existing := true;
  END IF;

  -- Lock and validate the source group before creating any intent. All customer
  -- fields in the response are derived from these rows, never caller input.
  PERFORM booking.id
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_group_id
  ORDER BY booking.id
  FOR UPDATE;

  SELECT
    pg_catalog.count(*),
    pg_catalog.count(DISTINCT coalesce(booking.workspace_id::text, '__legacy__')),
    pg_catalog.count(DISTINCT pg_catalog.lower(pg_catalog.btrim(booking.client_email))),
    pg_catalog.count(DISTINCT pg_catalog.lower(pg_catalog.btrim(booking.client_name))),
    pg_catalog.count(DISTINCT pg_catalog.btrim(booking.plan_name)),
    pg_catalog.count(DISTINCT booking.payment_method),
    pg_catalog.bool_and(
      booking.status = 'pending'
      AND booking.payment_status = 'pending'
      AND booking.payment_method IN ('pix', 'card')
      AND nullif(pg_catalog.btrim(booking.client_email), '') IS NOT NULL
      AND nullif(pg_catalog.btrim(booking.client_name), '') IS NOT NULL
      AND nullif(pg_catalog.btrim(booking.plan_name), '') IS NOT NULL
    ),
    (pg_catalog.array_agg(booking.workspace_id))[1],
    (pg_catalog.array_agg(pg_catalog.lower(pg_catalog.btrim(booking.client_email)) ORDER BY booking.id))[1],
    (pg_catalog.array_agg(pg_catalog.btrim(booking.client_name) ORDER BY booking.id))[1],
    (pg_catalog.array_agg(pg_catalog.btrim(booking.plan_name) ORDER BY booking.id))[1]
  INTO v_row_count, v_workspace_count, v_email_count, v_name_count, v_plan_count,
    v_method_count,
    v_group_payable, v_workspace_id, v_email, v_name, v_plan
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_group_id;

  IF v_row_count = 0 OR v_workspace_count <> 1 OR v_email_count <> 1
    OR v_name_count <> 1 OR v_plan_count <> 1 OR v_method_count <> 1
    OR v_group_payable IS DISTINCT FROM true
    OR v_workspace_id IS NOT NULL
    OR v_plan IS DISTINCT FROM v_expected_plan THEN
    RETURN;
  END IF;

  SELECT pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'id', booking.id,
          'workspace_id', booking.workspace_id,
          'client_name', pg_catalog.lower(pg_catalog.btrim(booking.client_name)),
          'client_email', pg_catalog.lower(pg_catalog.btrim(booking.client_email)),
          'plan_name', pg_catalog.btrim(booking.plan_name),
          'payment_method', booking.payment_method,
          'appointment_date', booking.appointment_date,
          'appointment_time', booking.appointment_time,
          'type', booking.type,
          'session_number', booking.session_number
        ) ORDER BY booking.id)::text, '[]'),
        'UTF8'
      ),
      'sha256'
    ), 'hex'
  ) INTO v_snapshot_hash
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_group_id;

  IF v_has_existing THEN
    IF v_intent.workspace_id IS DISTINCT FROM v_workspace_id THEN
      RETURN;
    END IF;
    SELECT capability.* INTO v_capability
    FROM public.public_booking_checkout_capabilities AS capability
    WHERE capability.booking_group_id = v_group_id
      AND capability.workspace_id IS NOT DISTINCT FROM v_workspace_id
      AND capability.capability_hash = p_capability_hash
    FOR UPDATE;
    IF NOT FOUND THEN
      RETURN;
    END IF;
    IF v_intent.amount_cents <> p_expected_amount_cents
      OR v_intent.payment_method <> p_payment_method
      OR v_intent.booking_snapshot_hash IS NULL
      OR v_intent.booking_snapshot_hash IS DISTINCT FROM v_snapshot_hash
      OR v_capability.payment_intent_id IS DISTINCT FROM v_intent.id THEN
      RETURN;
    END IF;
  ELSE
    SELECT capability.* INTO v_capability
    FROM public.public_booking_checkout_capabilities AS capability
    WHERE capability.booking_group_id = v_group_id
      AND capability.capability_hash = p_capability_hash
      AND capability.expires_at > v_now
    FOR UPDATE;
    IF NOT FOUND OR v_capability.workspace_id IS DISTINCT FROM v_workspace_id THEN
      RETURN;
    END IF;
    IF v_capability.payment_intent_id IS NOT NULL THEN
      RETURN;
    END IF;

    INSERT INTO public.consultation_payment_intents (
      workspace_id, booking_group_id, amount_cents, currency,
      payment_method, idempotency_key, status, booking_snapshot_hash,
      created_at, updated_at
    ) VALUES (
      v_workspace_id, v_group_id, p_expected_amount_cents, 'BRL',
      p_payment_method, p_idempotency_key, 'creating', v_snapshot_hash,
      v_now, v_now
    ) RETURNING * INTO v_intent;

    UPDATE public.public_booking_checkout_capabilities AS capability
    SET payment_intent_id = v_intent.id, updated_at = v_now
    WHERE capability.id = v_capability.id
      AND capability.payment_intent_id IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'checkout capability was claimed concurrently'
        USING ERRCODE = '40001';
    END IF;
  END IF;

  RETURN QUERY SELECT v_intent.id, v_intent.workspace_id, v_intent.booking_group_id,
    v_intent.amount_cents, v_intent.currency, v_intent.payment_method,
    v_intent.status, v_intent.provider_payment_id, v_email, v_name, v_plan;
EXCEPTION
  WHEN unique_violation THEN
    RETURN;
END;
$function$;

CREATE FUNCTION public.set_consultation_payment_provider_result(
  p_intent_id uuid,
  p_provider_payment_id text,
  p_provider_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_intent public.consultation_payment_intents%ROWTYPE;
  v_next_status text;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
    ''
  ) IS DISTINCT FROM 'service_role'
    OR p_intent_id IS NULL
    OR p_provider_status IS NULL
    OR p_provider_status NOT IN ('pending', 'in_process', 'rejected', 'cancelled', 'approved') THEN
    RETURN false;
  END IF;

  IF (p_provider_payment_id IS NULL
      AND p_provider_status NOT IN ('rejected', 'cancelled'))
    OR (p_provider_payment_id IS NOT NULL
      AND pg_catalog.char_length(pg_catalog.btrim(p_provider_payment_id)) NOT BETWEEN 1 AND 120) THEN
    RETURN false;
  END IF;

  SELECT intent.* INTO v_intent
  FROM public.consultation_payment_intents AS intent
  WHERE intent.id = p_intent_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_intent.provider_status IN ('rejected', 'cancelled') THEN
    RETURN v_intent.provider_payment_id IS NOT DISTINCT FROM nullif(pg_catalog.btrim(p_provider_payment_id), '')
      AND (p_provider_status = v_intent.provider_status
        OR (v_intent.provider_payment_id IS NOT NULL AND p_provider_status <> 'approved'));
  END IF;

  IF v_intent.provider_status = 'approved' AND p_provider_status <> 'approved' THEN
    RETURN v_intent.provider_payment_id IS NOT DISTINCT FROM nullif(pg_catalog.btrim(p_provider_payment_id), '');
  END IF;

  IF v_intent.provider_payment_id IS NOT NULL
    AND v_intent.provider_payment_id IS DISTINCT FROM nullif(pg_catalog.btrim(p_provider_payment_id), '') THEN
    RETURN false;
  END IF;

  IF v_intent.status = 'approved' THEN
    RETURN v_intent.provider_payment_id = pg_catalog.btrim(p_provider_payment_id)
      AND v_intent.provider_status = p_provider_status
      AND p_provider_status = 'approved';
  END IF;

  v_next_status := CASE p_provider_status
    WHEN 'rejected' THEN 'rejected'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END;

  UPDATE public.consultation_payment_intents AS intent
  SET provider_payment_id = nullif(pg_catalog.btrim(p_provider_payment_id), ''),
      provider_status = p_provider_status,
      status = v_next_status,
      updated_at = pg_catalog.now()
  WHERE intent.id = p_intent_id;

  IF p_provider_status IN ('rejected', 'cancelled') THEN
    UPDATE public.public_booking_checkout_capabilities AS capability
    SET payment_intent_id = NULL, updated_at = pg_catalog.now()
    WHERE capability.payment_intent_id = p_intent_id;
  END IF;
  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
END;
$function$;

CREATE FUNCTION public.confirm_consultation_payment_intent(
  p_intent_id uuid,
  p_provider_payment_id text,
  p_paid_amount_cents bigint,
  p_currency text,
  p_payment_method text
)
RETURNS TABLE (
  booking_group_id text,
  workspace_id uuid,
  client_name text,
  client_email text,
  plan_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_intent public.consultation_payment_intents%ROWTYPE;
  v_row_count bigint;
  v_workspace_count bigint;
  v_name_count bigint;
  v_email_count bigint;
  v_plan_count bigint;
  v_method_count bigint;
  v_pending_count bigint;
  v_workspace_id uuid;
  v_name text;
  v_email text;
  v_plan text;
  v_snapshot_hash text;
  v_previous_finalizing_intent_id text;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
    ''
  ) IS DISTINCT FROM 'service_role'
    OR p_intent_id IS NULL
    OR p_provider_payment_id IS NULL
    OR pg_catalog.char_length(pg_catalog.btrim(p_provider_payment_id)) NOT BETWEEN 1 AND 120
    OR p_paid_amount_cents IS NULL OR p_paid_amount_cents <= 0
    OR p_currency IS DISTINCT FROM 'BRL'
    OR p_payment_method IS NULL OR p_payment_method NOT IN ('pix', 'card') THEN
    RETURN;
  END IF;

  SELECT intent.* INTO v_intent
  FROM public.consultation_payment_intents AS intent
  WHERE intent.id = p_intent_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('consultation-checkout:' || v_intent.booking_group_id, 0)
  );

  SELECT intent.* INTO v_intent
  FROM public.consultation_payment_intents AS intent
  WHERE intent.id = p_intent_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_intent.workspace_id IS NOT NULL
    OR (v_intent.provider_payment_id IS NOT NULL
      AND v_intent.provider_payment_id IS DISTINCT FROM pg_catalog.btrim(p_provider_payment_id))
    OR v_intent.amount_cents <> p_paid_amount_cents
    OR v_intent.currency IS DISTINCT FROM p_currency
    OR v_intent.payment_method IS DISTINCT FROM p_payment_method
    OR v_intent.provider_status IS DISTINCT FROM 'approved' THEN
    RETURN;
  END IF;

  PERFORM booking.id
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_intent.booking_group_id
  ORDER BY booking.id
  FOR UPDATE;

  SELECT
    pg_catalog.count(*),
    pg_catalog.count(DISTINCT coalesce(booking.workspace_id::text, '__legacy__')),
    pg_catalog.count(DISTINCT pg_catalog.lower(pg_catalog.btrim(booking.client_name))),
    pg_catalog.count(DISTINCT pg_catalog.lower(pg_catalog.btrim(booking.client_email))),
    pg_catalog.count(DISTINCT pg_catalog.btrim(booking.plan_name)),
    pg_catalog.count(DISTINCT booking.payment_method),
    pg_catalog.count(*) FILTER (
      WHERE booking.status = 'pending' AND booking.payment_status = 'pending'
    ),
    (pg_catalog.array_agg(booking.workspace_id))[1],
    (pg_catalog.array_agg(pg_catalog.btrim(booking.client_name) ORDER BY booking.id))[1],
    (pg_catalog.array_agg(pg_catalog.lower(pg_catalog.btrim(booking.client_email)) ORDER BY booking.id))[1],
    (pg_catalog.array_agg(pg_catalog.btrim(booking.plan_name) ORDER BY booking.id))[1]
  INTO v_row_count, v_workspace_count, v_name_count, v_email_count, v_plan_count,
    v_method_count, v_pending_count, v_workspace_id, v_name, v_email, v_plan
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_intent.booking_group_id;

  IF v_row_count = 0 OR v_workspace_count <> 1 OR v_name_count <> 1
    OR v_email_count <> 1 OR v_plan_count <> 1 OR v_method_count <> 1
    OR v_workspace_id IS DISTINCT FROM v_intent.workspace_id THEN
    RETURN;
  END IF;

  SELECT pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'id', booking.id,
          'workspace_id', booking.workspace_id,
          'client_name', pg_catalog.lower(pg_catalog.btrim(booking.client_name)),
          'client_email', pg_catalog.lower(pg_catalog.btrim(booking.client_email)),
          'plan_name', pg_catalog.btrim(booking.plan_name),
          'payment_method', booking.payment_method,
          'appointment_date', booking.appointment_date,
          'appointment_time', booking.appointment_time,
          'type', booking.type,
          'session_number', booking.session_number
        ) ORDER BY booking.id)::text, '[]'),
        'UTF8'
      ),
      'sha256'
    ), 'hex'
  ) INTO v_snapshot_hash
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_intent.booking_group_id;

  IF v_intent.booking_snapshot_hash IS NULL
    OR v_intent.booking_snapshot_hash IS DISTINCT FROM v_snapshot_hash THEN
    RETURN;
  END IF;

  IF v_intent.status = 'approved' THEN
    IF v_pending_count <> 0 OR EXISTS (
      SELECT 1 FROM public.bookings AS booking
      WHERE booking.booking_group_id = v_intent.booking_group_id
        AND (booking.status IS DISTINCT FROM 'confirmed'
          OR booking.payment_status IS DISTINCT FROM 'paid'
          OR booking.payment_method IS DISTINCT FROM v_intent.payment_method)
    ) THEN
      RETURN;
    END IF;
    RETURN QUERY SELECT v_intent.booking_group_id, v_intent.workspace_id,
      v_name, v_email, v_plan;
    RETURN;
  END IF;

  IF v_intent.status NOT IN ('creating', 'pending')
    OR v_intent.provider_status IS DISTINCT FROM 'approved'
    OR v_pending_count <> v_row_count
    OR EXISTS (
      SELECT 1 FROM public.bookings AS booking
      WHERE booking.booking_group_id = v_intent.booking_group_id
        AND booking.payment_method IS DISTINCT FROM v_intent.payment_method
    ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.consultation_payment_intents AS other_intent
    WHERE other_intent.provider_payment_id = pg_catalog.btrim(p_provider_payment_id)
      AND other_intent.id <> p_intent_id
  ) THEN
    RETURN;
  END IF;

  v_previous_finalizing_intent_id := pg_catalog.current_setting(
    'nutri.finalizing_consultation_payment_intent', true
  );
  PERFORM pg_catalog.set_config(
    'nutri.finalizing_consultation_payment_intent', p_intent_id::text, true
  );
  UPDATE public.bookings AS booking
  SET status = 'confirmed', payment_status = 'paid',
      payment_method = v_intent.payment_method
  WHERE booking.booking_group_id = v_intent.booking_group_id
    AND booking.workspace_id IS NOT DISTINCT FROM v_intent.workspace_id
    AND booking.status = 'pending' AND booking.payment_status = 'pending';
  IF NOT FOUND THEN
    PERFORM pg_catalog.set_config(
      'nutri.finalizing_consultation_payment_intent',
      coalesce(v_previous_finalizing_intent_id, ''), true
    );
    RETURN;
  END IF;
  PERFORM pg_catalog.set_config(
    'nutri.finalizing_consultation_payment_intent',
    coalesce(v_previous_finalizing_intent_id, ''), true
  );

  UPDATE public.consultation_payment_intents AS intent
  SET provider_payment_id = pg_catalog.btrim(p_provider_payment_id),
      status = 'approved', updated_at = pg_catalog.now()
  WHERE intent.id = p_intent_id;

  RETURN QUERY SELECT v_intent.booking_group_id, v_intent.workspace_id,
    v_name, v_email, v_plan;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_consultation_payment_intent_v2(text, text, text, bigint, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_consultation_payment_intent_v2(text, text, text, bigint, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION public.set_consultation_payment_provider_result(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_consultation_payment_provider_result(uuid, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION public.confirm_consultation_payment_intent(uuid, text, bigint, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_consultation_payment_intent(uuid, text, bigint, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION public.create_consultation_payment_intent(text, text, text, bigint, text)
  FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION public.create_consultation_payment_intent_v2(text, text, text, bigint, text, text) IS
  'Service-only enriched checkout RPC. Customer identity and plan are derived from a locked booking group.';
COMMENT ON FUNCTION public.set_consultation_payment_provider_result(uuid, text, text) IS
  'Service-only provider status persistence; an approved provider status does not finalize the intent.';
COMMENT ON FUNCTION public.confirm_consultation_payment_intent(uuid, text, bigint, text, text) IS
  'Service-only atomic confirmation of a validated consultation payment intent and its booking group.';

-- Candidate bridge: installs one canonical capability ledger and a legacy-only
-- atomic RPC before the anonymous table-write cut. Keep public booking disabled
-- except for an explicitly approved, tightly controlled pre-cutover smoke.
DO $preflight$
BEGIN
  IF pg_catalog.to_regprocedure('public.submit_public_booking_group(jsonb,text,text,text)') IS NULL
    OR pg_catalog.to_regclass('public.bookings') IS NULL
    OR pg_catalog.to_regclass('public.workspaces') IS NULL THEN
    RAISE EXCEPTION 'public booking bridge preflight failed: required legacy schema is missing';
  END IF;
  IF pg_catalog.to_regclass('public.public_booking_checkout_capabilities') IS NOT NULL THEN
    RAISE EXCEPTION 'public booking bridge preflight failed: canonical capability table already exists';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.bookings'::regclass
      AND attname = 'workspace_id'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'public booking bridge preflight failed: bookings is already workspace-scoped';
  END IF;
END;
$preflight$;

CREATE TABLE public.public_booking_checkout_capabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid,
  booking_group_id text NOT NULL,
  capability_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT public_booking_checkout_capabilities_pkey PRIMARY KEY (id),
  CONSTRAINT public_booking_checkout_capabilities_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE NO ACTION,
  CONSTRAINT public_booking_checkout_capabilities_group_check
    CHECK (char_length(btrim(booking_group_id)) BETWEEN 8 AND 120),
  CONSTRAINT public_booking_checkout_capabilities_hash_key UNIQUE (capability_hash),
  CONSTRAINT public_booking_checkout_capabilities_hash_check
    CHECK (capability_hash ~ '^[a-f0-9]{64}$')
);

CREATE UNIQUE INDEX public_booking_checkout_capabilities_legacy_group_uidx
  ON public.public_booking_checkout_capabilities (booking_group_id)
  WHERE workspace_id IS NULL;
CREATE UNIQUE INDEX public_booking_checkout_capabilities_workspace_group_uidx
  ON public.public_booking_checkout_capabilities (workspace_id, booking_group_id)
  WHERE workspace_id IS NOT NULL;

ALTER TABLE public.public_booking_checkout_capabilities ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.public_booking_checkout_capabilities
  FROM PUBLIC, anon, authenticated, service_role;
COMMENT ON TABLE public.public_booking_checkout_capabilities IS
  'Canonical private checkout-capability ledger; stores only a SHA-256 hash. Bridge contract v1.';

CREATE FUNCTION public.issue_public_booking_checkout_capability(
  p_booking_group_id text,
  p_capability_hash text,
  p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_group_id text := pg_catalog.btrim(p_booking_group_id);
  v_now timestamptz := pg_catalog.now();
  v_booking_count bigint;
  v_email_count bigint;
  v_name_count bigint;
  v_plan_count bigint;
  v_method_count bigint;
  v_group_valid boolean;
  v_existing public.public_booking_checkout_capabilities%ROWTYPE;
BEGIN
  IF coalesce(
      nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
      nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
      ''
    ) IS DISTINCT FROM 'service_role'
    OR v_group_id IS NULL
    OR pg_catalog.char_length(v_group_id) NOT BETWEEN 8 AND 120
    OR p_capability_hash IS NULL
    OR p_capability_hash !~ '^[a-f0-9]{64}$'
    OR p_expires_at IS NULL
    OR p_expires_at <= v_now
    OR p_expires_at > v_now + interval '30 minutes' THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('consultation-checkout:' || v_group_id, 0)
  );

  SELECT
    pg_catalog.count(*),
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
  )
  INTO v_booking_count, v_email_count, v_name_count, v_plan_count, v_method_count,
    v_group_valid
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_group_id;

  IF v_booking_count = 0
    OR v_email_count <> 1
    OR v_name_count <> 1
    OR v_plan_count <> 1
    OR v_method_count <> 1
    OR v_group_valid IS DISTINCT FROM true THEN
    RETURN false;
  END IF;

  SELECT capability.* INTO v_existing
  FROM public.public_booking_checkout_capabilities AS capability
  WHERE capability.workspace_id IS NULL
    AND capability.booking_group_id = v_group_id
  FOR UPDATE;

  IF FOUND THEN
    RETURN v_existing.capability_hash = p_capability_hash
      AND v_existing.expires_at > v_now;
  END IF;

  INSERT INTO public.public_booking_checkout_capabilities (
    workspace_id, booking_group_id, capability_hash, expires_at
  ) VALUES (NULL, v_group_id, p_capability_hash, p_expires_at);
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END;
$function$;

CREATE FUNCTION public.submit_public_booking_checkout_group(
  p_bookings jsonb,
  p_city text,
  p_entitlement_payment_id text,
  p_entitlement_token text,
  p_capability_hash text,
  p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_group_id text;
  v_paid_group boolean;
  v_saved boolean;
  v_issued boolean;
  v_existing_hash text;
BEGIN
  IF coalesce(
      nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
      nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
      ''
    ) IS DISTINCT FROM 'service_role'
    OR pg_catalog.jsonb_typeof(p_bookings) IS DISTINCT FROM 'array'
    OR pg_catalog.jsonb_array_length(p_bookings) NOT BETWEEN 1 AND 20 THEN
    RETURN false;
  END IF;

  v_group_id := pg_catalog.btrim(p_bookings -> 0 ->> 'booking_group_id');
  IF v_group_id IS NULL OR pg_catalog.char_length(v_group_id) NOT BETWEEN 8 AND 100 THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_group_id, 0)
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('consultation-checkout:' || v_group_id, 0)
  );

  SELECT pg_catalog.bool_and(
    item.value ->> 'status' = 'pending'
    AND item.value ->> 'payment_status' = 'pending'
    AND item.value ->> 'payment_method' IN ('pix', 'card')
  )
  INTO v_paid_group
  FROM pg_catalog.jsonb_array_elements(p_bookings) AS item(value);
  v_paid_group := coalesce(v_paid_group, false);

  IF v_paid_group THEN
    IF p_capability_hash IS NULL
      OR p_capability_hash !~ '^[a-f0-9]{64}$'
      OR p_expires_at IS NULL
      OR p_expires_at <= pg_catalog.now()
      OR p_expires_at > pg_catalog.now() + interval '30 minutes' THEN
      RETURN false;
    END IF;

    SELECT capability.capability_hash INTO v_existing_hash
    FROM public.public_booking_checkout_capabilities AS capability
    WHERE capability.workspace_id IS NULL
      AND capability.booking_group_id = v_group_id;
    IF FOUND AND v_existing_hash IS DISTINCT FROM p_capability_hash THEN
      RAISE EXCEPTION 'checkout capability conflict' USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_capability_hash IS NOT NULL OR p_expires_at IS NOT NULL THEN
    RETURN false;
  END IF;

  v_saved := public.submit_public_booking_group(
    p_bookings, p_city, p_entitlement_payment_id, p_entitlement_token
  );
  IF v_saved IS DISTINCT FROM true THEN
    RETURN false;
  END IF;

  IF v_paid_group THEN
    v_issued := public.issue_public_booking_checkout_capability(
      v_group_id, p_capability_hash, p_expires_at
    );
    IF v_issued IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'checkout capability issuance failed' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.issue_public_booking_checkout_capability(text, text, timestamptz)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.issue_public_booking_checkout_capability(text, text, timestamptz)
  TO service_role;
REVOKE ALL ON FUNCTION public.submit_public_booking_checkout_group(jsonb, text, text, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_public_booking_checkout_group(jsonb, text, text, text, text, timestamptz)
  TO service_role;
COMMENT ON FUNCTION public.submit_public_booking_checkout_group(jsonb, text, text, text, text, timestamptz) IS
  'Atomically submits a legacy public booking and its private capability; service_role only. Bridge contract v1.';

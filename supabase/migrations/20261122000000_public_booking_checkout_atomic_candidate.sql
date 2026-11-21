-- Candidate only. The public booking endpoint must remain disabled until this
-- migration and its matching Edge Function are deployed and smoke-tested.
DO $preflight$
BEGIN
  IF pg_catalog.to_regprocedure('public.submit_public_booking_group(jsonb,text,text,text)') IS NULL
    OR pg_catalog.to_regprocedure('public.issue_public_booking_checkout_capability(text,text,timestamptz)') IS NULL
    OR pg_catalog.to_regprocedure('public.submit_public_booking_checkout_group(jsonb,text,text,text,text,timestamptz)') IS NULL
    OR pg_catalog.to_regclass('public.public_booking_checkout_capabilities') IS NULL THEN
    RAISE EXCEPTION 'atomic public booking preflight failed: booking and checkout prerequisites are missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.public_booking_checkout_capabilities'::regclass
      AND attname = 'workspace_id'
      AND atttypid = 'uuid'::regtype
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'atomic public booking preflight failed: checkout workspace scope is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.bookings'::regclass
      AND attname = 'workspace_id'
      AND atttypid = 'uuid'::regtype
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'atomic public booking preflight failed: booking workspace scope is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS procedure
    WHERE procedure.oid = 'public.submit_public_booking_checkout_group(jsonb,text,text,text,text,timestamptz)'::regprocedure
      AND procedure.proowner = (SELECT relowner FROM pg_catalog.pg_class WHERE oid = 'public.workspaces'::regclass)
      AND procedure.prorettype = 'boolean'::regtype
      AND procedure.prosecdef
      AND procedure.proconfig @> ARRAY['search_path=""']::text[]
  ) THEN
    RAISE EXCEPTION 'atomic public booking preflight failed: bridge RPC identity or security contract differs';
  END IF;
END;
$preflight$;

CREATE OR REPLACE FUNCTION public.submit_public_booking_checkout_group(
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

  -- Serialize the scope preflight with the legacy booking writer itself.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_group_id, 0)
  );

  -- All public/legacy writers must honor this group advisory lock.
  IF EXISTS (
    SELECT 1 FROM public.bookings AS booking
    WHERE booking.booking_group_id = v_group_id
      AND booking.workspace_id IS NOT NULL
  ) THEN
    RETURN false;
  END IF;

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
      OR p_expires_at IS NULL THEN
      RETURN false;
    END IF;

    -- Keep the checkout lock before any row-level work to match payment-intent
    -- and confirmation routines. The legacy booking lock above remains first.
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('consultation-checkout:' || v_group_id, 0)
    );

    SELECT capability.capability_hash INTO v_existing_hash
    FROM public.public_booking_checkout_capabilities AS capability
    WHERE capability.booking_group_id = v_group_id
      AND capability.workspace_id IS NULL;

    IF FOUND AND v_existing_hash IS DISTINCT FROM p_capability_hash THEN
      RAISE EXCEPTION 'checkout capability conflict'
        USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_capability_hash IS NOT NULL OR p_expires_at IS NOT NULL THEN
    RETURN false;
  END IF;

  v_saved := public.submit_public_booking_group(
    p_bookings,
    p_city,
    p_entitlement_payment_id,
    p_entitlement_token
  );
  IF v_saved IS DISTINCT FROM true THEN
    RETURN false;
  END IF;

  IF v_paid_group THEN
    v_issued := public.issue_public_booking_checkout_capability(
      v_group_id,
      p_capability_hash,
      p_expires_at
    );
    IF v_issued IS DISTINCT FROM true THEN
      -- An uncaught exception rolls back both the booking RPC and capability.
      RAISE EXCEPTION 'checkout capability issuance failed'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_public_booking_checkout_group(jsonb, text, text, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_public_booking_checkout_group(jsonb, text, text, text, text, timestamptz)
  TO service_role;
REVOKE ALL ON FUNCTION public.issue_public_booking_checkout_capability(text, text, timestamptz)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.issue_public_booking_checkout_capability(text, text, timestamptz)
  TO service_role;

COMMENT ON FUNCTION public.submit_public_booking_checkout_group(jsonb, text, text, text, text, timestamptz) IS
  'Atomically submits a legacy public booking and its private checkout capability; service_role only.';

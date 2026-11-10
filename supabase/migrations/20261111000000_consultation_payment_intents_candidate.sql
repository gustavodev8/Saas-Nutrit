-- Candidate only: persist a server-issued checkout capability and the intent
-- that binds a legacy/tenant booking group to one provider payment attempt.
-- This migration does not finalize payments or modify booking rows.

DO $preflight$
BEGIN
  IF pg_catalog.to_regclass('public.workspaces') IS NULL THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: public.workspaces is missing';
  END IF;
  IF pg_catalog.to_regclass('public.workspace_members') IS NULL THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: public.workspace_members is missing';
  END IF;
  IF pg_catalog.to_regclass('public.bookings') IS NULL THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: public.bookings is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.bookings'::regclass
      AND attname = 'workspace_id'
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: public.bookings.workspace_id is missing';
  END IF;
END;
$preflight$;

DO $capability_contract$
DECLARE
  v_table oid := pg_catalog.to_regclass('public.public_booking_checkout_capabilities');
  v_owner name;
  v_workspace_owner name;
BEGIN
  IF v_table IS NULL THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: canonical capability table is missing';
  END IF;

  SELECT role.rolname INTO v_owner
  FROM pg_catalog.pg_class AS relation
  JOIN pg_catalog.pg_roles AS role ON role.oid = relation.relowner
  WHERE relation.oid = v_table;
  SELECT role.rolname INTO v_workspace_owner
  FROM pg_catalog.pg_class AS relation
  JOIN pg_catalog.pg_roles AS role ON role.oid = relation.relowner
  WHERE relation.oid = 'public.workspaces'::regclass;
  IF v_owner IS DISTINCT FROM v_workspace_owner THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: capability owner differs from workspace owner';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS procedure
    WHERE procedure.oid = 'public.issue_public_booking_checkout_capability(text,text,timestamptz)'::regprocedure
      AND procedure.proowner = (SELECT relowner FROM pg_catalog.pg_class WHERE oid = 'public.workspaces'::regclass)
      AND procedure.prorettype = 'boolean'::regtype
      AND procedure.prosecdef
      AND procedure.proconfig @> ARRAY['search_path=""']::text[]
  ) THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: bridge issuer identity or security contract differs';
  END IF;

  IF (SELECT pg_catalog.count(*) FROM pg_catalog.pg_attribute
      WHERE attrelid = v_table AND attnum > 0 AND NOT attisdropped) <> 7
    OR EXISTS (
      SELECT 1
      FROM (VALUES
        ('id', 'uuid', true, 'gen_random_uuid()'),
        ('workspace_id', 'uuid', false, NULL),
        ('booking_group_id', 'text', true, NULL),
        ('capability_hash', 'text', true, NULL),
        ('expires_at', 'timestamp with time zone', true, NULL),
        ('created_at', 'timestamp with time zone', true, 'now()'),
        ('updated_at', 'timestamp with time zone', true, 'now()')
      ) AS expected(name, data_type, not_null, default_expr)
      LEFT JOIN pg_catalog.pg_attribute AS attribute
        ON attribute.attrelid = v_table
        AND attribute.attname = expected.name
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped
      LEFT JOIN pg_catalog.pg_attrdef AS definition
        ON definition.adrelid = v_table AND definition.adnum = attribute.attnum
      WHERE attribute.attnum IS NULL
        OR pg_catalog.format_type(attribute.atttypid, attribute.atttypmod) <> expected.data_type
        OR attribute.attnotnull IS DISTINCT FROM expected.not_null
        OR NULLIF(pg_catalog.regexp_replace(
          pg_catalog.pg_get_expr(definition.adbin, definition.adrelid), '[()]', '', 'g'
        ), '') IS DISTINCT FROM NULLIF(pg_catalog.regexp_replace(expected.default_expr, '[()]', '', 'g'), '')
    ) THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: canonical capability columns/defaults differ';
  END IF;

  IF (SELECT pg_catalog.count(*) FROM pg_catalog.pg_constraint WHERE conrelid = v_table) <> 5
    OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint
      WHERE conrelid = v_table AND conname = 'public_booking_checkout_capabilities_pkey'
        AND contype = 'p' AND convalidated
        AND pg_catalog.pg_get_constraintdef(oid) = 'PRIMARY KEY (id)'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint
      WHERE conrelid = v_table AND conname = 'public_booking_checkout_capabilities_workspace_id_fkey'
        AND contype = 'f' AND convalidated
        AND confrelid = 'public.workspaces'::regclass
        AND pg_catalog.pg_get_constraintdef(oid) =
          'FOREIGN KEY (workspace_id) REFERENCES workspaces(id)'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint
      WHERE conrelid = v_table AND conname = 'public_booking_checkout_capabilities_group_check'
        AND contype = 'c' AND convalidated
        AND pg_catalog.regexp_replace(pg_catalog.pg_get_constraintdef(oid), '[() ]', '', 'g') =
          'CHECKchar_lengthbtrimbooking_group_id>=8ANDchar_lengthbtrimbooking_group_id<=120'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint
      WHERE conrelid = v_table AND conname = 'public_booking_checkout_capabilities_hash_key'
        AND contype = 'u' AND convalidated
        AND pg_catalog.pg_get_constraintdef(oid) = 'UNIQUE (capability_hash)'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint
      WHERE conrelid = v_table AND conname = 'public_booking_checkout_capabilities_hash_check'
        AND contype = 'c' AND convalidated
        AND pg_catalog.regexp_replace(pg_catalog.pg_get_constraintdef(oid), '[() ]', '', 'g') =
          'CHECKcapability_hash~''^[a-f0-9]{64}$''::text'
    ) THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: canonical capability constraints differ';
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_index AS index
      JOIN pg_catalog.pg_class AS index_relation ON index_relation.oid = index.indexrelid
      WHERE index.indrelid = v_table AND index_relation.relname = 'public_booking_checkout_capabilities_legacy_group_uidx'
        AND index.indisunique AND index.indisvalid AND index.indnkeyatts = 1
        AND pg_catalog.pg_get_indexdef(index.indexrelid, 1, true) = 'booking_group_id'
        AND pg_catalog.pg_get_expr(index.indpred, index.indrelid) = '(workspace_id IS NULL)'
    )
    OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_index AS index
      JOIN pg_catalog.pg_class AS index_relation ON index_relation.oid = index.indexrelid
      WHERE index.indrelid = v_table AND index_relation.relname = 'public_booking_checkout_capabilities_workspace_group_uidx'
        AND index.indisunique AND index.indisvalid AND index.indnkeyatts = 2
        AND pg_catalog.pg_get_indexdef(index.indexrelid, 1, true) = 'workspace_id'
        AND pg_catalog.pg_get_indexdef(index.indexrelid, 2, true) = 'booking_group_id'
        AND pg_catalog.pg_get_expr(index.indpred, index.indrelid) = '(workspace_id IS NOT NULL)'
    ) THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: canonical capability indexes differ';
  END IF;

  IF NOT (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_catalog.pg_class WHERE oid = v_table)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_policy WHERE polrelid = v_table)
    OR EXISTS (
      SELECT 1 FROM pg_catalog.pg_class AS relation
      CROSS JOIN LATERAL pg_catalog.aclexplode(relation.relacl) AS privilege
      WHERE relation.oid = v_table
        AND privilege.grantee IN (
          0,
          (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'anon'),
          (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'authenticated'),
          (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
        )
    ) THEN
    RAISE EXCEPTION 'consultation payment intents preflight failed: capability RLS, policies, or grants differ';
  END IF;
END;
$capability_contract$;

CREATE TABLE public.consultation_payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE NO ACTION,
  booking_group_id text NOT NULL CHECK (char_length(btrim(booking_group_id)) BETWEEN 8 AND 120),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  payment_method text NOT NULL CHECK (payment_method IN ('pix', 'card')),
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[a-f0-9]{64}$'),
  provider_payment_id text UNIQUE CHECK (
    provider_payment_id IS NULL OR char_length(btrim(provider_payment_id)) BETWEEN 1 AND 120
  ),
  status text NOT NULL DEFAULT 'creating' CHECK (
    status IN ('creating', 'pending', 'approved', 'rejected', 'cancelled', 'reconciliation_required')
  ),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE UNIQUE INDEX consultation_payment_intents_legacy_idempotency_uidx
  ON public.consultation_payment_intents (idempotency_key)
  WHERE workspace_id IS NULL;
CREATE UNIQUE INDEX consultation_payment_intents_workspace_idempotency_uidx
  ON public.consultation_payment_intents (workspace_id, idempotency_key)
  WHERE workspace_id IS NOT NULL;
CREATE UNIQUE INDEX consultation_payment_intents_legacy_active_group_uidx
  ON public.consultation_payment_intents (booking_group_id)
  WHERE workspace_id IS NULL AND status IN ('creating', 'pending', 'reconciliation_required');
CREATE UNIQUE INDEX consultation_payment_intents_workspace_active_group_uidx
  ON public.consultation_payment_intents (workspace_id, booking_group_id)
  WHERE workspace_id IS NOT NULL AND status IN ('creating', 'pending', 'reconciliation_required');

ALTER TABLE public.public_booking_checkout_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_payment_intents ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.public_booking_checkout_capabilities,
  public.consultation_payment_intents FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.public_booking_checkout_capabilities,
  public.consultation_payment_intents TO service_role;

COMMENT ON TABLE public.public_booking_checkout_capabilities IS
  'Private, short-lived checkout capability; stores only a SHA-256 hash and derives workspace from bookings.';
COMMENT ON TABLE public.consultation_payment_intents IS
  'Private payment-to-booking-group intent. This candidate does not implement provider confirmation or final states.';

CREATE OR REPLACE FUNCTION public.issue_public_booking_checkout_capability(
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
  v_row_count bigint;
  v_workspace_count bigint;
  v_email_count bigint;
  v_name_count bigint;
  v_plan_count bigint;
  v_method_count bigint;
  v_group_payable boolean;
  v_workspace_id uuid;
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
    (pg_catalog.array_agg(booking.workspace_id))[1]
  INTO v_row_count, v_workspace_count, v_email_count, v_name_count, v_plan_count, v_method_count,
    v_group_payable, v_workspace_id
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_group_id;

  IF v_row_count = 0 OR v_workspace_count <> 1 OR v_email_count <> 1 OR v_name_count <> 1
    OR v_plan_count <> 1 OR v_method_count <> 1
    OR v_group_payable IS DISTINCT FROM true THEN
    RETURN false;
  END IF;

  SELECT capability.* INTO v_existing
  FROM public.public_booking_checkout_capabilities AS capability
  WHERE capability.booking_group_id = v_group_id
    AND capability.workspace_id IS NOT DISTINCT FROM v_workspace_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.capability_hash = p_capability_hash AND v_existing.expires_at > v_now THEN
      RETURN true;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.consultation_payment_intents AS intent
      WHERE intent.booking_group_id = v_group_id
        AND intent.workspace_id IS NOT DISTINCT FROM v_workspace_id
        AND intent.status IN ('creating', 'pending', 'reconciliation_required')
    ) THEN
      RETURN false;
    END IF;

    UPDATE public.public_booking_checkout_capabilities AS capability
    SET capability_hash = p_capability_hash,
        expires_at = p_expires_at,
        updated_at = v_now
    WHERE capability.id = v_existing.id;
    RETURN true;
  END IF;

  INSERT INTO public.public_booking_checkout_capabilities (
    workspace_id, booking_group_id, capability_hash, expires_at
  ) VALUES (
    v_workspace_id, v_group_id, p_capability_hash, p_expires_at
  );
  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
END;
$function$;

CREATE FUNCTION public.create_consultation_payment_intent(
  p_booking_group_id text,
  p_capability_hash text,
  p_idempotency_key text,
  p_expected_amount_cents bigint,
  p_payment_method text
)
RETURNS TABLE (
  intent_id uuid,
  workspace_id uuid,
  booking_group_id text,
  amount_cents bigint,
  currency text,
  payment_method text,
  status text,
  provider_payment_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_group_id text := pg_catalog.btrim(p_booking_group_id);
  v_now timestamptz := pg_catalog.now();
  v_row_count bigint;
  v_workspace_count bigint;
  v_email_count bigint;
  v_plan_count bigint;
  v_method_count bigint;
  v_group_payable boolean;
  v_workspace_id uuid;
  v_capability public.public_booking_checkout_capabilities%ROWTYPE;
  v_existing public.consultation_payment_intents%ROWTYPE;
  v_existing_count bigint;
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
    OR p_idempotency_key IS NULL
    OR p_idempotency_key !~ '^[a-f0-9]{64}$'
    OR p_expected_amount_cents IS NULL
    OR p_expected_amount_cents <= 0
    OR p_payment_method IS NULL
    OR p_payment_method NOT IN ('pix', 'card') THEN
    RETURN;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('consultation-checkout:' || v_group_id, 0)
  );

  -- Idempotent retries return the persisted result before checking capability
  -- expiry or current booking state. A reused key with changed fields fails.
  SELECT pg_catalog.count(*) INTO v_existing_count
  FROM public.consultation_payment_intents AS intent
  WHERE intent.booking_group_id = v_group_id
    AND intent.idempotency_key = p_idempotency_key;

  IF v_existing_count > 1 THEN
    RETURN;
  ELSIF v_existing_count = 1 THEN
    SELECT intent.* INTO v_existing
    FROM public.consultation_payment_intents AS intent
    WHERE intent.booking_group_id = v_group_id
      AND intent.idempotency_key = p_idempotency_key;

    IF v_existing.amount_cents <> p_expected_amount_cents
      OR v_existing.payment_method <> p_payment_method THEN
      RETURN;
    END IF;

    RETURN QUERY
    SELECT v_existing.id, v_existing.workspace_id, v_existing.booking_group_id,
      v_existing.amount_cents, v_existing.currency, v_existing.payment_method,
      v_existing.status, v_existing.provider_payment_id;
    RETURN;
  END IF;

  SELECT capability.* INTO v_capability
  FROM public.public_booking_checkout_capabilities AS capability
  WHERE capability.booking_group_id = v_group_id
    AND capability.capability_hash = p_capability_hash
    AND capability.expires_at > v_now
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT
    pg_catalog.count(*),
    pg_catalog.count(DISTINCT coalesce(booking.workspace_id::text, '__legacy__')),
    pg_catalog.count(DISTINCT pg_catalog.lower(pg_catalog.btrim(booking.client_email))),
    pg_catalog.count(DISTINCT pg_catalog.btrim(booking.plan_name)),
    pg_catalog.count(DISTINCT booking.payment_method),
    pg_catalog.bool_and(
      booking.status = 'pending'
      AND booking.payment_status = 'pending'
      AND booking.payment_method IN ('pix', 'card')
      AND nullif(pg_catalog.btrim(booking.client_email), '') IS NOT NULL
      AND nullif(pg_catalog.btrim(booking.plan_name), '') IS NOT NULL
    ),
    (pg_catalog.array_agg(booking.workspace_id))[1]
  INTO v_row_count, v_workspace_count, v_email_count, v_plan_count, v_method_count,
    v_group_payable, v_workspace_id
  FROM public.bookings AS booking
  WHERE booking.booking_group_id = v_group_id;

  IF v_row_count = 0 OR v_workspace_count <> 1 OR v_email_count <> 1
    OR v_plan_count <> 1 OR v_method_count <> 1
    OR v_group_payable IS DISTINCT FROM true
    OR v_workspace_id IS NOT NULL
    OR v_capability.workspace_id IS DISTINCT FROM v_workspace_id THEN
    RETURN;
  END IF;

  INSERT INTO public.consultation_payment_intents (
    workspace_id, booking_group_id, amount_cents, currency, payment_method,
    idempotency_key, status, created_at, updated_at
  ) VALUES (
    v_workspace_id, v_group_id, p_expected_amount_cents, 'BRL', p_payment_method,
    p_idempotency_key, 'creating', v_now, v_now
  ) RETURNING * INTO v_existing;

  RETURN QUERY
  SELECT v_existing.id, v_existing.workspace_id, v_existing.booking_group_id,
    v_existing.amount_cents, v_existing.currency, v_existing.payment_method,
    v_existing.status, v_existing.provider_payment_id;
EXCEPTION
  WHEN unique_violation THEN
    -- Covers a concurrent/replayed key or another active intent. Only return
    -- the exact matching persisted request; never convert a collision to success.
    SELECT intent.* INTO v_existing
    FROM public.consultation_payment_intents AS intent
    WHERE intent.booking_group_id = v_group_id
      AND intent.idempotency_key = p_idempotency_key
      AND intent.amount_cents = p_expected_amount_cents
      AND intent.payment_method = p_payment_method;
    IF FOUND THEN
      RETURN QUERY
      SELECT v_existing.id, v_existing.workspace_id, v_existing.booking_group_id,
        v_existing.amount_cents, v_existing.currency, v_existing.payment_method,
        v_existing.status, v_existing.provider_payment_id;
    END IF;
    RETURN;
END;
$function$;

REVOKE ALL ON FUNCTION public.issue_public_booking_checkout_capability(text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_public_booking_checkout_capability(text, text, timestamptz)
  TO service_role;
REVOKE ALL ON FUNCTION public.create_consultation_payment_intent(text, text, text, bigint, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_consultation_payment_intent(text, text, text, bigint, text)
  TO service_role;

-- Candidate only: durable, minimal provider observations. No webhook changes.
CREATE TABLE public.consultation_provider_observations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  intent_id uuid NOT NULL REFERENCES public.consultation_payment_intents(id) ON DELETE RESTRICT,
  provider_event_key_hash text NOT NULL CHECK (provider_event_key_hash ~ '^[a-f0-9]{64}$'),
  observation_fingerprint text NOT NULL CHECK (observation_fingerprint ~ '^[a-f0-9]{64}$'),
  provider_payment_id text NOT NULL CHECK (char_length(btrim(provider_payment_id)) BETWEEN 1 AND 120),
  observed_status text NOT NULL CHECK (observed_status IN ('pending','in_process','approved','rejected','cancelled')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL CHECK (currency = 'BRL'),
  payment_method text NOT NULL CHECK (payment_method IN ('pix','card')),
  provider_observed_at timestamptz NOT NULL CHECK (provider_observed_at <= observed_at + interval '5 minutes'),
  disposition text NOT NULL CHECK (disposition IN ('recorded','duplicate','conflict','late_approval_after_terminal_state')),
  observed_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE (provider_event_key_hash, observation_fingerprint)
);

ALTER TABLE public.consultation_provider_observations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.consultation_provider_observations FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.consultation_provider_observations TO service_role;
REVOKE ALL ON SEQUENCE public.consultation_provider_observations_id_seq FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.consultation_provider_observations_id_seq TO service_role;

CREATE FUNCTION public.record_consultation_provider_observation(
  p_intent_id uuid,
  p_provider_event_key_hash text,
  p_provider_payment_id text,
  p_observed_status text,
  p_amount_cents bigint,
  p_currency text,
  p_payment_method text,
  p_provider_observed_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_intent public.consultation_payment_intents%ROWTYPE;
  v_disposition text;
  v_fingerprint text;
  v_existing public.consultation_provider_observations%ROWTYPE;
BEGIN
  IF coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''), ''
  ) IS DISTINCT FROM 'service_role'
    OR p_intent_id IS NULL
    OR p_provider_event_key_hash IS NULL OR p_provider_event_key_hash !~ '^[a-f0-9]{64}$'
    OR p_provider_payment_id IS NULL
    OR pg_catalog.char_length(pg_catalog.btrim(p_provider_payment_id)) NOT BETWEEN 1 AND 120
    OR p_observed_status IS NULL
    OR p_observed_status NOT IN ('pending','in_process','approved','rejected','cancelled')
    OR p_amount_cents IS NULL OR p_amount_cents <= 0
    OR p_currency IS DISTINCT FROM 'BRL'
    OR p_payment_method IS NULL OR p_payment_method NOT IN ('pix','card')
    OR p_provider_observed_at IS NULL
    OR p_provider_observed_at > pg_catalog.now() + interval '5 minutes' THEN
    RAISE EXCEPTION 'invalid or unauthorized provider observation' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('consultation-provider-event:' || p_provider_event_key_hash, 0)
  );

  SELECT intent.* INTO v_intent FROM public.consultation_payment_intents intent
  WHERE intent.id = p_intent_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'intent not found' USING ERRCODE = 'P0002'; END IF;

  v_fingerprint := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
    pg_catalog.jsonb_build_object(
      'intent_id', p_intent_id,
      'provider_payment_id', pg_catalog.btrim(p_provider_payment_id),
      'status', p_observed_status,
      'amount_cents', p_amount_cents,
      'currency', p_currency,
      'payment_method', p_payment_method,
      'provider_observed_at', p_provider_observed_at
    )::text, 'UTF8'), 'sha256'), 'hex');

  v_disposition := CASE
    WHEN EXISTS (SELECT 1 FROM public.consultation_provider_observations observation
      WHERE observation.provider_event_key_hash = p_provider_event_key_hash
        AND observation.observation_fingerprint IS DISTINCT FROM v_fingerprint)
      OR (v_intent.provider_payment_id IS NOT NULL AND v_intent.provider_payment_id IS DISTINCT FROM pg_catalog.btrim(p_provider_payment_id))
      OR v_intent.amount_cents IS DISTINCT FROM p_amount_cents
      OR v_intent.currency IS DISTINCT FROM p_currency
      OR v_intent.payment_method IS DISTINCT FROM p_payment_method
      THEN 'conflict'
    WHEN p_observed_status = 'approved' AND v_intent.status IN ('rejected','cancelled')
      THEN 'late_approval_after_terminal_state'
    WHEN p_observed_status <> 'approved' AND v_intent.status = 'approved'
      THEN 'conflict'
    WHEN p_observed_status <> 'approved' AND v_intent.provider_status = 'approved'
      THEN 'conflict'
    WHEN coalesce(v_intent.provider_status, v_intent.status) IN ('rejected','cancelled')
      AND p_observed_status <> coalesce(v_intent.provider_status, v_intent.status)
      THEN 'conflict'
    WHEN v_intent.provider_status = 'in_process' AND p_observed_status = 'pending'
      THEN 'conflict'
    ELSE 'recorded'
  END;

  INSERT INTO public.consultation_provider_observations (
    intent_id, provider_event_key_hash, observation_fingerprint, provider_payment_id, observed_status,
    amount_cents, currency, payment_method, provider_observed_at, disposition
  ) VALUES (
    p_intent_id, p_provider_event_key_hash, v_fingerprint, pg_catalog.btrim(p_provider_payment_id),
    p_observed_status, p_amount_cents, p_currency, p_payment_method,
    p_provider_observed_at, v_disposition
  ) ON CONFLICT (provider_event_key_hash, observation_fingerprint) DO NOTHING;

  IF NOT FOUND THEN
    SELECT observation.* INTO v_existing FROM public.consultation_provider_observations observation
    WHERE observation.provider_event_key_hash = p_provider_event_key_hash
      AND observation.observation_fingerprint = v_fingerprint;
    IF v_existing.intent_id IS DISTINCT FROM p_intent_id
      OR v_existing.provider_payment_id IS DISTINCT FROM pg_catalog.btrim(p_provider_payment_id)
      OR v_existing.observed_status IS DISTINCT FROM p_observed_status
      OR v_existing.amount_cents IS DISTINCT FROM p_amount_cents
      OR v_existing.currency IS DISTINCT FROM p_currency
      OR v_existing.payment_method IS DISTINCT FROM p_payment_method
      OR v_existing.provider_observed_at IS DISTINCT FROM p_provider_observed_at THEN
      RAISE EXCEPTION 'provider event key reused with different observation' USING ERRCODE = '23505';
    END IF;
    RETURN CASE
      WHEN v_existing.disposition IN ('conflict', 'late_approval_after_terminal_state')
        THEN v_existing.disposition
      ELSE 'duplicate'
    END;
  END IF;

  RETURN v_disposition;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_consultation_provider_observation(uuid,text,text,text,bigint,text,text,timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_consultation_provider_observation(uuid,text,text,text,bigint,text,text,timestamptz)
  TO service_role;
COMMENT ON TABLE public.consultation_provider_observations IS
  'Append-only minimal provider observations; no payload or customer PII. Event key must be a server-side digest.';

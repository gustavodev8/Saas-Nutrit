-- Atomic rate limiting and retry-safe payment webhook claims.

ALTER TABLE public.payment_logs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.payment_logs
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

ALTER TABLE public.payment_logs
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.consume_public_rate_limit(
  p_endpoint TEXT,
  p_fingerprint_hash TEXT,
  p_bucket_start TIMESTAMPTZ,
  p_hit_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  allowed BOOLEAN;
BEGIN
  IF p_endpoint IS NULL OR length(p_endpoint) = 0 OR length(p_endpoint) > 120
     OR p_fingerprint_hash IS NULL OR p_fingerprint_hash !~ '^[a-f0-9]{64}$'
     OR p_bucket_start IS NULL OR p_hit_limit IS NULL OR p_hit_limit < 1 OR p_hit_limit > 100000 THEN
    RAISE EXCEPTION 'invalid rate limit input' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.public_request_rate_limits (
    endpoint, fingerprint_hash, bucket_start, hit_count, updated_at
  )
  VALUES (p_endpoint, p_fingerprint_hash, p_bucket_start, 1, NOW())
  ON CONFLICT (endpoint, fingerprint_hash, bucket_start)
  DO UPDATE SET
    hit_count = public.public_request_rate_limits.hit_count + 1,
    updated_at = NOW()
  RETURNING hit_count <= p_hit_limit INTO allowed;

  RETURN allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_public_rate_limit(TEXT, TEXT, TIMESTAMPTZ, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_rate_limit(TEXT, TEXT, TIMESTAMPTZ, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_payment_webhook(
  p_payment_id TEXT,
  p_stale_after_seconds INTEGER DEFAULT 900
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  claimed BOOLEAN;
  current_status TEXT;
BEGIN
  IF p_payment_id IS NULL OR length(btrim(p_payment_id)) = 0 OR length(p_payment_id) > 120
     OR p_stale_after_seconds IS NULL OR p_stale_after_seconds < 60 OR p_stale_after_seconds > 3600 THEN
    RAISE EXCEPTION 'invalid payment claim input' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.payment_logs (payment_id, status, updated_at)
  VALUES (p_payment_id, 'processing', NOW())
  ON CONFLICT (payment_id)
  DO UPDATE SET
    status = 'processing',
    updated_at = NOW()
  WHERE public.payment_logs.status IS DISTINCT FROM 'approved'
    AND public.payment_logs.updated_at < NOW() - make_interval(secs => p_stale_after_seconds)
  RETURNING TRUE INTO claimed;

  IF claimed THEN RETURN 'claimed'; END IF;

  SELECT status INTO current_status
  FROM public.payment_logs
  WHERE payment_id = p_payment_id;

  IF current_status = 'approved' THEN RETURN 'approved'; END IF;
  RETURN 'processing';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_payment_webhook(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_webhook(TEXT, INTEGER) TO service_role;

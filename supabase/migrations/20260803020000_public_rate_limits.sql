CREATE TABLE IF NOT EXISTS public.public_request_rate_limits (
  id bigserial PRIMARY KEY,
  endpoint text NOT NULL,
  fingerprint_hash text NOT NULL,
  bucket_start timestamptz NOT NULL,
  hit_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_public_request_rate_limits_bucket
  ON public.public_request_rate_limits (endpoint, fingerprint_hash, bucket_start);

CREATE INDEX IF NOT EXISTS idx_public_request_rate_limits_created_at
  ON public.public_request_rate_limits (created_at DESC);

ALTER TABLE public.public_request_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.public_request_rate_limits FROM anon, authenticated;

DROP POLICY IF EXISTS "service_role_manage_public_request_rate_limits" ON public.public_request_rate_limits;

CREATE POLICY "service_role_manage_public_request_rate_limits"
  ON public.public_request_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Isolated candidate: manual-access requests, reviewed through trusted Edge Functions.

CREATE TABLE public.workspace_access_requests (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  applicant_name text NOT NULL CHECK (
    pg_catalog.char_length(pg_catalog.btrim(applicant_name)) BETWEEN 2 AND 120
  ),
  professional_email text NOT NULL CHECK (
    professional_email = pg_catalog.lower(pg_catalog.btrim(professional_email))
    AND pg_catalog.char_length(professional_email) <= 320
    AND professional_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  phone text CHECK (
    phone IS NULL OR (
      pg_catalog.char_length(phone) <= 40
      AND phone ~ '^[0-9+(). -]+$'
      AND pg_catalog.length(pg_catalog.regexp_replace(phone, '[^0-9]', '', 'g')) BETWEEN 8 AND 15
    )
  ),
  crn text CHECK (
    crn IS NULL OR (
      pg_catalog.char_length(crn) <= 40
      AND crn ~ '^[[:alnum:] ./-]+$'
    )
  ),
  need_category text NOT NULL CHECK (
    need_category IN (
      'patient_management',
      'meal_planning',
      'appointments',
      'clinical_records',
      'practice_management'
    )
  ),
  consented_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  CHECK (
    (status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR (status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
  )
);

CREATE UNIQUE INDEX workspace_access_requests_one_pending_email
  ON public.workspace_access_requests (professional_email)
  WHERE status = 'pending';
CREATE INDEX workspace_access_requests_status_created_idx
  ON public.workspace_access_requests (status, created_at DESC);

ALTER TABLE public.workspace_access_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.workspace_access_requests FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.submit_workspace_access_request(
  p_applicant_name text,
  p_professional_email text,
  p_phone text,
  p_crn text,
  p_need_category text,
  p_consent boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_name text := pg_catalog.btrim(coalesce(p_applicant_name, ''));
  v_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_professional_email, '')));
  v_phone text := nullif(pg_catalog.btrim(coalesce(p_phone, '')), '');
  v_crn text := nullif(pg_catalog.btrim(coalesce(p_crn, '')), '');
  v_need_category text := coalesce(p_need_category, '');
BEGIN
  IF pg_catalog.char_length(v_name) NOT BETWEEN 2 AND 120
    OR pg_catalog.char_length(v_email) > 320
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR (v_phone IS NOT NULL AND (
      pg_catalog.char_length(v_phone) > 40
      OR v_phone !~ '^[0-9+(). -]+$'
      OR pg_catalog.length(pg_catalog.regexp_replace(v_phone, '[^0-9]', '', 'g')) NOT BETWEEN 8 AND 15
    ))
    OR (v_crn IS NOT NULL AND (
      pg_catalog.char_length(v_crn) > 40 OR v_crn !~ '^[[:alnum:] ./-]+$'
    ))
    OR v_need_category NOT IN (
      'patient_management',
      'meal_planning',
      'appointments',
      'clinical_records',
      'practice_management'
    )
    OR p_consent IS DISTINCT FROM true THEN
    RETURN false;
  END IF;

  INSERT INTO public.workspace_access_requests (
    applicant_name, professional_email, phone, crn, need_category, consented_at
  )
  VALUES (v_name, v_email, v_phone, v_crn, v_need_category, pg_catalog.now())
  ON CONFLICT (professional_email) WHERE status = 'pending' DO NOTHING;

  -- A duplicate pending request has the same generic success response; no lookup or enumeration is exposed.
  RETURN true;
END;
$function$;

CREATE FUNCTION public.list_workspace_access_requests()
RETURNS TABLE (
  id uuid,
  applicant_name text,
  professional_email text,
  phone text,
  crn text,
  need_category text,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT request.id, request.applicant_name, request.professional_email,
         request.phone, request.crn, request.need_category, request.status,
         request.created_at, request.reviewed_at
  FROM public.workspace_access_requests AS request
  ORDER BY request.created_at DESC, request.id DESC
  LIMIT 100
$function$;

CREATE FUNCTION public.review_workspace_access_request(
  p_request_id uuid,
  p_status text,
  p_reviewed_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF p_request_id IS NULL OR p_reviewed_by IS NULL
    OR p_status IS NULL OR p_status NOT IN ('approved', 'rejected') THEN
    RETURN false;
  END IF;

  UPDATE public.workspace_access_requests
  SET status = p_status,
      reviewed_at = pg_catalog.now(),
      reviewed_by = p_reviewed_by
  WHERE id = p_request_id AND status = 'pending';

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_workspace_access_request(text, text, text, text, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.list_workspace_access_requests()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.review_workspace_access_request(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_workspace_access_request(text, text, text, text, text, boolean)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.list_workspace_access_requests()
  TO service_role;
GRANT EXECUTE ON FUNCTION public.review_workspace_access_request(uuid, text, uuid)
  TO service_role;

COMMENT ON TABLE public.workspace_access_requests IS
  'Manual SaaS access triage only; no clinical records, credentials, or invitation tokens are stored.';

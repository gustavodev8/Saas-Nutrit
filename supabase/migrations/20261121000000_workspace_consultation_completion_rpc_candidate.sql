-- Local candidate only. This RPC completes one scoped booking and creates its
-- consultation record atomically. Legacy unscoped bookings remain unsupported.
DO $workspace_consultation_completion_preflight$
DECLARE
  required_column text;
BEGIN
  IF to_regclass('public.workspaces') IS NULL
     OR to_regclass('public.workspace_members') IS NULL
     OR to_regclass('public.bookings') IS NULL
     OR to_regclass('public.patients') IS NULL
     OR to_regclass('public.consultation_records') IS NULL THEN
    RAISE EXCEPTION 'Workspace consultation completion prerequisites are missing';
  END IF;

  FOREACH required_column IN ARRAY ARRAY[
    'bookings.workspace_id', 'bookings.booking_group_id', 'bookings.patient_id',
    'bookings.status', 'bookings.completed_at', 'bookings.session_number',
    'bookings.client_name', 'bookings.client_email',
    'consultation_records.workspace_id', 'consultation_records.booking_id',
    'consultation_records.booking_group_id', 'consultation_records.session_number',
    'consultation_records.client_name', 'consultation_records.client_email',
    'consultation_records.notes', 'consultation_records.weight',
    'consultation_records.height', 'consultation_records.next_return_date',
    'consultation_records.next_steps'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_attribute AS attribute
      WHERE attribute.attrelid = pg_catalog.to_regclass(
        'public.' || pg_catalog.split_part(required_column, '.', 1)
      )
        AND attribute.attname = pg_catalog.split_part(required_column, '.', 2)
        AND NOT attribute.attisdropped
    ) THEN
      RAISE EXCEPTION 'Workspace consultation completion prerequisite column is missing';
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS index_catalog
    WHERE index_catalog.indexrelid = pg_catalog.to_regclass('public.consultation_records_booking_id_uidx')
      AND index_catalog.indrelid = 'public.consultation_records'::regclass
      AND index_catalog.indisunique
      AND index_catalog.indisvalid
      AND index_catalog.indisready
      AND index_catalog.indnatts = 1
      AND index_catalog.indnkeyatts = 1
      AND index_catalog.indkey[0] = (
        SELECT attribute.attnum::smallint
        FROM pg_catalog.pg_attribute AS attribute
        WHERE attribute.attrelid = 'public.consultation_records'::regclass
          AND attribute.attname = 'booking_id'
          AND NOT attribute.attisdropped
      )
      AND pg_catalog.pg_get_expr(index_catalog.indpred, index_catalog.indrelid)
        = '(booking_id IS NOT NULL)'
  ) THEN
    RAISE EXCEPTION 'Workspace consultation completion requires the reviewed booking uniqueness index';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger AS trigger_catalog
    WHERE trigger_catalog.tgrelid = 'public.consultation_records'::regclass
      AND trigger_catalog.tgname = 'derive_consultation_record_workspace'
      AND NOT trigger_catalog.tgisinternal
      AND trigger_catalog.tgenabled IN ('O', 'A')
      AND trigger_catalog.tgfoid = 'public.derive_consultation_record_workspace()'::regprocedure
      AND (trigger_catalog.tgtype & 1) = 1
      AND (trigger_catalog.tgtype & 2) = 2
      AND (trigger_catalog.tgtype & 4) = 4
  ) THEN
    RAISE EXCEPTION 'Workspace consultation completion requires the enabled scope-derivation trigger';
  END IF;
END
$workspace_consultation_completion_preflight$;

CREATE TABLE private.workspace_consultation_completion_requests (
  request_key uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE RESTRICT,
  booking_id bigint NOT NULL,
  actor_user_id uuid NOT NULL,
  payload_hash bytea NOT NULL CHECK (pg_catalog.octet_length(payload_hash) = 32),
  consultation_record_id bigint NOT NULL UNIQUE
    REFERENCES public.consultation_records(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  CONSTRAINT workspace_consultation_completion_booking_fk
    FOREIGN KEY (workspace_id, booking_id)
    REFERENCES public.bookings(workspace_id, id) ON DELETE RESTRICT,
  CONSTRAINT workspace_consultation_completion_workspace_booking_key
    UNIQUE (workspace_id, booking_id)
);

ALTER TABLE private.workspace_consultation_completion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.workspace_consultation_completion_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE private.workspace_consultation_completion_requests
  FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON TABLE private.workspace_consultation_completion_requests IS
  'Private idempotency ledger for tenant-scoped consultation completion; stores only request identity and payload digest.';

CREATE OR REPLACE FUNCTION public.complete_workspace_consultation(
  p_workspace_id uuid,
  p_booking_id bigint,
  p_booking_group_id text,
  p_request_key uuid,
  p_payload jsonb,
  p_contract_version smallint DEFAULT 1
)
RETURNS TABLE (
  consultation_record_id bigint,
  booking_status text,
  outcome text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_existing_request private.workspace_consultation_completion_requests%ROWTYPE;
  v_record_id bigint;
  v_notes text;
  v_next_steps text;
  v_weight numeric;
  v_height numeric;
  v_next_return_date date;
  v_canonical_payload jsonb;
  v_payload_hash bytea;
  v_updated_rows integer;
  v_key text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR v_actor_user_id IS NULL
     OR p_workspace_id IS NULL OR p_booking_id IS NULL
     OR p_booking_group_id IS NULL OR p_request_key IS NULL
     OR p_contract_version IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Consultation completion request is invalid or unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Consultation completion request is invalid'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_object_keys(p_payload) AS payload_key(key)
    WHERE payload_key.key NOT IN (
      'notes', 'weight', 'height', 'next_return_date', 'next_steps'
    )
  ) THEN
    RAISE EXCEPTION 'Consultation completion request is invalid'
      USING ERRCODE = '22023';
  END IF;

  IF (p_payload ? 'notes'
      AND pg_catalog.jsonb_typeof(p_payload -> 'notes') NOT IN ('string', 'null'))
     OR (p_payload ? 'next_steps'
      AND pg_catalog.jsonb_typeof(p_payload -> 'next_steps') NOT IN ('string', 'null'))
     OR (p_payload ? 'weight'
      AND pg_catalog.jsonb_typeof(p_payload -> 'weight') NOT IN ('number', 'null'))
     OR (p_payload ? 'height'
      AND pg_catalog.jsonb_typeof(p_payload -> 'height') NOT IN ('number', 'null'))
     OR (p_payload ? 'next_return_date'
      AND pg_catalog.jsonb_typeof(p_payload -> 'next_return_date') NOT IN ('string', 'null')) THEN
    RAISE EXCEPTION 'Consultation completion request is invalid'
      USING ERRCODE = '22023';
  END IF;

  IF p_payload ? 'next_return_date'
     AND pg_catalog.jsonb_typeof(p_payload -> 'next_return_date') = 'string'
     AND (p_payload ->> 'next_return_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    RAISE EXCEPTION 'Consultation completion request is invalid'
      USING ERRCODE = '22023';
  END IF;

  BEGIN
    v_notes := NULLIF(pg_catalog.btrim(p_payload ->> 'notes'), '');
    v_next_steps := NULLIF(pg_catalog.btrim(p_payload ->> 'next_steps'), '');
    v_weight := (p_payload ->> 'weight')::numeric;
    v_height := (p_payload ->> 'height')::numeric;
    v_next_return_date := (p_payload ->> 'next_return_date')::date;
  EXCEPTION
    WHEN invalid_text_representation OR invalid_datetime_format
      OR datetime_field_overflow OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'Consultation completion request is invalid'
        USING ERRCODE = '22023';
  END;

  IF v_weight IS NOT NULL AND v_weight <= 0
     OR v_weight IS NOT NULL AND (v_weight > 999.99 OR v_weight <> pg_catalog.round(v_weight, 2))
     OR v_height IS NOT NULL AND (v_height <= 0 OR v_height > 999.99 OR v_height <> pg_catalog.round(v_height, 2)) THEN
    RAISE EXCEPTION 'Consultation completion request is invalid'
      USING ERRCODE = '22023';
  END IF;

  v_weight := CASE WHEN v_weight IS NULL THEN NULL ELSE pg_catalog.round(v_weight, 2) END;
  v_height := CASE WHEN v_height IS NULL THEN NULL ELSE pg_catalog.round(v_height, 2) END;

  PERFORM 1
  FROM public.workspace_members AS member
  WHERE member.workspace_id = p_workspace_id
    AND member.user_id = v_actor_user_id
    AND member.role IN ('owner', 'nutritionist')
    AND member.status = 'active'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation completion request is invalid or unauthorized'
      USING ERRCODE = '42501';
  END IF;

  SELECT booking.*
    INTO v_booking
  FROM public.bookings AS booking
  WHERE booking.id = p_booking_id
    AND booking.workspace_id = p_workspace_id
    AND booking.booking_group_id = p_booking_group_id
  FOR UPDATE OF booking;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation completion request is invalid or unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF v_booking.workspace_id IS NULL
     OR v_booking.booking_group_id IS DISTINCT FROM p_booking_group_id THEN
    RAISE EXCEPTION 'Consultation completion request is invalid or unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF v_booking.patient_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.patients AS patient
    WHERE patient.id = v_booking.patient_id
      AND patient.workspace_id = v_booking.workspace_id
  ) THEN
    RAISE EXCEPTION 'Consultation completion request is invalid or unauthorized'
      USING ERRCODE = '42501';
  END IF;

  v_canonical_payload := pg_catalog.jsonb_build_object(
    'contract_version', p_contract_version,
    'workspace_id', v_booking.workspace_id,
    'booking_id', v_booking.id,
    'booking_group_id', v_booking.booking_group_id,
    'notes', v_notes,
    'weight', v_weight,
    'height', v_height,
    'next_return_date', v_next_return_date,
    'next_steps', v_next_steps
  );
  v_payload_hash := extensions.digest(v_canonical_payload::text, 'sha256');

  SELECT request.*
    INTO v_existing_request
  FROM private.workspace_consultation_completion_requests AS request
  WHERE request.request_key = p_request_key
  FOR UPDATE OF request;

  IF FOUND THEN
    IF v_existing_request.workspace_id IS DISTINCT FROM v_booking.workspace_id
       OR v_existing_request.booking_id IS DISTINCT FROM v_booking.id
       OR v_existing_request.actor_user_id IS DISTINCT FROM v_actor_user_id
       OR v_existing_request.payload_hash IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'Consultation completion request conflicts with an existing operation'
        USING ERRCODE = '23505';
    END IF;

    IF v_booking.status IS DISTINCT FROM 'completed'
       OR v_booking.completed_at IS NULL
       OR NOT EXISTS (
         SELECT 1
         FROM public.consultation_records AS record
         WHERE record.id = v_existing_request.consultation_record_id
           AND record.booking_id = v_booking.id
           AND record.workspace_id = v_booking.workspace_id
       ) THEN
      RAISE EXCEPTION 'Consultation completion requires reconciliation'
        USING ERRCODE = '23514';
    END IF;

    consultation_record_id := v_existing_request.consultation_record_id;
    booking_status := v_booking.status;
    outcome := 'replayed';
    RETURN NEXT;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.consultation_records AS record
    WHERE record.booking_id = v_booking.id
  ) THEN
    RAISE EXCEPTION 'A consultation already exists for this booking'
      USING ERRCODE = '23505';
  END IF;

  IF v_booking.status IS DISTINCT FROM 'confirmed'
     OR v_booking.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Booking is not eligible for consultation completion'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.consultation_records (
    booking_id,
    booking_group_id,
    session_number,
    client_name,
    client_email,
    notes,
    weight,
    height,
    next_return_date,
    next_steps
  ) VALUES (
    v_booking.id,
    v_booking.booking_group_id,
    v_booking.session_number,
    v_booking.client_name,
    v_booking.client_email,
    v_notes,
    v_weight,
    v_height,
    v_next_return_date,
    v_next_steps
  )
  RETURNING id INTO v_record_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.consultation_records AS record
    WHERE record.id = v_record_id
      AND record.booking_id = v_booking.id
      AND record.booking_group_id = v_booking.booking_group_id
      AND record.workspace_id = v_booking.workspace_id
  ) THEN
    RAISE EXCEPTION 'Consultation completion scope could not be verified'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO private.workspace_consultation_completion_requests (
    request_key, workspace_id, booking_id, actor_user_id, payload_hash, consultation_record_id
  ) VALUES (
    p_request_key, v_booking.workspace_id, v_booking.id, v_actor_user_id, v_payload_hash, v_record_id
  );

  UPDATE public.bookings AS booking
  SET status = 'completed',
      completed_at = pg_catalog.clock_timestamp()
  WHERE booking.id = v_booking.id
    AND booking.workspace_id = v_booking.workspace_id
    AND booking.status = 'confirmed'
    AND booking.completed_at IS NULL;
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows <> 1 THEN
    RAISE EXCEPTION 'Booking is not eligible for consultation completion'
      USING ERRCODE = '23514';
  END IF;

  consultation_record_id := v_record_id;
  booking_status := 'completed';
  outcome := 'created';
  RETURN NEXT;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Consultation completion conflicts with an existing operation'
      USING ERRCODE = '23505';
END
$function$;

ALTER FUNCTION public.complete_workspace_consultation(
  uuid, bigint, text, uuid, jsonb, smallint
) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.complete_workspace_consultation(
  uuid, bigint, text, uuid, jsonb, smallint
) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_workspace_consultation(
  uuid, bigint, text, uuid, jsonb, smallint
) TO authenticated;

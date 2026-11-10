-- Candidate only: aggregate, read-only diagnostics for consultation payments.
-- No provider event history is inferred beyond fields persisted in the intent.

CREATE OR REPLACE FUNCTION public.consultation_payment_reconciliation_report()
RETURNS TABLE (
  issue_code text,
  affected_count bigint,
  oldest_age_seconds bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_role text := coalesce(
    nullif(pg_catalog.current_setting('request.jwt.claim.role', true), ''),
    nullif(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
    ''
  );
BEGIN
  IF v_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH diagnostics AS (
    SELECT 'approved_intent_without_confirmed_booking'::text AS code,
      intent.updated_at AS observed_at
    FROM public.consultation_payment_intents AS intent
    WHERE intent.status = 'approved'
      AND (
        NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.booking_group_id = intent.booking_group_id
          AND b.workspace_id IS NOT DISTINCT FROM intent.workspace_id)
        OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.booking_group_id = intent.booking_group_id
          AND b.workspace_id IS NOT DISTINCT FROM intent.workspace_id
          AND (b.status IS DISTINCT FROM 'confirmed' OR b.payment_status IS DISTINCT FROM 'paid'))
      )
    UNION ALL
    SELECT 'confirmed_booking_without_approved_intent', pg_catalog.min(b.created_at)
    FROM public.bookings b
    WHERE b.status = 'confirmed' AND b.payment_status = 'paid'
      AND EXISTS (SELECT 1 FROM public.public_booking_checkout_capabilities c
        WHERE c.booking_group_id = b.booking_group_id
          AND c.workspace_id IS NOT DISTINCT FROM b.workspace_id)
    GROUP BY b.booking_group_id, b.workspace_id
    HAVING NOT EXISTS (SELECT 1 FROM public.consultation_payment_intents i
      WHERE i.booking_group_id = b.booking_group_id
        AND i.workspace_id IS NOT DISTINCT FROM b.workspace_id
        AND i.status = 'approved')
    UNION ALL
    SELECT 'capability_intent_link_inconsistent', c.updated_at
    FROM public.public_booking_checkout_capabilities c
    LEFT JOIN public.consultation_payment_intents i ON i.id = c.payment_intent_id
    WHERE c.payment_intent_id IS NOT NULL
      AND (i.id IS NULL OR i.booking_group_id IS DISTINCT FROM c.booking_group_id
        OR i.workspace_id IS DISTINCT FROM c.workspace_id)
    UNION ALL
    SELECT CASE WHEN i.status = 'creating' THEN 'intent_stuck_creating'
      WHEN i.status = 'pending' THEN 'intent_stuck_pending'
      ELSE 'intent_reconciliation_required' END,
      i.updated_at
    FROM public.consultation_payment_intents i
    WHERE i.status IN ('creating', 'pending', 'reconciliation_required')
      AND i.updated_at < pg_catalog.now() - interval '30 minutes'
    UNION ALL
    SELECT 'booking_snapshot_diverged', i.updated_at
    FROM public.consultation_payment_intents i
    WHERE i.booking_snapshot_hash IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.booking_group_id = i.booking_group_id
        AND b.workspace_id IS NOT DISTINCT FROM i.workspace_id)
      AND i.booking_snapshot_hash IS DISTINCT FROM (
        SELECT pg_catalog.encode(extensions.digest(pg_catalog.convert_to(
          coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
            'id', b.id, 'workspace_id', b.workspace_id,
            'client_name', pg_catalog.lower(pg_catalog.btrim(b.client_name)),
            'client_email', pg_catalog.lower(pg_catalog.btrim(b.client_email)),
            'plan_name', pg_catalog.btrim(b.plan_name), 'payment_method', b.payment_method,
            'appointment_date', b.appointment_date, 'appointment_time', b.appointment_time,
            'type', b.type, 'session_number', b.session_number
          ) ORDER BY b.id)::text, '[]'), 'UTF8'), 'sha256'), 'hex')
        FROM public.bookings b WHERE b.booking_group_id = i.booking_group_id
          AND b.workspace_id IS NOT DISTINCT FROM i.workspace_id)
    UNION ALL
    SELECT 'stale_processing_log_linked_to_intent', l.created_at
    FROM public.payment_logs l
    WHERE l.status = 'processing'
      AND l.created_at < pg_catalog.now() - interval '30 minutes'
      AND l.payment_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.consultation_payment_intents i
        WHERE i.provider_payment_id = l.payment_id)
    UNION ALL
    SELECT 'late_provider_approval_after_terminal_state', observation.observed_at
    FROM public.consultation_provider_observations AS observation
    WHERE observation.disposition = 'late_approval_after_terminal_state'
    UNION ALL
    SELECT 'provider_observation_conflict', observation.observed_at
    FROM public.consultation_provider_observations AS observation
    WHERE observation.disposition = 'conflict'
  )
  SELECT d.code, pg_catalog.count(*)::bigint,
    floor(extract(epoch FROM (pg_catalog.now() - pg_catalog.min(d.observed_at))))::bigint
  FROM diagnostics d
  GROUP BY d.code
  ORDER BY d.code;
END;
$function$;

REVOKE ALL ON FUNCTION public.consultation_payment_reconciliation_report() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consultation_payment_reconciliation_report() TO service_role;
COMMENT ON FUNCTION public.consultation_payment_reconciliation_report() IS
  'Read-only aggregate payment reconciliation diagnostics; returns issue codes, counts and age only.';

-- Additive hardening for workout draft saves and portal training-log retries.
-- Keeps published versions immutable and preserves all existing rows.

BEGIN;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.workout_exercise_logs
    GROUP BY session_log_id, exercise_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate workout exercise logs require review before idempotency hardening';
  END IF;
END;
$preflight$;

ALTER TABLE public.workout_plan_versions
  ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.workout_session_logs
  ADD COLUMN IF NOT EXISTS request_id uuid,
  ADD COLUMN IF NOT EXISTS request_fingerprint text;

CREATE UNIQUE INDEX IF NOT EXISTS workout_session_logs_request_uidx
  ON public.workout_session_logs(auth_user_id, request_id)
  WHERE request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS workout_exercise_logs_session_exercise_uidx
  ON public.workout_exercise_logs(session_log_id, exercise_id);

CREATE OR REPLACE FUNCTION public.prevent_published_workout_version_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_old_locked boolean := false;
  v_new_locked boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'workout_plan_versions' THEN
    IF TG_OP = 'DELETE' AND OLD.status IN ('published', 'archived') THEN
      RAISE EXCEPTION 'published workout versions are immutable';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.status IN ('published', 'archived')
       AND NOT (
         OLD.status = 'published'
         AND NEW.status = 'archived'
         AND (to_jsonb(NEW) - 'status' - 'updated_at') = (to_jsonb(OLD) - 'status' - 'updated_at')
       ) THEN
      RAISE EXCEPTION 'published workout versions are immutable';
    END IF;
  ELSIF TG_TABLE_NAME = 'workout_sessions' THEN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
      SELECT EXISTS (
        SELECT 1 FROM public.workout_plan_versions
        WHERE id = OLD.version_id AND status IN ('published', 'archived')
      ) INTO v_old_locked;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
      SELECT EXISTS (
        SELECT 1 FROM public.workout_plan_versions
        WHERE id = NEW.version_id AND status IN ('published', 'archived')
      ) INTO v_new_locked;
    END IF;
    IF v_old_locked OR v_new_locked THEN
      RAISE EXCEPTION 'published workout versions are immutable';
    END IF;
  ELSIF TG_TABLE_NAME = 'workout_plan_exercises' THEN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.workout_sessions AS session_row
        JOIN public.workout_plan_versions AS version_row ON version_row.id = session_row.version_id
        WHERE session_row.id = OLD.session_id
          AND version_row.status IN ('published', 'archived')
      ) INTO v_old_locked;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.workout_sessions AS session_row
        JOIN public.workout_plan_versions AS version_row ON version_row.id = session_row.version_id
        WHERE session_row.id = NEW.session_id
          AND version_row.status IN ('published', 'archived')
      ) INTO v_new_locked;
    END IF;
    IF v_old_locked OR v_new_locked THEN
      RAISE EXCEPTION 'published workout versions are immutable';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_workout_plan_draft(
  p_version_id bigint,
  p_expected_revision bigint,
  p_title text,
  p_goal text,
  p_frequency text,
  p_valid_from date,
  p_valid_until date,
  p_general_notes text,
  p_sessions jsonb
) RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
DECLARE
  v_workspace_id uuid;
  v_revision bigint;
  v_session jsonb;
  v_exercise jsonb;
  v_session_id bigint;
  v_session_order integer := 0;
  v_exercise_order integer;
BEGIN
  IF nullif(btrim(coalesce(p_title, '')), '') IS NULL THEN
    RAISE EXCEPTION 'workout title is required';
  END IF;
  IF jsonb_typeof(coalesce(p_sessions, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'sessions must be a JSON array';
  END IF;
  IF jsonb_array_length(coalesce(p_sessions, '[]'::jsonb)) > 100 THEN
    RAISE EXCEPTION 'too many workout sessions';
  END IF;

  UPDATE public.workout_plan_versions AS version_row
  SET title = btrim(p_title),
      goal = coalesce(p_goal, ''),
      frequency = coalesce(p_frequency, ''),
      valid_from = p_valid_from,
      valid_until = p_valid_until,
      general_notes = coalesce(p_general_notes, ''),
      revision = version_row.revision + 1,
      updated_at = now()
  WHERE version_row.id = p_version_id
    AND version_row.status = 'draft'
    AND version_row.revision = p_expected_revision
  RETURNING version_row.workspace_id, version_row.revision
  INTO v_workspace_id, v_revision;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'workout draft changed concurrently or is not editable';
  END IF;

  DELETE FROM public.workout_sessions WHERE version_id = p_version_id;

  FOR v_session IN
    SELECT value FROM jsonb_array_elements(coalesce(p_sessions, '[]'::jsonb))
  LOOP
    IF jsonb_typeof(coalesce(v_session->'exercises', '[]'::jsonb)) <> 'array' THEN
      RAISE EXCEPTION 'exercises must be a JSON array';
    END IF;
    IF jsonb_array_length(coalesce(v_session->'exercises', '[]'::jsonb)) > 250 THEN
      RAISE EXCEPTION 'too many exercises in workout session';
    END IF;

    INSERT INTO public.workout_sessions(version_id, title, notes, sort_order)
    VALUES (
      p_version_id,
      coalesce(nullif(btrim(v_session->>'title'), ''), format('Treino %s', v_session_order + 1)),
      coalesce(v_session->>'notes', ''),
      v_session_order
    )
    RETURNING id INTO v_session_id;

    v_exercise_order := 0;
    FOR v_exercise IN
      SELECT value FROM jsonb_array_elements(coalesce(v_session->'exercises', '[]'::jsonb))
    LOOP
      IF nullif(btrim(coalesce(v_exercise->>'name', '')), '') IS NOT NULL THEN
        INSERT INTO public.workout_plan_exercises(
          session_id, name, sets, repetitions, reference_load, rest,
          instructions, demo_url, sort_order
        ) VALUES (
          v_session_id,
          btrim(v_exercise->>'name'),
          coalesce(v_exercise->>'sets', ''),
          coalesce(v_exercise->>'repetitions', ''),
          coalesce(v_exercise->>'reference_load', ''),
          coalesce(v_exercise->>'rest', ''),
          coalesce(v_exercise->>'instructions', ''),
          coalesce(v_exercise->>'demo_url', ''),
          v_exercise_order
        );
      END IF;
      v_exercise_order := v_exercise_order + 1;
    END LOOP;
    v_session_order := v_session_order + 1;
  END LOOP;

  RETURN v_revision;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_workout_plan_draft(bigint,bigint,text,text,text,date,date,text,jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_workout_plan_draft(bigint,bigint,text,text,text,date,date,text,jsonb)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.create_workout_session_log_v2(
  p_workout_session_id bigint,
  p_performed_at timestamptz,
  p_difficulty smallint,
  p_notes text,
  p_exercises jsonb,
  p_request_id uuid
) RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
DECLARE
  v_log_id bigint;
  v_session record;
  v_item jsonb;
  v_fingerprint text;
  v_existing_fingerprint text;
BEGIN
  IF auth.uid() IS NULL OR p_request_id IS NULL THEN
    RAISE EXCEPTION 'authenticated request id required';
  END IF;
  IF jsonb_typeof(coalesce(p_exercises, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'exercises must be a JSON array';
  END IF;
  IF jsonb_array_length(coalesce(p_exercises, '[]'::jsonb)) > 250 THEN
    RAISE EXCEPTION 'too many exercise logs';
  END IF;

  v_fingerprint := md5(concat_ws('|',
    p_workout_session_id::text,
    coalesce(p_performed_at::text, ''),
    coalesce(p_difficulty::text, ''),
    coalesce(p_notes, ''),
    coalesce(p_exercises, '[]'::jsonb)::text
  ));

  SELECT id, request_fingerprint INTO v_log_id, v_existing_fingerprint
  FROM public.workout_session_logs
  WHERE auth_user_id = auth.uid() AND request_id = p_request_id;
  IF FOUND THEN
    IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
      RAISE EXCEPTION 'request id already used with different workout payload';
    END IF;
    RETURN v_log_id;
  END IF;

  SELECT session_row.id AS session_id,
         session_row.workspace_id,
         version_row.id AS version_id,
         version_row.status,
         plan_row.patient_id
  INTO v_session
  FROM public.workout_sessions AS session_row
  JOIN public.workout_plan_versions AS version_row
    ON version_row.id = session_row.version_id
    AND version_row.workspace_id IS NOT DISTINCT FROM session_row.workspace_id
  JOIN public.workout_plans AS plan_row
    ON plan_row.id = version_row.workout_plan_id
    AND plan_row.workspace_id IS NOT DISTINCT FROM version_row.workspace_id
  WHERE session_row.id = p_workout_session_id;

  IF NOT FOUND OR v_session.status <> 'published' THEN
    RAISE EXCEPTION 'published workout session not found';
  END IF;

  INSERT INTO public.workout_session_logs(
    version_id, workout_session_id, patient_id, workspace_id, auth_user_id,
    performed_at, perceived_difficulty, notes, request_id, request_fingerprint
  ) VALUES (
    v_session.version_id, v_session.session_id, v_session.patient_id,
    v_session.workspace_id, auth.uid(), coalesce(p_performed_at, now()),
    p_difficulty, left(coalesce(p_notes, ''), 4000), p_request_id, v_fingerprint
  )
  ON CONFLICT (auth_user_id, request_id) WHERE request_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_log_id;

  IF v_log_id IS NULL THEN
    SELECT id, request_fingerprint INTO v_log_id, v_existing_fingerprint
    FROM public.workout_session_logs
    WHERE auth_user_id = auth.uid() AND request_id = p_request_id;
    IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
      RAISE EXCEPTION 'request id already used with different workout payload';
    END IF;
    RETURN v_log_id;
  END IF;

  FOR v_item IN
    SELECT DISTINCT ON (value->>'exercise_id') value
    FROM jsonb_array_elements(coalesce(p_exercises, '[]'::jsonb))
    ORDER BY value->>'exercise_id'
  LOOP
    INSERT INTO public.workout_exercise_logs(
      session_log_id, exercise_id, exercise_name, load_used, notes
    )
    SELECT v_log_id, exercise_row.id, exercise_row.name,
           left(coalesce(v_item->>'load_used', ''), 200),
           left(coalesce(v_item->>'notes', ''), 2000)
    FROM public.workout_plan_exercises AS exercise_row
    JOIN public.workout_sessions AS session_row
      ON session_row.id = exercise_row.session_id
      AND session_row.workspace_id IS NOT DISTINCT FROM exercise_row.workspace_id
    WHERE exercise_row.id = (v_item->>'exercise_id')::bigint
      AND session_row.id = v_session.session_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'exercise does not belong to workout session';
    END IF;
  END LOOP;

  RETURN v_log_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_workout_session_log_v2(bigint,timestamptz,smallint,text,jsonb,uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_workout_session_log_v2(bigint,timestamptz,smallint,text,jsonb,uuid)
  TO authenticated;

COMMIT;

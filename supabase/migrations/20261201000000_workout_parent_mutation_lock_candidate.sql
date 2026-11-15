-- Serialize workout child mutations with version publication and archival.
-- Local candidate only; preserves existing grants, policies, and records.

CREATE OR REPLACE FUNCTION public.prevent_published_workout_version_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_old_version_id bigint;
  v_new_version_id bigint;
  v_old_session_id bigint;
  v_new_session_id bigint;
  v_old_session_version_id bigint;
  v_new_session_version_id bigint;
  v_parent record;
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
      v_old_version_id := OLD.version_id;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
      v_new_version_id := NEW.version_id;
    END IF;

    -- The same lock serializes child writes with a concurrent version status
    -- update. Sorting both parents gives reparenting one consistent lock order.
    FOR v_parent IN
      SELECT version_row.id, version_row.status
      FROM public.workout_plan_versions AS version_row
      WHERE version_row.id = v_old_version_id OR version_row.id = v_new_version_id
      ORDER BY version_row.id
      FOR UPDATE
    LOOP
      IF v_parent.status IN ('published', 'archived') THEN
        RAISE EXCEPTION 'published workout versions are immutable';
      END IF;
    END LOOP;

  ELSIF TG_TABLE_NAME = 'workout_plan_exercises' THEN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
      v_old_session_id := OLD.session_id;
      SELECT session_row.version_id
        INTO v_old_session_version_id
      FROM public.workout_sessions AS session_row
      WHERE session_row.id = v_old_session_id;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
      v_new_session_id := NEW.session_id;
      SELECT session_row.version_id
        INTO v_new_session_version_id
      FROM public.workout_sessions AS session_row
      WHERE session_row.id = v_new_session_id;
    END IF;

    -- Lock the versions containing OLD and NEW sessions in deterministic order.
    -- The version row lock conflicts with publication/archive UPDATEs.
    FOR v_parent IN
      SELECT version_row.id, version_row.status
      FROM public.workout_plan_versions AS version_row
      WHERE version_row.id = v_old_session_version_id
         OR version_row.id = v_new_session_version_id
      ORDER BY version_row.id
      FOR UPDATE
    LOOP
      IF v_parent.status IN ('published', 'archived') THEN
        RAISE EXCEPTION 'published workout versions are immutable';
      END IF;
    END LOOP;

    -- A session may have been moved while the trigger waited for its version
    -- lock. Fail closed and let the caller retry against the current parent.
    IF v_old_session_id IS NOT NULL THEN
      SELECT session_row.version_id
        INTO v_old_version_id
      FROM public.workout_sessions AS session_row
      WHERE session_row.id = v_old_session_id;
      IF v_old_version_id IS DISTINCT FROM v_old_session_version_id THEN
        RAISE EXCEPTION 'workout session parent changed concurrently; retry mutation';
      END IF;
    END IF;
    IF v_new_session_id IS NOT NULL THEN
      SELECT session_row.version_id
        INTO v_new_version_id
      FROM public.workout_sessions AS session_row
      WHERE session_row.id = v_new_session_id;
      IF v_new_version_id IS DISTINCT FROM v_new_session_version_id THEN
        RAISE EXCEPTION 'workout session parent changed concurrently; retry mutation';
      END IF;
    END IF;

  ELSE
    RAISE EXCEPTION 'unsupported workout immutability table: %', TG_TABLE_NAME;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

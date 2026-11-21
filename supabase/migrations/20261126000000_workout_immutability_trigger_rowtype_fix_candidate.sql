-- Candidate delta: keep the shared immutability trigger safe for each row type.
-- The previous function referenced fields belonging to other trigger tables,
-- which can raise SQLSTATE 42703 when workout_sessions is inserted.

CREATE OR REPLACE FUNCTION public.prevent_published_workout_version_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_parent_id bigint;
BEGIN
  IF TG_TABLE_NAME = 'workout_plan_versions' THEN
    IF OLD.status IN ('published', 'archived') THEN
      IF TG_OP = 'DELETE'
        OR NOT (
          OLD.status = 'published'
          AND NEW.status = 'archived'
          AND (to_jsonb(NEW) - 'status') = (to_jsonb(OLD) - 'status')
        ) THEN
        RAISE EXCEPTION 'published workout versions are immutable';
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'workout_sessions' THEN
    IF TG_OP = 'DELETE' THEN
      v_parent_id := OLD.version_id;
    ELSE
      v_parent_id := NEW.version_id;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.workout_plan_versions AS version_row
      WHERE version_row.id = v_parent_id
        AND version_row.status IN ('published', 'archived')
    ) THEN
      RAISE EXCEPTION 'published workout versions are immutable';
    END IF;

  ELSIF TG_TABLE_NAME = 'workout_plan_exercises' THEN
    IF TG_OP = 'DELETE' THEN
      v_parent_id := OLD.session_id;
    ELSE
      v_parent_id := NEW.session_id;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.workout_sessions AS session_row
      JOIN public.workout_plan_versions AS version_row
        ON version_row.id = session_row.version_id
      WHERE session_row.id = v_parent_id
        AND version_row.status IN ('published', 'archived')
    ) THEN
      RAISE EXCEPTION 'published workout versions are immutable';
    END IF;

  ELSE
    RAISE EXCEPTION 'unsupported workout immutability table: %', TG_TABLE_NAME;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

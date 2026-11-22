-- LOCAL CANDIDATE ONLY. Do not apply remotely without independent review.
--
-- Scope: meal_plans -> meals -> meal_foods and their patient audit rows.
-- Legacy rows remain workspace_id NULL and retain admin/patient-portal reads.
-- No backfill is performed. Existing workspace parents with unscoped children
-- are a hard stop so this candidate cannot silently hide or rewrite data.

DO $workspace_meal_plans_preflight$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'workspaces', 'workspace_members', 'patients', 'meal_plans', 'meals',
    'meal_foods', 'measurements', 'patient_audit_logs'
  ] LOOP
    IF to_regclass('public.' || relation_name) IS NULL THEN
      RAISE EXCEPTION 'workspace meal-plan prerequisite is missing: %', relation_name;
    END IF;
  END LOOP;

  IF to_regprocedure('public.is_admin_email()') IS NULL
     OR to_regprocedure('public.current_patient_id()') IS NULL
     OR to_regprocedure('public.current_patient_owns_plan(bigint)') IS NULL
     OR to_regprocedure('public.current_patient_owns_meal(bigint)') IS NULL THEN
    RAISE EXCEPTION 'reviewed admin or patient-portal authorization helpers are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.meal_plans'::regclass
      AND attname = 'workspace_id' AND NOT attisdropped
      AND atttypid = 'uuid'::regtype AND NOT attnotnull
  ) THEN
    RAISE EXCEPTION 'meal_plans.workspace_id must already be a nullable UUID';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.meal_plans'::regclass AND relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.meals'::regclass AND relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.meal_foods'::regclass AND relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.patient_audit_logs'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on all meal-plan and audit tables';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.measurements'::regclass
      AND attname = 'workspace_id' AND NOT attisdropped
      AND atttypid = 'uuid'::regtype
  ) THEN
    RAISE EXCEPTION 'measurements.workspace_id is required to validate plan lineage';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.patient_audit_logs'::regclass
      AND attname = 'workspace_id' AND NOT attisdropped
      AND (atttypid <> 'uuid'::regtype OR attnotnull)
  ) THEN
    RAISE EXCEPTION 'patient_audit_logs.workspace_id has an incompatible definition';
  END IF;

  IF (
    SELECT count(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patient_audit_logs'
      AND column_name IN ('patient_id', 'patient_name', 'section_key', 'section_label', 'action', 'entity_type', 'entity_id', 'summary', 'actor_email', 'changed_fields', 'metadata', 'created_at')
  ) <> 12 THEN
    RAISE EXCEPTION 'patient_audit_logs schema is missing a reviewed column';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.meals'::regclass
      AND attname = 'workspace_id' AND NOT attisdropped
      AND (atttypid <> 'uuid'::regtype OR attnotnull)
  ) OR EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.meal_foods'::regclass
      AND attname = 'workspace_id' AND NOT attisdropped
      AND (atttypid <> 'uuid'::regtype OR attnotnull)
  ) THEN
    RAISE EXCEPTION 'existing child workspace_id has an incompatible definition';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.meals'::regclass
      AND attname = 'alternative_meals' AND NOT attisdropped
      AND atttypid = 'jsonb'::regtype
  ) THEN
    RAISE EXCEPTION 'meals.alternative_meals JSONB is required by the reviewed remote schema';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.meals'::regclass
      AND attname = 'substitution_items' AND NOT attisdropped
      AND atttypid = 'jsonb'::regtype
  ) THEN
    RAISE EXCEPTION 'meals.substitution_items JSONB is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index AS index_record
    WHERE index_record.indrelid = 'public.patients'::regclass
      AND index_record.indisunique AND index_record.indisvalid
      AND (SELECT array_agg(attribute.attname::text ORDER BY key_position.ordinality)
           FROM unnest(index_record.indkey) WITH ORDINALITY AS key_position(attnum, ordinality)
           JOIN pg_attribute AS attribute
             ON attribute.attrelid = index_record.indrelid
            AND attribute.attnum = key_position.attnum
            AND NOT attribute.attisdropped) = ARRAY['workspace_id', 'id']::text[]
  ) THEN
    RAISE EXCEPTION 'patients(workspace_id,id) unique key is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policy AS policy
    JOIN pg_class AS relation ON relation.oid = policy.polrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid)
    WHERE namespace.nspname = 'public'
      AND relation.relname IN ('meal_plans', 'meals', 'meal_foods', 'patient_audit_logs')
      AND policy.polpermissive
      AND policy.polname NOT IN (
        'admin_all_meal_plans', 'admin_all_meals', 'admin_all_meal_foods',
        'patient_self_read_meal_plans', 'patient_self_read_meals',
        'patient_self_read_meal_foods',
        'workspace_meal_plans_select_active_member',
        'workspace_meal_plans_insert_active_member',
        'workspace_meal_plans_update_active_member',
        'workspace_meal_plans_delete_active_member',
        'workspace_meals_select_active_member',
        'workspace_meals_insert_active_member',
        'workspace_meals_update_active_member',
        'workspace_meals_delete_active_member',
        'workspace_meal_foods_select_active_member',
        'workspace_meal_foods_insert_active_member',
        'workspace_meal_foods_update_active_member',
        'workspace_meal_foods_delete_active_member',
        'authenticated_all_patient_audit_logs',
        'admin_all_patient_audit_logs',
        'workspace_patient_audit_logs_select_active_member'
      )
      AND (
        policy_role.role_oid = 0
        OR policy_role.role_oid IN ('anon'::regrole, 'authenticated'::regrole)
        OR pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')
        OR pg_has_role('anon'::regrole, policy_role.role_oid, 'MEMBER')
      )
  ) THEN
    RAISE EXCEPTION 'unknown permissive client policy exists on meal-plan tables';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['meal_plans','meals','meal_foods','patient_audit_logs']::text[]) AS table_item(table_name)
    CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']::text[]) AS privilege_item(privilege_name)
    WHERE has_table_privilege('anon', 'public.' || table_item.table_name, privilege_item.privilege_name)
  ) THEN
    RAISE EXCEPTION 'anon has an effective privilege on a meal-plan table';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['meal_plans_id_seq','meals_id_seq','meal_foods_id_seq','patient_audit_logs_id_seq']::text[]) AS sequence_item(sequence_name)
    CROSS JOIN unnest(ARRAY['USAGE','SELECT','UPDATE']::text[]) AS privilege_item(privilege_name)
    WHERE has_sequence_privilege('anon', 'public.' || sequence_item.sequence_name, privilege_item.privilege_name)
  ) THEN
    RAISE EXCEPTION 'anon has an effective privilege on a meal-plan sequence';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['meal_plans','meals','meal_foods','patient_audit_logs']::text[]) AS table_item(table_name)
    CROSS JOIN unnest(ARRAY['TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']::text[]) AS privilege_item(privilege_name)
    WHERE has_table_privilege('authenticated', 'public.' || table_item.table_name, privilege_item.privilege_name)
  ) THEN
    RAISE EXCEPTION 'authenticated has an effective elevated privilege on a meal-plan table';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['meal_plans_id_seq','meals_id_seq','meal_foods_id_seq','patient_audit_logs_id_seq']::text[]) AS sequence_item(sequence_name)
    CROSS JOIN unnest(ARRAY['SELECT','UPDATE']::text[]) AS privilege_item(privilege_name)
    WHERE has_sequence_privilege('authenticated', 'public.' || sequence_item.sequence_name, privilege_item.privilege_name)
  ) THEN
    RAISE EXCEPTION 'authenticated has an effective elevated privilege on a meal-plan sequence';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.meal_plans AS plan
    JOIN public.patients AS patient ON patient.id = plan.patient_id
    WHERE plan.workspace_id IS DISTINCT FROM patient.workspace_id
  ) THEN
    RAISE EXCEPTION 'existing meal plans and patients have inconsistent workspace scope';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.meal_plans'::regclass
      AND attname = 'measurement_id'
      AND atttypid = 'bigint'::regtype
      AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.measurements'::regclass
      AND attname = 'workspace_id'
      AND atttypid = 'uuid'::regtype
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'workspace measurement lineage prerequisites are missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.meal_plans AS plan
    WHERE plan.measurement_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.measurements AS measurement
        WHERE measurement.id = plan.measurement_id
          AND measurement.workspace_id IS NOT DISTINCT FROM plan.workspace_id
          AND measurement.patient_id = plan.patient_id
      )
  ) THEN
    RAISE EXCEPTION 'existing meal plan measurement reference has invalid workspace or patient';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.meals'::regclass
      AND attname = 'workspace_id'
      AND NOT attisdropped
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM public.meals AS meal
      JOIN public.meal_plans AS plan ON plan.id = meal.plan_id
      WHERE meal.workspace_id IS DISTINCT FROM plan.workspace_id
    ) THEN
      RAISE EXCEPTION 'existing meals and meal plans have inconsistent workspace scope';
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1
      FROM public.meals AS meal
      JOIN public.meal_plans AS plan ON plan.id = meal.plan_id
      WHERE plan.workspace_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'cannot add meals.workspace_id: workspace-scoped plans already have legacy meals';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.meal_foods'::regclass
      AND attname = 'workspace_id'
      AND NOT attisdropped
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.meals'::regclass
        AND attname = 'workspace_id'
        AND NOT attisdropped
    ) THEN
      RAISE EXCEPTION 'meal_foods.workspace_id exists but meals.workspace_id is missing';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.meal_foods AS food
      JOIN public.meals AS meal ON meal.id = food.meal_id
      WHERE food.workspace_id IS DISTINCT FROM meal.workspace_id
    ) THEN
      RAISE EXCEPTION 'existing meal foods and meals have inconsistent workspace scope';
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.meals'::regclass
        AND attname = 'workspace_id'
        AND NOT attisdropped
    ) THEN
      IF EXISTS (
        SELECT 1
        FROM public.meal_foods AS food
        JOIN public.meals AS meal ON meal.id = food.meal_id
        WHERE meal.workspace_id IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'cannot add meal_foods.workspace_id: workspace-scoped meals already have legacy foods';
      END IF;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.meals AS meal
    JOIN public.meal_plans AS plan ON plan.id = meal.plan_id
    WHERE plan.workspace_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE attrelid = 'public.meals'::regclass
          AND attname = 'workspace_id'
          AND NOT attisdropped
      )
  ) THEN
    RAISE EXCEPTION 'workspace-scoped plan has a meal before meals.workspace_id exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.patient_audit_logs AS audit
    JOIN public.patients AS patient ON patient.id = audit.patient_id
    WHERE patient.workspace_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'existing audit rows linked to workspace patients would lose workspace scope';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.patient_audit_logs AS audit
    WHERE EXISTS (
          SELECT 1
          FROM public.meal_plans AS plan
          WHERE audit.entity_type = 'meal_plan'
            AND audit.entity_id = plan.id
            AND plan.workspace_id IS NOT NULL
        )
        OR EXISTS (
          SELECT 1
          FROM public.meals AS meal
          JOIN public.meal_plans AS plan ON plan.id = meal.plan_id
          WHERE audit.entity_type = 'meal'
            AND audit.entity_id = meal.id
            AND plan.workspace_id IS NOT NULL
        )
        OR EXISTS (
          SELECT 1
          FROM public.meal_foods AS food
          JOIN public.meals AS meal ON meal.id = food.meal_id
          JOIN public.meal_plans AS plan ON plan.id = meal.plan_id
          WHERE audit.entity_type IN ('meal_food', 'meal_foods')
            AND audit.entity_id = food.id
            AND plan.workspace_id IS NOT NULL
        )
  ) THEN
    RAISE EXCEPTION 'existing audit rows linked to workspace meal entities would lose workspace scope';
  END IF;

END
$workspace_meal_plans_preflight$;

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

DO $workspace_meal_plans_constraint_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('public.meal_plans'::regclass, 'meal_plans_workspace_id_fkey', 'public.workspaces'::regclass, ARRAY['workspace_id']::text[], ARRAY['id']::text[], NULL::text[], 's', 'a', 'a', false, false, false),
        ('public.meal_plans'::regclass, 'meal_plans_workspace_patient_fkey', 'public.patients'::regclass, ARRAY['workspace_id','patient_id']::text[], ARRAY['workspace_id','id']::text[], NULL::text[], 's', 'a', 'a', false, false, false),
        ('public.meals'::regclass, 'meals_workspace_id_fkey', 'public.workspaces'::regclass, ARRAY['workspace_id']::text[], ARRAY['id']::text[], NULL::text[], 's', 'a', 'a', false, false, false),
        ('public.meals'::regclass, 'meals_workspace_plan_fkey', 'public.meal_plans'::regclass, ARRAY['workspace_id','plan_id']::text[], ARRAY['workspace_id','id']::text[], NULL::text[], 's', 'a', 'a', false, false, false),
        ('public.meal_foods'::regclass, 'meal_foods_workspace_id_fkey', 'public.workspaces'::regclass, ARRAY['workspace_id']::text[], ARRAY['id']::text[], NULL::text[], 's', 'a', 'a', false, false, false),
        ('public.meal_foods'::regclass, 'meal_foods_workspace_meal_fkey', 'public.meals'::regclass, ARRAY['workspace_id','meal_id']::text[], ARRAY['workspace_id','id']::text[], NULL::text[], 's', 'a', 'a', false, false, false),
        ('public.patient_audit_logs'::regclass, 'patient_audit_logs_workspace_patient_fkey', 'public.patients'::regclass, ARRAY['workspace_id','patient_id']::text[], ARRAY['workspace_id','id']::text[], ARRAY['patient_id']::text[], 's', 'a', 'n', false, false, false)
    ) AS expected(relid, constraint_name, referenced_relid, local_columns, referenced_columns, delete_set_columns, match_type, update_type, delete_type, is_deferrable, is_deferred, is_valid)
    JOIN pg_constraint constraint_record
      ON constraint_record.conrelid = expected.relid
     AND constraint_record.conname = expected.constraint_name
    WHERE constraint_record.contype <> 'f'
       OR constraint_record.confrelid <> expected.referenced_relid
       OR constraint_record.confmatchtype <> expected.match_type
       OR constraint_record.confupdtype <> expected.update_type
       OR constraint_record.confdeltype <> expected.delete_type
       OR (SELECT array_agg(attribute.attname::text ORDER BY key_position.ordinality)
           FROM unnest(constraint_record.confdelsetcols) WITH ORDINALITY AS key_position(attnum, ordinality)
           JOIN pg_attribute AS attribute
             ON attribute.attrelid = constraint_record.conrelid
            AND attribute.attnum = key_position.attnum
            AND NOT attribute.attisdropped) IS DISTINCT FROM expected.delete_set_columns
       OR constraint_record.condeferrable <> expected.is_deferrable
       OR constraint_record.condeferred <> expected.is_deferred
       OR constraint_record.convalidated <> expected.is_valid
       OR (SELECT array_agg(attribute.attname::text ORDER BY key_position.ordinality)
           FROM unnest(constraint_record.conkey) WITH ORDINALITY AS key_position(attnum, ordinality)
           JOIN pg_attribute AS attribute
             ON attribute.attrelid = constraint_record.conrelid
            AND attribute.attnum = key_position.attnum
            AND NOT attribute.attisdropped) IS DISTINCT FROM expected.local_columns
       OR (SELECT array_agg(attribute.attname::text ORDER BY key_position.ordinality)
           FROM unnest(constraint_record.confkey) WITH ORDINALITY AS key_position(attnum, ordinality)
           JOIN pg_attribute AS attribute
             ON attribute.attrelid = constraint_record.confrelid
            AND attribute.attnum = key_position.attnum
            AND NOT attribute.attisdropped) IS DISTINCT FROM expected.referenced_columns
  ) THEN
    RAISE EXCEPTION 'existing meal-plan workspace constraint has an unexpected complete definition';
  END IF;
END
$workspace_meal_plans_constraint_preflight$;

ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

ALTER TABLE public.meal_foods
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

ALTER TABLE public.patient_audit_logs
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

COMMENT ON COLUMN public.patient_audit_logs.workspace_id IS
  'Nullable workspace scope for new audit rows; legacy NULL rows remain historical.';

DO $workspace_meal_plans_audit_integrity$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.patient_audit_logs AS audit
    JOIN public.patients AS patient ON patient.id = audit.patient_id
    WHERE audit.workspace_id IS DISTINCT FROM patient.workspace_id
  ) THEN
    RAISE EXCEPTION 'existing audit rows do not match patient workspace; legacy NULL rows linked to workspace patients are ambiguous';
  END IF;
END
$workspace_meal_plans_audit_integrity$;

DO $workspace_meal_plans_child_constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index
    WHERE indrelid = 'public.meal_plans'::regclass
      AND indisunique
      AND (SELECT array_agg(a.attname::text ORDER BY k.ordinality)
           FROM unnest(indkey) WITH ORDINALITY AS k(attnum, ordinality)
           JOIN pg_attribute a ON a.attrelid = indrelid AND a.attnum = k.attnum
           WHERE NOT a.attisdropped) = ARRAY['workspace_id', 'id']::text[]
  ) THEN
    CREATE UNIQUE INDEX meal_plans_workspace_id_key
      ON public.meal_plans (workspace_id, id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index
    WHERE indrelid = 'public.meals'::regclass
      AND indisunique
      AND (SELECT array_agg(a.attname::text ORDER BY k.ordinality)
           FROM unnest(indkey) WITH ORDINALITY AS k(attnum, ordinality)
           JOIN pg_attribute a ON a.attrelid = indrelid AND a.attnum = k.attnum
           WHERE NOT a.attisdropped) = ARRAY['workspace_id', 'id']::text[]
  ) THEN
    CREATE UNIQUE INDEX meals_workspace_id_key
      ON public.meals (workspace_id, id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.meals'::regclass
      AND conname = 'meals_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.meals
      ADD CONSTRAINT meals_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
      ON DELETE NO ACTION NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.meals'::regclass
      AND conname = 'meals_workspace_plan_fkey'
  ) THEN
    ALTER TABLE public.meals
      ADD CONSTRAINT meals_workspace_plan_fkey
      FOREIGN KEY (workspace_id, plan_id)
      REFERENCES public.meal_plans(workspace_id, id)
      MATCH SIMPLE ON DELETE NO ACTION NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.meal_foods'::regclass
      AND conname = 'meal_foods_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.meal_foods
      ADD CONSTRAINT meal_foods_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
      ON DELETE NO ACTION NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.meal_foods'::regclass
      AND conname = 'meal_foods_workspace_meal_fkey'
  ) THEN
    ALTER TABLE public.meal_foods
      ADD CONSTRAINT meal_foods_workspace_meal_fkey
      FOREIGN KEY (workspace_id, meal_id)
      REFERENCES public.meals(workspace_id, id)
      MATCH SIMPLE ON DELETE NO ACTION NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.patient_audit_logs'::regclass
      AND conname = 'patient_audit_logs_workspace_patient_fkey'
  ) THEN
    ALTER TABLE public.patient_audit_logs
      ADD CONSTRAINT patient_audit_logs_workspace_patient_fkey
      FOREIGN KEY (workspace_id, patient_id)
      REFERENCES public.patients (workspace_id, id)
      MATCH SIMPLE ON DELETE SET NULL (patient_id) NOT VALID;
  END IF;
END
$workspace_meal_plans_child_constraints$;

CREATE INDEX IF NOT EXISTS meals_workspace_plan_idx
  ON public.meals (workspace_id, plan_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS meal_foods_workspace_meal_idx
  ON public.meal_foods (workspace_id, meal_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS patient_audit_logs_workspace_patient_idx
  ON public.patient_audit_logs (workspace_id, patient_id)
  WHERE workspace_id IS NOT NULL;

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.meal_plans, public.meals, public.meal_foods, public.patient_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_plans, public.meals, public.meal_foods, public.patient_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_plans, public.meals, public.meal_foods, public.patient_audit_logs TO service_role;

REVOKE ALL PRIVILEGES ON SEQUENCE public.meal_plans_id_seq, public.meals_id_seq, public.meal_foods_id_seq, public.patient_audit_logs_id_seq FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SEQUENCE public.meal_plans_id_seq, public.meals_id_seq, public.meal_foods_id_seq, public.patient_audit_logs_id_seq TO authenticated, service_role;

DROP POLICY IF EXISTS auth_all_meal_plans ON public.meal_plans;
DROP POLICY IF EXISTS authenticated_all_meal_plans ON public.meal_plans;
DROP POLICY IF EXISTS admin_all_meal_plans ON public.meal_plans;
DROP POLICY IF EXISTS patient_self_read_meal_plans ON public.meal_plans;
DROP POLICY IF EXISTS auth_all_meals ON public.meals;
DROP POLICY IF EXISTS authenticated_all_meals ON public.meals;
DROP POLICY IF EXISTS admin_all_meals ON public.meals;
DROP POLICY IF EXISTS patient_self_read_meals ON public.meals;
DROP POLICY IF EXISTS auth_all_meal_foods ON public.meal_foods;
DROP POLICY IF EXISTS authenticated_all_meal_foods ON public.meal_foods;
DROP POLICY IF EXISTS admin_all_meal_foods ON public.meal_foods;
DROP POLICY IF EXISTS patient_self_read_meal_foods ON public.meal_foods;
DROP POLICY IF EXISTS authenticated_all_patient_audit_logs ON public.patient_audit_logs;
DROP POLICY IF EXISTS admin_all_patient_audit_logs ON public.patient_audit_logs;
DROP POLICY IF EXISTS workspace_patient_audit_logs_select_active_member ON public.patient_audit_logs;

DROP POLICY IF EXISTS workspace_meal_plans_select_active_member ON public.meal_plans;
DROP POLICY IF EXISTS workspace_meal_plans_insert_active_member ON public.meal_plans;
DROP POLICY IF EXISTS workspace_meal_plans_update_active_member ON public.meal_plans;
DROP POLICY IF EXISTS workspace_meal_plans_delete_active_member ON public.meal_plans;
DROP POLICY IF EXISTS workspace_meals_select_active_member ON public.meals;
DROP POLICY IF EXISTS workspace_meals_insert_active_member ON public.meals;
DROP POLICY IF EXISTS workspace_meals_update_active_member ON public.meals;
DROP POLICY IF EXISTS workspace_meals_delete_active_member ON public.meals;
DROP POLICY IF EXISTS workspace_meal_foods_select_active_member ON public.meal_foods;
DROP POLICY IF EXISTS workspace_meal_foods_insert_active_member ON public.meal_foods;
DROP POLICY IF EXISTS workspace_meal_foods_update_active_member ON public.meal_foods;
DROP POLICY IF EXISTS workspace_meal_foods_delete_active_member ON public.meal_foods;

CREATE POLICY admin_all_meal_plans ON public.meal_plans
  FOR ALL TO authenticated
  USING (
    public.is_admin_email() AND workspace_id IS NULL
    AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = meal_plans.patient_id AND p.workspace_id IS NULL)
  )
  WITH CHECK (
    public.is_admin_email() AND workspace_id IS NULL
    AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = meal_plans.patient_id AND p.workspace_id IS NULL)
  );

CREATE POLICY patient_self_read_meal_plans ON public.meal_plans
  FOR SELECT TO authenticated
  USING (workspace_id IS NULL AND patient_id = public.current_patient_id());

CREATE POLICY workspace_meal_plans_select_active_member ON public.meal_plans
  FOR SELECT TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members member
      WHERE member.workspace_id = meal_plans.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (SELECT count(*) FROM public.workspace_members active_member
             WHERE active_member.user_id = (SELECT auth.uid()) AND active_member.status = 'active') = 1
    )
    AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = meal_plans.patient_id AND p.workspace_id = meal_plans.workspace_id)
  );

CREATE POLICY admin_all_meals ON public.meals
  FOR ALL TO authenticated
  USING (public.is_admin_email() AND workspace_id IS NULL AND EXISTS (SELECT 1 FROM public.meal_plans plan JOIN public.patients patient ON patient.id = plan.patient_id WHERE plan.id = meals.plan_id AND plan.workspace_id IS NULL AND patient.workspace_id IS NULL))
  WITH CHECK (public.is_admin_email() AND workspace_id IS NULL AND EXISTS (SELECT 1 FROM public.meal_plans plan JOIN public.patients patient ON patient.id = plan.patient_id WHERE plan.id = meals.plan_id AND plan.workspace_id IS NULL AND patient.workspace_id IS NULL));

CREATE POLICY patient_self_read_meals ON public.meals
  FOR SELECT TO authenticated
  USING (workspace_id IS NULL AND public.current_patient_owns_plan(plan_id));

CREATE POLICY workspace_meals_select_active_member ON public.meals
  FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.workspace_members member WHERE member.workspace_id = meals.workspace_id AND member.user_id = (SELECT auth.uid()) AND member.role IN ('owner', 'nutritionist') AND member.status = 'active' AND (SELECT count(*) FROM public.workspace_members active_member WHERE active_member.user_id = (SELECT auth.uid()) AND active_member.status = 'active') = 1) AND EXISTS (SELECT 1 FROM public.meal_plans plan WHERE plan.id = meals.plan_id AND plan.workspace_id = meals.workspace_id));

CREATE POLICY admin_all_meal_foods ON public.meal_foods
  FOR ALL TO authenticated
  USING (public.is_admin_email() AND workspace_id IS NULL AND EXISTS (SELECT 1 FROM public.meals meal JOIN public.meal_plans plan ON plan.id = meal.plan_id JOIN public.patients patient ON patient.id = plan.patient_id WHERE meal.id = meal_foods.meal_id AND meal.workspace_id IS NULL AND plan.workspace_id IS NULL AND patient.workspace_id IS NULL))
  WITH CHECK (public.is_admin_email() AND workspace_id IS NULL AND EXISTS (SELECT 1 FROM public.meals meal JOIN public.meal_plans plan ON plan.id = meal.plan_id JOIN public.patients patient ON patient.id = plan.patient_id WHERE meal.id = meal_foods.meal_id AND meal.workspace_id IS NULL AND plan.workspace_id IS NULL AND patient.workspace_id IS NULL));

CREATE POLICY patient_self_read_meal_foods ON public.meal_foods
  FOR SELECT TO authenticated
  USING (workspace_id IS NULL AND public.current_patient_owns_meal(meal_id));

CREATE POLICY workspace_meal_foods_select_active_member ON public.meal_foods
  FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.workspace_members member WHERE member.workspace_id = meal_foods.workspace_id AND member.user_id = (SELECT auth.uid()) AND member.role IN ('owner', 'nutritionist') AND member.status = 'active' AND (SELECT count(*) FROM public.workspace_members active_member WHERE active_member.user_id = (SELECT auth.uid()) AND active_member.status = 'active') = 1) AND EXISTS (SELECT 1 FROM public.meals meal WHERE meal.id = meal_foods.meal_id AND meal.workspace_id = meal_foods.workspace_id));

CREATE POLICY admin_all_patient_audit_logs ON public.patient_audit_logs
  FOR ALL TO authenticated
  USING (
    public.is_admin_email()
    AND workspace_id IS NULL
    AND (
      patient_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.patients patient
        WHERE patient.id = patient_audit_logs.patient_id
          AND patient.workspace_id IS NULL
      )
    )
  )
  WITH CHECK (
    public.is_admin_email()
    AND workspace_id IS NULL
    AND (
      patient_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.patients patient
        WHERE patient.id = patient_audit_logs.patient_id
          AND patient.workspace_id IS NULL
      )
    )
  );

CREATE POLICY workspace_patient_audit_logs_select_active_member ON public.patient_audit_logs
  FOR SELECT TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members member
      WHERE member.workspace_id = patient_audit_logs.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (SELECT count(*) FROM public.workspace_members active_member
             WHERE active_member.user_id = (SELECT auth.uid()) AND active_member.status = 'active') = 1
    )
    AND (
      patient_audit_logs.patient_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.patients patient
        WHERE patient.id = patient_audit_logs.patient_id
          AND patient.workspace_id = patient_audit_logs.workspace_id
      )
    )
  );

-- The function is the only atomic application write contract for the full editor.
-- It validates the session itself, locks the parent, replaces children and emits
-- the audit row in one PostgreSQL transaction. A raised exception rolls back all.
DO $workspace_meal_plan_rpc_preflight$
BEGIN
  IF to_regprocedure('public.save_workspace_meal_plan(uuid,bigint,bigint,jsonb,jsonb,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'save_workspace_meal_plan already exists; candidate must be reviewed instead of replacing it';
  END IF;
END
$workspace_meal_plan_rpc_preflight$;

CREATE FUNCTION public.save_workspace_meal_plan(
  p_workspace_id uuid,
  p_patient_id bigint,
  p_plan_id bigint,
  p_plan jsonb,
  p_meals jsonb,
  p_source text DEFAULT 'manual'
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $workspace_meal_plan_rpc$
DECLARE
  v_plan_id bigint;
  v_plan jsonb := coalesce(p_plan, '{}'::jsonb);
  v_meal jsonb;
  v_food jsonb;
  v_meal_id bigint;
  v_patient_name text;
  v_action text;
  v_current_measurement_id bigint;
  v_effective_measurement_id bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authenticated session required';
  END IF;
  IF p_workspace_id IS NULL OR p_patient_id IS NULL OR p_meals IS NULL OR jsonb_typeof(p_meals) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'workspace, patient and meals array are required';
  END IF;
  IF p_source NOT IN ('manual', 'autosave') THEN
    RAISE EXCEPTION 'invalid meal-plan save source';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members member
    WHERE member.workspace_id = p_workspace_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'nutritionist')
      AND member.status = 'active'
      AND (SELECT count(*) FROM public.workspace_members active_member
           WHERE active_member.user_id = auth.uid() AND active_member.status = 'active') = 1
  ) THEN
    RAISE EXCEPTION 'active workspace membership required';
  END IF;

  SELECT patient.name INTO v_patient_name
  FROM public.patients patient
  WHERE patient.id = p_patient_id AND patient.workspace_id = p_workspace_id
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'patient does not belong to workspace';
  END IF;

  IF p_plan_id IS NULL THEN
    v_effective_measurement_id := nullif(v_plan->>'measurement_id', '')::bigint;
  ELSE
    SELECT plan.id, plan.measurement_id
      INTO v_plan_id, v_current_measurement_id
    FROM public.meal_plans AS plan
    WHERE plan.id = p_plan_id
      AND plan.workspace_id = p_workspace_id
      AND plan.patient_id = p_patient_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'meal plan does not belong to workspace and patient';
    END IF;
    v_effective_measurement_id := CASE
      WHEN v_plan ? 'measurement_id' THEN nullif(v_plan->>'measurement_id', '')::bigint
      ELSE v_current_measurement_id
    END;
  END IF;

  IF v_effective_measurement_id IS NOT NULL THEN
    PERFORM measurement.id
    FROM public.measurements AS measurement
    WHERE measurement.id = v_effective_measurement_id
      AND measurement.workspace_id = p_workspace_id
      AND measurement.patient_id = p_patient_id
    FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'measurement does not belong to patient/workspace';
    END IF;
  END IF;

  IF p_plan_id IS NULL THEN
    INSERT INTO public.meal_plans (
      workspace_id, patient_id, title, start_date, end_date, daily_calories,
      notes, strategy_type, target_calories, target_protein_g, target_carbs_g,
      target_fat_g, measurement_id, get_kcal
    ) VALUES (
      p_workspace_id, p_patient_id,
      coalesce(nullif(v_plan->>'title', ''), 'Plano Alimentar'),
      nullif(v_plan->>'start_date', '')::date,
      nullif(v_plan->>'end_date', '')::date,
      nullif(v_plan->>'daily_calories', '')::numeric,
      nullif(v_plan->>'notes', ''),
      nullif(v_plan->>'strategy_type', ''),
      nullif(v_plan->>'target_calories', '')::numeric,
      nullif(v_plan->>'target_protein_g', '')::numeric,
      nullif(v_plan->>'target_carbs_g', '')::numeric,
      nullif(v_plan->>'target_fat_g', '')::numeric,
      v_effective_measurement_id,
      nullif(v_plan->>'get_kcal', '')::numeric
    ) RETURNING id INTO v_plan_id;
    v_action := 'create';
  ELSE
    UPDATE public.meal_plans
    SET title = CASE WHEN v_plan ? 'title' THEN coalesce(nullif(v_plan->>'title', ''), title) ELSE title END,
        start_date = CASE WHEN v_plan ? 'start_date' THEN nullif(v_plan->>'start_date', '')::date ELSE start_date END,
        end_date = CASE WHEN v_plan ? 'end_date' THEN nullif(v_plan->>'end_date', '')::date ELSE end_date END,
        daily_calories = CASE WHEN v_plan ? 'daily_calories' THEN nullif(v_plan->>'daily_calories', '')::numeric ELSE daily_calories END,
        notes = CASE WHEN v_plan ? 'notes' THEN nullif(v_plan->>'notes', '') ELSE notes END,
        strategy_type = CASE WHEN v_plan ? 'strategy_type' THEN nullif(v_plan->>'strategy_type', '') ELSE strategy_type END,
        target_calories = CASE WHEN v_plan ? 'target_calories' THEN nullif(v_plan->>'target_calories', '')::numeric ELSE target_calories END,
        target_protein_g = CASE WHEN v_plan ? 'target_protein_g' THEN nullif(v_plan->>'target_protein_g', '')::numeric ELSE target_protein_g END,
        target_carbs_g = CASE WHEN v_plan ? 'target_carbs_g' THEN nullif(v_plan->>'target_carbs_g', '')::numeric ELSE target_carbs_g END,
        target_fat_g = CASE WHEN v_plan ? 'target_fat_g' THEN nullif(v_plan->>'target_fat_g', '')::numeric ELSE target_fat_g END,
        measurement_id = v_effective_measurement_id,
        get_kcal = CASE WHEN v_plan ? 'get_kcal' THEN nullif(v_plan->>'get_kcal', '')::numeric ELSE get_kcal END
    WHERE id = v_plan_id;
    v_action := 'update';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.meals meal
    WHERE meal.plan_id = v_plan_id AND meal.workspace_id IS DISTINCT FROM p_workspace_id
  ) THEN
    RAISE EXCEPTION 'meal plan has a child with a different workspace';
  END IF;

  DELETE FROM public.meal_foods food
  WHERE food.workspace_id = p_workspace_id
    AND EXISTS (SELECT 1 FROM public.meals meal WHERE meal.id = food.meal_id AND meal.plan_id = v_plan_id AND meal.workspace_id = p_workspace_id);
  DELETE FROM public.meals meal
  WHERE meal.workspace_id = p_workspace_id AND meal.plan_id = v_plan_id;

  FOR v_meal IN SELECT value FROM jsonb_array_elements(p_meals) LOOP
    IF jsonb_typeof(coalesce(v_meal->'substitution_items', '[]'::jsonb)) <> 'array'
       OR jsonb_typeof(coalesce(v_meal->'alternative_meals', '[]'::jsonb)) <> 'array' THEN
      RAISE EXCEPTION 'meal substitution fields must remain JSON arrays';
    END IF;
    INSERT INTO public.meals (
      workspace_id, plan_id, meal_name, time_suggestion, notes, sort_order,
      substitution_items, alternative_meals
    ) VALUES (
      p_workspace_id, v_plan_id,
      coalesce(nullif(v_meal->>'meal_name', ''), 'Refeição'),
      nullif(v_meal->>'time_suggestion', ''),
      nullif(v_meal->>'notes', ''),
      coalesce(nullif(v_meal->>'sort_order', '')::smallint, 0),
      coalesce(v_meal->'substitution_items', '[]'::jsonb),
      coalesce(v_meal->'alternative_meals', '[]'::jsonb)
    ) RETURNING id INTO v_meal_id;

    FOR v_food IN SELECT value FROM jsonb_array_elements(coalesce(v_meal->'foods', '[]'::jsonb)) LOOP
      IF nullif(btrim(v_food->>'food_name'), '') IS NULL THEN
        CONTINUE;
      END IF;
      INSERT INTO public.meal_foods (
        workspace_id, meal_id, food_name, quantity, unit, calories, protein,
        carbs, fat, notes, sort_order, kcal_per_100g, protein_per_100g,
        carbs_per_100g, fat_per_100g, household_measure, measure_amount, food_group
      ) VALUES (
        p_workspace_id, v_meal_id, btrim(v_food->>'food_name'),
        nullif(v_food->>'quantity', '')::numeric,
        coalesce(nullif(v_food->>'unit', ''), 'g'),
        nullif(v_food->>'calories', '')::numeric,
        nullif(v_food->>'protein', '')::numeric,
        nullif(v_food->>'carbs', '')::numeric,
        nullif(v_food->>'fat', '')::numeric,
        nullif(v_food->>'notes', ''),
        coalesce(nullif(v_food->>'sort_order', '')::smallint, 0),
        nullif(v_food->>'kcal_per_100g', '')::numeric,
        nullif(v_food->>'protein_per_100g', '')::numeric,
        nullif(v_food->>'carbs_per_100g', '')::numeric,
        nullif(v_food->>'fat_per_100g', '')::numeric,
        nullif(v_food->>'household_measure', ''),
        nullif(v_food->>'measure_amount', '')::numeric,
        nullif(v_food->>'food_group', '')
      );
    END LOOP;
  END LOOP;

  INSERT INTO public.patient_audit_logs (
    workspace_id, patient_id, patient_name, section_key, section_label, action, entity_type,
    entity_id, summary, actor_email, changed_fields, metadata
  ) VALUES (
    p_workspace_id, p_patient_id, v_patient_name, 'plano_alimentar', 'Plano alimentar',
    v_action, 'meal_plan', v_plan_id,
    CASE WHEN v_action = 'create' THEN 'Plano alimentar criado.' ELSE 'Plano alimentar atualizado.' END,
    auth.jwt() ->> 'email', ARRAY['plan', 'meals'],
    jsonb_build_object('source', p_source, 'meals_count', jsonb_array_length(p_meals))
  );

  RETURN v_plan_id;
END
$workspace_meal_plan_rpc$;

DO $workspace_meal_plan_rpc_owner$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    RAISE EXCEPTION 'trusted postgres owner role is unavailable';
  END IF;
END
$workspace_meal_plan_rpc_owner$;

ALTER FUNCTION public.save_workspace_meal_plan(uuid, bigint, bigint, jsonb, jsonb, text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.save_workspace_meal_plan(uuid, bigint, bigint, jsonb, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_workspace_meal_plan(uuid, bigint, bigint, jsonb, jsonb, text) TO authenticated;

COMMENT ON FUNCTION public.save_workspace_meal_plan(uuid, bigint, bigint, jsonb, jsonb, text) IS
  'Closed-pilot workspace meal-plan save. Validates membership and ownership, replaces children and audit atomically; legacy rows remain outside this contract.';

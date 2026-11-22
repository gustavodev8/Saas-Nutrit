-- LOCAL CANDIDATE ONLY. Do not apply remotely without an independent review.
--
-- This candidate is deliberately closed by default. It preserves existing
-- anamnesis rows with workspace_id NULL, performs no backfill, and refuses to
-- proceed when a permissive or unknown client policy could OR-bypass RLS.
-- The application release gate must remain disabled until this candidate and
-- its isolated pgTAP test are reviewed and executed in an approved environment.

DO $workspace_anamnesis_preflight$
DECLARE
  candidate_policy_count integer;
  broad_policy text;
BEGIN
  IF to_regclass('public.anamnesis') IS NULL
     OR to_regclass('public.patients') IS NULL
     OR to_regclass('public.workspaces') IS NULL
     OR to_regclass('public.workspace_members') IS NULL THEN
    RAISE EXCEPTION 'workspace anamnesis prerequisites are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.anamnesis'::regclass AND relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.patients'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on anamnesis and patients';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'anamnesis'
      AND column_name = 'workspace_id'
      AND (data_type <> 'uuid' OR is_nullable <> 'YES' OR column_default IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'anamnesis.workspace_id exists with an incompatible definition';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_index AS index_record
    WHERE index_record.indrelid = 'public.patients'::regclass
      AND index_record.indisunique
      AND index_record.indisvalid
      AND (
        SELECT array_agg(attribute.attname::text ORDER BY key_position.ordinality)
        FROM unnest(index_record.indkey) WITH ORDINALITY AS key_position(attnum, ordinality)
        JOIN pg_attribute AS attribute
          ON attribute.attrelid = index_record.indrelid
         AND attribute.attnum = key_position.attnum
         AND NOT attribute.attisdropped
      ) = ARRAY['workspace_id', 'id']::text[]
  ) THEN
    RAISE EXCEPTION 'patients(workspace_id,id) unique key is missing or invalid';
  END IF;

  -- A permissive policy for PUBLIC, anon, or authenticated is client-visible.
  -- Unknown policies are a hard stop because policies are OR-combined.
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'anamnesis'
      AND permissive = 'PERMISSIVE'
      AND roles && ARRAY['public', 'anon', 'authenticated']::name[]
      AND policyname NOT IN (
        'admin_all_anamnesis',
        'auth_all_anamnesis',
        'authenticated_all_anamnesis',
        'workspace_anamnesis_select_active_member',
        'workspace_anamnesis_insert_active_member',
        'workspace_anamnesis_update_active_member',
        'workspace_anamnesis_delete_active_member'
      )
  ) THEN
    RAISE EXCEPTION 'unexpected client policy exists on public.anamnesis';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policy AS policy
    JOIN pg_class AS relation ON relation.oid = policy.polrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid)
    WHERE namespace.nspname = 'public'
      AND relation.relname = 'anamnesis'
      AND policy.polname NOT IN (
        'admin_all_anamnesis',
        'auth_all_anamnesis',
        'authenticated_all_anamnesis',
        'workspace_anamnesis_select_active_member',
        'workspace_anamnesis_insert_active_member',
        'workspace_anamnesis_update_active_member',
        'workspace_anamnesis_delete_active_member'
      )
      AND (
        policy_role.role_oid = 0
        OR pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')
        OR pg_has_role('anon'::regrole, policy_role.role_oid, 'MEMBER')
      )
  ) THEN
    RAISE EXCEPTION 'inherited client policy exists on public.anamnesis';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'anamnesis'
      AND policyname IN ('auth_all_anamnesis', 'authenticated_all_anamnesis')
      AND (
        regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g') NOT IN ('true', '((true))')
        OR regexp_replace(lower(coalesce(with_check, '')), '[[:space:]()]', '', 'g') NOT IN ('true', '((true))')
      )
  ) THEN
    RAISE EXCEPTION 'known broad anamnesis policy differs from the reviewed legacy shape';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'anamnesis'
      AND policyname = 'admin_all_anamnesis'
      AND (
        NOT (
          (
            regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g') IN ('public.is_admin_email', 'is_admin_email')
            AND regexp_replace(lower(coalesce(with_check, '')), '[[:space:]()]', '', 'g') IN ('public.is_admin_email', 'is_admin_email')
          )
          OR (
            regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g') LIKE '%is_admin_email%workspace_idisnull%'
            AND regexp_replace(lower(coalesce(with_check, '')), '[[:space:]()]', '', 'g') LIKE '%is_admin_email%workspace_idisnull%'
          )
        )
      )
  ) THEN
    RAISE EXCEPTION 'admin_all_anamnesis differs from the reviewed legacy shape';
  END IF;

  SELECT count(*) INTO candidate_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'anamnesis'
    AND policyname IN (
      'workspace_anamnesis_select_active_member',
      'workspace_anamnesis_insert_active_member',
      'workspace_anamnesis_update_active_member'
    );
  IF candidate_policy_count NOT IN (0, 3) THEN
    RAISE EXCEPTION 'partial workspace anamnesis policy set detected';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'anamnesis'
      AND policyname IN ('admin_all_anamnesis', 'auth_all_anamnesis', 'authenticated_all_anamnesis')
  ) THEN
    RAISE EXCEPTION 'no reviewed legacy anamnesis policy is available to constrain';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.anamnesis'::regclass
      AND conname = 'anamnesis_workspace_patient_fkey'
      AND replace(lower(pg_get_constraintdef(oid)), ' ', '') NOT LIKE '%foreignkey(workspace_id,patient_id)referencespublic.patients(workspace_id,id)%'
  ) THEN
    RAISE EXCEPTION 'anamnesis_workspace_patient_fkey exists with a different definition';
  END IF;

  IF to_regclass('public.anamnesis_workspace_patient_idx') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_class
       WHERE oid = to_regclass('public.anamnesis_workspace_patient_idx')
         AND pg_get_indexdef(oid) ILIKE '%(workspace_id, patient_id)%WHERE (workspace_id IS NOT NULL)%'
     ) THEN
    RAISE EXCEPTION 'anamnesis workspace index exists with a different definition';
  END IF;
END
$workspace_anamnesis_preflight$;

ALTER TABLE public.anamnesis
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

DO $workspace_anamnesis_data_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.anamnesis AS anamnesis
    LEFT JOIN public.patients AS patient ON patient.id = anamnesis.patient_id
    WHERE patient.id IS NULL
       OR anamnesis.workspace_id IS DISTINCT FROM patient.workspace_id
  ) THEN
    RAISE EXCEPTION 'existing anamnesis workspace scope does not match its patient';
  END IF;
END
$workspace_anamnesis_data_preflight$;

DO $workspace_anamnesis_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.anamnesis'::regclass
      AND conname = 'anamnesis_workspace_patient_fkey'
  ) THEN
    ALTER TABLE public.anamnesis
      ADD CONSTRAINT anamnesis_workspace_patient_fkey
      FOREIGN KEY (workspace_id, patient_id)
      REFERENCES public.patients (workspace_id, id)
      MATCH SIMPLE
      ON DELETE NO ACTION
      NOT VALID;
  END IF;
END
$workspace_anamnesis_constraint$;

CREATE INDEX IF NOT EXISTS anamnesis_workspace_patient_idx
  ON public.anamnesis (workspace_id, patient_id)
  WHERE workspace_id IS NOT NULL;

REVOKE ALL PRIVILEGES ON TABLE public.anamnesis FROM PUBLIC, anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public.anamnesis FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.anamnesis TO authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public.anamnesis_id_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SEQUENCE public.anamnesis_id_seq TO authenticated;

DROP POLICY IF EXISTS auth_all_anamnesis ON public.anamnesis;
DROP POLICY IF EXISTS authenticated_all_anamnesis ON public.anamnesis;
DROP POLICY IF EXISTS admin_all_anamnesis ON public.anamnesis;
DROP POLICY IF EXISTS workspace_anamnesis_select_active_member ON public.anamnesis;
DROP POLICY IF EXISTS workspace_anamnesis_insert_active_member ON public.anamnesis;
DROP POLICY IF EXISTS workspace_anamnesis_update_active_member ON public.anamnesis;
DROP POLICY IF EXISTS workspace_anamnesis_delete_active_member ON public.anamnesis;

CREATE POLICY admin_all_anamnesis
  ON public.anamnesis FOR ALL TO authenticated
  USING (
    public.is_admin_email()
    AND workspace_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = anamnesis.patient_id
        AND patient.workspace_id IS NULL
    )
  )
  WITH CHECK (
    public.is_admin_email()
    AND workspace_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = anamnesis.patient_id
        AND patient.workspace_id IS NULL
    )
  );

CREATE POLICY workspace_anamnesis_select_active_member
  ON public.anamnesis FOR SELECT TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members AS member
      WHERE member.workspace_id = anamnesis.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (SELECT count(*) FROM public.workspace_members AS active_member
             WHERE active_member.user_id = (SELECT auth.uid())
               AND active_member.status = 'active') = 1
    )
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = anamnesis.patient_id
        AND patient.workspace_id = anamnesis.workspace_id
    )
  );

CREATE POLICY workspace_anamnesis_insert_active_member
  ON public.anamnesis FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members AS member
      WHERE member.workspace_id = anamnesis.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (SELECT count(*) FROM public.workspace_members AS active_member
             WHERE active_member.user_id = (SELECT auth.uid())
               AND active_member.status = 'active') = 1
    )
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = anamnesis.patient_id
        AND patient.workspace_id = anamnesis.workspace_id
    )
  );

CREATE POLICY workspace_anamnesis_update_active_member
  ON public.anamnesis FOR UPDATE TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members AS member
      WHERE member.workspace_id = anamnesis.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (SELECT count(*) FROM public.workspace_members AS active_member
             WHERE active_member.user_id = (SELECT auth.uid())
               AND active_member.status = 'active') = 1
    )
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = anamnesis.patient_id
        AND patient.workspace_id = anamnesis.workspace_id
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members AS member
      WHERE member.workspace_id = anamnesis.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (SELECT count(*) FROM public.workspace_members AS active_member
             WHERE active_member.user_id = (SELECT auth.uid())
               AND active_member.status = 'active') = 1
    )
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = anamnesis.patient_id
        AND patient.workspace_id = anamnesis.workspace_id
    )
  );

COMMENT ON COLUMN public.anamnesis.workspace_id IS
  'Nullable workspace scope. Existing legacy rows remain NULL and are never backfilled by this candidate.';

DO $workspace_anamnesis_postcondition$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'anamnesis'
      AND roles && ARRAY['public', 'anon']::name[]
  ) THEN
    RAISE EXCEPTION 'anon or PUBLIC policy remains on public.anamnesis';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.anamnesis', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.anamnesis', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.anamnesis', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.anamnesis', 'DELETE')
     OR has_table_privilege('authenticated', 'public.anamnesis', 'TRUNCATE')
     OR has_table_privilege('authenticated', 'public.anamnesis', 'REFERENCES')
     OR has_table_privilege('authenticated', 'public.anamnesis', 'TRIGGER')
     OR has_table_privilege('authenticated', 'public.anamnesis', 'MAINTAIN')
     OR has_table_privilege('anon', 'public.anamnesis', 'SELECT')
     OR has_table_privilege('anon', 'public.anamnesis', 'INSERT')
     OR has_table_privilege('anon', 'public.anamnesis', 'UPDATE')
     OR has_table_privilege('anon', 'public.anamnesis', 'DELETE')
     OR has_table_privilege('anon', 'public.anamnesis', 'TRUNCATE')
     OR has_table_privilege('anon', 'public.anamnesis', 'REFERENCES')
     OR has_table_privilege('anon', 'public.anamnesis', 'TRIGGER') THEN
    RAISE EXCEPTION 'effective anamnesis ACL does not match the reviewed CRUD contract';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'anamnesis'
      AND cmd = 'DELETE'
      AND roles && ARRAY['authenticated', 'anon', 'public']::name[]
  ) THEN
    RAISE EXCEPTION 'a client DELETE policy remains on public.anamnesis';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_class AS relation
    CROSS JOIN LATERAL aclexplode(coalesce(relation.relacl, acldefault('r', relation.relowner))) AS privilege
    WHERE relation.oid = 'public.anamnesis'::regclass
      AND privilege.grantee = 0
      AND privilege.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
  ) THEN
    RAISE EXCEPTION 'PUBLIC has an effective anamnesis table privilege';
  END IF;
  IF has_sequence_privilege('anon', 'public.anamnesis_id_seq', 'USAGE')
     OR has_sequence_privilege('anon', 'public.anamnesis_id_seq', 'SELECT')
     OR has_sequence_privilege('anon', 'public.anamnesis_id_seq', 'UPDATE') THEN
    RAISE EXCEPTION 'anon has an effective anamnesis sequence privilege';
  END IF;
  IF NOT has_sequence_privilege('authenticated', 'public.anamnesis_id_seq', 'USAGE')
     OR has_sequence_privilege('authenticated', 'public.anamnesis_id_seq', 'SELECT')
     OR has_sequence_privilege('authenticated', 'public.anamnesis_id_seq', 'UPDATE') THEN
    RAISE EXCEPTION 'authenticated sequence ACL must be USAGE only';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_class AS relation
    CROSS JOIN LATERAL aclexplode(coalesce(relation.relacl, acldefault('S', relation.relowner))) AS privilege
    WHERE relation.oid = 'public.anamnesis_id_seq'::regclass
      AND privilege.grantee = 0
      AND privilege.privilege_type IN ('USAGE', 'SELECT', 'UPDATE')
  ) THEN
    RAISE EXCEPTION 'PUBLIC has an effective anamnesis sequence privilege';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'anamnesis'
      AND policyname = 'admin_all_anamnesis'
      AND qual ILIKE '%workspace_id IS NULL%'
      AND with_check ILIKE '%workspace_id IS NULL%'
  ) THEN
    RAISE EXCEPTION 'legacy admin policy is not NULL-workspace restricted';
  END IF;
END
$workspace_anamnesis_postcondition$;

-- LOCAL CANDIDATE ONLY: closed workspace patient registry pilot.
-- Do not apply remotely. Existing patient rows and the legacy admin allowlist
-- policy are preserved; no DELETE policy or clinical-table scope is added.

-- Table ACLs are provisioned after the reviewed RLS policies are installed.

DO $workspace_patient_registry_preflight$
BEGIN
  IF to_regclass('public.patients') IS NULL
     OR to_regclass('public.workspaces') IS NULL
     OR to_regclass('public.workspace_members') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'patients'
         AND column_name = 'workspace_id'
     ) THEN
    RAISE EXCEPTION 'workspace patient registry prerequisites are missing';
  END IF;

  -- Permissive policies are OR-combined. Unknown policies for client roles
  -- must stop promotion instead of silently widening the registry.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patients'
      AND permissive = 'PERMISSIVE'
      AND roles && ARRAY['authenticated', 'anon', 'public']::name[]
      AND policyname NOT IN (
        'admin_all_patients', 'patient_self_read_patients',
        'auth_all_patients', 'authenticated_all_patients',
        'workspace_patients_select_active_member',
        'workspace_patients_insert_active_member',
        'workspace_patients_update_active_member'
      )
  ) THEN
    RAISE EXCEPTION 'unexpected permissive client policy exists on public.patients';
  END IF;

  -- Anon CRUD is a stop condition. Authenticated ACLs are normalized after
  -- installing the reviewed policies; do not assume CLI defaults.
  IF has_table_privilege('anon', 'public.patients', 'SELECT')
     OR has_table_privilege('anon', 'public.patients', 'INSERT')
     OR has_table_privilege('anon', 'public.patients', 'UPDATE')
     OR has_table_privilege('anon', 'public.patients', 'DELETE') THEN
    RAISE EXCEPTION 'anon has effective CRUD privileges on public.patients';
  END IF;

  IF pg_get_serial_sequence('public.patients', 'id') IS NULL THEN
    RAISE EXCEPTION 'patients.id serial sequence is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patients'
      AND policyname = 'admin_all_patients'
      AND cmd = 'ALL'
      AND permissive = 'PERMISSIVE'
      AND roles = ARRAY['authenticated']::name[]
      AND (
        (
          lower(regexp_replace(qual, '[[:space:]]', '', 'g')) IN ('public.is_admin_email()', 'is_admin_email()', '(public.is_admin_email())', '(is_admin_email())')
          AND lower(regexp_replace(with_check, '[[:space:]]', '', 'g')) IN ('public.is_admin_email()', 'is_admin_email()', '(public.is_admin_email())', '(is_admin_email())')
        )
        OR
        (
          lower(regexp_replace(qual, '[[:space:]]', '', 'g')) IN ('(public.is_admin_email()and(workspace_idisnull))', '(is_admin_email()and(workspace_idisnull))', '(public.is_admin_email()andworkspace_idisnull)', '(is_admin_email()andworkspace_idisnull)', 'public.is_admin_email()andworkspace_idisnull', 'is_admin_email()andworkspace_idisnull')
          AND lower(regexp_replace(with_check, '[[:space:]]', '', 'g')) IN ('(public.is_admin_email()and(workspace_idisnull))', '(is_admin_email()and(workspace_idisnull))', '(public.is_admin_email()andworkspace_idisnull)', '(is_admin_email()andworkspace_idisnull)', 'public.is_admin_email()andworkspace_idisnull', 'is_admin_email()andworkspace_idisnull')
        )
      )
  ) THEN
    RAISE EXCEPTION 'admin_all_patients is neither the exact legacy nor candidate policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'patients'
      AND policyname = 'patient_self_read_patients'
      AND cmd = 'SELECT'
      AND permissive = 'PERMISSIVE'
      AND roles = ARRAY['authenticated']::name[]
      AND (
        lower(regexp_replace(qual, '[[:space:]]', '', 'g')) IN (
          'public.is_admin_email()orid=public.current_patient_id()',
          'public.is_admin_email()orid=current_patient_id()',
          'is_admin_email()orid=public.current_patient_id()',
          'is_admin_email()orid=current_patient_id()',
          '(public.is_admin_email()or(id=public.current_patient_id()))',
          '(public.is_admin_email()or(id=current_patient_id()))',
          '(is_admin_email()or(id=public.current_patient_id()))',
          '(is_admin_email()or(id=current_patient_id()))'
        )
        OR lower(regexp_replace(qual, '[[:space:]]', '', 'g')) IN (
          'id=public.current_patient_id()',
          'id=current_patient_id()',
          '(id=public.current_patient_id())',
          '(id=current_patient_id())'
        )
      )
  ) THEN
    RAISE EXCEPTION 'patient_self_read_patients is neither the exact legacy nor candidate policy';
  END IF;
END
$workspace_patient_registry_preflight$;

-- ALTER TABLE ENABLE is idempotent and must precede policy installation.
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DO $workspace_patient_registry_rls_postcondition$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS schema ON schema.oid = relation.relnamespace
    WHERE schema.nspname = 'public'
      AND relation.relname = 'patients'
      AND relation.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on public.patients';
  END IF;
END
$workspace_patient_registry_rls_postcondition$;

-- The historical authenticated_all_patients policy is globally permissive and
-- would OR with workspace policies, defeating tenant isolation. Remove only
-- the known broad legacy name. Restrict the allowlist to unscoped legacy rows;
-- workspace rows require the separate active-membership policies below.
DROP POLICY IF EXISTS auth_all_patients ON public.patients;
DROP POLICY IF EXISTS authenticated_all_patients ON public.patients;
DROP POLICY admin_all_patients ON public.patients;
CREATE POLICY admin_all_patients
  ON public.patients
  FOR ALL
  TO authenticated
  USING (public.is_admin_email() AND workspace_id IS NULL)
  WITH CHECK (public.is_admin_email() AND workspace_id IS NULL);

-- Keep portal self-read by email-derived patient identity, but remove the
-- allowlist branch that would otherwise OR into global workspace visibility.
DROP POLICY patient_self_read_patients ON public.patients;
CREATE POLICY patient_self_read_patients
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (id = public.current_patient_id());

DROP POLICY IF EXISTS workspace_patients_select_active_member ON public.patients;
CREATE POLICY workspace_patients_select_active_member
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = patients.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (
          SELECT count(*)
          FROM public.workspace_members AS active_member
          WHERE active_member.user_id = (SELECT auth.uid())
            AND active_member.status = 'active'
        ) = 1
    )
  );

DROP POLICY IF EXISTS workspace_patients_insert_active_member ON public.patients;
CREATE POLICY workspace_patients_insert_active_member
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = patients.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (
          SELECT count(*)
          FROM public.workspace_members AS active_member
          WHERE active_member.user_id = (SELECT auth.uid())
            AND active_member.status = 'active'
        ) = 1
    )
  );

DROP POLICY IF EXISTS workspace_patients_update_active_member ON public.patients;
CREATE POLICY workspace_patients_update_active_member
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = patients.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (
          SELECT count(*)
          FROM public.workspace_members AS active_member
          WHERE active_member.user_id = (SELECT auth.uid())
            AND active_member.status = 'active'
        ) = 1
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = patients.workspace_id
        AND member.user_id = (SELECT auth.uid())
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (
          SELECT count(*)
          FROM public.workspace_members AS active_member
          WHERE active_member.user_id = (SELECT auth.uid())
            AND active_member.status = 'active'
        ) = 1
    )
  );

COMMENT ON POLICY workspace_patients_select_active_member ON public.patients IS
  'Closed pilot: exactly one active owner/nutritionist membership; legacy NULL rows stay hidden.';
COMMENT ON POLICY workspace_patients_insert_active_member ON public.patients IS
  'Closed pilot: inserts require a non-NULL workspace_id owned by the sole active owner/nutritionist membership.';
COMMENT ON POLICY workspace_patients_update_active_member ON public.patients IS
  'Closed pilot: updates stay in the caller workspace through USING and WITH CHECK; no DELETE policy is added.';

-- RLS controls which CRUD operations are effective. Table ACLs must still
-- permit the API role to reach those policies; no workspace DELETE policy is
-- added, so the grant preserves legacy-admin DELETE only on NULL rows.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.patients
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.patients
  TO authenticated;

DO $workspace_patient_sequence_acl$
DECLARE
  sequence_name text := pg_get_serial_sequence('public.patients', 'id');
BEGIN
  IF sequence_name IS NULL THEN
    RAISE EXCEPTION 'patients.id serial sequence disappeared after preflight';
  END IF;

  EXECUTE format(
    'REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC, anon, authenticated',
    sequence_name
  );
  EXECUTE format(
    'GRANT USAGE ON SEQUENCE %s TO authenticated',
    sequence_name
  );
END
$workspace_patient_sequence_acl$;

DO $workspace_patient_acl_postcondition$
DECLARE
  sequence_name text := pg_get_serial_sequence('public.patients', 'id');
BEGIN
  IF NOT has_table_privilege('authenticated', 'public.patients', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.patients', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.patients', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.patients', 'DELETE')
     OR has_table_privilege('authenticated', 'public.patients', 'TRUNCATE')
     OR has_table_privilege('authenticated', 'public.patients', 'REFERENCES')
     OR has_table_privilege('authenticated', 'public.patients', 'TRIGGER')
     OR has_table_privilege('authenticated', 'public.patients', 'MAINTAIN') THEN
    RAISE EXCEPTION 'authenticated patients table ACL postcondition failed';
  END IF;

  IF has_table_privilege('anon', 'public.patients', 'SELECT')
     OR has_table_privilege('anon', 'public.patients', 'INSERT')
     OR has_table_privilege('anon', 'public.patients', 'UPDATE')
     OR has_table_privilege('anon', 'public.patients', 'DELETE')
     OR has_table_privilege('anon', 'public.patients', 'TRUNCATE')
     OR has_table_privilege('anon', 'public.patients', 'REFERENCES')
     OR has_table_privilege('anon', 'public.patients', 'TRIGGER')
     OR has_table_privilege('anon', 'public.patients', 'MAINTAIN') THEN
    RAISE EXCEPTION 'anon patients table ACL postcondition failed';
  END IF;

  IF sequence_name IS NULL
     OR NOT has_sequence_privilege('authenticated', sequence_name, 'USAGE')
     OR has_sequence_privilege('authenticated', sequence_name, 'SELECT')
     OR has_sequence_privilege('authenticated', sequence_name, 'UPDATE')
     OR has_sequence_privilege('anon', sequence_name, 'USAGE')
     OR has_sequence_privilege('anon', sequence_name, 'SELECT')
     OR has_sequence_privilege('anon', sequence_name, 'UPDATE') THEN
    RAISE EXCEPTION 'patients sequence ACL postcondition failed';
  END IF;
END
$workspace_patient_acl_postcondition$;

-- LOCAL CANDIDATE ONLY. Can follow the patients workspace expansion
-- (measurements.workspace_id absent) or the full, local, unpromoted candidate
-- supabase/migration-candidates/
-- 20261104020000_workspace_clinical_legacy_rls_candidate.sql (which already
-- adds measurements.workspace_id). It is not strictly dependent on that full
-- clinical candidate. Do not promote/apply without separate review/authorization.
-- Existing measurements remain legacy rows (workspace_id NULL); no backfill.
-- Patient portal access to workspace measurements stays closed until a
-- workspace-scoped patient identity/link is designed and reviewed.

DO $workspace_measurements_preflight$
DECLARE
  normalized_qual text;
  normalized_check text;
  broad_policy_count integer;
  workspace_attnum smallint;
  patient_attnum smallint;
  patient_admin_qual text;
  patient_admin_check text;
  patient_self_qual text;
  patient_policy_name text;
  patient_policy_cmd text;
  expected_patient_qual text;
  expected_patient_check text;
  actual_patient_qual text;
  actual_patient_check text;
BEGIN
  IF to_regclass('public.measurements') IS NULL
     OR to_regclass('public.patients') IS NULL
     OR to_regclass('public.workspaces') IS NULL
     OR to_regclass('public.workspace_members') IS NULL THEN
    RAISE EXCEPTION 'workspace measurements prerequisites are missing';
  END IF;

  IF NOT EXISTS (
       SELECT 1 FROM pg_class AS relation
       WHERE relation.oid = 'public.measurements'::regclass
         AND relation.relrowsecurity
     ) THEN
    RAISE EXCEPTION 'RLS is not enabled on public.measurements';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class AS relation
    WHERE relation.oid = 'public.patients'::regclass
      AND relation.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on public.patients';
  END IF;

  -- The measurement policies query patients as the caller. Require the
  -- reviewed patient-scope policy set before granting authenticated SELECT.
  SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g'),
         regexp_replace(lower(with_check), '[[:space:]()]', '', 'g')
    INTO patient_admin_qual, patient_admin_check
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'patients'
    AND policyname = 'admin_all_patients' AND cmd = 'ALL'
    AND permissive = 'PERMISSIVE'
    AND roles = ARRAY['authenticated']::name[];
  IF patient_admin_qual IS NULL OR patient_admin_check IS NULL
     OR patient_admin_qual NOT IN (
       'public.is_admin_emailandworkspace_idisnull',
       'is_admin_emailandworkspace_idisnull'
     )
     OR patient_admin_check NOT IN (
       'public.is_admin_emailandworkspace_idisnull',
       'is_admin_emailandworkspace_idisnull'
     ) THEN
    RAISE EXCEPTION 'patients admin policy is missing or not restricted to NULL workspace rows';
  END IF;

  SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g')
    INTO patient_self_qual
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'patients'
    AND policyname = 'patient_self_read_patients' AND cmd = 'SELECT'
    AND permissive = 'PERMISSIVE'
    AND roles = ARRAY['authenticated']::name[];
  IF patient_self_qual IS NULL
     OR patient_self_qual NOT IN (
       'id=public.current_patient_id', 'id=current_patient_id'
     ) THEN
    RAISE EXCEPTION 'patients self-read policy is missing or differs from the reviewed self-only contract';
  END IF;

  -- Require the complete reviewed ACL contract from the patient registry
  -- candidate before relying on its RLS-filtered parent rows.
  IF NOT has_table_privilege('authenticated', 'public.patients', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.patients', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.patients', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.patients', 'DELETE')
     OR has_table_privilege('authenticated', 'public.patients', 'TRUNCATE')
     OR has_table_privilege('authenticated', 'public.patients', 'REFERENCES')
     OR has_table_privilege('authenticated', 'public.patients', 'TRIGGER')
     OR has_table_privilege('authenticated', 'public.patients', 'MAINTAIN')
     OR has_table_privilege('anon', 'public.patients', 'SELECT')
     OR has_table_privilege('anon', 'public.patients', 'INSERT')
     OR has_table_privilege('anon', 'public.patients', 'UPDATE')
     OR has_table_privilege('anon', 'public.patients', 'DELETE')
     OR has_table_privilege('anon', 'public.patients', 'TRUNCATE')
     OR has_table_privilege('anon', 'public.patients', 'REFERENCES')
     OR has_table_privilege('anon', 'public.patients', 'TRIGGER')
     OR has_table_privilege('anon', 'public.patients', 'MAINTAIN') THEN
    RAISE EXCEPTION 'public.patients effective ACL differs from the reviewed patient registry contract';
  END IF;

  FOR patient_policy_name, patient_policy_cmd,
      expected_patient_qual, expected_patient_check IN
    SELECT * FROM (VALUES
      (
        'workspace_patients_select_active_member', 'SELECT',
        'workspace_idisnotnullandexistsselect1fromworkspace_membersmemberwheremember.workspace_id=patients.workspace_idandmember.user_id=auth.uidandmember.rolein[''owner'',''nutritionist'']andmember.status=''active''andselectcount*fromworkspace_membersactive_memberwhereactive_member.user_id=auth.uidandactive_member.status=''active''=1'::text,
        NULL::text
      ),
      (
        'workspace_patients_insert_active_member', 'INSERT',
        NULL::text,
        'workspace_idisnotnullandexistsselect1fromworkspace_membersmemberwheremember.workspace_id=patients.workspace_idandmember.user_id=auth.uidandmember.rolein[''owner'',''nutritionist'']andmember.status=''active''andselectcount*fromworkspace_membersactive_memberwhereactive_member.user_id=auth.uidandactive_member.status=''active''=1'
      ),
      (
        'workspace_patients_update_active_member', 'UPDATE',
        'workspace_idisnotnullandexistsselect1fromworkspace_membersmemberwheremember.workspace_id=patients.workspace_idandmember.user_id=auth.uidandmember.rolein[''owner'',''nutritionist'']andmember.status=''active''andselectcount*fromworkspace_membersactive_memberwhereactive_member.user_id=auth.uidandactive_member.status=''active''=1',
        'workspace_idisnotnullandexistsselect1fromworkspace_membersmemberwheremember.workspace_id=patients.workspace_idandmember.user_id=auth.uidandmember.rolein[''owner'',''nutritionist'']andmember.status=''active''andselectcount*fromworkspace_membersactive_memberwhereactive_member.user_id=auth.uidandactive_member.status=''active''=1'
      )
    ) AS expected(policy_name, command_name, qual, check_expression)
  LOOP
    SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g'),
           regexp_replace(lower(with_check), '[[:space:]()]', '', 'g')
      INTO actual_patient_qual, actual_patient_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patients'
      AND policyname = patient_policy_name
      AND cmd = patient_policy_cmd
      AND permissive = 'PERMISSIVE'
      AND roles = ARRAY['authenticated']::name[];

    actual_patient_qual := replace(replace(replace(replace(replace(
      actual_patient_qual, 'public.', ''), '::text', ''), 'asmember', 'member'),
      'asactive_member', 'active_member'), '=anyarray[', 'in[');
    actual_patient_check := replace(replace(replace(replace(replace(
      actual_patient_check, 'public.', ''), '::text', ''), 'asmember', 'member'),
      'asactive_member', 'active_member'), '=anyarray[', 'in[');
    actual_patient_qual := replace(replace(actual_patient_qual, 'selectauth.uidasuid', 'auth.uid'), 'selectauth.uid', 'auth.uid');
    actual_patient_check := replace(replace(actual_patient_check, 'selectauth.uidasuid', 'auth.uid'), 'selectauth.uid', 'auth.uid');
    -- pg_get_expr assigns the implicit output name to count(*) as "count".
    actual_patient_qual := replace(actual_patient_qual, 'ascountfrom', 'from');
    actual_patient_check := replace(actual_patient_check, 'ascountfrom', 'from');

    IF actual_patient_qual IS DISTINCT FROM expected_patient_qual
       OR actual_patient_check IS DISTINCT FROM expected_patient_check THEN
      RAISE EXCEPTION 'workspace patient policy % differs from the reviewed exact-membership contract', patient_policy_name;
    END IF;
  END LOOP;

  -- pg_policy.polroles stores role OIDs; OID 0 means PUBLIC. Test role
  -- inheritance in the direction of the effective caller: authenticated ->
  -- policy role. MEMBER conservatively includes NOINHERIT memberships that
  -- could become effective through role switching; OID 0 is always PUBLIC.
  IF EXISTS (
    SELECT 1
    FROM pg_policy AS policy
    JOIN pg_class AS relation ON relation.oid = policy.polrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid)
    WHERE namespace.nspname = 'public' AND relation.relname = 'patients'
      AND policy.polname NOT IN (
        'admin_all_patients', 'patient_self_read_patients',
        'workspace_patients_select_active_member',
        'workspace_patients_insert_active_member',
        'workspace_patients_update_active_member'
      )
      AND (
        CASE WHEN policy_role.role_oid = 0 THEN true
             ELSE pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')
        END
        OR CASE WHEN policy_role.role_oid = 0 THEN true
                ELSE pg_has_role('anon'::regrole, policy_role.role_oid, 'MEMBER')
           END
      )
  ) THEN
    RAISE EXCEPTION 'unexpected client policy exists on public.patients';
  END IF;

  IF has_table_privilege('anon', 'public.patients', 'SELECT') THEN
    RAISE EXCEPTION 'anon has effective SELECT privilege on public.patients';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'measurements'
      AND column_name = 'patient_id'
  ) THEN
    RAISE EXCEPTION 'measurements.patient_id is missing';
  END IF;

  -- Never backfill or discard historical rows. Refuse before any migration
  -- DDL if even one measurement has no patient link.
  IF EXISTS (
    SELECT 1 FROM public.measurements WHERE patient_id IS NULL
  ) THEN
    RAISE EXCEPTION 'measurements.patient_id contains NULL rows; refusing schema change';
  END IF;

  -- Support the patients-only expansion (column absent) and the full clinical
  -- candidate (column present), but reject any incompatible/partial column.
  SELECT attnum INTO workspace_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.measurements'::regclass
    AND attname = 'workspace_id' AND NOT attisdropped;
  IF workspace_attnum IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.measurements'::regclass
      AND attname = 'workspace_id' AND NOT attisdropped
      AND atttypid = 'uuid'::regtype
      AND NOT attnotnull
      AND NOT atthasdef
      AND attgenerated = ''
  ) THEN
    RAISE EXCEPTION 'existing measurements.workspace_id must be nullable UUID without a default or generation';
  END IF;

  -- NOT VALID protects new writes but does not scan historical rows. Before
  -- replacing the legacy policies, fail closed if any already-scoped record
  -- is not paired with its patient in the same workspace. Never repair here.
  IF workspace_attnum IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.measurements AS measurement
      WHERE measurement.workspace_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM public.patients AS patient
          WHERE patient.id = measurement.patient_id
            AND patient.workspace_id = measurement.workspace_id
        )
    ) THEN
      RAISE EXCEPTION 'existing scoped measurements contain a missing or cross-workspace patient link';
    END IF;
  END IF;

  IF NOT EXISTS (
       SELECT 1 FROM pg_index AS idx
       WHERE idx.indrelid = 'public.patients'::regclass
         AND idx.indisunique AND idx.indisvalid AND idx.indisready
         AND pg_get_indexdef(idx.indexrelid) ILIKE
           'CREATE UNIQUE INDEX%patients_workspace_id_id_key%ON%public.patients%USING btree (workspace_id, id)'
     ) THEN
    RAISE EXCEPTION 'required valid patients(workspace_id, id) unique index is missing';
  END IF;

  SELECT attnum INTO patient_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.measurements'::regclass
    AND attname = 'patient_id' AND NOT attisdropped;

  -- Do not adopt partially-created constraints or indexes: their definitions
  -- require independent review before this one-shot candidate can proceed.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.measurements'::regclass
      AND conname = 'measurements_workspace_patient_fkey'
  ) OR (
    workspace_attnum IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pg_constraint AS constraint_row
      WHERE constraint_row.conrelid = 'public.measurements'::regclass
        AND constraint_row.contype = 'f'
        AND constraint_row.conkey @> ARRAY[workspace_attnum, patient_attnum]::smallint[]
    )
  ) THEN
    RAISE EXCEPTION 'a measurements workspace/patient FK already exists; review before promotion';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname = 'measurements_workspace_patient_idx'
  ) OR (
    workspace_attnum IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pg_index AS idx
      WHERE idx.indrelid = 'public.measurements'::regclass
        AND pg_get_indexdef(idx.indexrelid) ILIKE '%(workspace_id, patient_id)%'
    )
  ) THEN
    RAISE EXCEPTION 'a measurements workspace/patient index already exists; review before promotion';
  END IF;

  -- Permissive policies OR together. Any policy outside the explicitly
  -- reviewed legacy lineage is a stop condition, even if restrictive today.
  IF EXISTS (
    SELECT 1
    FROM pg_policy AS policy
    JOIN pg_class AS relation ON relation.oid = policy.polrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid)
    WHERE namespace.nspname = 'public' AND relation.relname = 'measurements'
      AND policy.polname NOT IN (
        'admin_all_measurements', 'patient_self_read_measurements',
        'auth_all_measurements', 'authenticated_all_measurements',
        'workspace_measurements_select_active_member',
        'workspace_measurements_insert_active_member',
        'workspace_measurements_update_active_member'
      )
      AND (
        CASE WHEN policy_role.role_oid = 0 THEN true
             ELSE pg_has_role('authenticated'::regrole, policy_role.role_oid, 'MEMBER')
        END
        OR CASE WHEN policy_role.role_oid = 0 THEN true
                ELSE pg_has_role('anon'::regrole, policy_role.role_oid, 'MEMBER')
           END
      )
  ) THEN
    RAISE EXCEPTION 'unexpected client policy exists on public.measurements';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'measurements'
      AND policyname IN (
        'workspace_measurements_select_active_member',
        'workspace_measurements_insert_active_member',
        'workspace_measurements_update_active_member'
      )
  ) THEN
    RAISE EXCEPTION 'workspace measurements policies already exist; review partial or prior application';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policy AS policy
    JOIN pg_class AS relation ON relation.oid = policy.polrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    CROSS JOIN LATERAL unnest(policy.polroles) AS policy_role(role_oid)
    WHERE namespace.nspname = 'public' AND relation.relname = 'measurements'
      AND CASE WHEN policy_role.role_oid = 0 THEN true
               ELSE pg_has_role('anon'::regrole, policy_role.role_oid, 'MEMBER')
          END
  ) THEN
    RAISE EXCEPTION 'anonymous or PUBLIC policy exists on public.measurements';
  END IF;

  -- Accept only the exact allowlist policy from 20260803010000 or the exact
  -- NULL-workspace restriction from the unpromoted clinical-scope candidate.
  -- Anything else, including a missing policy, fails closed.
  SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g'),
         regexp_replace(lower(with_check), '[[:space:]()]', '', 'g')
    INTO normalized_qual, normalized_check
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'measurements'
    AND policyname = 'admin_all_measurements' AND cmd = 'ALL'
    AND permissive = 'PERMISSIVE'
    AND roles = ARRAY['authenticated']::name[];
  IF normalized_qual IS NULL OR normalized_check IS NULL
     OR normalized_qual NOT IN (
       'public.is_admin_email', 'is_admin_email',
       'public.is_admin_emailandworkspace_idisnull',
       'is_admin_emailandworkspace_idisnull'
     )
     OR normalized_check NOT IN (
       'public.is_admin_email', 'is_admin_email',
       'public.is_admin_emailandworkspace_idisnull',
       'is_admin_emailandworkspace_idisnull'
     ) THEN
    RAISE EXCEPTION 'admin_all_measurements is missing or differs from the reviewed allowlist/candidate contract';
  END IF;

  -- Accept only the two known broad-policy names and exact TRUE predicates.
  SELECT count(*)::integer INTO broad_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'measurements'
    AND policyname IN ('auth_all_measurements', 'authenticated_all_measurements');
  IF broad_policy_count > 1 OR EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'measurements'
      AND policyname IN ('auth_all_measurements', 'authenticated_all_measurements')
      AND NOT (
        cmd = 'ALL' AND permissive = 'PERMISSIVE'
        AND roles = ARRAY['authenticated']::name[]
        AND lower(regexp_replace(qual, '[[:space:]()]', '', 'g')) = 'true'
        AND lower(regexp_replace(with_check, '[[:space:]()]', '', 'g')) = 'true'
      )
  ) THEN
    RAISE EXCEPTION 'broad measurements policy differs from the reviewed legacy contract';
  END IF;

  -- The existing patient portal policy is permissive and would OR with the
  -- workspace policies. Accept only its known legacy form or already-narrowed
  -- legacy-only form, then replace it with the latter.
  SELECT regexp_replace(lower(qual), '[[:space:]()]', '', 'g')
    INTO normalized_qual
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'measurements'
    AND policyname = 'patient_self_read_measurements' AND cmd = 'SELECT'
    AND permissive = 'PERMISSIVE'
    AND roles = ARRAY['authenticated']::name[];
  IF normalized_qual IS NULL OR normalized_qual NOT IN (
    'public.is_admin_emailorpatient_id=public.current_patient_id',
    'public.is_admin_emailorpatient_id=current_patient_id',
    'is_admin_emailorpatient_id=public.current_patient_id',
    'is_admin_emailorpatient_id=current_patient_id',
    'patient_id=public.current_patient_id',
    'patient_id=current_patient_id'
  ) THEN
    RAISE EXCEPTION 'patient_self_read_measurements is missing or differs from reviewed portal contract';
  END IF;

  -- Anonymous access is a stop condition. Authenticated CRUD grants are
  -- provisioned explicitly below rather than assumed from CLI defaults.
  IF has_table_privilege('anon', 'public.measurements', 'SELECT')
     OR has_table_privilege('anon', 'public.measurements', 'INSERT')
     OR has_table_privilege('anon', 'public.measurements', 'UPDATE')
     OR has_table_privilege('anon', 'public.measurements', 'DELETE') THEN
    RAISE EXCEPTION 'anonymous effective CRUD privilege exists on public.measurements';
  END IF;

  IF pg_get_serial_sequence('public.measurements', 'id') IS NULL THEN
    RAISE EXCEPTION 'measurements.id serial sequence is missing';
  END IF;
END
$workspace_measurements_preflight$;

-- Reassert the invariant after the read-only preflight. PostgreSQL takes the
-- required table lock and rechecks existing rows; no data is rewritten.
ALTER TABLE public.measurements
  ALTER COLUMN patient_id SET NOT NULL;

REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.measurements
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.measurements
  TO authenticated;
GRANT SELECT ON TABLE public.patients TO authenticated;

DO $workspace_measurements_sequence_acl$
DECLARE
  sequence_name text := pg_get_serial_sequence('public.measurements', 'id');
BEGIN
  IF sequence_name IS NULL THEN
    RAISE EXCEPTION 'measurements.id serial sequence disappeared after preflight';
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
$workspace_measurements_sequence_acl$;

DO $workspace_measurements_column$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.measurements'::regclass
      AND attname = 'workspace_id' AND NOT attisdropped
  ) THEN
    ALTER TABLE public.measurements ADD COLUMN workspace_id uuid;
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.measurements'::regclass
      AND attname = 'workspace_id' AND NOT attisdropped
      AND atttypid = 'uuid'::regtype
      AND NOT attnotnull
      AND NOT atthasdef
      AND attgenerated = ''
  ) THEN
    RAISE EXCEPTION 'measurements.workspace_id changed after preflight';
  END IF;
END
$workspace_measurements_column$;

ALTER TABLE public.measurements
  ADD CONSTRAINT measurements_workspace_patient_fkey
  FOREIGN KEY (workspace_id, patient_id)
  REFERENCES public.patients (workspace_id, id)
  MATCH SIMPLE
  ON DELETE NO ACTION
  NOT VALID;

CREATE INDEX measurements_workspace_patient_idx
  ON public.measurements (workspace_id, patient_id)
  WHERE workspace_id IS NOT NULL;

DROP POLICY IF EXISTS auth_all_measurements ON public.measurements;
DROP POLICY IF EXISTS authenticated_all_measurements ON public.measurements;
DROP POLICY admin_all_measurements ON public.measurements;
DROP POLICY patient_self_read_measurements ON public.measurements;

CREATE POLICY admin_all_measurements
  ON public.measurements
  FOR ALL
  TO authenticated
  USING (
    public.is_admin_email()
    AND workspace_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.patients AS patient
      WHERE patient.id = measurements.patient_id
        AND patient.workspace_id IS NULL
    )
  )
  WITH CHECK (
    public.is_admin_email()
    AND workspace_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.patients AS patient
      WHERE patient.id = measurements.patient_id
        AND patient.workspace_id IS NULL
    )
  );

CREATE POLICY patient_self_read_measurements
  ON public.measurements
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NULL
    AND patient_id = public.current_patient_id()
    AND EXISTS (
      SELECT 1
      FROM public.patients AS patient
      WHERE patient.id = measurements.patient_id
        AND patient.workspace_id IS NULL
    )
  );

CREATE POLICY workspace_measurements_select_active_member
  ON public.measurements
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = measurements.workspace_id
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

CREATE POLICY workspace_measurements_insert_active_member
  ON public.measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = measurements.workspace_id
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

CREATE POLICY workspace_measurements_update_active_member
  ON public.measurements
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = measurements.workspace_id
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
      WHERE member.workspace_id = measurements.workspace_id
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

COMMENT ON POLICY patient_self_read_measurements ON public.measurements IS
  'Workspace portal access is intentionally closed pending a reviewed patient-workspace identity link; legacy rows only.';
COMMENT ON POLICY workspace_measurements_select_active_member ON public.measurements IS
  'Closed pilot: sole active membership must be owner or nutritionist; legacy NULL rows stay hidden.';
COMMENT ON POLICY workspace_measurements_insert_active_member ON public.measurements IS
  'Closed pilot: workspace measurements require a sole active owner/nutritionist membership; no legacy backfill.';
COMMENT ON POLICY workspace_measurements_update_active_member ON public.measurements IS
  'Closed pilot: updates remain in the caller workspace through USING and WITH CHECK; no workspace DELETE policy.';

COMMENT ON COLUMN public.measurements.workspace_id IS
  'Nullable workspace scope; existing legacy rows remain NULL and are not backfilled by this candidate.';

DO $workspace_measurements_acl_postcondition$
DECLARE
  sequence_name text := pg_get_serial_sequence('public.measurements', 'id');
BEGIN
  IF NOT has_table_privilege('authenticated', 'public.patients', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated patients SELECT ACL postcondition failed';
  END IF;
  IF has_table_privilege('anon', 'public.patients', 'SELECT') THEN
    RAISE EXCEPTION 'anon patients SELECT ACL postcondition failed';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.measurements', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.measurements', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.measurements', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.measurements', 'DELETE')
     OR has_table_privilege('authenticated', 'public.measurements', 'TRUNCATE')
     OR has_table_privilege('authenticated', 'public.measurements', 'REFERENCES')
     OR has_table_privilege('authenticated', 'public.measurements', 'TRIGGER')
     OR has_table_privilege('authenticated', 'public.measurements', 'MAINTAIN') THEN
    RAISE EXCEPTION 'authenticated measurements table ACL postcondition failed';
  END IF;

  IF has_table_privilege('anon', 'public.measurements', 'SELECT')
     OR has_table_privilege('anon', 'public.measurements', 'INSERT')
     OR has_table_privilege('anon', 'public.measurements', 'UPDATE')
     OR has_table_privilege('anon', 'public.measurements', 'DELETE')
     OR has_table_privilege('anon', 'public.measurements', 'TRUNCATE')
     OR has_table_privilege('anon', 'public.measurements', 'REFERENCES')
     OR has_table_privilege('anon', 'public.measurements', 'TRIGGER')
     OR has_table_privilege('anon', 'public.measurements', 'MAINTAIN') THEN
    RAISE EXCEPTION 'anon measurements table ACL postcondition failed';
  END IF;

  IF sequence_name IS NULL
     OR NOT has_sequence_privilege('authenticated', sequence_name, 'USAGE')
     OR has_sequence_privilege('authenticated', sequence_name, 'SELECT')
     OR has_sequence_privilege('authenticated', sequence_name, 'UPDATE')
     OR has_sequence_privilege('anon', sequence_name, 'USAGE')
     OR has_sequence_privilege('anon', sequence_name, 'SELECT')
     OR has_sequence_privilege('anon', sequence_name, 'UPDATE') THEN
    RAISE EXCEPTION 'measurements sequence ACL postcondition failed';
  END IF;
END
$workspace_measurements_acl_postcondition$;

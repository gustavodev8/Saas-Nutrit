-- LOCAL CANDIDATE ONLY (NAO APLICAR automaticamente). Relatorio clinico no workspace.
-- Da a membros ativos (owner/nutritionist) de um workspace CRUD sobre patient_reports
-- dos pacientes do proprio workspace.
--
-- Estado verificado em supabase/migrations: patient_reports NAO tem workspace_id.
-- (20261101000000_workspace_clinical_scope_expand.sql nao menciona patient_reports.)
-- O candidate 20261104020000_workspace_clinical_legacy_rls_candidate.sql tambem adiciona
-- o marcador workspace_id e restringe admin_all_patient_reports a "workspace_id IS NULL".
-- Este candidate e idempotente em relacao a ele (ADD COLUMN IF NOT EXISTS) e EXIGE que as
-- policies legadas abertas (anon_all/auth_all USING true) ja tenham sido removidas e que a
-- policy de admin ja esteja restrita a workspace_id IS NULL, para que linhas de workspace
-- nunca fiquem visiveis ao admin legado nem a anon.
--
-- Pre-requisitos: can_manage_workspace_clinical(uuid), patients(workspace_id, id) unico.
-- Nenhuma linha existente e alterada ou backfillada.

DO $patient_reports_preflight$
DECLARE
  v_policy record;
BEGIN
  IF to_regprocedure('public.can_manage_workspace_clinical(uuid)') IS NULL
     OR to_regclass('public.patient_reports') IS NULL
     OR to_regclass('public.patients') IS NULL
     OR to_regclass('public.workspaces') IS NULL THEN
    RAISE EXCEPTION 'workspace patient_reports prerequisites are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'public.patient_reports'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on public.patient_reports';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index idx
    WHERE idx.indrelid = 'public.patients'::regclass
      AND idx.indisunique AND idx.indisvalid
      AND pg_get_indexdef(idx.indexrelid) ILIKE '%(workspace_id, id)%'
  ) THEN
    RAISE EXCEPTION 'required unique index patients(workspace_id, id) is missing';
  END IF;

  -- Nenhuma policy totalmente aberta pode coexistir (policies permissivas sao OR).
  FOR v_policy IN
    SELECT policyname, qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_reports'
      AND permissive = 'PERMISSIVE'
      AND (roles && ARRAY['anon', 'authenticated', 'public']::name[])
      AND regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g') = 'true'
  LOOP
    RAISE EXCEPTION 'open policy % on public.patient_reports must be removed first', v_policy.policyname;
  END LOOP;

  -- Se a policy de admin existir, precisa estar restrita a linhas legadas.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patient_reports'
      AND policyname = 'admin_all_patient_reports'
      AND regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g') NOT LIKE '%workspace_idisnull%'
  ) THEN
    RAISE EXCEPTION 'admin_all_patient_reports must be scoped to workspace_id IS NULL (apply legacy RLS candidate first)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.patient_reports'::regclass
      AND conname = 'patient_reports_workspace_patient_fkey'
      AND replace(lower(pg_get_constraintdef(oid)), ' ', '')
          NOT LIKE '%foreignkey(workspace_id,patient_id)referencespatients(workspace_id,id)%'
  ) THEN
    RAISE EXCEPTION 'patient_reports_workspace_patient_fkey exists with a different definition';
  END IF;
END
$patient_reports_preflight$;

ALTER TABLE public.patient_reports
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

DO $patient_reports_data_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.patient_reports AS report
    LEFT JOIN public.patients AS patient ON patient.id = report.patient_id
    WHERE patient.id IS NULL
       OR report.workspace_id IS DISTINCT FROM patient.workspace_id
  ) THEN
    RAISE EXCEPTION 'existing patient_reports workspace scope does not match its patient';
  END IF;
END
$patient_reports_data_preflight$;

DO $patient_reports_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.patient_reports'::regclass
      AND conname = 'patient_reports_workspace_patient_fkey'
  ) THEN
    ALTER TABLE public.patient_reports
      ADD CONSTRAINT patient_reports_workspace_patient_fkey
      FOREIGN KEY (workspace_id, patient_id)
      REFERENCES public.patients (workspace_id, id)
      MATCH SIMPLE
      ON DELETE NO ACTION
      NOT VALID;
  END IF;
END
$patient_reports_fk$;

CREATE INDEX IF NOT EXISTS patient_reports_workspace_patient_idx
  ON public.patient_reports (workspace_id, patient_id)
  WHERE workspace_id IS NOT NULL;

REVOKE ALL PRIVILEGES ON TABLE public.patient_reports FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.patient_reports TO authenticated;
DO $patient_reports_sequence_acl$
DECLARE v_sequence text;
BEGIN
  v_sequence := pg_catalog.pg_get_serial_sequence('public.patient_reports', 'id');
  IF v_sequence IS NOT NULL THEN
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC, anon', v_sequence);
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', v_sequence);
  END IF;
END
$patient_reports_sequence_acl$;

-- ─── Policies de workspace ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_select_patient_reports ON public.patient_reports;
CREATE POLICY workspace_select_patient_reports
  ON public.patient_reports FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id));

DROP POLICY IF EXISTS workspace_insert_patient_reports ON public.patient_reports;
CREATE POLICY workspace_insert_patient_reports
  ON public.patient_reports FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND public.can_manage_workspace_clinical(workspace_id)
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = patient_reports.patient_id
        AND patient.workspace_id = patient_reports.workspace_id
    )
  );

DROP POLICY IF EXISTS workspace_update_patient_reports ON public.patient_reports;
CREATE POLICY workspace_update_patient_reports
  ON public.patient_reports FOR UPDATE TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id))
  WITH CHECK (
    workspace_id IS NOT NULL
    AND public.can_manage_workspace_clinical(workspace_id)
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = patient_reports.patient_id
        AND patient.workspace_id = patient_reports.workspace_id
    )
  );

DROP POLICY IF EXISTS workspace_delete_patient_reports ON public.patient_reports;
CREATE POLICY workspace_delete_patient_reports
  ON public.patient_reports FOR DELETE TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id));

COMMENT ON COLUMN public.patient_reports.workspace_id IS
  'Escopo de workspace. NULL = relatorio legado do admin; preenchido = relatorio do workspace (RLS via can_manage_workspace_clinical).';

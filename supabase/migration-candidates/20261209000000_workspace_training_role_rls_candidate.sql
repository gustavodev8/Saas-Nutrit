-- Candidate: RLS por papel para o módulo de treino do workspace.
-- Substitui as policies wtp_member_all / wte_member_all (20261121040000_workspace_training.sql),
-- que liberavam QUALQUER membro ativo, por policies escopadas a owner/nutritionist via
-- public.can_manage_workspace_clinical(workspace_id).
--
-- NÃO aplicada automaticamente. Revisar e testar antes de promover para supabase/migrations/.

DO $preflight$
BEGIN
  IF to_regprocedure('public.can_manage_workspace_clinical(uuid)') IS NULL
     OR to_regclass('public.workspace_training_plans') IS NULL
     OR to_regclass('public.workspace_training_exercises') IS NULL THEN
    RAISE EXCEPTION 'workspace training role RLS prerequisites are missing (can_manage_workspace_clinical / training tables)';
  END IF;
END;
$preflight$;

-- ─── workspace_training_plans ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "wtp_member_all" ON public.workspace_training_plans;
DROP POLICY IF EXISTS wtp_clinical_select ON public.workspace_training_plans;
DROP POLICY IF EXISTS wtp_clinical_insert ON public.workspace_training_plans;
DROP POLICY IF EXISTS wtp_clinical_update ON public.workspace_training_plans;
DROP POLICY IF EXISTS wtp_clinical_delete ON public.workspace_training_plans;

CREATE POLICY wtp_clinical_select
  ON public.workspace_training_plans FOR SELECT TO authenticated
  USING (public.can_manage_workspace_clinical(workspace_id));

CREATE POLICY wtp_clinical_insert
  ON public.workspace_training_plans FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_workspace_clinical(workspace_id));

CREATE POLICY wtp_clinical_update
  ON public.workspace_training_plans FOR UPDATE TO authenticated
  USING (public.can_manage_workspace_clinical(workspace_id))
  WITH CHECK (public.can_manage_workspace_clinical(workspace_id));

CREATE POLICY wtp_clinical_delete
  ON public.workspace_training_plans FOR DELETE TO authenticated
  USING (public.can_manage_workspace_clinical(workspace_id));

-- ─── workspace_training_exercises ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "wte_member_all" ON public.workspace_training_exercises;
DROP POLICY IF EXISTS wte_clinical_select ON public.workspace_training_exercises;
DROP POLICY IF EXISTS wte_clinical_insert ON public.workspace_training_exercises;
DROP POLICY IF EXISTS wte_clinical_update ON public.workspace_training_exercises;
DROP POLICY IF EXISTS wte_clinical_delete ON public.workspace_training_exercises;

CREATE POLICY wte_clinical_select
  ON public.workspace_training_exercises FOR SELECT TO authenticated
  USING (public.can_manage_workspace_clinical(workspace_id));

CREATE POLICY wte_clinical_insert
  ON public.workspace_training_exercises FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_workspace_clinical(workspace_id));

CREATE POLICY wte_clinical_update
  ON public.workspace_training_exercises FOR UPDATE TO authenticated
  USING (public.can_manage_workspace_clinical(workspace_id))
  WITH CHECK (public.can_manage_workspace_clinical(workspace_id));

CREATE POLICY wte_clinical_delete
  ON public.workspace_training_exercises FOR DELETE TO authenticated
  USING (public.can_manage_workspace_clinical(workspace_id));

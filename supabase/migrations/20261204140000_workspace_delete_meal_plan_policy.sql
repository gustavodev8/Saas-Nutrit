-- ============================================================
-- Fix (pré-piloto): nutricionista (membro do workspace) precisa EXCLUIR planos alimentares
-- ============================================================
-- Bug encontrado na QA: o botão "Excluir" de um plano alimentar não apagava nada.
-- A UI mostrava a confirmação, rodava, e recarregava a lista — mas o plano continuava
-- no banco. Causa-raiz:
--
--   deleteWorkspaceMealPlan() (src/lib/workspaceMealPlans.ts) faz um DELETE DIRETO:
--       workspaceSupabase.from("meal_plans").delete().eq(...)
--   mas meal_plans só tinha policies de DELETE via `admin_all_meal_plans`
--   (is_admin_email()). Um nutricionista comum (não-admin) é bloqueado pela RLS,
--   que casa ZERO linhas. Nesse caso o Postgres retorna SUCESSO com 0 linhas e
--   SEM erro — então o app "conclui" sem apagar nada (falha silenciosa).
--
-- Diferente das escritas de save (que passam pelo RPC SECURITY DEFINER
-- save_workspace_meal_plan), o delete é feito direto na tabela. Então aqui damos ao
-- membro ativo do workspace uma policy de DELETE escopada (igual ao padrão dos
-- SELECT: workspace_*_select_active_member).
--
-- As filhas (meals, meal_foods) NÃO precisam de policy: as FKs meals->meal_plans e
-- meal_foods->meals são ON DELETE CASCADE, e cascata de FK roda como dono da tabela,
-- IGNORANDO RLS nas filhas. Logo, 1 policy de DELETE em meal_plans resolve o delete
-- inteiro. Apenas DELETE; INSERT/UPDATE continuam pelo admin/RPC. Idempotente.
-- ============================================================

drop policy if exists "workspace_meal_plans_delete_active_member" on meal_plans;
create policy "workspace_meal_plans_delete_active_member"
  on meal_plans
  for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and status = 'active'
    )
  );

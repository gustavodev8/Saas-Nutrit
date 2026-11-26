-- ============================================================
-- Permitir que membro do workspace EXCLUA avaliações antropométricas
-- ============================================================
-- measurements tinha INSERT/UPDATE/SELECT de membro (workspace_measurements_*),
-- mas NÃO tinha DELETE — então excluir avaliação ficava bloqueado no workspace.
-- measurements é tabela-folha (sem filhos), então basta uma policy de DELETE
-- escopada por workspace do membro ativo. Idempotente.
-- ============================================================

drop policy if exists "workspace_measurements_delete_active_member" on measurements;
create policy "workspace_measurements_delete_active_member"
  on measurements
  for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and status = 'active'
    )
  );

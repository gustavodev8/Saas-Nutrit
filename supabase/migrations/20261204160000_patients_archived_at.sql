-- ============================================================
-- Arquivamento de paciente no workspace (soft delete reversível)
-- ============================================================
-- O workspace não tinha como "remover" um paciente da lista. Em vez de hard
-- delete (que cascatearia e apagaria todo o histórico clínico — irreversível),
-- usamos arquivamento: uma coluna archived_at nullable. Paciente arquivado some
-- da lista ativa mas continua no banco e pode ser restaurado.
--
-- Arquivar/restaurar é feito via UPDATE (setar/limpar archived_at), reusando a
-- policy workspace_patients_update_active_member já existente — não precisa de
-- policy nova. Idempotente.
-- ============================================================

alter table patients add column if not exists archived_at timestamptz;

-- Índice parcial para a listagem ativa (archived_at is null) por workspace.
create index if not exists idx_patients_active_by_workspace
  on patients (workspace_id)
  where archived_at is null;

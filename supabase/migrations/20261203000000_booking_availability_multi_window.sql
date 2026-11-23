-- ============================================================
-- Booking availability: multiple time windows per day of week
-- ============================================================
-- Propósito: permitir mais de um intervalo de disponibilidade no mesmo dia
-- da semana (ex.: manhã 08:00-12:00 e tarde 14:00-18:00).
--
-- A migração original (20261121_workspace_booking_system.sql) criou
-- UNIQUE(workspace_id, day_of_week), o que impede 2+ janelas no mesmo dia.
-- Esta migração remove essa constraint e adiciona:
--   - sort_order: ordenação das janelas dentro do dia
--   - índice não único (workspace_id, day_of_week) para consultas por dia
--
-- Idempotente: pode ser executada mais de uma vez sem erro.
-- Não altera RLS: as policies existentes continuam válidas.
--
-- IMPORTANTE: aplicar ANTES de usar a UI de múltiplas janelas em produção.
-- Caso contrário, o 2º INSERT no mesmo dia viola a unique antiga.
-- ============================================================

-- Remove a unique antiga (nome auto-gerado pelo Postgres para o UNIQUE inline)
ALTER TABLE workspace_booking_availability
  DROP CONSTRAINT IF EXISTS workspace_booking_availability_workspace_id_day_of_week_key;

-- Ordenação das janelas dentro do mesmo dia
ALTER TABLE workspace_booking_availability
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

-- Índice para consulta por dia (substitui o índice implícito da unique removida)
CREATE INDEX IF NOT EXISTS idx_booking_availability_ws_day
  ON workspace_booking_availability(workspace_id, day_of_week);

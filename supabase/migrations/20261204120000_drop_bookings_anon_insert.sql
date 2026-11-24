-- ============================================================
-- Hardening: remover INSERT anônimo direto em workspace_bookings
-- ============================================================
-- A policy legada `bookings_anon_insert` (INSERT, role anon, WITH CHECK true)
-- permitia que qualquer visitante anônimo inserisse reservas com QUALQUER
-- workspace_id e qualquer dado, direto na tabela — sem checagem de conflito,
-- sem pagamento, sem validação. Vetor de spam/abuso.
--
-- O fluxo legítimo NÃO usa esse caminho: a página pública chama o edge function
-- `create-workspace-booking-payment`, que insere via RPC `create_workspace_booking_atomic`
-- (SECURITY DEFINER / service_role, com advisory lock + overlap check). A leitura
-- anônima de horários (fetchBookedSlots) usa uma policy de SELECT separada e não é afetada.
--
-- Removendo a policy, toda criação de reserva passa a ser obrigada a ir pelo
-- caminho validado (defense in depth). Idempotente e reversível.
-- ============================================================

drop policy if exists "bookings_anon_insert" on workspace_bookings;

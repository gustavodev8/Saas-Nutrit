-- Candidate: Exames no workspace (multi-tenant).
-- Dá a membros ativos (owner/nutritionist) de um workspace acesso aos pedidos de exame
-- dos seus pacientes, e leitura da biblioteca global de exames/protocolos.
--
-- Decisões de projeto:
--  * As tabelas-filhas (patient_exam_request_items, patient_exam_results) NÃO ganham
--    workspace_id nem FK composta. O escopo é feito pela requisição-pai via RLS. Isso evita
--    repetir o bug de embed ambíguo (2 FKs para a mesma tabela) que quebrou os planos.
--  * Escritas multi-linha (criar pedido + itens; salvar resultados) passam por RPC
--    SECURITY DEFINER atômico, no molde de save_workspace_meal_plan.
--  * Catálogo/protocolos globais são referência só-leitura para qualquer membro de workspace.
--
-- NÃO aplicada automaticamente. Revisar e testar antes de promover para supabase/migrations/.

DO $preflight$
BEGIN
  IF to_regprocedure('public.can_manage_workspace_clinical(uuid)') IS NULL
     OR to_regclass('public.patient_exam_requests') IS NULL
     OR to_regclass('public.patient_exam_request_items') IS NULL
     OR to_regclass('public.patient_exam_results') IS NULL
     OR to_regclass('public.global_exams_catalog') IS NULL
     OR to_regclass('public.global_exam_protocols') IS NULL
     OR to_regclass('public.global_protocol_items') IS NULL
     OR to_regclass('public.patient_audit_logs') IS NULL THEN
    RAISE EXCEPTION 'workspace exams prerequisites are missing';
  END IF;
END;
$preflight$;

-- ─── Leitura da biblioteca global (referência só-leitura p/ membros de workspace) ──────────
-- Helper: usuário é membro ativo de pelo menos um workspace.
CREATE OR REPLACE FUNCTION public.is_active_workspace_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $fn$
  SELECT auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
    )
$fn$;

REVOKE ALL ON FUNCTION public.is_active_workspace_member() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_active_workspace_member() TO authenticated;

DROP POLICY IF EXISTS workspace_read_global_exams_catalog ON public.global_exams_catalog;
CREATE POLICY workspace_read_global_exams_catalog
  ON public.global_exams_catalog FOR SELECT TO authenticated
  USING (public.is_active_workspace_member());

DROP POLICY IF EXISTS workspace_read_global_exam_protocols ON public.global_exam_protocols;
CREATE POLICY workspace_read_global_exam_protocols
  ON public.global_exam_protocols FOR SELECT TO authenticated
  USING (public.is_active_workspace_member());

DROP POLICY IF EXISTS workspace_read_global_protocol_items ON public.global_protocol_items;
CREATE POLICY workspace_read_global_protocol_items
  ON public.global_protocol_items FOR SELECT TO authenticated
  USING (public.is_active_workspace_member());

-- ─── Pedidos de exame (cabeçalho) ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_select_exam_requests ON public.patient_exam_requests;
CREATE POLICY workspace_select_exam_requests
  ON public.patient_exam_requests FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id));

-- INSERT/UPDATE direto é bloqueado; escrita de cabeçalho só via RPC (DEFINER). Mas permitimos
-- UPDATE de status e DELETE pelo membro, para ações simples sem múltiplas linhas.
DROP POLICY IF EXISTS workspace_update_exam_requests ON public.patient_exam_requests;
CREATE POLICY workspace_update_exam_requests
  ON public.patient_exam_requests FOR UPDATE TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id));

DROP POLICY IF EXISTS workspace_delete_exam_requests ON public.patient_exam_requests;
CREATE POLICY workspace_delete_exam_requests
  ON public.patient_exam_requests FOR DELETE TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id));

-- ─── Itens do pedido (escopo via pai) ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_select_exam_request_items ON public.patient_exam_request_items;
CREATE POLICY workspace_select_exam_request_items
  ON public.patient_exam_request_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.patient_exam_requests r
    WHERE r.id = patient_exam_request_items.request_id
      AND r.workspace_id IS NOT NULL
      AND public.can_manage_workspace_clinical(r.workspace_id)
  ));

-- ─── Resultados (escopo via pai) ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_select_exam_results ON public.patient_exam_results;
CREATE POLICY workspace_select_exam_results
  ON public.patient_exam_results FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.patient_exam_requests r
    WHERE r.id = patient_exam_results.request_id
      AND r.workspace_id IS NOT NULL
      AND public.can_manage_workspace_clinical(r.workspace_id)
  ));

-- ─── RPC: criar pedido de exame + itens (atômico) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_workspace_exam_request(
  p_workspace_id uuid,
  p_patient_id bigint,
  p_global_protocol_id bigint,
  p_items jsonb,
  p_notes text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
DECLARE
  v_request_id bigint;
  v_patient_name text;
  v_item jsonb;
  v_count int := 0;
BEGIN
  IF p_workspace_id IS NULL OR p_patient_id IS NULL
     OR p_items IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'workspace, patient and items array are required';
  END IF;
  IF jsonb_array_length(p_items) > 200 THEN
    RAISE EXCEPTION 'too many exam items';
  END IF;
  IF NOT public.can_manage_workspace_clinical(p_workspace_id) THEN
    RAISE EXCEPTION 'active workspace membership required' USING ERRCODE = '42501';
  END IF;

  SELECT patient.name INTO v_patient_name
  FROM public.patients patient
  WHERE patient.id = p_patient_id AND patient.workspace_id = p_workspace_id
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'patient does not belong to workspace';
  END IF;

  IF p_global_protocol_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.global_exam_protocols gp WHERE gp.id = p_global_protocol_id) THEN
    RAISE EXCEPTION 'protocol not found';
  END IF;

  INSERT INTO public.patient_exam_requests(
    patient_id, workspace_id, protocol_id, global_protocol_id, notes, status, status_key
  ) VALUES (
    p_patient_id, p_workspace_id, NULL, p_global_protocol_id,
    nullif(btrim(coalesce(p_notes, '')), ''), 'Pendente', 'pending'
  ) RETURNING id INTO v_request_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF nullif(btrim(v_item->>'exam_name'), '') IS NULL
       OR nullif(v_item->>'global_exam_id', '') IS NULL THEN
      CONTINUE;
    END IF;
    INSERT INTO public.patient_exam_request_items(
      request_id, exam_id, global_exam_id, notes, exam_name, group_category, unit,
      ref_min, ref_max, target_male_min, target_male_max, target_female_min, target_female_max
    ) VALUES (
      v_request_id, NULL, (v_item->>'global_exam_id')::bigint,
      nullif(btrim(coalesce(v_item->>'notes', '')), ''),
      btrim(v_item->>'exam_name'),
      nullif(v_item->>'group_category', ''),
      nullif(v_item->>'unit', ''),
      nullif(v_item->>'ref_min', '')::numeric,
      nullif(v_item->>'ref_max', '')::numeric,
      nullif(v_item->>'target_male_min', '')::numeric,
      nullif(v_item->>'target_male_max', '')::numeric,
      nullif(v_item->>'target_female_min', '')::numeric,
      nullif(v_item->>'target_female_max', '')::numeric
    ) ON CONFLICT (request_id, global_exam_id) DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  INSERT INTO public.patient_audit_logs(
    workspace_id, patient_id, patient_name, section_key, section_label, action, entity_type,
    entity_id, summary, actor_email, changed_fields, metadata
  ) VALUES (
    p_workspace_id, p_patient_id, v_patient_name, 'protocolos_exames', 'Protocolos de exames',
    'create', 'exam_request', v_request_id,
    v_count::text || ' exame(s) solicitado(s).',
    auth.jwt() ->> 'email', ARRAY['items', 'notes', 'status'],
    jsonb_build_object('exams_count', v_count, 'global_protocol_id', p_global_protocol_id)
  );

  RETURN v_request_id;
END
$fn$;

-- ─── RPC: salvar resultados do pedido (atômico, delete+insert) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.save_workspace_exam_results(
  p_workspace_id uuid,
  p_request_id bigint,
  p_results jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
DECLARE
  v_patient_id bigint;
  v_patient_name text;
  v_result jsonb;
  v_count int := 0;
BEGIN
  IF p_workspace_id IS NULL OR p_request_id IS NULL
     OR p_results IS NULL OR jsonb_typeof(p_results) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'workspace, request and results array are required';
  END IF;
  IF NOT public.can_manage_workspace_clinical(p_workspace_id) THEN
    RAISE EXCEPTION 'active workspace membership required' USING ERRCODE = '42501';
  END IF;

  SELECT r.patient_id INTO v_patient_id
  FROM public.patient_exam_requests r
  WHERE r.id = p_request_id AND r.workspace_id = p_workspace_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'exam request does not belong to workspace';
  END IF;

  DELETE FROM public.patient_exam_results WHERE request_id = p_request_id;

  FOR v_result IN SELECT value FROM jsonb_array_elements(p_results) LOOP
    IF nullif(v_result->>'global_exam_id', '') IS NULL THEN
      CONTINUE;
    END IF;
    INSERT INTO public.patient_exam_results(
      request_id, exam_id, global_exam_id, result_value, date_collected, notes
    ) VALUES (
      p_request_id, NULL, (v_result->>'global_exam_id')::bigint,
      nullif(v_result->>'result_value', '')::numeric,
      nullif(v_result->>'date_collected', '')::date,
      nullif(btrim(coalesce(v_result->>'notes', '')), '')
    ) ON CONFLICT (request_id, global_exam_id) DO UPDATE
      SET result_value = EXCLUDED.result_value,
          date_collected = EXCLUDED.date_collected,
          notes = EXCLUDED.notes;
    v_count := v_count + 1;
  END LOOP;

  SELECT patient.name INTO v_patient_name FROM public.patients patient WHERE patient.id = v_patient_id;
  INSERT INTO public.patient_audit_logs(
    workspace_id, patient_id, patient_name, section_key, section_label, action, entity_type,
    entity_id, summary, actor_email, changed_fields, metadata
  ) VALUES (
    p_workspace_id, v_patient_id, v_patient_name, 'protocolos_exames', 'Protocolos de exames',
    'update', 'exam_request', p_request_id,
    'Resultados laboratoriais atualizados para o pedido #' || p_request_id::text || '.',
    auth.jwt() ->> 'email', ARRAY['results'],
    jsonb_build_object('total_results', v_count)
  );

  RETURN true;
END
$fn$;

REVOKE ALL ON FUNCTION public.create_workspace_exam_request(uuid, bigint, bigint, jsonb, text) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.save_workspace_exam_results(uuid, bigint, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_workspace_exam_request(uuid, bigint, bigint, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_workspace_exam_results(uuid, bigint, jsonb) TO authenticated;

COMMENT ON FUNCTION public.create_workspace_exam_request(uuid, bigint, bigint, jsonb, text) IS
  'Cria um pedido de exame + itens para um paciente do workspace, de forma atômica e escopada por membership.';
COMMENT ON FUNCTION public.save_workspace_exam_results(uuid, bigint, jsonb) IS
  'Substitui os resultados de um pedido de exame do workspace, de forma atômica e escopada por membership.';

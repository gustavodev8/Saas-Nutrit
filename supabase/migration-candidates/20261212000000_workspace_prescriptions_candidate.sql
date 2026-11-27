-- LOCAL CANDIDATE ONLY (NAO APLICAR automaticamente). Prescricao magistral no workspace.
-- Da a membros ativos (owner/nutritionist) de um workspace CRUD sobre os receituarios dos
-- pacientes do proprio workspace, e leitura da biblioteca GLOBAL de substratos/formulas prontas.
--
-- Decisoes de projeto:
--  * A biblioteca (substrates, ready_formulas, formula_items) e GLOBAL, gerenciada centralmente
--    (admin). O workspace so LE (mesmo modelo dos catalogos de alimentos e exames). Nenhuma
--    policy de escrita e criada para ela.
--  * O receituario (prescriptions -> prescription_blocks -> prescription_block_items) e POR
--    workspace. prescriptions ganha workspace_id + FK composta (workspace_id, patient_id) ->
--    patients(workspace_id, id). Blocos e itens recebem o marcador workspace_id (o candidate
--    20261104020000 restringe admin_all_* a "workspace_id IS NULL"; sem o marcador nas filhas,
--    linhas de workspace ficariam visiveis ao admin legado). Quem preenche e a RPC.
--  * Escrita multi-linha (receituario + blocos + itens) passa por RPC SECURITY DEFINER atomico,
--    no molde de create_workspace_exam_request. Policies de INSERT/UPDATE diretas existem como
--    defesa em profundidade, escopadas por membership e pelo paciente do workspace.
--
-- Pre-requisitos: can_manage_workspace_clinical(uuid), patients(workspace_id, id) unico, e o
-- candidate 20261104020000 (admin_all_* restrito a workspace_id IS NULL, policies abertas removidas).
-- Nenhuma linha existente e alterada ou backfillada.

DO $prescriptions_preflight$
DECLARE
  v_table text;
  v_policy record;
BEGIN
  IF to_regprocedure('public.can_manage_workspace_clinical(uuid)') IS NULL
     OR to_regclass('public.workspaces') IS NULL
     OR to_regclass('public.workspace_members') IS NULL
     OR to_regclass('public.patients') IS NULL
     OR to_regclass('public.patient_audit_logs') IS NULL
     OR to_regclass('public.substrates') IS NULL
     OR to_regclass('public.ready_formulas') IS NULL
     OR to_regclass('public.formula_items') IS NULL
     OR to_regclass('public.prescriptions') IS NULL
     OR to_regclass('public.prescription_blocks') IS NULL
     OR to_regclass('public.prescription_block_items') IS NULL THEN
    RAISE EXCEPTION 'workspace prescriptions prerequisites are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index idx
    WHERE idx.indrelid = 'public.patients'::regclass
      AND idx.indisunique AND idx.indisvalid
      AND pg_get_indexdef(idx.indexrelid) ILIKE '%(workspace_id, id)%'
  ) THEN
    RAISE EXCEPTION 'required unique index patients(workspace_id, id) is missing';
  END IF;

  FOREACH v_table IN ARRAY ARRAY['prescriptions', 'prescription_blocks', 'prescription_block_items'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class
      WHERE oid = to_regclass(format('public.%I', v_table)) AND relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on public.%', v_table;
    END IF;

    -- Policies permissivas sao OR: nenhuma totalmente aberta pode coexistir.
    FOR v_policy IN
      SELECT policyname, qual
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table
        AND permissive = 'PERMISSIVE'
        AND (roles && ARRAY['anon', 'authenticated', 'public']::name[])
        AND regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      RAISE EXCEPTION 'open policy % on public.% must be removed first', v_policy.policyname, v_table;
    END LOOP;

    -- Se a policy de admin existir, precisa estar restrita a linhas legadas.
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table
        AND policyname = 'admin_all_' || v_table
        AND regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g') NOT LIKE '%workspace_idisnull%'
    ) THEN
      RAISE EXCEPTION 'admin_all_% must be scoped to workspace_id IS NULL (apply legacy RLS candidate first)', v_table;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.prescriptions'::regclass
      AND conname = 'prescriptions_workspace_patient_fkey'
      AND replace(lower(pg_get_constraintdef(oid)), ' ', '')
          NOT LIKE '%foreignkey(workspace_id,patient_id)referencespatients(workspace_id,id)%'
  ) THEN
    RAISE EXCEPTION 'prescriptions_workspace_patient_fkey exists with a different definition';
  END IF;
END
$prescriptions_preflight$;

-- ─── Colunas de escopo ────────────────────────────────────────────────────────────────────
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE public.prescription_blocks ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE public.prescription_block_items ADD COLUMN IF NOT EXISTS workspace_id uuid;

DO $prescriptions_data_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.prescriptions AS p
    LEFT JOIN public.patients AS patient ON patient.id = p.patient_id
    WHERE patient.id IS NULL
       OR p.workspace_id IS DISTINCT FROM patient.workspace_id
  ) THEN
    RAISE EXCEPTION 'existing prescriptions workspace scope does not match its patient';
  END IF;
END
$prescriptions_data_preflight$;

DO $prescriptions_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.prescriptions'::regclass
      AND conname = 'prescriptions_workspace_patient_fkey'
  ) THEN
    ALTER TABLE public.prescriptions
      ADD CONSTRAINT prescriptions_workspace_patient_fkey
      FOREIGN KEY (workspace_id, patient_id)
      REFERENCES public.patients (workspace_id, id)
      MATCH SIMPLE
      ON DELETE NO ACTION
      NOT VALID;
  END IF;
END
$prescriptions_fk$;

CREATE INDEX IF NOT EXISTS prescriptions_workspace_patient_idx
  ON public.prescriptions (workspace_id, patient_id)
  WHERE workspace_id IS NOT NULL;

-- ─── Privilegios ──────────────────────────────────────────────────────────────────────────
REVOKE ALL PRIVILEGES ON TABLE public.prescriptions, public.prescription_blocks,
  public.prescription_block_items FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prescriptions, public.prescription_blocks,
  public.prescription_block_items TO authenticated;
GRANT SELECT ON TABLE public.substrates, public.ready_formulas, public.formula_items TO authenticated;

DO $prescriptions_sequence_acl$
DECLARE
  v_table text;
  v_sequence text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['prescriptions', 'prescription_blocks', 'prescription_block_items'] LOOP
    v_sequence := pg_catalog.pg_get_serial_sequence(format('public.%I', v_table), 'id');
    IF v_sequence IS NOT NULL THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC, anon', v_sequence);
      EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', v_sequence);
    END IF;
  END LOOP;
END
$prescriptions_sequence_acl$;

-- ─── Leitura da biblioteca global (referencia so-leitura p/ membros de workspace) ───────────
-- Helper: usuario e membro ativo de pelo menos um workspace (idem candidate de exames).
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

DROP POLICY IF EXISTS workspace_read_substrates ON public.substrates;
CREATE POLICY workspace_read_substrates
  ON public.substrates FOR SELECT TO authenticated
  USING (public.is_active_workspace_member());

DROP POLICY IF EXISTS workspace_read_ready_formulas ON public.ready_formulas;
CREATE POLICY workspace_read_ready_formulas
  ON public.ready_formulas FOR SELECT TO authenticated
  USING (public.is_active_workspace_member());

DROP POLICY IF EXISTS workspace_read_formula_items ON public.formula_items;
CREATE POLICY workspace_read_formula_items
  ON public.formula_items FOR SELECT TO authenticated
  USING (public.is_active_workspace_member());

-- ─── Receituario (cabecalho) ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_select_prescriptions ON public.prescriptions;
CREATE POLICY workspace_select_prescriptions
  ON public.prescriptions FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id));

DROP POLICY IF EXISTS workspace_insert_prescriptions ON public.prescriptions;
CREATE POLICY workspace_insert_prescriptions
  ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND public.can_manage_workspace_clinical(workspace_id)
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = prescriptions.patient_id
        AND patient.workspace_id = prescriptions.workspace_id
    )
  );

DROP POLICY IF EXISTS workspace_update_prescriptions ON public.prescriptions;
CREATE POLICY workspace_update_prescriptions
  ON public.prescriptions FOR UPDATE TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id))
  WITH CHECK (
    workspace_id IS NOT NULL
    AND public.can_manage_workspace_clinical(workspace_id)
    AND EXISTS (
      SELECT 1 FROM public.patients AS patient
      WHERE patient.id = prescriptions.patient_id
        AND patient.workspace_id = prescriptions.workspace_id
    )
  );

DROP POLICY IF EXISTS workspace_delete_prescriptions ON public.prescriptions;
CREATE POLICY workspace_delete_prescriptions
  ON public.prescriptions FOR DELETE TO authenticated
  USING (workspace_id IS NOT NULL AND public.can_manage_workspace_clinical(workspace_id));

-- ─── Blocos (escopo via pai) ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_select_prescription_blocks ON public.prescription_blocks;
CREATE POLICY workspace_select_prescription_blocks
  ON public.prescription_blocks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_blocks.prescription_id
      AND p.workspace_id IS NOT NULL
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ));

DROP POLICY IF EXISTS workspace_insert_prescription_blocks ON public.prescription_blocks;
CREATE POLICY workspace_insert_prescription_blocks
  ON public.prescription_blocks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_blocks.prescription_id
      AND p.workspace_id IS NOT NULL
      AND p.workspace_id = prescription_blocks.workspace_id
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ));

DROP POLICY IF EXISTS workspace_update_prescription_blocks ON public.prescription_blocks;
CREATE POLICY workspace_update_prescription_blocks
  ON public.prescription_blocks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_blocks.prescription_id
      AND p.workspace_id IS NOT NULL
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_blocks.prescription_id
      AND p.workspace_id IS NOT NULL
      AND p.workspace_id = prescription_blocks.workspace_id
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ));

DROP POLICY IF EXISTS workspace_delete_prescription_blocks ON public.prescription_blocks;
CREATE POLICY workspace_delete_prescription_blocks
  ON public.prescription_blocks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_blocks.prescription_id
      AND p.workspace_id IS NOT NULL
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ));

-- ─── Itens (escopo via bloco -> receituario) ──────────────────────────────────────────────
DROP POLICY IF EXISTS workspace_select_prescription_block_items ON public.prescription_block_items;
CREATE POLICY workspace_select_prescription_block_items
  ON public.prescription_block_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.prescription_blocks b
    JOIN public.prescriptions p ON p.id = b.prescription_id
    WHERE b.id = prescription_block_items.block_id
      AND p.workspace_id IS NOT NULL
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ));

DROP POLICY IF EXISTS workspace_insert_prescription_block_items ON public.prescription_block_items;
CREATE POLICY workspace_insert_prescription_block_items
  ON public.prescription_block_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.prescription_blocks b
    JOIN public.prescriptions p ON p.id = b.prescription_id
    WHERE b.id = prescription_block_items.block_id
      AND p.workspace_id IS NOT NULL
      AND p.workspace_id = prescription_block_items.workspace_id
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ));

DROP POLICY IF EXISTS workspace_update_prescription_block_items ON public.prescription_block_items;
CREATE POLICY workspace_update_prescription_block_items
  ON public.prescription_block_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.prescription_blocks b
    JOIN public.prescriptions p ON p.id = b.prescription_id
    WHERE b.id = prescription_block_items.block_id
      AND p.workspace_id IS NOT NULL
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.prescription_blocks b
    JOIN public.prescriptions p ON p.id = b.prescription_id
    WHERE b.id = prescription_block_items.block_id
      AND p.workspace_id IS NOT NULL
      AND p.workspace_id = prescription_block_items.workspace_id
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ));

DROP POLICY IF EXISTS workspace_delete_prescription_block_items ON public.prescription_block_items;
CREATE POLICY workspace_delete_prescription_block_items
  ON public.prescription_block_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.prescription_blocks b
    JOIN public.prescriptions p ON p.id = b.prescription_id
    WHERE b.id = prescription_block_items.block_id
      AND p.workspace_id IS NOT NULL
      AND public.can_manage_workspace_clinical(p.workspace_id)
  ));

-- ─── RPC: criar/atualizar receituario + blocos + itens (atomico) ──────────────────────────
-- p_prescription_id NULL => cria; informado => substitui os blocos do receituario existente.
-- p_blocks: [{label, pharmaceutical_form, posology, items:[{substrate_id, name, dose, unit}]}]
CREATE OR REPLACE FUNCTION public.save_workspace_prescription(
  p_workspace_id uuid,
  p_patient_id bigint,
  p_prescription_id bigint,
  p_blocks jsonb,
  p_notes text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
DECLARE
  v_prescription_id bigint;
  v_patient_name text;
  v_block jsonb;
  v_item jsonb;
  v_block_id bigint;
  v_block_idx int := 0;
  v_item_idx int;
  v_blocks_count int := 0;
  v_items_count int := 0;
  v_substrate_id bigint;
BEGIN
  IF p_workspace_id IS NULL OR p_patient_id IS NULL
     OR p_blocks IS NULL OR jsonb_typeof(p_blocks) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'workspace, patient and blocks array are required';
  END IF;
  IF jsonb_array_length(p_blocks) > 50 THEN
    RAISE EXCEPTION 'too many prescription blocks';
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

  IF p_prescription_id IS NULL THEN
    INSERT INTO public.prescriptions(patient_id, workspace_id, notes)
    VALUES (p_patient_id, p_workspace_id, nullif(btrim(coalesce(p_notes, '')), ''))
    RETURNING id INTO v_prescription_id;
  ELSE
    SELECT p.id INTO v_prescription_id
    FROM public.prescriptions p
    WHERE p.id = p_prescription_id
      AND p.workspace_id = p_workspace_id
      AND p.patient_id = p_patient_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'prescription does not belong to workspace patient';
    END IF;
    -- Itens caem em cascata (prescription_block_items.block_id ON DELETE CASCADE).
    DELETE FROM public.prescription_blocks WHERE prescription_id = v_prescription_id;
  END IF;

  FOR v_block IN SELECT value FROM jsonb_array_elements(p_blocks) LOOP
    IF jsonb_typeof(v_block->'items') IS DISTINCT FROM 'array'
       OR jsonb_array_length(v_block->'items') = 0 THEN
      CONTINUE;
    END IF;
    IF jsonb_array_length(v_block->'items') > 100 THEN
      RAISE EXCEPTION 'too many items in prescription block';
    END IF;

    INSERT INTO public.prescription_blocks(
      prescription_id, workspace_id, label, pharmaceutical_form, posology, sort_order
    ) VALUES (
      v_prescription_id, p_workspace_id,
      coalesce(nullif(btrim(v_block->>'label'), ''), 'Fórmula ' || (v_block_idx + 1)::text),
      coalesce(nullif(btrim(v_block->>'pharmaceutical_form'), ''), 'Cápsulas'),
      nullif(btrim(coalesce(v_block->>'posology', '')), ''),
      v_block_idx
    ) RETURNING id INTO v_block_id;
    v_block_idx := v_block_idx + 1;
    v_blocks_count := v_blocks_count + 1;
    v_item_idx := 0;

    FOR v_item IN SELECT value FROM jsonb_array_elements(v_block->'items') LOOP
      IF nullif(btrim(v_item->>'name'), '') IS NULL THEN
        CONTINUE;
      END IF;
      -- substrate_id e referencia opcional ao catalogo global; ignora ids inexistentes.
      v_substrate_id := NULL;
      IF nullif(v_item->>'substrate_id', '') IS NOT NULL THEN
        SELECT s.id INTO v_substrate_id
        FROM public.substrates s
        WHERE s.id = (v_item->>'substrate_id')::bigint;
      END IF;
      INSERT INTO public.prescription_block_items(
        block_id, workspace_id, substrate_id, name, dose, unit, sort_order
      ) VALUES (
        v_block_id, p_workspace_id, v_substrate_id,
        btrim(v_item->>'name'),
        coalesce(nullif(v_item->>'dose', '')::numeric, 0),
        coalesce(nullif(btrim(v_item->>'unit'), ''), 'mg'),
        v_item_idx
      );
      v_item_idx := v_item_idx + 1;
      v_items_count := v_items_count + 1;
    END LOOP;
  END LOOP;

  IF v_items_count = 0 THEN
    RAISE EXCEPTION 'prescription requires at least one item';
  END IF;

  INSERT INTO public.patient_audit_logs(
    workspace_id, patient_id, patient_name, section_key, section_label, action, entity_type,
    entity_id, summary, actor_email, changed_fields, metadata
  ) VALUES (
    p_workspace_id, p_patient_id, v_patient_name, 'prescricao', 'Prescrição',
    CASE WHEN p_prescription_id IS NULL THEN 'create' ELSE 'update' END,
    'prescription', v_prescription_id,
    CASE WHEN p_prescription_id IS NULL THEN 'Prescrição criada' ELSE 'Prescrição atualizada' END
      || ' com ' || v_blocks_count::text || ' bloco(s).',
    auth.jwt() ->> 'email', ARRAY['blocks'],
    jsonb_build_object('blocks_count', v_blocks_count, 'items_count', v_items_count)
  );

  RETURN v_prescription_id;
END
$fn$;

REVOKE ALL ON FUNCTION public.save_workspace_prescription(uuid, bigint, bigint, jsonb, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.save_workspace_prescription(uuid, bigint, bigint, jsonb, text) TO authenticated;

COMMENT ON FUNCTION public.save_workspace_prescription(uuid, bigint, bigint, jsonb, text) IS
  'Cria ou substitui um receituario magistral (blocos + itens) de um paciente do workspace, de forma atomica e escopada por membership.';
COMMENT ON COLUMN public.prescriptions.workspace_id IS
  'Escopo de workspace. NULL = receituario legado do admin; preenchido = receituario do workspace (RLS via can_manage_workspace_clinical).';

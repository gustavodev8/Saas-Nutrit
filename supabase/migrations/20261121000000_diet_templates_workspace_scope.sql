-- Fase 3: Modelos no workspace
-- Adiciona workspace_id em diet_templates para suportar modelos privados por workspace.
-- NULL = biblioteca global (visível para todos), preenchido = modelo privado do workspace.

ALTER TABLE diet_templates
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;

-- Índice para buscas por workspace
CREATE INDEX IF NOT EXISTS diet_templates_workspace_id_idx ON diet_templates(workspace_id);

-- RLS: workspace pode ver a biblioteca global (workspace_id IS NULL) + seus próprios modelos
CREATE POLICY "workspace_diet_templates_select"
  ON diet_templates FOR SELECT
  USING (
    workspace_id IS NULL
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS: workspace pode inserir seus próprios modelos
CREATE POLICY "workspace_diet_templates_insert"
  ON diet_templates FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS: workspace pode atualizar/deletar apenas seus próprios modelos
CREATE POLICY "workspace_diet_templates_update"
  ON diet_templates FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "workspace_diet_templates_delete"
  ON diet_templates FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

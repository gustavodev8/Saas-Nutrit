-- ── Consultas ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_consultations (
  id            BIGSERIAL PRIMARY KEY,
  workspace_id  UUID    NOT NULL REFERENCES workspaces(id)  ON DELETE CASCADE,
  patient_id    INTEGER NOT NULL REFERENCES patients(id)    ON DELETE CASCADE,
  consulted_at  DATE    NOT NULL DEFAULT CURRENT_DATE,
  type          TEXT    NOT NULL DEFAULT 'retorno'
                CHECK (type IN ('inicial','retorno','avaliacao','outro')),
  status        TEXT    NOT NULL DEFAULT 'realizada'
                CHECK (status IN ('agendada','realizada','cancelada')),
  duration_min  INTEGER CHECK (duration_min IS NULL OR duration_min > 0),
  notes         TEXT,
  private_notes TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workspace_consultations_workspace_patient
  ON workspace_consultations(workspace_id, patient_id);
CREATE INDEX IF NOT EXISTS workspace_consultations_date
  ON workspace_consultations(workspace_id, consulted_at DESC);

ALTER TABLE public.workspace_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY wc_member ON public.workspace_consultations
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_consultations.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
  ));

-- ── Recordatório Alimentar 24h ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_dietary_recalls (
  id              BIGSERIAL PRIMARY KEY,
  workspace_id    UUID    NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  patient_id      INTEGER NOT NULL REFERENCES patients(id)   ON DELETE CASCADE,
  recall_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
  meals           JSONB   NOT NULL DEFAULT '[]'::jsonb,
  -- meals = [{ label, description, kcal, protein_g, carbs_g, fat_g }]
  total_kcal      NUMERIC(8,1),
  total_protein_g NUMERIC(8,1),
  total_carbs_g   NUMERIC(8,1),
  total_fat_g     NUMERIC(8,1),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workspace_recalls_workspace_patient
  ON workspace_dietary_recalls(workspace_id, patient_id);

ALTER TABLE public.workspace_dietary_recalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY wdr_member ON public.workspace_dietary_recalls
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_dietary_recalls.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
  ));

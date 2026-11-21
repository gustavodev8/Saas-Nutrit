-- ─────────────────────────────────────────────────────────────────────────────
-- Workspace Training Module
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_training_plans (
  id               SERIAL PRIMARY KEY,
  workspace_id     UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  patient_id       INTEGER     NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  goal             TEXT        CHECK (goal IN ('hipertrofia','emagrecimento','condicionamento','saude','forca','reabilitacao','outro')),
  frequency_per_week SMALLINT  CHECK (frequency_per_week BETWEEN 1 AND 7),
  duration_weeks   SMALLINT,
  notes            TEXT,
  status           TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workspace_training_plans_ws_patient
  ON workspace_training_plans (workspace_id, patient_id);

CREATE TABLE IF NOT EXISTS workspace_training_exercises (
  id            SERIAL PRIMARY KEY,
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id       INTEGER     NOT NULL REFERENCES workspace_training_plans(id) ON DELETE CASCADE,
  day_label     TEXT        NOT NULL DEFAULT 'A',
  exercise_name TEXT        NOT NULL,
  sets          SMALLINT,
  reps          TEXT,
  load_kg       NUMERIC(6,2),
  rest_seconds  SMALLINT,
  notes         TEXT,
  position      SMALLINT    NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workspace_training_exercises_plan
  ON workspace_training_exercises (plan_id);

-- RLS
ALTER TABLE workspace_training_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_training_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wtp_member_all"
  ON workspace_training_plans FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "wte_member_all"
  ON workspace_training_exercises FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

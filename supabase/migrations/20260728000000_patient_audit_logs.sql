CREATE TABLE IF NOT EXISTS patient_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  section_key TEXT NOT NULL,
  section_label TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  summary TEXT NOT NULL,
  actor_email TEXT,
  changed_fields TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_audit_logs_created_at
  ON patient_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_audit_logs_patient_created
  ON patient_audit_logs (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_audit_logs_section_created
  ON patient_audit_logs (section_key, created_at DESC);

ALTER TABLE patient_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'patient_audit_logs'
      AND policyname = 'authenticated_all_patient_audit_logs'
  ) THEN
    CREATE POLICY "authenticated_all_patient_audit_logs"
      ON patient_audit_logs
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

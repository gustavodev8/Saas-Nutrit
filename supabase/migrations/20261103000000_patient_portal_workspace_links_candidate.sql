-- LOCAL CANDIDATE ONLY: review and test after the complete local migration replay.
-- Not authorization to apply this migration to any remote or production database.
-- Links are explicit authorization; a selected workspace is only a query filter.
-- No email/CPF matching, legacy-account backfill, or clinical policy changes.

CREATE TABLE public.patient_portal_workspace_links (
  auth_user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL
    REFERENCES public.workspaces(id) ON DELETE NO ACTION,
  patient_id bigint NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT patient_portal_workspace_links_pkey
    PRIMARY KEY (auth_user_id, workspace_id, patient_id),
  CONSTRAINT patient_portal_workspace_links_status_timestamp_check
    CHECK (
      (status = 'active' AND revoked_at IS NULL)
      OR (status = 'revoked' AND revoked_at IS NOT NULL)
    ),
  CONSTRAINT patient_portal_workspace_links_patient_workspace_fkey
    FOREIGN KEY (workspace_id, patient_id)
    REFERENCES public.patients(workspace_id, id)
    ON DELETE CASCADE
);

CREATE INDEX patient_portal_workspace_links_patient_idx
  ON public.patient_portal_workspace_links (workspace_id, patient_id);

ALTER TABLE public.patient_portal_workspace_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.patient_portal_workspace_links
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.patient_portal_workspace_links TO authenticated;

CREATE POLICY patient_portal_workspace_links_select_own_active
  ON public.patient_portal_workspace_links
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    AND status = 'active'
  );

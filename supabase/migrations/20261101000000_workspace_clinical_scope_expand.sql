-- Expand-only workspace scope. Existing rows remain NULL and policies are unchanged.
-- Do not backfill or require these columns until legacy ownership is mapped and
-- workspace-scoped policies have passed review.

ALTER TABLE public.patients
  ADD COLUMN workspace_id uuid;

ALTER TABLE public.patients
  ADD CONSTRAINT patients_workspace_id_fkey
  FOREIGN KEY (workspace_id)
  REFERENCES public.workspaces(id)
  ON DELETE NO ACTION
  NOT VALID;

-- This unique index is required as the target of the composite patient FKs.
-- Measure table size and plan the deployment window before remote rollout;
-- the CLI migration pipeline cannot run CREATE INDEX CONCURRENTLY.
CREATE UNIQUE INDEX patients_workspace_id_id_key
  ON public.patients (workspace_id, id);

ALTER TABLE public.bookings
  ADD COLUMN workspace_id uuid;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_workspace_id_fkey
  FOREIGN KEY (workspace_id)
  REFERENCES public.workspaces(id)
  ON DELETE NO ACTION
  NOT VALID,
  ADD CONSTRAINT bookings_workspace_patient_fkey
  FOREIGN KEY (workspace_id, patient_id)
  REFERENCES public.patients(workspace_id, id)
  MATCH SIMPLE
  ON DELETE NO ACTION
  NOT VALID;

CREATE INDEX bookings_workspace_patient_idx
  ON public.bookings (workspace_id, patient_id)
  WHERE workspace_id IS NOT NULL;

ALTER TABLE public.meal_plans
  ADD COLUMN workspace_id uuid;

ALTER TABLE public.meal_plans
  ADD CONSTRAINT meal_plans_workspace_id_fkey
  FOREIGN KEY (workspace_id)
  REFERENCES public.workspaces(id)
  ON DELETE NO ACTION
  NOT VALID,
  ADD CONSTRAINT meal_plans_workspace_patient_fkey
  FOREIGN KEY (workspace_id, patient_id)
  REFERENCES public.patients(workspace_id, id)
  MATCH SIMPLE
  ON DELETE NO ACTION
  NOT VALID;

CREATE INDEX meal_plans_workspace_patient_idx
  ON public.meal_plans (workspace_id, patient_id)
  WHERE workspace_id IS NOT NULL;

ALTER TABLE public.patient_exam_requests
  ADD COLUMN workspace_id uuid;

ALTER TABLE public.patient_exam_requests
  ADD CONSTRAINT patient_exam_requests_workspace_id_fkey
  FOREIGN KEY (workspace_id)
  REFERENCES public.workspaces(id)
  ON DELETE NO ACTION
  NOT VALID,
  ADD CONSTRAINT patient_exam_requests_workspace_patient_fkey
  FOREIGN KEY (workspace_id, patient_id)
  REFERENCES public.patients(workspace_id, id)
  MATCH SIMPLE
  ON DELETE NO ACTION
  NOT VALID;

CREATE INDEX patient_exam_requests_workspace_patient_idx
  ON public.patient_exam_requests (workspace_id, patient_id)
  WHERE workspace_id IS NOT NULL;

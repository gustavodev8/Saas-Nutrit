import { useMemo } from "react";
import { AnamnesisForm, type AnamnesisFormAdapter } from "@/components/admin/AnamnesisForm";
import type { Anamnesis } from "@/lib/supabase";
import {
  fetchWorkspaceAnamnesis,
  isWorkspaceAnamnesisEnabled,
  upsertWorkspaceAnamnesis,
  WORKSPACE_ANAMNESIS_GATE_MESSAGE,
} from "@/lib/workspaceAnamnesis";
import type { WorkspacePatient } from "@/lib/workspacePatients";

interface WorkspaceAnamnesisFormProps {
  workspaceId: string;
  patient: WorkspacePatient;
  enabled?: boolean;
}

export function WorkspaceAnamnesisForm({ workspaceId, patient, enabled = isWorkspaceAnamnesisEnabled() }: WorkspaceAnamnesisFormProps) {
  const scopeKey = `${workspaceId}:${patient.id}`;
  const adapter = useMemo<AnamnesisFormAdapter>(() => ({
    fetch: () => fetchWorkspaceAnamnesis(workspaceId, patient.id),
    save: (anamnesis: Anamnesis) => upsertWorkspaceAnamnesis(
      workspaceId,
      patient,
      anamnesis.structured_data ?? {},
      anamnesis.id,
    ),
  }), [patient, workspaceId]);

  if (patient.workspace_id !== workspaceId) {
    return <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Paciente fora do workspace ativo.</p>;
  }

  if (!enabled) {
    return <p role="status" className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">{WORKSPACE_ANAMNESIS_GATE_MESSAGE}</p>;
  }

  return <AnamnesisForm key={scopeKey} patientId={String(patient.id)} adapter={adapter} scopeKey={scopeKey} />;
}

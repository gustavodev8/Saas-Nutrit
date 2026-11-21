import type { Anamnesis, AnamnesisStructured } from "@/lib/supabase";
import type { WorkspacePatient } from "@/lib/workspacePatients";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

const ANAMNESIS_COLUMNS = "id, workspace_id, patient_id, main_complaint, medical_history, medications, allergies, food_aversions, food_preferences, meals_per_day, water_intake, physical_activity, sleep_hours, bowel_function, goals, structured_data, updated_at";

export const WORKSPACE_ANAMNESIS_GATE_MESSAGE =
  "Recurso bloqueado: a anamnese workspace aguarda a migration candidata e a validação RLS. Nenhum dado legado será consultado.";

export type WorkspaceAnamnesis = Anamnesis & {
  id: number;
  workspace_id: string;
  structured_data: AnamnesisStructured;
};

export function isWorkspaceAnamnesisEnabled(): boolean {
  return import.meta.env.VITE_WORKSPACE_ANAMNESIS_ENABLED === "true";
}

function assertWorkspaceAnamnesisEnabled(): void {
  if (!isWorkspaceAnamnesisEnabled()) throw new Error(WORKSPACE_ANAMNESIS_GATE_MESSAGE);
}

function assertWorkspacePatient(workspaceId: string, patient: WorkspacePatient): void {
  if (!workspaceId || patient.workspace_id !== workspaceId) {
    throw new Error("O paciente não pertence ao workspace informado.");
  }
}

export function getWorkspaceAnamnesisError(error: { code?: string; message?: string }): Error {
  if (["PGRST204", "PGRST205", "42P01", "42703", "42501", "PGRST301"].includes(error.code ?? "")) {
    return new Error(WORKSPACE_ANAMNESIS_GATE_MESSAGE);
  }
  return new Error(error.message || "Não foi possível acessar a anamnese deste paciente.");
}

export async function fetchWorkspaceAnamnesis(
  workspaceId: string,
  patientId: number,
): Promise<WorkspaceAnamnesis | null> {
  assertWorkspaceAnamnesisEnabled();
  const { data, error } = await workspaceSupabase
    .from("anamnesis")
    .select(ANAMNESIS_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) throw getWorkspaceAnamnesisError(error);
  return (data ?? null) as WorkspaceAnamnesis | null;
}

export async function upsertWorkspaceAnamnesis(
  workspaceId: string,
  patient: WorkspacePatient,
  structuredData: AnamnesisStructured,
  existingId?: number,
): Promise<WorkspaceAnamnesis> {
  assertWorkspacePatient(workspaceId, patient);
  assertWorkspaceAnamnesisEnabled();

  const payload = {
    workspace_id: workspaceId,
    patient_id: patient.id,
    structured_data: structuredData,
    updated_at: new Date().toISOString(),
  };
  const query = existingId
    ? workspaceSupabase
        .from("anamnesis")
        .update(payload)
        .eq("workspace_id", workspaceId)
        .eq("patient_id", patient.id)
        .eq("id", existingId)
    : workspaceSupabase.from("anamnesis").insert(payload);
  const { data, error } = await query.select(ANAMNESIS_COLUMNS).single();

  if (error) throw getWorkspaceAnamnesisError(error);
  return data as WorkspaceAnamnesis;
}

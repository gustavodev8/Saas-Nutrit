import { workspaceSupabase } from "@/lib/workspaceSupabase";

export interface WorkspacePatient {
  id: number;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface WorkspacePatientInput {
  name: string;
  email: string;
  phone: string;
}

function normalizePatientInput(input: WorkspacePatientInput): WorkspacePatientInput {
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
  };
}

export async function fetchWorkspacePatients(workspaceId: string): Promise<WorkspacePatient[]> {
  const { data, error } = await workspaceSupabase
    .from("patients")
    .select("id, workspace_id, name, email, phone")
    .eq("workspace_id", workspaceId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspacePatient[];
}

export async function createWorkspacePatient(
  workspaceId: string,
  input: WorkspacePatientInput,
): Promise<WorkspacePatient> {
  const normalized = normalizePatientInput(input);
  if (!normalized.name) throw new Error("Informe o nome do paciente.");

  const { data, error } = await workspaceSupabase
    .from("patients")
    .insert({ workspace_id: workspaceId, ...normalized })
    .select("id, workspace_id, name, email, phone")
    .single();

  if (error) throw new Error(error.message);
  return data as WorkspacePatient;
}

export async function updateWorkspacePatient(
  workspaceId: string,
  patientId: number,
  input: WorkspacePatientInput,
): Promise<WorkspacePatient> {
  const normalized = normalizePatientInput(input);
  if (!normalized.name) throw new Error("Informe o nome do paciente.");

  const { data, error } = await workspaceSupabase
    .from("patients")
    .update(normalized)
    .eq("workspace_id", workspaceId)
    .eq("id", patientId)
    .select("id, workspace_id, name, email, phone")
    .single();

  if (error) throw new Error(error.message);
  return data as WorkspacePatient;
}

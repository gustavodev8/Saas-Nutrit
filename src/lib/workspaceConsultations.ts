import { workspaceSupabase } from "./workspaceSupabase";

export type ConsultationType   = "inicial" | "retorno" | "avaliacao" | "outro";
export type ConsultationStatus = "agendada" | "realizada" | "cancelada";

export interface WorkspaceConsultation {
  id: number;
  workspace_id: string;
  patient_id: number;
  consulted_at: string;
  type: ConsultationType;
  status: ConsultationStatus;
  duration_min: number | null;
  notes: string | null;
  private_notes: string | null;
  created_at: string;
}

export interface WorkspaceConsultationInput {
  consulted_at: string;
  type: ConsultationType;
  status: ConsultationStatus;
  duration_min?: number | null;
  notes?: string;
  private_notes?: string;
}

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
  inicial:    "Consulta inicial",
  retorno:    "Retorno",
  avaliacao:  "Avaliação",
  outro:      "Outro",
};

export const CONSULTATION_STATUS_META: Record<ConsultationStatus, { label: string; cls: string }> = {
  agendada:   { label: "Agendada",  cls: "bg-blue-50 text-blue-700 border border-blue-200"   },
  realizada:  { label: "Realizada", cls: "bg-green-50 text-green-700 border border-green-200" },
  cancelada:  { label: "Cancelada", cls: "bg-red-50 text-red-700 border border-red-200"       },
};

function handleError(err: { code?: string; message?: string }): Error {
  if (["42P01", "PGRST204", "42501", "PGRST301"].includes(err.code ?? "")) {
    return new Error("MIGRATION_PENDING");
  }
  return new Error(err.message ?? "Erro desconhecido.");
}

export async function fetchPatientConsultations(
  workspaceId: string,
  patientId: number,
): Promise<WorkspaceConsultation[]> {
  const { data, error } = await workspaceSupabase
    .from("workspace_consultations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("consulted_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw handleError(error);
  return (data ?? []) as WorkspaceConsultation[];
}

export async function fetchRecentConsultations(
  workspaceId: string,
  limit = 5,
): Promise<Array<WorkspaceConsultation & { patient_name: string; patient_id: number }>> {
  const { data, error } = await workspaceSupabase
    .from("workspace_consultations")
    .select("*, patients!inner(name)")
    .eq("workspace_id", workspaceId)
    .order("consulted_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (error) return [];
  type Row = WorkspaceConsultation & { patients: { name: string } };
  return ((data ?? []) as Row[]).map((row) => ({
    ...row,
    patient_name: row.patients?.name ?? "Paciente",
  }));
}

export async function fetchConsultationCountThisMonth(workspaceId: string): Promise<number> {
  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);

  const { count, error } = await workspaceSupabase
    .from("workspace_consultations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .gte("consulted_at", firstDay.toISOString().slice(0, 10));

  if (error) return 0;
  return count ?? 0;
}

export async function createConsultation(
  workspaceId: string,
  patientId: number,
  input: WorkspaceConsultationInput,
): Promise<WorkspaceConsultation> {
  const { data, error } = await workspaceSupabase
    .from("workspace_consultations")
    .insert({
      workspace_id:  workspaceId,
      patient_id:    patientId,
      consulted_at:  input.consulted_at,
      type:          input.type,
      status:        input.status,
      duration_min:  input.duration_min ?? null,
      notes:         input.notes?.trim() || null,
      private_notes: input.private_notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw handleError(error);
  return data as WorkspaceConsultation;
}

export async function updateConsultation(
  workspaceId: string,
  id: number,
  input: WorkspaceConsultationInput,
): Promise<WorkspaceConsultation> {
  const { data, error } = await workspaceSupabase
    .from("workspace_consultations")
    .update({
      consulted_at:  input.consulted_at,
      type:          input.type,
      status:        input.status,
      duration_min:  input.duration_min ?? null,
      notes:         input.notes?.trim() || null,
      private_notes: input.private_notes?.trim() || null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw handleError(error);
  return data as WorkspaceConsultation;
}

export async function deleteConsultation(workspaceId: string, id: number): Promise<void> {
  const { error } = await workspaceSupabase
    .from("workspace_consultations")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);

  if (error) throw handleError(error);
}

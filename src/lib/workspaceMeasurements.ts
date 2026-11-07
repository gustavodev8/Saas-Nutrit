import type { MeasurementForm, OfficialAnthropometrySource } from "@/components/admin/anthropometryTypes";
import type { SkinfoldProtocol } from "@/lib/anthropometryUtils";
import { buildAnthropometryPayload, toMeasurementRecord } from "@/lib/patientAnthropometry";
import type { Measurement } from "@/lib/supabase";
import type { WorkspacePatient } from "@/lib/workspacePatients";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

const MEASUREMENT_COLUMNS = "*";
export const WORKSPACE_MEASUREMENTS_GATE_MESSAGE =
  "Recurso bloqueado: avaliações do workspace só serão liberadas após aprovação e aplicação da migration com RLS validada. Nenhum dado global será consultado.";

export type WorkspaceMeasurement = Measurement & {
  id: number;
  workspace_id: string;
};

export type WorkspaceMeasurementInput = MeasurementForm;

export function isWorkspaceMeasurementsEnabled(): boolean {
  // Release gate only: keep disabled until the migration is applied and RLS A/B tests pass.
  // This flag is not authorization; database RLS remains the security authority.
  return import.meta.env.VITE_WORKSPACE_MEASUREMENTS_ENABLED === "true";
}

export function validateWorkspaceMeasurementInput(input: WorkspaceMeasurementInput): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.assessment_date)) {
    throw new Error("Informe uma data válida para a avaliação.");
  }
  const date = new Date(`${input.assessment_date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.assessment_date) {
    throw new Error("Informe uma data válida para a avaliação.");
  }

  const numericFields = Object.entries(input).filter(([field]) => !["assessment_date", "four_component_reference", "notes"].includes(field));
  const numbers = numericFields.map(([, value]) => typeof value === "string" && value.trim() ? Number(value) : undefined);
  if (numbers.some((value) => value !== undefined && !Number.isFinite(value))) {
    throw new Error("Revise os valores numéricos da avaliação.");
  }
  const valueFor = (field: keyof MeasurementForm) => {
    const value = input[field];
    return typeof value === "string" && value.trim() ? Number(value) : undefined;
  };
  const weight = valueFor("weight");
  const height = valueFor("height");
  const bodyFat = valueFor("bio_fat_pct");
  if (weight !== undefined && weight <= 0) throw new Error("O peso deve ser maior que zero.");
  if (height !== undefined && height <= 0) throw new Error("A altura deve ser maior que zero.");
  if (bodyFat !== undefined && (bodyFat < 0 || bodyFat > 100)) {
    throw new Error("O percentual de gordura deve estar entre 0 e 100.");
  }
  if (numbers.some((value) => value !== undefined && value < 0)) throw new Error("As medidas não podem ser negativas.");
  if (numbers.every((value) => value === undefined)) {
    throw new Error("Informe ao menos uma medida para registrar a avaliação.");
  }
}

export function getWorkspaceMeasurementError(error: { code?: string; message?: string }): Error {
  if (["PGRST204", "PGRST205", "42P01", "42703", "42501", "PGRST301"].includes(error.code ?? "")) {
    return new Error(WORKSPACE_MEASUREMENTS_GATE_MESSAGE);
  }
  return new Error(error.message || "Não foi possível acessar as avaliações deste paciente.");
}

function assertWorkspaceMeasurementsEnabled(): void {
  if (!isWorkspaceMeasurementsEnabled()) {
    throw new Error(WORKSPACE_MEASUREMENTS_GATE_MESSAGE);
  }
}

export async function fetchWorkspaceMeasurements(
  workspaceId: string,
  patientId: number,
): Promise<WorkspaceMeasurement[]> {
  assertWorkspaceMeasurementsEnabled();
  const { data, error } = await workspaceSupabase
    .from("measurements")
    .select(MEASUREMENT_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("assessment_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw getWorkspaceMeasurementError(error);
  return (data ?? []) as WorkspaceMeasurement[];
}

async function buildWorkspaceMeasurementRecord(
  workspaceId: string,
  patient: WorkspacePatient,
  input: WorkspaceMeasurementInput,
  protocol: SkinfoldProtocol,
  officialSource: OfficialAnthropometrySource,
) {
  if (patient.workspace_id !== workspaceId) {
    throw new Error("O paciente não pertence ao workspace informado.");
  }
  assertWorkspaceMeasurementsEnabled();
  validateWorkspaceMeasurementInput(input);
  const payload = await buildAnthropometryPayload({
    form: input,
    patientId: patient.id,
    patientGender: patient.gender,
    patientBirthDate: patient.birth_date,
    protocol,
    officialSource,
  });

  return { ...toMeasurementRecord(payload), workspace_id: workspaceId };
}

export async function createWorkspaceMeasurement(
  workspaceId: string,
  patient: WorkspacePatient,
  input: WorkspaceMeasurementInput,
  protocol: SkinfoldProtocol = patient.gender === "F" ? "JP3F" : "JP3M",
  officialSource: OfficialAnthropometrySource = null,
): Promise<WorkspaceMeasurement> {
  const record = await buildWorkspaceMeasurementRecord(workspaceId, patient, input, protocol, officialSource);
  const { data, error } = await workspaceSupabase
    .from("measurements")
    .insert(record)
    .select(MEASUREMENT_COLUMNS)
    .single();

  if (error) throw getWorkspaceMeasurementError(error);
  return data as WorkspaceMeasurement;
}

export async function updateWorkspaceMeasurement(
  workspaceId: string,
  patient: WorkspacePatient,
  measurementId: number,
  input: WorkspaceMeasurementInput,
  protocol: SkinfoldProtocol,
  officialSource: OfficialAnthropometrySource,
): Promise<WorkspaceMeasurement> {
  const record = await buildWorkspaceMeasurementRecord(workspaceId, patient, input, protocol, officialSource);
  const { data, error } = await workspaceSupabase
    .from("measurements")
    .update(record)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patient.id)
    .eq("id", measurementId)
    .select(MEASUREMENT_COLUMNS)
    .single();

  if (error) throw getWorkspaceMeasurementError(error);
  return data as WorkspaceMeasurement;
}

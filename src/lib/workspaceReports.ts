import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { createReportTitle, todayISO } from "@/lib/patientReportUtils";

/**
 * Camada de dados de RELATÓRIO CLÍNICO escopada por workspace (multi-tenant).
 * Todas as operações filtram por workspace_id (e patient_id quando aplicável); a RLS
 * (can_manage_workspace_clinical) é a barreira final.
 * Backend: supabase/migration-candidates/20261211000000_workspace_patient_reports_candidate.sql
 *
 * TODO: auditoria (patient_audit_logs) e envio por e-mail ficam fora do escopo desta fase.
 */

export interface WorkspacePatientReport {
  id: number;
  workspace_id: string;
  patient_id: number;
  title: string;
  report_date: string;
  report_text: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceReportInput {
  title: string;
  report_date: string;
  report_text: string;
}

/** Feature flag: módulo de Relatório do workspace. Default DESLIGADO. */
export function isWorkspaceReportsEnabled(): boolean {
  return import.meta.env.VITE_WORKSPACE_REPORTS_ENABLED === "true";
}

/** Mensagem amigável para erros da camada de relatórios (inclui MIGRATION_PENDING). */
export function workspaceReportsErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "MIGRATION_PENDING") {
      return "O módulo de Relatório ainda não está disponível neste workspace. Tente novamente mais tarde.";
    }
    return err.message;
  }
  return "Erro desconhecido.";
}

function assertScope(workspaceId: string, patientId: number): void {
  if (!workspaceId || !Number.isSafeInteger(patientId) || patientId <= 0) {
    throw new Error("Workspace e paciente são obrigatórios.");
  }
}

function assertReportScope(workspaceId: string, reportId: number): void {
  if (!workspaceId || !Number.isSafeInteger(reportId) || reportId <= 0) {
    throw new Error("Workspace e relatório são obrigatórios.");
  }
}

function handleError(err: { code?: string; message?: string }): Error {
  if (["42P01", "PGRST204", "42501", "PGRST301"].includes(err.code ?? "")) {
    return new Error("MIGRATION_PENDING");
  }
  return new Error(err.message ?? "Erro desconhecido.");
}

export async function fetchWorkspaceReports(
  workspaceId: string,
  patientId: number,
): Promise<WorkspacePatientReport[]> {
  assertScope(workspaceId, patientId);
  const { data, error } = await workspaceSupabase
    .from("patient_reports")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw handleError(error);
  return (data ?? []) as WorkspacePatientReport[];
}

export async function fetchWorkspaceReport(
  workspaceId: string,
  reportId: number,
): Promise<WorkspacePatientReport | null> {
  assertReportScope(workspaceId, reportId);
  const { data, error } = await workspaceSupabase
    .from("patient_reports")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", reportId)
    .maybeSingle();
  if (error) throw handleError(error);
  return (data as WorkspacePatientReport | null) ?? null;
}

export async function createWorkspaceReport(
  workspaceId: string,
  patientId: number,
  input: WorkspaceReportInput,
): Promise<WorkspacePatientReport> {
  assertScope(workspaceId, patientId);
  const { data, error } = await workspaceSupabase
    .from("patient_reports")
    .insert({
      workspace_id: workspaceId,
      patient_id: patientId,
      title: input.title.trim(),
      report_date: input.report_date,
      report_text: input.report_text,
    })
    .select("*")
    .single();
  if (error) throw handleError(error);
  return data as WorkspacePatientReport;
}

export async function updateWorkspaceReport(
  workspaceId: string,
  reportId: number,
  input: WorkspaceReportInput,
): Promise<WorkspacePatientReport> {
  assertReportScope(workspaceId, reportId);
  const { data, error } = await workspaceSupabase
    .from("patient_reports")
    .update({
      title: input.title.trim(),
      report_date: input.report_date,
      report_text: input.report_text,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", reportId)
    .select("*")
    .single();
  if (error) throw handleError(error);
  return data as WorkspacePatientReport;
}

/** Cria e persiste uma cópia do relatório (título "(cópia)", data de hoje). */
export async function duplicateWorkspaceReport(
  workspaceId: string,
  reportId: number,
): Promise<WorkspacePatientReport> {
  const source = await fetchWorkspaceReport(workspaceId, reportId);
  if (!source) throw new Error("Relatório não encontrado neste workspace.");
  return createWorkspaceReport(workspaceId, source.patient_id, {
    title: `${createReportTitle(todayISO())} (cópia)`,
    report_date: todayISO(),
    report_text: source.report_text,
  });
}

export async function deleteWorkspaceReport(workspaceId: string, reportId: number): Promise<void> {
  assertReportScope(workspaceId, reportId);
  const { error } = await workspaceSupabase
    .from("patient_reports")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", reportId);
  if (error) throw handleError(error);
}

import { workspaceSupabase } from "@/lib/workspaceSupabase";
import type {
  ExamCatalogItem,
  ExamProtocol,
  ExamRequestItemInput,
  ExamRequestStatus,
  PatientExamRequest,
  PatientExamResult,
} from "@/lib/supabase";

/**
 * Camada de dados de EXAMES escopada por workspace (multi-tenant).
 * Leitura: catálogo/protocolos globais (RLS só-leitura p/ membros) + pedidos do workspace.
 * Escrita multi-linha: via RPC SECURITY DEFINER atômico (create/save). Status e exclusão
 * usam as policies de UPDATE/DELETE do workspace.
 * Backend: supabase/migration-candidates/20261208000000_workspace_exams_candidate.sql
 */

/** Feature flag: módulo de Exames do workspace. Default DESLIGADO. */
export function isWorkspaceExamsEnabled(): boolean {
  return import.meta.env.VITE_WORKSPACE_EXAMS_ENABLED === "true";
}

/** Mensagem amigável para erros da camada de exames (inclui MIGRATION_PENDING). */
export function workspaceExamsErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "MIGRATION_PENDING") {
      return "O módulo de Exames ainda não está disponível neste workspace. Tente novamente mais tarde.";
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

function handleError(err: { code?: string; message?: string }): Error {
  if (["42P01", "PGRST204", "42501", "PGRST301"].includes(err.code ?? "")) {
    return new Error("MIGRATION_PENDING");
  }
  return new Error(err.message ?? "Erro desconhecido.");
}

// ─── Mapeamento ────────────────────────────────────────────────────────────────────────────
interface GlobalExamRow {
  id: number;
  name: string;
  category?: string | null;
  unit?: string | null;
  lab_ref_min?: number | null;
  lab_ref_max?: number | null;
  target_male_min?: number | null;
  target_male_max?: number | null;
  target_female_min?: number | null;
  target_female_max?: number | null;
}

function mapGlobalExam(exam: GlobalExamRow): ExamCatalogItem {
  return {
    id: exam.id,
    name: exam.name,
    group_category: exam.category ?? "Geral",
    unit: exam.unit ?? undefined,
    ref_min: exam.lab_ref_min ?? undefined,
    ref_max: exam.lab_ref_max ?? undefined,
    target_male_min: exam.target_male_min ?? undefined,
    target_male_max: exam.target_male_max ?? undefined,
    target_female_min: exam.target_female_min ?? undefined,
    target_female_max: exam.target_female_max ?? undefined,
  };
}

interface RequestItemRow {
  id?: number;
  notes?: string | null;
  global_exam_id?: number | null;
  exam_name?: string | null;
  group_category?: string | null;
  unit?: string | null;
  ref_min?: number | null;
  ref_max?: number | null;
  target_male_min?: number | null;
  target_male_max?: number | null;
  target_female_min?: number | null;
  target_female_max?: number | null;
  global_exam?: GlobalExamRow | null;
}

function mapRequestItem(row: RequestItemRow): ExamCatalogItem | null {
  const base = row.global_exam ? mapGlobalExam(row.global_exam) : null;
  const id = base?.id ?? row.global_exam_id ?? null;
  const name = base?.name ?? row.exam_name ?? null;
  if (id == null || !name) return null;
  return {
    id,
    name,
    group_category: base?.group_category ?? row.group_category ?? "Geral",
    unit: base?.unit ?? row.unit ?? undefined,
    ref_min: base?.ref_min ?? row.ref_min ?? undefined,
    ref_max: base?.ref_max ?? row.ref_max ?? undefined,
    target_male_min: base?.target_male_min ?? row.target_male_min ?? undefined,
    target_male_max: base?.target_male_max ?? row.target_male_max ?? undefined,
    target_female_min: base?.target_female_min ?? row.target_female_min ?? undefined,
    target_female_max: base?.target_female_max ?? row.target_female_max ?? undefined,
    request_item_id: row.id,
    request_notes: row.notes ?? null,
  };
}

interface GlobalProtocolRow {
  id: number;
  name: string;
  description?: string | null;
}

interface RequestRow {
  id: number;
  patient_id: number;
  global_protocol_id?: number | null;
  status?: string | null;
  status_key?: ExamRequestStatus | null;
  notes?: string | null;
  created_at?: string;
  global_protocol?: GlobalProtocolRow | null;
  items?: RequestItemRow[] | null;
  results?: PatientExamResult[] | null;
}

function mapRequest(row: RequestRow): PatientExamRequest {
  return {
    id: row.id,
    patient_id: row.patient_id,
    global_protocol_id: row.global_protocol_id ?? null,
    status: row.status_key ?? "pending",
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    protocol: row.global_protocol
      ? { id: row.global_protocol.id, name: row.global_protocol.name, description: row.global_protocol.description ?? undefined }
      : undefined,
    items: (row.items ?? []).map(mapRequestItem).filter((i): i is ExamCatalogItem => Boolean(i)),
    results: (row.results ?? []).map((r) => ({ ...r, exam_id: r.global_exam_id ?? r.exam_id })),
  };
}

// ─── Leitura: biblioteca global ─────────────────────────────────────────────────────────────
export async function fetchWorkspaceExamsCatalog(): Promise<ExamCatalogItem[]> {
  const { data, error } = await workspaceSupabase
    .from("global_exams_catalog")
    .select("*")
    .order("category")
    .order("name");
  if (error) throw handleError(error);
  return ((data ?? []) as GlobalExamRow[]).map(mapGlobalExam);
}

export async function fetchWorkspaceExamProtocols(): Promise<ExamProtocol[]> {
  const { data, error } = await workspaceSupabase
    .from("global_exam_protocols")
    .select("*, exams:global_protocol_items(sort_order, exam:global_exams_catalog(*))")
    .order("name");
  if (error) throw handleError(error);
  type ProtocolRow = GlobalProtocolRow & {
    exams?: { sort_order?: number | null; exam: GlobalExamRow | null }[] | null;
  };
  return ((data ?? []) as ProtocolRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    exams: (p.exams ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((pe) => (pe.exam ? mapGlobalExam(pe.exam) : null))
      .filter((e): e is ExamCatalogItem => Boolean(e)),
  }));
}

// ─── Leitura: pedidos do paciente (escopado) ───────────────────────────────────────────────
const REQUEST_SELECT = `
  id, patient_id, global_protocol_id, status, status_key, notes, created_at,
  global_protocol:global_exam_protocols(id, name, description),
  items:patient_exam_request_items(
    id, notes, global_exam_id, exam_name, group_category, unit,
    ref_min, ref_max, target_male_min, target_male_max, target_female_min, target_female_max,
    global_exam:global_exams_catalog(*)
  ),
  results:patient_exam_results(*)
`;

export async function fetchWorkspaceExamRequests(
  workspaceId: string,
  patientId: number,
): Promise<PatientExamRequest[]> {
  assertScope(workspaceId, patientId);
  const { data, error } = await workspaceSupabase
    .from("patient_exam_requests")
    .select(REQUEST_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw handleError(error);
  return ((data ?? []) as unknown as RequestRow[]).map(mapRequest);
}

export async function fetchWorkspaceExamRequest(
  workspaceId: string,
  requestId: number,
): Promise<PatientExamRequest | null> {
  if (!workspaceId || !Number.isSafeInteger(requestId)) return null;
  const { data, error } = await workspaceSupabase
    .from("patient_exam_requests")
    .select(REQUEST_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw handleError(error);
  return data ? mapRequest(data as unknown as RequestRow) : null;
}

// ─── Escrita ────────────────────────────────────────────────────────────────────────────────
export async function createWorkspaceExamRequest(
  workspaceId: string,
  patientId: number,
  protocolId: number | undefined,
  items: ExamRequestItemInput[],
  notes?: string,
): Promise<number> {
  assertScope(workspaceId, patientId);
  const payload = items.map(({ exam, notes: itemNotes }) => ({
    global_exam_id: exam.id,
    exam_name: exam.name,
    group_category: exam.group_category,
    unit: exam.unit ?? null,
    ref_min: exam.ref_min ?? null,
    ref_max: exam.ref_max ?? null,
    target_male_min: exam.target_male_min ?? null,
    target_male_max: exam.target_male_max ?? null,
    target_female_min: exam.target_female_min ?? null,
    target_female_max: exam.target_female_max ?? null,
    notes: itemNotes?.trim() || null,
  }));
  const { data, error } = await workspaceSupabase.rpc("create_workspace_exam_request", {
    p_workspace_id: workspaceId,
    p_patient_id: patientId,
    p_global_protocol_id: protocolId ?? null,
    p_items: payload,
    p_notes: notes?.trim() || null,
  });
  if (error) throw handleError(error);
  return data as number;
}

export async function saveWorkspaceExamResults(
  workspaceId: string,
  requestId: number,
  results: PatientExamResult[],
): Promise<void> {
  if (!workspaceId || !Number.isSafeInteger(requestId)) {
    throw new Error("Workspace e pedido são obrigatórios.");
  }
  const payload = results.map((r) => ({
    global_exam_id: r.global_exam_id ?? r.exam_id,
    result_value: r.result_value ?? null,
    date_collected: r.date_collected ?? null,
    notes: r.notes ?? null,
  }));
  const { error } = await workspaceSupabase.rpc("save_workspace_exam_results", {
    p_workspace_id: workspaceId,
    p_request_id: requestId,
    p_results: payload,
  });
  if (error) throw handleError(error);
}

export async function updateWorkspaceExamRequestStatus(
  workspaceId: string,
  requestId: number,
  status: ExamRequestStatus,
): Promise<void> {
  if (!workspaceId || !Number.isSafeInteger(requestId)) {
    throw new Error("Workspace e pedido são obrigatórios.");
  }
  const { error } = await workspaceSupabase
    .from("patient_exam_requests")
    .update({ status_key: status, status: status === "completed" ? "Concluído" : "Pendente" })
    .eq("workspace_id", workspaceId)
    .eq("id", requestId);
  if (error) throw handleError(error);
}

export async function deleteWorkspaceExamRequest(
  workspaceId: string,
  requestId: number,
): Promise<void> {
  if (!workspaceId || !Number.isSafeInteger(requestId)) {
    throw new Error("Workspace e pedido são obrigatórios.");
  }
  const { error } = await workspaceSupabase
    .from("patient_exam_requests")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", requestId);
  if (error) throw handleError(error);
}

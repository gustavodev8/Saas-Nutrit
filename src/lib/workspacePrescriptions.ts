import { workspaceSupabase } from "@/lib/workspaceSupabase";
import type {
  FormulaItem,
  PrescriptionBlockInput,
  ReadyFormula,
  SavedPrescription,
  Substrate,
} from "@/lib/supabase";

/**
 * Camada de dados de PRESCRIÇÃO MAGISTRAL escopada por workspace (multi-tenant).
 * Biblioteca (substratos + fórmulas prontas): GLOBAL, só leitura para membros (RLS).
 * Receituário do paciente: por workspace. Gravação multi-linha (receituário + blocos + itens)
 * via RPC SECURITY DEFINER atômico; exclusão usa a policy de DELETE do workspace.
 * Backend: supabase/migration-candidates/20261212000000_workspace_prescriptions_candidate.sql
 *
 * TODO: auditoria de exclusão (patient_audit_logs) e envio por e-mail ficam fora desta fase.
 */

/** Feature flag: módulo de Prescrição do workspace. Default DESLIGADO. */
export function isWorkspacePrescriptionsEnabled(): boolean {
  return import.meta.env.VITE_WORKSPACE_PRESCRIPTIONS_ENABLED === "true";
}

/** Mensagem amigável para erros da camada de prescrição (inclui MIGRATION_PENDING). */
export function workspacePrescriptionsErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "MIGRATION_PENDING") {
      return "O módulo de Prescrição ainda não está disponível neste workspace. Tente novamente mais tarde.";
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
  if (["42P01", "PGRST204", "PGRST202", "42501", "PGRST301"].includes(err.code ?? "")) {
    return new Error("MIGRATION_PENDING");
  }
  return new Error(err.message ?? "Erro desconhecido.");
}

// ─── Leitura: biblioteca global ─────────────────────────────────────────────────────────────
export async function fetchWorkspaceSubstrates(): Promise<Substrate[]> {
  const { data, error } = await workspaceSupabase
    .from("substrates")
    .select("*")
    .order("category")
    .order("name");
  if (error) throw handleError(error);
  return (data ?? []) as Substrate[];
}

type FormulaRow = Omit<ReadyFormula, "items"> & { items?: FormulaItem[] | null };

export async function fetchWorkspaceReadyFormulas(): Promise<ReadyFormula[]> {
  const { data, error } = await workspaceSupabase
    .from("ready_formulas")
    .select("*, items:formula_items(name, substrate_id, applied_dose, unit, sort_order, substrate:substrates(name))")
    .order("objective")
    .order("name");
  if (error) throw handleError(error);
  return ((data ?? []) as unknown as FormulaRow[]).map((f) => ({
    ...f,
    items: (f.items ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((fi) => ({ ...fi, substrate_name: fi.name ?? fi.substrate?.name ?? "" })),
  }));
}

// ─── Leitura: receituários do paciente (escopado) ──────────────────────────────────────────
const PRESCRIPTION_SELECT = `
  id, created_at, notes,
  blocks:prescription_blocks(
    id, label, pharmaceutical_form, posology, sort_order,
    items:prescription_block_items(substrate_id, name, dose, unit, sort_order)
  )
`;

export async function fetchWorkspacePrescriptions(
  workspaceId: string,
  patientId: number,
): Promise<SavedPrescription[]> {
  assertScope(workspaceId, patientId);
  const { data, error } = await workspaceSupabase
    .from("prescriptions")
    .select(PRESCRIPTION_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw handleError(error);
  return ((data ?? []) as unknown as SavedPrescription[]).map((p) => ({
    ...p,
    blocks: (p.blocks ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) => ({
        ...b,
        items: (b.items ?? []).slice().sort((x, y) => x.sort_order - y.sort_order),
      })),
  }));
}

// ─── Escrita ────────────────────────────────────────────────────────────────────────────────
/** Cria (sem prescriptionId) ou substitui (com prescriptionId) o receituário. Retorna o id. */
export async function saveWorkspacePrescription(
  workspaceId: string,
  patientId: number,
  blocks: PrescriptionBlockInput[],
  prescriptionId?: number,
): Promise<number> {
  assertScope(workspaceId, patientId);
  const payload = blocks
    .filter((b) => b.items.length > 0)
    .map((b) => ({
      label: b.label,
      pharmaceutical_form: b.pharmaceuticalForm,
      posology: b.posology || null,
      items: b.items.map((item) => ({
        substrate_id: item.substrateId ?? null,
        name: item.name,
        dose: item.dose,
        unit: item.unit,
      })),
    }));
  if (payload.length === 0) throw new Error("Adicione pelo menos um ativo ao receituário.");
  const { data, error } = await workspaceSupabase.rpc("save_workspace_prescription", {
    p_workspace_id: workspaceId,
    p_patient_id: patientId,
    p_prescription_id: prescriptionId ?? null,
    p_blocks: payload,
    p_notes: null,
  });
  if (error) throw handleError(error);
  return data as number;
}

export async function deleteWorkspacePrescription(
  workspaceId: string,
  prescriptionId: number,
): Promise<void> {
  if (!workspaceId || !Number.isSafeInteger(prescriptionId) || prescriptionId <= 0) {
    throw new Error("Workspace e prescrição são obrigatórios.");
  }
  const { error } = await workspaceSupabase
    .from("prescriptions")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", prescriptionId);
  if (error) throw handleError(error);
}

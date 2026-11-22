import { workspaceSupabase } from "./workspaceSupabase";

export interface RecallMeal {
  label: string;
  description: string;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface WorkspaceDietaryRecall {
  id: number;
  workspace_id: string;
  patient_id: number;
  recall_date: string;
  meals: RecallMeal[];
  total_kcal: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkspaceRecallInput {
  recall_date: string;
  meals: RecallMeal[];
  notes?: string;
}

export const DEFAULT_MEAL_LABELS = [
  "Café da manhã",
  "Lanche da manhã",
  "Almoço",
  "Lanche da tarde",
  "Jantar",
  "Ceia",
];

export function emptyMeal(label: string): RecallMeal {
  return { label, description: "", kcal: null, protein_g: null, carbs_g: null, fat_g: null };
}

export function sumMacro(meals: RecallMeal[], key: keyof RecallMeal): number | null {
  const nums = meals
    .map((m) => m[key] as number | null)
    .filter((v): v is number => v != null && Number.isFinite(v));
  return nums.length === 0 ? null : parseFloat(nums.reduce((a, b) => a + b, 0).toFixed(1));
}

function handleError(err: { code?: string; message?: string }): Error {
  if (["42P01", "PGRST204", "42501", "PGRST301"].includes(err.code ?? "")) {
    return new Error("MIGRATION_PENDING");
  }
  return new Error(err.message ?? "Erro desconhecido.");
}

export async function fetchPatientRecalls(
  workspaceId: string,
  patientId: number,
): Promise<WorkspaceDietaryRecall[]> {
  const { data, error } = await workspaceSupabase
    .from("workspace_dietary_recalls")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("recall_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw handleError(error);
  return ((data ?? []) as WorkspaceDietaryRecall[]).map((row) => ({
    ...row,
    meals: Array.isArray(row.meals) ? (row.meals as RecallMeal[]) : [],
  }));
}

export async function createRecall(
  workspaceId: string,
  patientId: number,
  input: WorkspaceRecallInput,
): Promise<WorkspaceDietaryRecall> {
  const meals = input.meals.filter((m) => m.description.trim() || m.kcal != null);
  const payload = {
    workspace_id:    workspaceId,
    patient_id:      patientId,
    recall_date:     input.recall_date,
    meals,
    total_kcal:      sumMacro(meals, "kcal"),
    total_protein_g: sumMacro(meals, "protein_g"),
    total_carbs_g:   sumMacro(meals, "carbs_g"),
    total_fat_g:     sumMacro(meals, "fat_g"),
    notes:           input.notes?.trim() || null,
  };

  const { data, error } = await workspaceSupabase
    .from("workspace_dietary_recalls")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw handleError(error);
  return { ...(data as WorkspaceDietaryRecall), meals };
}

export async function deleteRecall(workspaceId: string, id: number): Promise<void> {
  const { error } = await workspaceSupabase
    .from("workspace_dietary_recalls")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);

  if (error) throw handleError(error);
}

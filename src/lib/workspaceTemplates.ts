import type { SubstitutionItem } from "./supabase";
import { workspaceSupabase } from "./workspaceSupabase";

export interface WorkspaceDietTemplateFood {
  id: number;
  template_meal_id: number;
  food_name: string;
  quantity: number;
  unit: string;
  household_measure?: string;
  measure_amount?: number;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  order_index?: number;
  food_group?: string;
  notes?: string;
}

export interface WorkspaceDietTemplateMeal {
  id: number;
  template_id: number;
  meal_name: string;
  time_suggestion?: string;
  order_index?: number;
  notes?: string;
  is_substitution_of?: number | null;
  /** Trocas por alimento (jsonb); exige a coluna da migration candidata de substituicoes. */
  substitution_items?: SubstitutionItem[] | null;
  foods?: WorkspaceDietTemplateFood[];
}

export interface WorkspaceDietTemplate {
  id: number;
  name: string;
  description?: string;
  strategy?: string;
  total_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  workspace_id?: string | null;
  created_at?: string;
  meals?: WorkspaceDietTemplateMeal[];
}

export async function fetchWorkspaceTemplates(): Promise<WorkspaceDietTemplate[]> {
  const { data, error } = await workspaceSupabase
    .from("diet_templates")
    .select("id, name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, workspace_id, created_at")
    .eq("is_active", true)
    .order("name");
  if (error) {
    console.error("[workspace] fetchWorkspaceTemplates:", error.message);
    throw error;
  }
  return (data ?? []) as WorkspaceDietTemplate[];
}

export async function fetchWorkspaceTemplateById(id: number): Promise<WorkspaceDietTemplate | null> {
  const { data, error } = await workspaceSupabase
    .from("diet_templates")
    .select("*, meals:diet_template_meals(*, foods:diet_template_foods(*))")
    .eq("id", id)
    .single();
  if (error) {
    console.error("[workspace] fetchWorkspaceTemplateById:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    ...data,
    meals: ((data.meals ?? []) as WorkspaceDietTemplateMeal[])
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((m) => ({
        ...m,
        foods: ((m.foods ?? []) as WorkspaceDietTemplateFood[]).sort(
          (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
        ),
      })),
  };
}

interface TemplateSourceFood {
  food_name: string;
  quantity?: number;
  unit?: string;
  household_measure?: string;
  measure_amount?: number;
  kcal_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  food_group?: string;
  notes?: string;
}

interface TemplateSourceAlternative {
  meal_name: string;
  time_suggestion?: string;
  notes?: string;
  foods?: TemplateSourceFood[];
}

interface TemplateSourcePlan {
  title: string;
  strategy_type?: string;
  daily_calories?: number;
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  meals: Array<{
    meal_name: string;
    time_suggestion?: string;
    notes?: string;
    foods?: TemplateSourceFood[];
    alternative_meals?: TemplateSourceAlternative[];
    substitution_items?: SubstitutionItem[];
  }>;
}

function foodPayload(f: TemplateSourceFood) {
  return {
    food_name: f.food_name,
    quantity: f.quantity ?? null,
    unit: f.unit ?? null,
    household_measure: f.household_measure ?? null,
    measure_amount: f.measure_amount ?? null,
    kcal_per_100g: f.kcal_per_100g ?? null,
    protein_per_100g: f.protein_per_100g ?? null,
    carbs_per_100g: f.carbs_per_100g ?? null,
    fat_per_100g: f.fat_per_100g ?? null,
    food_group: f.food_group ?? null,
    notes: f.notes ?? null,
  };
}

/** Salva um plano alimentar como MODELO do workspace via RPC SECURITY DEFINER. Retorna o id do modelo. */
export async function createWorkspaceTemplate(
  workspaceId: string,
  name: string,
  plan: TemplateSourcePlan,
): Promise<number> {
  const p_template = {
    name: name.trim() || plan.title,
    strategy: plan.strategy_type ?? null,
    total_kcal: plan.daily_calories ?? plan.target_calories ?? null,
    protein_g: plan.target_protein_g ?? null,
    carbs_g: plan.target_carbs_g ?? null,
    fat_g: plan.target_fat_g ?? null,
  };
  const p_meals = plan.meals.map((m) => ({
    meal_name: m.meal_name,
    time_suggestion: m.time_suggestion ?? null,
    notes: m.notes ?? null,
    foods: (m.foods ?? []).map(foodPayload),
    // Alternativas viram refeicoes-filhas (is_substitution_of) no RPC; chaves extras
    // sao ignoradas pelo RPC antigo, entao o envio e seguro antes da migration.
    substitutions: (m.alternative_meals ?? []).map((alt) => ({
      meal_name: alt.meal_name,
      time_suggestion: alt.time_suggestion ?? null,
      notes: alt.notes ?? null,
      foods: (alt.foods ?? []).map(foodPayload),
    })),
    substitution_items: (m.substitution_items ?? []).map((item) => ({ ...item })),
  }));
  const { data, error } = await workspaceSupabase.rpc("create_workspace_diet_template", {
    p_workspace_id: workspaceId,
    p_template,
    p_meals,
  });
  if (error) throw new Error(error.message);
  const id = typeof data === "number" ? data : Number(data);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("O RPC não retornou um modelo válido.");
  return id;
}

/** Exclui (soft delete) um modelo PRÓPRIO do workspace. Modelos globais não podem ser excluídos. */
export async function deleteWorkspaceTemplate(workspaceId: string, templateId: number): Promise<void> {
  const { error } = await workspaceSupabase.rpc("delete_workspace_diet_template", {
    p_workspace_id: workspaceId,
    p_template_id: templateId,
  });
  if (error) throw new Error(error.message);
}

/** Renomeia um modelo PRÓPRIO do workspace. */
export async function renameWorkspaceTemplate(workspaceId: string, templateId: number, name: string): Promise<void> {
  const { error } = await workspaceSupabase.rpc("rename_workspace_diet_template", {
    p_workspace_id: workspaceId,
    p_template_id: templateId,
    p_name: name,
  });
  if (error) throw new Error(error.message);
}

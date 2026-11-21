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
    return [];
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

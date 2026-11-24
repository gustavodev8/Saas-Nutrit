import type { Meal, MealFood, MealPlan } from "@/lib/supabase";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

export const WORKSPACE_MEAL_PLANS_GATE_MESSAGE =
  "Planos alimentares do workspace ainda estão fechados até a migration e os testes de isolamento serem aprovados.";

export function isWorkspaceMealPlansEnabled(): boolean {
  return true;
}

export type WorkspaceMealFood = MealFood & { workspace_id: string };
export type WorkspaceMeal = Meal & { workspace_id: string; foods: WorkspaceMealFood[] };
export type WorkspaceMealPlan = MealPlan & {
  workspace_id: string;
  meals: WorkspaceMeal[];
};

export interface WorkspaceMealPlanInput {
  id?: number;
  patient_id: number;
  title: string;
  start_date?: string;
  end_date?: string;
  daily_calories?: number;
  notes?: string;
  strategy_type?: string;
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  measurement_id?: number;
  get_kcal?: number;
  meals: WorkspaceMeal[];
}

const PLAN_COLUMNS = "id, workspace_id, patient_id, title, start_date, end_date, daily_calories, notes, strategy_type, target_calories, target_protein_g, target_carbs_g, target_fat_g, measurement_id, get_kcal, created_at";
const MEAL_COLUMNS = "id, workspace_id, plan_id, meal_name, time_suggestion, sort_order, notes, substitution_items, alternative_meals";
const FOOD_COLUMNS = "id, workspace_id, meal_id, food_name, quantity, unit, calories, protein, carbs, fat, notes, sort_order, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, household_measure, measure_amount, food_group";

function assertScope(workspaceId: string, patientId: number): void {
  if (!workspaceId || !Number.isSafeInteger(patientId) || patientId <= 0) {
    throw new Error("Workspace e paciente são obrigatórios.");
  }
}

export async function fetchWorkspaceMealPlans(workspaceId: string, patientId: number): Promise<WorkspaceMealPlan[]> {
  assertScope(workspaceId, patientId);
  const { data: plans, error: planError } = await workspaceSupabase
    .from("meal_plans")
    .select(PLAN_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (planError) throw new Error(planError.message);

  const planRows = (plans ?? []) as Array<MealPlan & { workspace_id: string }>;
  if (planRows.length === 0) return [];
  const planIds = planRows.map((plan) => plan.id).filter((id): id is number => typeof id === "number");
  if (planIds.length === 0) return planRows.map((plan) => ({ ...plan, meals: [] }));

  const { data: meals, error: mealError } = await workspaceSupabase
    .from("meals")
    .select(MEAL_COLUMNS)
    .eq("workspace_id", workspaceId)
    .in("plan_id", planIds)
    .order("sort_order");
  if (mealError) throw new Error(mealError.message);

  const mealRows = (meals ?? []) as Array<Meal & { workspace_id: string }>;
  const mealIds = mealRows.map((meal) => meal.id).filter((id): id is number => typeof id === "number");
  let foodRows: WorkspaceMealFood[] = [];
  if (mealIds.length > 0) {
    const { data: foods, error: foodError } = await workspaceSupabase
      .from("meal_foods")
      .select(FOOD_COLUMNS)
      .eq("workspace_id", workspaceId)
      .in("meal_id", mealIds)
      .order("sort_order");
    if (foodError) throw new Error(foodError.message);
    foodRows = (foods ?? []) as WorkspaceMealFood[];
  }

  return planRows.map((plan) => ({
    ...plan,
    meals: mealRows
      .filter((meal) => meal.plan_id === plan.id)
      .map((meal) => ({
        ...meal,
        foods: foodRows.filter((food) => food.meal_id === meal.id),
      })),
  }));
}

export async function fetchWorkspaceMealPlan(
  workspaceId: string,
  patientId: number,
  planId: number,
): Promise<WorkspaceMealPlan> {
  const plan = (await fetchWorkspaceMealPlans(workspaceId, patientId)).find((item) => item.id === planId);
  if (!plan) throw new Error("Plano alimentar não encontrado neste workspace.");
  return plan;
}

function jsonPlan(input: WorkspaceMealPlanInput): Record<string, unknown> {
  return {
    title: input.title.trim() || "Plano Alimentar",
    start_date: input.start_date || "",
    end_date: input.end_date || "",
    daily_calories: input.daily_calories,
    notes: input.notes ?? "",
    strategy_type: input.strategy_type,
    target_calories: input.target_calories,
    target_protein_g: input.target_protein_g,
    target_carbs_g: input.target_carbs_g,
    target_fat_g: input.target_fat_g,
    measurement_id: input.measurement_id,
    get_kcal: input.get_kcal,
  };
}

function jsonMeals(meals: WorkspaceMeal[]): Array<Record<string, unknown>> {
  return meals.map((meal, mealIndex) => ({
    meal_name: meal.meal_name,
    time_suggestion: meal.time_suggestion,
    notes: meal.notes,
    sort_order: meal.sort_order ?? mealIndex,
    substitution_items: meal.substitution_items ?? [],
    alternative_meals: meal.alternative_meals ?? [],
    foods: (meal.foods ?? []).map((food, foodIndex) => ({
      food_name: food.food_name,
      quantity: food.quantity,
      unit: food.unit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      notes: food.notes,
      sort_order: food.sort_order ?? foodIndex,
      kcal_per_100g: food.kcal_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fat_per_100g: food.fat_per_100g,
      household_measure: food.household_measure,
      measure_amount: food.measure_amount,
      food_group: food.food_group,
    })),
  }));
}

export async function saveWorkspaceMealPlan(
  workspaceId: string,
  patientId: number,
  input: WorkspaceMealPlanInput,
  source: "manual" | "autosave" = "manual",
): Promise<number> {
  assertScope(workspaceId, patientId);
  if (input.patient_id !== patientId) throw new Error("O plano não pertence ao paciente informado.");
  const { data, error } = await workspaceSupabase.rpc("save_workspace_meal_plan", {
    p_workspace_id: workspaceId,
    p_patient_id: patientId,
    p_plan_id: input.id ?? null,
    p_plan: jsonPlan(input),
    p_meals: jsonMeals(input.meals),
    p_source: source,
  });
  if (error) throw new Error(error.message);
  const savedId = typeof data === "number" ? data : Number(data);
  if (!Number.isSafeInteger(savedId) || savedId <= 0) throw new Error("O RPC não retornou um plano válido.");
  return savedId;
}

export const workspaceMealPlanColumns = { PLAN_COLUMNS, MEAL_COLUMNS, FOOD_COLUMNS };

/** "X" -> "X (cópia)"; se já existir (case-insensitive), "X (cópia 2)", "X (cópia 3)"... */
export function duplicateMealPlanTitle(title: string, existingTitles: string[]): string {
  const base = title.trim();
  const taken = new Set(existingTitles.map((t) => t.trim().toLowerCase()));
  const first = `${base} (cópia)`;
  if (!taken.has(first.toLowerCase())) return first;
  for (let i = 2; ; i++) {
    const candidate = `${base} (cópia ${i})`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

/**
 * Duplica um plano alimentar reusando o RPC de save: o plano de origem é lido,
 * clonado (ids zerados para inserir novos) e salvo no paciente de destino.
 */
export async function duplicateWorkspaceMealPlan(
  workspaceId: string,
  sourcePlanId: number,
  sourcePatientId: number,
  targetPatientId: number,
  newTitle: string,
): Promise<number> {
  assertScope(workspaceId, sourcePatientId);
  assertScope(workspaceId, targetPatientId);
  const source = await fetchWorkspaceMealPlan(workspaceId, sourcePatientId, sourcePlanId);

  const meals: WorkspaceMeal[] = source.meals.map((meal) => ({
    ...meal,
    workspace_id: workspaceId,
    plan_id: 0,
    id: undefined,
    foods: (meal.foods ?? []).map((food) => ({ ...food, workspace_id: workspaceId, meal_id: 0, id: undefined })),
    alternative_meals: (meal.alternative_meals ?? []).map((alternative) => ({
      ...alternative,
      foods: (alternative.foods ?? []).map((food) => ({ ...food })),
    })),
    substitution_items: (meal.substitution_items ?? []).map((item) => ({ ...item })),
  }));

  const input: WorkspaceMealPlanInput = {
    id: undefined,
    patient_id: targetPatientId,
    title: newTitle.trim() || source.title,
    start_date: source.start_date,
    end_date: source.end_date,
    daily_calories: source.daily_calories,
    notes: source.notes,
    strategy_type: source.strategy_type,
    target_calories: source.target_calories,
    target_protein_g: source.target_protein_g,
    target_carbs_g: source.target_carbs_g,
    target_fat_g: source.target_fat_g,
    measurement_id: source.measurement_id,
    get_kcal: source.get_kcal,
    meals,
  };

  return await saveWorkspaceMealPlan(workspaceId, targetPatientId, input);
}

// ─── Template → Plan conversion ───────────────────────────────────────────────

import type { WorkspaceDietTemplate } from "./workspaceTemplates";

export function templateToPlanInput(
  template: WorkspaceDietTemplate,
  workspaceId: string,
  patientId: number,
): WorkspaceMealPlanInput {
  const meals: WorkspaceMeal[] = (template.meals ?? [])
    .filter((m) => m.is_substitution_of == null)
    .map((m, sortOrder) => ({
      workspace_id: workspaceId,
      plan_id: 0,
      meal_name: m.meal_name,
      time_suggestion: m.time_suggestion ?? "",
      sort_order: sortOrder,
      notes: m.notes ?? "",
      substitution_items: [],
      alternative_meals: [],
      foods: (m.foods ?? []).map((f, fi) => ({
        workspace_id: workspaceId,
        meal_id: 0,
        food_name: f.food_name,
        quantity: f.quantity ?? 100,
        unit: f.unit ?? "g",
        calories: ((f.kcal_per_100g ?? 0) * (f.quantity ?? 100)) / 100,
        protein: ((f.protein_per_100g ?? 0) * (f.quantity ?? 100)) / 100,
        carbs: ((f.carbs_per_100g ?? 0) * (f.quantity ?? 100)) / 100,
        fat: ((f.fat_per_100g ?? 0) * (f.quantity ?? 100)) / 100,
        notes: f.notes ?? "",
        sort_order: fi,
        kcal_per_100g: f.kcal_per_100g ?? 0,
        protein_per_100g: f.protein_per_100g ?? 0,
        carbs_per_100g: f.carbs_per_100g ?? 0,
        fat_per_100g: f.fat_per_100g ?? 0,
        household_measure: f.household_measure ?? undefined,
        measure_amount: f.measure_amount ?? undefined,
        food_group: f.food_group ?? undefined,
      } as WorkspaceMealFood),
    )}));

  return {
    patient_id: patientId,
    title: template.name,
    strategy_type: template.strategy ?? undefined,
    target_calories: template.total_kcal ?? undefined,
    target_protein_g: template.protein_g ?? undefined,
    target_carbs_g: template.carbs_g ?? undefined,
    target_fat_g: template.fat_g ?? undefined,
    meals,
  };
}

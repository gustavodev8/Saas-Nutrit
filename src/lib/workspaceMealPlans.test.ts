import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWorkspaceMealPlans, saveWorkspaceMealPlan, type WorkspaceMealPlanInput } from "./workspaceMealPlans";

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/workspaceSupabase", () => ({ workspaceSupabase: { from: mocks.from, rpc: mocks.rpc } }));

function builder(result: unknown) {
  const query = {
    select: vi.fn(), eq: vi.fn(), in: vi.fn(), order: vi.fn(),
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.in.mockReturnValue(query); query.order.mockReturnValue(query);
  return query;
}

const planFields = {
  title: "Plano A", start_date: "2026-11-17", end_date: "2026-11-24",
  daily_calories: 2100, notes: "Synthetic plan", strategy_type: "maintenance",
  target_calories: 2100, target_protein_g: 140, target_carbs_g: 250, target_fat_g: 60,
  measurement_id: 50, get_kcal: 2150,
};
const plan = { id: 10, workspace_id: "workspace-a", patient_id: 41, ...planFields, created_at: "2026-11-17T12:00:00Z" };
const foodFields = {
  food_name: "Feijão", quantity: 80, unit: "g", calories: 96, protein: 6.4, carbs: 16, fat: 0.8,
  notes: "Cooked", sort_order: 2, kcal_per_100g: 120, protein_per_100g: 8,
  carbs_per_100g: 20, fat_per_100g: 1, household_measure: "ladle", measure_amount: 0.5,
  food_group: "Legumes",
};
const food = { id: 30, workspace_id: "workspace-a", meal_id: 20, ...foodFields };
const mealFields = {
  meal_name: "Almoço", time_suggestion: "12:30", notes: "Main meal", sort_order: 3,
  alternative_meals: [{
    meal_name: "Opção 2", time_suggestion: "13:00", notes: "Alternative, not additive",
    foods: [{
      meal_id: 20, food_name: "Rice", quantity: 150, unit: "g", calories: 195,
      protein: 4.5, carbs: 42, fat: 1.5, notes: "Cooked alternative", sort_order: 0,
      kcal_per_100g: 130, protein_per_100g: 3, carbs_per_100g: 28, fat_per_100g: 1,
      household_measure: "spoon", measure_amount: 3, food_group: "Cereal",
    }],
  }],
  substitution_items: [{ food_name: "Lentils", quantity: 100, unit: "g", notes: "Cooked substitute", replaces_food: "Feijão" }],
};
const meal = { id: 20, workspace_id: "workspace-a", plan_id: 10, ...mealFields };

describe("workspaceMealPlans", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("filters plan, child meals and foods by the same workspace and patient", async () => {
    const secondPlan = { ...plan, id: 11, title: "Plano B" };
    const secondMeal = { ...meal, id: 21, plan_id: 11, meal_name: "Dinner" };
    const secondFood = { ...food, id: 31, meal_id: 21, food_name: "Potato" };
    const plansQuery = builder({ data: [plan, secondPlan], error: null });
    const mealsQuery = builder({ data: [secondMeal, meal], error: null });
    const foodsQuery = builder({ data: [secondFood, food], error: null });
    mocks.from.mockImplementation((table: string) => {
      switch (table) {
        case "meal_plans": return plansQuery;
        case "meals": return mealsQuery;
        case "meal_foods": return foodsQuery;
        default: throw new Error(`Unexpected table: ${table}`);
      }
    });
    const result = await fetchWorkspaceMealPlans("workspace-a", 41);
    expect(result).toEqual([
      { ...plan, meals: [{ ...meal, foods: [food] }] },
      { ...secondPlan, meals: [{ ...secondMeal, foods: [secondFood] }] },
    ]);
    expect(mocks.from).toHaveBeenCalledTimes(3);
    expect(mocks.from).toHaveBeenNthCalledWith(1, "meal_plans");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "meals");
    expect(mocks.from).toHaveBeenNthCalledWith(3, "meal_foods");
    expect(plansQuery.eq.mock.calls).toEqual([["workspace_id", "workspace-a"], ["patient_id", 41]]);
    expect(mealsQuery.eq.mock.calls).toEqual([["workspace_id", "workspace-a"]]);
    expect(mealsQuery.in.mock.calls).toEqual([["plan_id", [10, 11]]]);
    expect(foodsQuery.eq.mock.calls).toEqual([["workspace_id", "workspace-a"]]);
    expect(foodsQuery.in.mock.calls).toEqual([["meal_id", [21, 20]]]);
    // Exact projections catch missing or renamed fields without relying on mock row keys.
    expect(plansQuery.select).toHaveBeenCalledWith(
      "id, workspace_id, patient_id, title, start_date, end_date, daily_calories, notes, strategy_type, target_calories, target_protein_g, target_carbs_g, target_fat_g, measurement_id, get_kcal, created_at",
    );
    expect(mealsQuery.select).toHaveBeenCalledWith(
      "id, workspace_id, plan_id, meal_name, time_suggestion, sort_order, notes, substitution_items, alternative_meals",
    );
    expect(foodsQuery.select).toHaveBeenCalledWith(
      "id, workspace_id, meal_id, food_name, quantity, unit, calories, protein, carbs, fat, notes, sort_order, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, household_measure, measure_amount, food_group",
    );
    expect(plansQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mealsQuery.order).toHaveBeenCalledWith("sort_order");
    expect(foodsQuery.order).toHaveBeenCalledWith("sort_order");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    { operation: "create", id: undefined, source: "manual" as const },
    { operation: "edit", id: 10, source: "autosave" as const },
  ])("sends the complete $operation graph through the workspace RPC", async ({ id, source }) => {
    mocks.rpc.mockResolvedValue({ data: 10, error: null });
    const input: WorkspaceMealPlanInput = {
      ...structuredClone(plan), id,
      meals: [{ ...structuredClone(meal), foods: [structuredClone(food)] }],
    };
    const expectedPlan = structuredClone(planFields);
    const expectedMeals = structuredClone([{ ...mealFields, foods: [foodFields] }]);
    await expect(saveWorkspaceMealPlan("workspace-a", 41, input, source)).resolves.toBe(10);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("save_workspace_meal_plan", {
      p_workspace_id: "workspace-a", p_patient_id: 41, p_plan_id: id ?? null,
      p_plan: expectedPlan, p_meals: expectedMeals, p_source: source,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects a plan whose patient does not match the requested scope before calling RPC", async () => {
    await expect(saveWorkspaceMealPlan("workspace-a", 42, { ...plan, meals: [], patient_id: 41 })).rejects.toThrow(/paciente/i);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

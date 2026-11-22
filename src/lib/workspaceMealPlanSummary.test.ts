import { describe, expect, it } from "vitest";
import type { WorkspaceMealPlanInput } from "@/lib/workspaceMealPlans";
import { summarizeWorkspaceMealPlan } from "@/lib/workspaceMealPlanSummary";

const basePlan = (overrides: Partial<WorkspaceMealPlanInput> = {}): WorkspaceMealPlanInput => ({
  patient_id: 7,
  title: "Plano de teste",
  daily_calories: 2000,
  meals: [],
  ...overrides,
});

describe("summarizeWorkspaceMealPlan", () => {
  it("totals calories and macros from primary meal foods", () => {
    const result = summarizeWorkspaceMealPlan(basePlan({
      meals: [{
        workspace_id: "workspace-a",
        plan_id: 1,
        meal_name: "Almoço",
        foods: [{
          meal_id: 1,
          food_name: "Arroz",
          quantity: 100,
          unit: "g",
          kcal_per_100g: 130,
          protein_per_100g: 2.5,
          carbs_per_100g: 28,
          fat_per_100g: 0.3,
        }],
      }],
    }));

    expect(result.totals).toEqual({ calories: 130, protein: 2.5, carbohydrates: 28, fat: 0.3 });
  });

  it("does not add alternatives or substitutions to the daily totals or consistency check", () => {
    const result = summarizeWorkspaceMealPlan(basePlan({
      daily_calories: 1000,
      meals: [{
        workspace_id: "workspace-a",
        plan_id: 1,
        meal_name: "Almoço",
        foods: [{ meal_id: 1, food_name: "Refeição principal", quantity: 100, unit: "g", kcal_per_100g: 500, protein_per_100g: 20, carbs_per_100g: 50, fat_per_100g: 10, calories: 500, protein: 20, carbs: 50, fat: 10 }],
        alternative_meals: [{
          meal_name: "Opção 2",
          foods: [{ meal_id: 1, food_name: "Alternativa", calories: 5000, protein: 200, carbs: 500, fat: 100 }],
        }],
        substitution_items: [{ food_name: "Substituição", quantity: 500, unit: "g" }],
      }],
    }));

    expect(result.totals).toEqual({ calories: 500, protein: 20, carbohydrates: 50, fat: 10 });
    const calorieAlert = result.alerts.find((alert) => alert.id === "calorie-mismatch");
    expect(calorieAlert?.message).toContain("50% da meta diária");
    expect(calorieAlert?.message).not.toContain("550%");
  });

  it("compares macro totals with explicit targets and omits macro alerts when targets are incomplete", () => {
    const fullTargets = summarizeWorkspaceMealPlan(basePlan({
      target_protein_g: 100,
      target_carbs_g: 200,
      target_fat_g: 60,
      meals: [{
        workspace_id: "workspace-a",
        plan_id: 1,
        meal_name: "Jantar",
        foods: [{ meal_id: 1, food_name: "Ovo", quantity: 100, unit: "g", kcal_per_100g: 100, protein_per_100g: 10, carbs_per_100g: 5, fat_per_100g: 5, calories: 100, protein: 10, carbs: 5, fat: 5 }],
      }],
    }));
    const partialTargets = summarizeWorkspaceMealPlan(basePlan({
      target_protein_g: 100,
      meals: [{
        workspace_id: "workspace-a",
        plan_id: 1,
        meal_name: "Jantar",
        foods: [{ meal_id: 1, food_name: "Ovo", quantity: 100, unit: "g", kcal_per_100g: 100, protein_per_100g: 10, carbs_per_100g: 5, fat_per_100g: 5, calories: 100, protein: 10, carbs: 5, fat: 5 }],
      }],
    }));

    expect(fullTargets.alerts.map((alert) => alert.id)).toContain("protein-mismatch");
    expect(partialTargets.alerts.map((alert) => alert.id)).not.toContain("protein-mismatch");
  });
});

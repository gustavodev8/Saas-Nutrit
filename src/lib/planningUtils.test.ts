import { describe, expect, it } from "vitest";
import type { MealPlan } from "@/lib/supabase";
import {
  DEFAULT_MACRO_TARGET,
  auditMacro,
  calcMacroGoals,
  generateMealPlanConsistencyAlerts,
  getMealNutritionTargets,
} from "@/lib/planningUtils";

const plan = (overrides: Partial<MealPlan>): MealPlan => ({
  patient_id: 1,
  title: "Plano teste",
  ...overrides,
});

describe("planningUtils", () => {
  it("calculates residual carbs from grams per kg macro targets", () => {
    const goals = calcMacroGoals(DEFAULT_MACRO_TARGET, 2000, 80);

    expect(goals).toMatchObject({
      calories: 2000,
      protein_g: 160,
      fat_g: 80,
      carbs_g: 160,
      protein_g_per_kg: 2,
      fat_g_per_kg: 1,
      carbs_g_per_kg: 2,
    });
  });

  it("audits macros with objective status bands", () => {
    expect(auditMacro(92, 100).status).toBe("on_target");
    expect(auditMacro(109, 100).status).toBe("above");
    expect(auditMacro(80, 100).status).toBe("below");
  });

  it("distributes nutrition targets using meal context", () => {
    const goals = calcMacroGoals(DEFAULT_MACRO_TARGET, 2000, 80);
    expect(goals).not.toBeNull();
    if (!goals) return;

    const targets = getMealNutritionTargets(
      [
        { meal_name: "Cafe da manha", time_suggestion: "07:00" },
        { meal_name: "Almoco", time_suggestion: "12:30" },
        { meal_name: "Ceia", time_suggestion: "22:00" },
      ],
      goals,
    );

    expect(targets[1].calories).toBeGreaterThan(targets[0].calories);
    expect(targets[2].carbs_g).toBeLessThan(targets[0].carbs_g);
  });

  it("flags empty, duplicated and off-target meal plans", () => {
    const alerts = generateMealPlanConsistencyAlerts({
      plan: plan({ daily_calories: 2000 }),
      meals: [
        { meal_name: "Almoco", foods: [{ food_name: "Arroz", calories: 200, protein: 4, carbs: 44, fat: 1 }] },
        { meal_name: "Almoço", foods: [] },
      ],
    });

    expect(alerts.map((alert) => alert.id)).toEqual(
      expect.arrayContaining(["empty-meals", "duplicate-meal-names", "calorie-mismatch"]),
    );
  });
});

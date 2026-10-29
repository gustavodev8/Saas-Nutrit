import { describe, expect, it } from "vitest";
import type { Meal } from "@/lib/supabase";
import { hasStaleMealMacros, recalculateMealMacros } from "@/lib/mealMacros";
import { preparePdfMeals } from "@/lib/mealPlanPdfUtils";

describe("recalculateMealMacros", () => {
  it("keeps editor and PDF macros consistent without mutating loaded plan data", () => {
    const stored: Meal[] = [{
      plan_id: 55,
      meal_name: "Café da manhã",
      foods: [{
        meal_id: 1,
        food_name: "Ovo de galinha",
        quantity: 5,
        unit: "un",
        kcal_per_100g: 143.2,
        protein_per_100g: 13.3,
        carbs_per_100g: 0.6,
        fat_per_100g: 9.5,
        calories: 7.2,
        protein: 0.7,
        carbs: 0,
        fat: 0.5,
      }],
    }];
    const originalCalories = stored[0].foods?.[0].calories;

    expect(hasStaleMealMacros(stored)).toBe(true);
    const editorMeals = recalculateMealMacros(stored);
    const pdfMeals = preparePdfMeals(stored);

    expect(editorMeals[0].foods?.[0].calories).toBe(358);
    expect(pdfMeals[0].foods?.[0].calories).toBe(editorMeals[0].foods?.[0].calories);
    expect(stored[0].foods?.[0].calories).toBe(originalCalories);
    expect(hasStaleMealMacros(editorMeals)).toBe(false);
  });

  it("recalculates foods inside legacy options after grouping them in memory", () => {
    const result = recalculateMealMacros([
      { plan_id: 1, meal_name: "Almoço", foods: [] },
      {
        plan_id: 1,
        meal_name: "Almoço — Opção 2",
        foods: [{
          meal_id: 2,
          food_name: "Arroz",
          quantity: 100,
          unit: "g",
          kcal_per_100g: 128,
          calories: 1,
        }],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].alternative_meals?.[0].foods?.[0].calories).toBe(128);
  });
});

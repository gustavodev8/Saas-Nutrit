import { describe, expect, it } from "vitest";
import type { Meal } from "@/lib/supabase";
import { normalizePdfMealAlternatives } from "@/lib/mealPlanPdfUtils";

const meal = (meal_name: string, time_suggestion = "08:00"): Meal => ({
  plan_id: 1,
  meal_name,
  time_suggestion,
  foods: [],
});

describe("normalizePdfMealAlternatives", () => {
  it("regroups legacy numbered options under their matching meal", () => {
    const main = meal("Café da manhã");
    const option2 = meal("Café da manhã — Opção 2");
    const option3 = meal("Café da manhã - Opcao 3");

    const result = normalizePdfMealAlternatives([main, option2, option3]);

    expect(result).toHaveLength(1);
    expect(result[0].meal_name).toBe("Café da manhã");
    expect(result[0].alternative_meals?.map((alternative) => alternative.meal_name)).toEqual([
      "Opção 2",
      "Opção 3",
    ]);
  });

  it("keeps an option as a meal when its parent match is ambiguous or has a different time", () => {
    const ambiguous = normalizePdfMealAlternatives([
      meal("Almoço"),
      meal("Almoço"),
      meal("Almoço — Opção 2"),
    ]);
    const differentTime = normalizePdfMealAlternatives([
      meal("Jantar", "19:00"),
      meal("Jantar — Opção 2", "21:00"),
    ]);

    expect(ambiguous).toHaveLength(3);
    expect(differentTime).toHaveLength(2);
    expect(differentTime[0].alternative_meals).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import type { Meal } from "@/lib/supabase";
import { normalizeLegacyMealAlternatives } from "@/lib/mealAlternatives";

const meal = (meal_name: string, time_suggestion = "08:00"): Meal => ({
  id: meal_name.includes("Opção") ? 2 : 1,
  plan_id: 1,
  meal_name,
  time_suggestion,
  foods: [{ meal_id: 0, food_name: meal_name, quantity: 4, unit: "g", calories: 5 }],
});

describe("normalizeLegacyMealAlternatives", () => {
  it("groups uniquely matched legacy options and preserves their foods and quantities", () => {
    const main = meal("Café da manhã");
    const option = meal("Café da manhã — Opção 2");
    const result = normalizeLegacyMealAlternatives([main, option]);

    expect(result).toHaveLength(1);
    expect(result[0].foods).toEqual(main.foods);
    expect(result[0].alternative_meals?.[0]).toMatchObject({
      meal_name: "Opção 2",
      foods: option.foods,
    });
    expect(result[0].alternative_meals?.[0].foods?.[0].quantity).toBe(4);
  });

  it("leaves ambiguous or time-mismatched options as separate meals", () => {
    const ambiguous = normalizeLegacyMealAlternatives([
      meal("Almoço"),
      { ...meal("Almoço"), id: 3 },
      meal("Almoço — Opção 2"),
    ]);
    const timeMismatch = normalizeLegacyMealAlternatives([
      meal("Jantar", "19:00"),
      meal("Jantar — Opção 2", "21:00"),
    ]);

    expect(ambiguous).toHaveLength(3);
    expect(timeMismatch).toHaveLength(2);
    expect(timeMismatch[0].alternative_meals).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { calculateFoodMacros } from "@/lib/calculateFoodMacros";

describe("calculateFoodMacros", () => {
  it("converts units to grams before calculating imported food macros", () => {
    const result = calculateFoodMacros({
      meal_id: 0,
      food_name: "Ovo de galinha",
      quantity: 5,
      unit: "un",
      kcal_per_100g: 146,
      protein_per_100g: 13.3,
      carbs_per_100g: 0.6,
      fat_per_100g: 9.5,
    });

    expect(result.calories).toBe(365);
    expect(result.protein).toBe(33.3);
    expect(result.fat).toBe(23.8);
  });
});

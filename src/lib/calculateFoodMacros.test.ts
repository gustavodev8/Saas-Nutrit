import { describe, expect, it } from "vitest";
import { calculateFoodMacros, usesEstimatedFoodUnitConversion } from "@/lib/calculateFoodMacros";

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

  it("clears previous macros when quantity becomes zero", () => {
    const result = calculateFoodMacros({
      meal_id: 0,
      food_name: "Arroz",
      quantity: 0,
      unit: "g",
      kcal_per_100g: 128,
      protein_per_100g: 2.5,
      carbs_per_100g: 28.1,
      fat_per_100g: 0.2,
      calories: 256,
      protein: 5,
      carbs: 56.2,
      fat: 0.4,
    });

    expect(result).toMatchObject({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("does not count negative quantities in nutrition totals", () => {
    const result = calculateFoodMacros({
      meal_id: 0,
      food_name: "Arroz",
      quantity: -50,
      kcal_per_100g: 128,
      protein_per_100g: 2.5,
      carbs_per_100g: 28.1,
      fat_per_100g: 0.2,
      calories: 64,
      protein: 1.3,
      carbs: 14.1,
      fat: 0.1,
    });

    expect(result).toMatchObject({ calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
  });

  it("flags generic unit conversions when the food has no specific household measure", () => {
    expect(usesEstimatedFoodUnitConversion({
      meal_id: 0,
      food_name: "Bebida teste",
      quantity: 200,
      unit: "ml",
    })).toBe(true);
    expect(usesEstimatedFoodUnitConversion({
      meal_id: 0,
      food_name: "Ovo inteiro cozido",
      quantity: 2,
      unit: "un",
    })).toBe(false);
    expect(usesEstimatedFoodUnitConversion({
      meal_id: 0,
      food_name: "Arroz",
      quantity: 100,
      unit: "g",
    })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { mealPresetFoodToMealFood, mealPresetToMeal } from "@/lib/mealPresetUtils";

describe("meal preset food conversion", () => {
  it("preserves base macros per 100 g when importing a preset", () => {
    const imported = mealPresetFoodToMealFood({
      preset_id: 12,
      food_name: "Alimento de teste",
      quantity: 75,
      kcal_per_100g: 140.5,
      protein_per_100g: 12.2,
      carbs_per_100g: 8.4,
      fat_per_100g: 6.1,
    });

    expect(imported).toMatchObject({
      quantity: 75,
      kcal_per_100g: 140.5,
      protein_per_100g: 12.2,
      carbs_per_100g: 8.4,
      fat_per_100g: 6.1,
    });
  });

  it("keeps presets created before base macros were stored importable", () => {
    const imported = mealPresetToMeal({
      id: 12,
      name: "Preset antigo",
      meal_name: "Lanche",
      foods: [{
        preset_id: 12,
        food_name: "Alimento antigo",
        quantity: 100,
        calories: 140,
      }],
    });

    expect(imported.foods?.[0]).toMatchObject({
      food_name: "Alimento antigo",
      quantity: 100,
      calories: 140,
    });
    expect(imported.foods?.[0]?.kcal_per_100g).toBeUndefined();
  });
});

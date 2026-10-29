import type { Meal, MealFood, MealPreset, MealPresetFood } from "@/lib/supabase";

export function mealPresetFoodToMealFood(food: MealPresetFood): MealFood {
  return {
    meal_id: 0,
    food_name: food.food_name,
    quantity: food.quantity ?? undefined,
    unit: food.unit ?? "g",
    calories: food.calories ?? undefined,
    protein: food.protein ?? undefined,
    carbs: food.carbs ?? undefined,
    fat: food.fat ?? undefined,
    kcal_per_100g: food.kcal_per_100g ?? undefined,
    protein_per_100g: food.protein_per_100g ?? undefined,
    carbs_per_100g: food.carbs_per_100g ?? undefined,
    fat_per_100g: food.fat_per_100g ?? undefined,
    notes: food.notes ?? undefined,
    household_measure: food.household_measure ?? undefined,
    measure_amount: food.measure_amount ?? undefined,
    food_group: food.food_group ?? undefined,
  };
}

export function mealPresetToMeal(preset: MealPreset): Meal {
  return {
    plan_id: 0,
    meal_name: preset.meal_name,
    time_suggestion: preset.time_suggestion ?? "",
    notes: preset.notes ?? "",
    foods: (preset.foods ?? []).map(mealPresetFoodToMealFood),
    substitution_items: [],
  };
}

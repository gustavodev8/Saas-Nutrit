import type { Meal } from "@/lib/supabase";
import { calculateFoodMacros } from "@/lib/calculateFoodMacros";
import { normalizeLegacyMealAlternatives } from "@/lib/mealAlternatives";

export { normalizeLegacyMealAlternatives as normalizePdfMealAlternatives } from "@/lib/mealAlternatives";

export function preparePdfMeals(meals: Meal[]): Meal[] {
  return normalizeLegacyMealAlternatives(meals).map((meal) => ({
    ...meal,
    foods: (meal.foods ?? []).map((food) => calculateFoodMacros(food)),
    alternative_meals: (meal.alternative_meals ?? []).map((alternative) => ({
      ...alternative,
      foods: (alternative.foods ?? []).map((food) => calculateFoodMacros(food)),
    })),
  }));
}

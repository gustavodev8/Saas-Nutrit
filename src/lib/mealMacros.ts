import type { Meal } from "@/lib/supabase";
import { calculateFoodMacros } from "@/lib/calculateFoodMacros";
import { normalizeLegacyMealAlternatives } from "@/lib/mealAlternatives";

/** Recalculates stored macros in memory; it never persists changes to a plan. */
export function recalculateMealMacros(meals: Meal[]): Meal[] {
  return normalizeLegacyMealAlternatives(meals).map((meal) => ({
    ...meal,
    foods: (meal.foods ?? []).map((food) => calculateFoodMacros(food)),
    alternative_meals: (meal.alternative_meals ?? []).map((alternative) => ({
      ...alternative,
      foods: (alternative.foods ?? []).map((food) => calculateFoodMacros(food)),
    })),
  }));
}

export function hasStaleMealMacros(meals: Meal[]): boolean {
  return normalizeLegacyMealAlternatives(meals).some((meal) => {
    const foodsHaveStaleMacros = (foods: Meal["foods"]) =>
      (foods ?? []).some((food) => {
        const recalculated = calculateFoodMacros(food);
        return ["calories", "protein", "carbs", "fat"].some(
          (key) => recalculated[key] !== food[key],
        );
      });

    return foodsHaveStaleMacros(meal.foods) ||
      (meal.alternative_meals ?? []).some((alternative) => foodsHaveStaleMacros(alternative.foods));
  });
}

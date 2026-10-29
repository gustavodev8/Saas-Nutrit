import type { Meal } from "@/lib/supabase";
import { recalculateMealMacros } from "@/lib/mealMacros";

export { normalizeLegacyMealAlternatives as normalizePdfMealAlternatives } from "@/lib/mealAlternatives";

export function preparePdfMeals(meals: Meal[]): Meal[] {
  return recalculateMealMacros(meals);
}

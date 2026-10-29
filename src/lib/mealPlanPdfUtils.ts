import type { AlternativeMeal, Meal } from "@/lib/supabase";
import { calculateFoodMacros } from "@/lib/calculateFoodMacros";

const LEGACY_ALTERNATIVE_SUFFIX = /\s+[—–-]\s+(?:opção|opcao)\s+(\d+)\s*$/i;

function normalizeMealName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function normalizeMealTime(value?: string) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

/** Regroups legacy imported alternatives for PDF display without changing saved records. */
export function normalizePdfMealAlternatives(meals: Meal[]): Meal[] {
  const parents = meals.map((meal) => ({
    ...meal,
    alternative_meals: [...(meal.alternative_meals ?? [])],
  }));
  const parentIndexes = new Map<string, number[]>();

  meals.forEach((meal, index) => {
    if (LEGACY_ALTERNATIVE_SUFFIX.test(meal.meal_name)) return;
    const key = normalizeMealName(meal.meal_name);
    parentIndexes.set(key, [...(parentIndexes.get(key) ?? []), index]);
  });

  const groupedIndexes = new Set<number>();
  meals.forEach((meal, index) => {
    const match = meal.meal_name.match(LEGACY_ALTERNATIVE_SUFFIX);
    if (!match) return;

    const optionNumber = Number(match[1]);
    if (!Number.isInteger(optionNumber) || optionNumber < 2) return;

    const baseName = meal.meal_name.replace(LEGACY_ALTERNATIVE_SUFFIX, "");
    const candidates = (parentIndexes.get(normalizeMealName(baseName)) ?? []).filter((parentIndex) => {
      const parentTime = normalizeMealTime(meals[parentIndex].time_suggestion);
      const alternativeTime = normalizeMealTime(meal.time_suggestion);
      return !parentTime || !alternativeTime || parentTime === alternativeTime;
    });

    if (candidates.length !== 1) return;

    const parent = parents[candidates[0]];
    const alternative: AlternativeMeal = {
      meal_name: `Opção ${optionNumber}`,
      time_suggestion: meal.time_suggestion,
      notes: meal.notes,
      foods: meal.foods,
    };
    parent.alternative_meals = [...(parent.alternative_meals ?? []), alternative];
    groupedIndexes.add(index);
  });

  return parents.filter((_, index) => !groupedIndexes.has(index));
}

export function preparePdfMeals(meals: Meal[]): Meal[] {
  return normalizePdfMealAlternatives(meals).map((meal) => ({
    ...meal,
    foods: (meal.foods ?? []).map((food) => calculateFoodMacros(food)),
    alternative_meals: (meal.alternative_meals ?? []).map((alternative) => ({
      ...alternative,
      foods: (alternative.foods ?? []).map((food) => calculateFoodMacros(food)),
    })),
  }));
}

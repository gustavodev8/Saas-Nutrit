import { getFoodHouseholdMeasures, type FoodItem, type HouseholdMeasure } from "@/lib/foodDatabase";
import type { MealFood } from "@/lib/supabase";

function normalizeMeasure(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function usesEstimatedFoodUnitConversion(food: MealFood, foodDb?: FoodItem): boolean {
  const unit = normalizeMeasure(food.unit ?? "g");
  if (unit === "g" || unit === "grama" || unit === "gramas" || unit === "kg") return false;

  const measures = food.household_measures ?? foodDb?.household_measures ?? getFoodHouseholdMeasures(food.food_name);
  return !measures?.some((measure) => {
    const measureUnit = normalizeMeasure(measure.unit);
    return measureUnit === unit || (unit === "un" && measureUnit.includes("unidade"));
  });
}

export function calculateFoodMacros(food: MealFood, foodDb?: FoodItem): MealFood {
  const qty = food.quantity;
  if (qty === undefined || !Number.isFinite(qty)) return food;
  if (qty < 0) {
    return { ...food, calories: undefined, protein: undefined, carbs: undefined, fat: undefined };
  }
  if (qty === 0) {
    return { ...food, calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  if (food.kcal_per_100g === undefined) return food;

  const availableMeasures = food.household_measures ?? foodDb?.household_measures ?? getFoodHouseholdMeasures(food.food_name);
  const unit = (food.unit ?? "g").trim();
  let grams = qty;

  const normalizedUnit = normalizeMeasure(unit);
  const measureByName = (measures?: HouseholdMeasure[]) => {
    if (!measures) return undefined;
    const exact = measures.find((measure) => normalizeMeasure(measure.unit) === normalizedUnit);
    if (exact) return exact;
    if (normalizedUnit === "un") {
      return measures.find((measure) => normalizeMeasure(measure.unit).includes("unidade"));
    }
    return undefined;
  };

  const matchedMeasure = measureByName(availableMeasures);
  if (matchedMeasure) {
    grams = qty * matchedMeasure.grams;
  } else {
    const genericFactors: Record<string, number> = {
      g: 1,
      grama: 1,
      gramas: 1,
      kg: 1000,
      ml: 1,
      l: 1000,
      xicara: 240,
      "col. sopa": 15,
      "col. cha": 5,
      fatia: 30,
      porcao: 100,
      un: 50,
    };
    const fallback = genericFactors[normalizedUnit];
    if (fallback) grams = qty * fallback;
  }

  const factor = grams / 100;
  return {
    ...food,
    calories: parseFloat(((food.kcal_per_100g ?? 0) * factor).toFixed(1)),
    protein: parseFloat(((food.protein_per_100g ?? 0) * factor).toFixed(1)),
    carbs: parseFloat(((food.carbs_per_100g ?? 0) * factor).toFixed(1)),
    fat: parseFloat(((food.fat_per_100g ?? 0) * factor).toFixed(1)),
  };
}

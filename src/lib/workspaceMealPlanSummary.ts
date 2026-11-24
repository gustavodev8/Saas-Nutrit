import type { ClinicalAlert } from "@/lib/clinicalAlertsUtils";
import { calculateFoodMacros } from "@/lib/calculateFoodMacros";
import {
  generateMealPlanConsistencyAlerts,
  getMealCalorieTargets,
  type MacroGoals,
} from "@/lib/planningUtils";
import type { MealPlan } from "@/lib/supabase";
import type { MealFood } from "@/lib/supabase";
import type { WorkspaceMealPlanInput } from "@/lib/workspaceMealPlans";

export interface WorkspaceMealPlanSummary {
  totals: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  alerts: ClinicalAlert[];
}

function buildMacroGoals(plan: WorkspaceMealPlanInput): MacroGoals | undefined {
  const protein = plan.target_protein_g;
  const carbohydrates = plan.target_carbs_g;
  const fat = plan.target_fat_g;
  if (![protein, carbohydrates, fat].every((value) => typeof value === "number" && value > 0)) return undefined;

  const proteinKcal = protein * 4;
  const carbohydratesKcal = carbohydrates * 4;
  const fatKcal = fat * 9;
  const calories = plan.daily_calories ?? proteinKcal + carbohydratesKcal + fatKcal;

  return {
    calories,
    protein_g: protein,
    carbs_g: carbohydrates,
    fat_g: fat,
    protein_kcal: proteinKcal,
    carbs_kcal: carbohydratesKcal,
    fat_kcal: fatKcal,
    protein_pct: calories > 0 ? proteinKcal / calories * 100 : 0,
    carbs_pct: calories > 0 ? carbohydratesKcal / calories * 100 : 0,
    fat_pct: calories > 0 ? fatKcal / calories * 100 : 0,
    protein_g_per_kg: 0,
    carbs_g_per_kg: 0,
    fat_g_per_kg: 0,
  };
}

function resolveSummaryFoodMacros(food: MealFood): MealFood {
  const recalculated = calculateFoodMacros(food);
  if (typeof food.quantity !== "number" || !Number.isFinite(food.quantity) || food.quantity <= 0) {
    return recalculated;
  }

  return {
    ...recalculated,
    calories: Number.isFinite(food.calories) ? food.calories : recalculated.calories,
    protein: Number.isFinite(food.protein) ? food.protein : recalculated.protein,
    carbs: Number.isFinite(food.carbs) ? food.carbs : recalculated.carbs,
    fat: Number.isFinite(food.fat) ? food.fat : recalculated.fat,
  };
}

export function summarizeWorkspaceMealPlan(plan: WorkspaceMealPlanInput): WorkspaceMealPlanSummary {
  const meals = plan.meals.map((meal) => ({
    meal_name: meal.meal_name,
    time_suggestion: meal.time_suggestion,
    foods: (meal.foods ?? []).map(resolveSummaryFoodMacros),
  }));

  const totals = meals.reduce(
    (sum, meal) => meal.foods.reduce((mealSum, food) => ({
      calories: mealSum.calories + (food.calories ?? 0),
      protein: mealSum.protein + (food.protein ?? 0),
      carbohydrates: mealSum.carbohydrates + (food.carbs ?? 0),
      fat: mealSum.fat + (food.fat ?? 0),
    }), sum),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );

  const macroGoals = buildMacroGoals(plan);
  const mealTargets = getMealCalorieTargets(meals, plan.daily_calories);
  const consistencyPlan: MealPlan = {
    patient_id: plan.patient_id,
    title: plan.title,
    daily_calories: plan.daily_calories,
    target_protein_g: plan.target_protein_g,
    target_carbs_g: plan.target_carbs_g,
    target_fat_g: plan.target_fat_g,
  };

  return {
    totals,
    alerts: generateMealPlanConsistencyAlerts({
      plan: consistencyPlan,
      meals,
      mealTargets,
      macroGoals,
    }),
  };
}

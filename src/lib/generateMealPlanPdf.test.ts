import { describe, expect, it } from "vitest";
import type { Meal } from "@/lib/supabase";
import { generateMealPlanPdf } from "@/lib/generateMealPlanPdf";

const plainMeal = (meal_name: string, foodCount = 1): Meal => ({
  plan_id: 1,
  meal_name,
  time_suggestion: "08:00",
  foods: Array.from({ length: foodCount }, (_, index) => ({
    meal_id: 0,
    food_name: `${meal_name} item ${index + 1}`,
    quantity: 100,
    unit: "g",
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 5,
  })),
});

describe("generateMealPlanPdf", () => {
  it("keeps a meal and its selected alternatives together and flags a large target gap", () => {
    const breakfast = plainMeal("Café da manhã");
    const snack = plainMeal("Lanche da manhã");
    const lunch = plainMeal("Almoço", 6);
    lunch.alternative_meals = [plainMeal("Opção 2").foods, plainMeal("Opção 3").foods].map((foods, index) => ({
      meal_name: `Opção ${index + 2}`,
      time_suggestion: "12:00",
      foods,
    }));

    const pdf = generateMealPlanPdf(
      { id: 1, patient_id: 1, title: "Teste", daily_calories: 2000 },
      [breakfast, snack, lunch],
      null,
      { substitutionLayout: "columns", selectedAlternatives: { 2: [0, 1] } },
    );
    const pages = (pdf as typeof pdf & { internal: { pages: string[][] } }).internal.pages.slice(1);
    const mealPage = pages.findIndex((page) => page.join("\n").includes("Almoço"));
    const optionPage = pages.findIndex((page) => page.join("\n").includes("Opção 2"));
    const allText = pages.flat().join("\n");

    expect(mealPage).toBeGreaterThanOrEqual(0);
    expect(optionPage).toBe(mealPage);
    expect(allText).toContain("Atenção");
    expect(allText).toContain("abaixo da meta");
  });
});

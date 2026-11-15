import { describe, expect, it } from "vitest";
import { validateCustomFoodForm } from "./foodSearchValidation";

const validForm = {
  name: "Alimento teste",
  kcal_per_100g: "0",
  protein_per_100g: "0",
  carbs_per_100g: "0",
  fat_per_100g: "0",
};

describe("validateCustomFoodForm", () => {
  it("accepts zero as a valid nutrient amount", () => {
    expect(validateCustomFoodForm(validForm)).toEqual({});
  });

  it("rejects blank, non-finite, and negative required nutrient values", () => {
    expect(validateCustomFoodForm({
      ...validForm,
      kcal_per_100g: " ",
      protein_per_100g: "NaN",
      carbs_per_100g: "Infinity",
      fat_per_100g: "-0.1",
    })).toEqual({
      kcal_per_100g: "Informe as calorias",
      protein_per_100g: "Informe a proteína",
      carbs_per_100g: "Informe os carboidratos",
      fat_per_100g: "Informe a gordura",
    });
  });
});

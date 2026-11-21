export interface CustomFoodFormValues {
  name: string;
  kcal_per_100g: string;
  protein_per_100g: string;
  carbs_per_100g: string;
  fat_per_100g: string;
}

export type CustomFoodFormErrors = Partial<Record<keyof CustomFoodFormValues, string>>;

export function validateCustomFoodForm(form: CustomFoodFormValues): CustomFoodFormErrors {
  const errors: CustomFoodFormErrors = {};
  if (!form.name.trim()) errors.name = "Nome é obrigatório";

  const requiredNutrients: Array<[keyof CustomFoodFormValues, string]> = [
    ["kcal_per_100g", "Informe as calorias"],
    ["protein_per_100g", "Informe a proteína"],
    ["carbs_per_100g", "Informe os carboidratos"],
    ["fat_per_100g", "Informe a gordura"],
  ];

  for (const [field, message] of requiredNutrients) {
    const value = form[field];
    const number = Number(value);
    if (!value.trim() || !Number.isFinite(number) || number < 0) errors[field] = message;
  }

  return errors;
}

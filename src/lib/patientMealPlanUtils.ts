import type { EnergyInput } from "@/lib/energyUtils";
import type { MacroResult, StrategyType } from "@/lib/strategyUtils";
import { calcPatientAge } from "@/lib/patientAnthropometry";
import type { MealPlan, Measurement, Patient } from "@/lib/supabase";

export const STRATEGY_LABELS: Record<
  string,
  { label: string; cls: string }
> = {
  deficit: {
    label: "Déficit",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  maintenance: {
    label: "Manutenção",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  surplus: {
    label: "Superávit",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

export function buildMealPlanEnergyInput(
  patient: Pick<Patient, "birth_date" | "gender">,
  latestMeasurement?: Pick<Measurement, "weight" | "height"> | null,
): EnergyInput | undefined {
  if (!latestMeasurement?.weight || !latestMeasurement?.height) return undefined;
  if (!patient.birth_date) return undefined;

  return {
    weight: latestMeasurement.weight,
    height: latestMeasurement.height,
    age: calcPatientAge(patient.birth_date),
    gender: patient.gender === "F" ? "F" : "M",
  };
}

export function buildMealPlanPayload(params: {
  patientId: number;
  title: string;
  strategy: StrategyType | null;
  macros: MacroResult | null;
}): MealPlan {
  const { patientId, title, strategy, macros } = params;

  return {
    patient_id: patientId,
    title,
    ...(strategy && macros
      ? {
          strategy_type: strategy,
          target_calories: macros.calories,
          target_protein_g: macros.protein_g,
          target_carbs_g: macros.carbs_g,
          target_fat_g: macros.fat_g,
          daily_calories: macros.calories,
        }
      : {}),
  };
}

export function formatMealPlanCardMeta(plan: MealPlan) {
  if (plan.target_calories) {
    return `${plan.target_calories} kcal · ${plan.target_protein_g ?? 0}g PTN · ${plan.target_carbs_g ?? 0}g CHO · ${plan.target_fat_g ?? 0}g LIP`;
  }

  return `Criado em ${
    plan.created_at
      ? new Date(plan.created_at).toLocaleDateString("pt-BR")
      : "—"
  }`;
}

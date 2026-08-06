import { describe, expect, it } from "vitest";

import { buildMealPlanEnergyInput, buildMealPlanPayload, formatMealPlanCardMeta } from "@/lib/patientMealPlanUtils";

describe("patientMealPlanUtils", () => {
  it("builds energy input only when patient and measurement data are complete", () => {
    expect(
      buildMealPlanEnergyInput(
        { birth_date: "1990-01-10", gender: "F" },
        { weight: 70, height: 165 },
      ),
    ).toMatchObject({
      weight: 70,
      height: 165,
      gender: "F",
    });

    expect(
      buildMealPlanEnergyInput(
        { birth_date: null, gender: "F" },
        { weight: 70, height: 165 },
      ),
    ).toBeUndefined();
  });

  it("builds meal plan payload with macro targets when strategy exists", () => {
    const payload = buildMealPlanPayload({
      patientId: 12,
      title: "Plano corte",
      strategy: "deficit",
      macros: {
        strategy: "deficit",
        calories: 1800,
        protein_g: 140,
        carbs_g: 180,
        fat_g: 50,
      },
    });

    expect(payload).toMatchObject({
      patient_id: 12,
      title: "Plano corte",
      strategy_type: "deficit",
      target_calories: 1800,
      daily_calories: 1800,
    });
  });

  it("builds minimal payload when plan is created without macro targets", () => {
    const payload = buildMealPlanPayload({
      patientId: 8,
      title: "Plano livre",
      strategy: null,
      macros: null,
    });

    expect(payload).toEqual({
      patient_id: 8,
      title: "Plano livre",
    });
  });

  it("formats meal plan card metadata", () => {
    expect(
      formatMealPlanCardMeta({
        patient_id: 1,
        title: "Plano",
        target_calories: 2000,
        target_protein_g: 150,
        target_carbs_g: 180,
        target_fat_g: 60,
      }),
    ).toContain("2000 kcal");

    expect(
      formatMealPlanCardMeta({
        patient_id: 1,
        title: "Plano",
        created_at: "2026-08-06T10:00:00",
      }),
    ).toContain("Criado em");
  });
});

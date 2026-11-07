import { describe, expect, it } from "vitest";
import type { Measurement } from "@/lib/supabase";
import { calcArmAnthropometry } from "@/lib/anthropometryUtils";
import { calculateFourComponentAnthropometry } from "@/lib/fourComponentAnthropometry";
import {
  calculateAnthropometryReportValues,
  getAnthropometryComparisonIds,
  selectAnthropometryComparisonMeasurements,
} from "./anthropometricComparison";

function makeMeasurement(id: number, assessment_date: string): Measurement {
  return { id, patient_id: 41, assessment_date, weight: 70, height: 170 };
}

describe("anthropometric comparison helpers", () => {
  const history = [makeMeasurement(4, "2026-11-06"), makeMeasurement(3, "2026-10-06"), makeMeasurement(2, "2026-09-06"), makeMeasurement(1, "2026-08-06")];

  it("matches legacy presets and chronological comparison order", () => {
    expect(getAnthropometryComparisonIds(history, "latest-two")).toEqual([4, 3]);
    expect(getAnthropometryComparisonIds(history, "latest-three")).toEqual([4, 3, 2]);
    expect(getAnthropometryComparisonIds(history, "latest-five")).toEqual([4, 3, 2, 1]);
    expect(getAnthropometryComparisonIds(history, "baseline-latest")).toEqual([4, 1]);
    expect(getAnthropometryComparisonIds(history, "all")).toEqual([4, 3, 2, 1]);
    expect(selectAnthropometryComparisonMeasurements(history, [4, 1]).map((item) => item.id)).toEqual([1, 4]);
  });

  it("reuses the legacy derived anthropometry calculations", () => {
    const measurement: Measurement = {
      ...makeMeasurement(4, "2026-11-06"),
      body_fat: 20,
      arm_relax_r: 30,
      sf_triceps: 10,
      sf_protocol: "JP3F",
      sf_suprailiac: 12,
      sf_thigh_sf: 16,
      biestyloid_diameter_mm: 55,
      biepicondylar_femur_diameter_mm: 89,
      four_component_reference: "F",
    };
    const result = calculateAnthropometryReportValues(measurement, "F", "1990-02-10");
    expect(result.bmi).toBe(24.2);
    expect(result.fatMass).toBe(14);
    expect(result.arm).toEqual(calcArmAnthropometry(30, 10, "F"));
    expect(result.skinfoldSum).toBe(38);
    expect(result.fourComponent).toEqual(calculateFourComponentAnthropometry({
      weightKg: 70,
      heightCm: 170,
      bodyFatPct: 20,
      biestyloidDiameterMm: 55,
      biepicondylarFemurDiameterMm: 89,
      reference: "F",
    }).result);
    expect(result.ambcAdequacy).not.toBeNull();
  });
});

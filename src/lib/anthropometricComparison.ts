import type { Measurement } from "@/lib/supabase";
import {
  classifyAmbc,
  classifyBodyFat,
  calcArmAnthropometry,
  PROTOCOLS,
  type SkinfoldKey,
} from "@/lib/anthropometryUtils";
import { calculateFourComponentAnthropometry } from "@/lib/fourComponentAnthropometry";

export const ANTHROPOMETRY_COMPARISON_PRINT_MAX = 5;

export function getReportBmiLabel(bmi: number): string {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidade";
}

export type AnthropometryComparisonPreset =
  | "latest-two"
  | "latest-three"
  | "latest-five"
  | "baseline-latest"
  | "all";

export function getAnthropometryComparisonIds(
  measurements: Measurement[],
  preset: AnthropometryComparisonPreset,
): number[] {
  const ids = measurements.map((measurement) => measurement.id).filter((id): id is number => id != null);
  if (preset === "all") return ids;
  if (preset === "baseline-latest") {
    const newest = ids[0];
    const baseline = ids[ids.length - 1];
    return newest == null ? [] : baseline == null ? [newest] : [...new Set([newest, baseline])];
  }
  const limit = preset === "latest-two" ? 2 : preset === "latest-three" ? 3 : ANTHROPOMETRY_COMPARISON_PRINT_MAX;
  return ids.slice(0, limit);
}

export function selectAnthropometryComparisonMeasurements(
  measurements: Measurement[],
  selectedIds: number[],
): Measurement[] {
  return measurements
    .filter((measurement) => measurement.id != null && selectedIds.includes(measurement.id))
    .sort((a, b) => (a.assessment_date ?? "").localeCompare(b.assessment_date ?? ""));
}

export function getReportSkinfoldValue(measurement: Measurement, key: SkinfoldKey): number | null {
  return measurement[key] ?? null;
}

export function calculateReportAgeAt(birthDate: string, assessmentDate: string): number {
  const birth = new Date(`${birthDate}T12:00:00`);
  const assessment = new Date(`${assessmentDate}T12:00:00`);
  let age = assessment.getFullYear() - birth.getFullYear();
  const monthDelta = assessment.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && assessment.getDate() < birth.getDate())) age--;
  return age;
}

export function calculateAnthropometryReportValues(
  measurement: Measurement,
  gender: "M" | "F" | null,
  birthDate: string | null,
) {
  const bmi = !measurement.weight || !measurement.height
    ? null
    : parseFloat((measurement.weight / Math.pow(measurement.height / 100, 2)).toFixed(1));
  const fatMass = measurement.weight != null && measurement.body_fat != null
    ? parseFloat((measurement.weight * (measurement.body_fat / 100)).toFixed(1))
    : null;
  const arm = gender && measurement.arm_relax_r != null && measurement.sf_triceps != null
    ? calcArmAnthropometry(measurement.arm_relax_r, measurement.sf_triceps, gender)
    : null;
  const fourComponent = measurement.weight != null
      && measurement.height != null
      && measurement.body_fat != null
      && measurement.biestyloid_diameter_mm != null
      && measurement.biepicondylar_femur_diameter_mm != null
      && measurement.four_component_reference
    ? calculateFourComponentAnthropometry({
        weightKg: measurement.weight,
        heightCm: measurement.height,
        bodyFatPct: measurement.body_fat,
        biestyloidDiameterMm: measurement.biestyloid_diameter_mm,
        biepicondylarFemurDiameterMm: measurement.biepicondylar_femur_diameter_mm,
        reference: measurement.four_component_reference,
      }).result
    : null;

  let skinfoldSum: number | null = null;
  if (measurement.sf_protocol) {
    const protocol = PROTOCOLS.find((item) => item.id === measurement.sf_protocol);
    if (protocol && protocol.skinfolds.every((key) => getReportSkinfoldValue(measurement, key) != null)) {
      const sum = protocol.skinfolds.reduce((total, key) => total + (getReportSkinfoldValue(measurement, key) ?? 0), 0);
      skinfoldSum = sum > 0 ? sum : null;
    }
  }

  const assessmentAge = gender && birthDate && measurement.assessment_date
    ? calculateReportAgeAt(birthDate, measurement.assessment_date)
    : null;
  const ambcAdequacy = arm && gender && assessmentAge != null
    ? classifyAmbc(arm.ambc, gender, assessmentAge)
    : null;
  const bodyFatClassification = measurement.body_fat != null && gender
    ? classifyBodyFat(measurement.body_fat, gender)
    : null;

  return { bmi, fatMass, arm, fourComponent, skinfoldSum, ambcAdequacy, bodyFatClassification };
}

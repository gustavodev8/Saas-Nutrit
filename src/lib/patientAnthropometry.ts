import type {
  MeasurementForm,
  OfficialAnthropometrySource,
} from "@/components/admin/anthropometryTypes";
import { calcBodyFat, type SkinfoldProtocol } from "@/lib/anthropometryUtils";
import { validateFourComponentProtocol } from "@/lib/fourComponentAnthropometry";
import type { Measurement, Patient } from "@/lib/supabase";

const numberOrUndefined = (value?: string) =>
  value != null && value !== "" ? parseFloat(value) : undefined;

export const calcBMI = (weight?: number, height?: number): string | null => {
  if (!weight || !height) return null;
  return (weight / Math.pow(height / 100, 2)).toFixed(1);
};

export const getBmiClass = (bmi: number) => {
  if (bmi < 18.5) {
    return { label: "Abaixo do peso", cls: "bg-blue-100 text-blue-700" };
  }
  if (bmi < 25) {
    return { label: "Normal", cls: "bg-green-100 text-green-700" };
  }
  if (bmi < 30) {
    return { label: "Sobrepeso", cls: "bg-yellow-100 text-yellow-700" };
  }
  return { label: "Obesidade", cls: "bg-red-100 text-red-700" };
};

export interface LatestMeasurementSummaryItem {
  label: string;
  value: string;
  badge: string | null;
}

export const calcPatientAge = (birthDate?: string | null): number => {
  if (!birthDate) return 25;
  const today = new Date();
  const birth = new Date(`${birthDate}T12:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export async function buildAnthropometryPayload(params: {
  form: MeasurementForm;
  patientId: number;
  patientGender?: Patient["gender"] | null;
  patientBirthDate?: string | null;
  protocol: SkinfoldProtocol;
  officialSource: OfficialAnthropometrySource;
}): Promise<Record<string, unknown>> {
  const {
    form,
    patientId,
    patientGender,
    patientBirthDate,
    protocol,
    officialSource,
  } = params;

  const patientAge = calcPatientAge(patientBirthDate);
  const genderKey = patientGender === "F" ? "F" : "M";
  const payload: Record<string, unknown> = {
    patient_id: patientId,
    assessment_date: form.assessment_date,
  };

  const numericFields: Array<keyof MeasurementForm> = [
    "weight",
    "height",
    "biestyloid_diameter_mm",
    "biepicondylar_femur_diameter_mm",
    "neck",
    "shoulder",
    "chest",
    "waist",
    "abdomen",
    "hip",
    "arm_relax_r",
    "arm_relax_l",
    "arm_contract_r",
    "arm_contract_l",
    "forearm_r",
    "forearm_l",
    "wrist_r",
    "wrist_l",
    "thigh_prox_r",
    "thigh_prox_l",
    "thigh_r",
    "thigh_l",
    "calf_r",
    "calf_l",
  ];

  numericFields.forEach((field) => {
    const value = numberOrUndefined(form[field]);
    if (value != null) {
      payload[field] = value;
    }
  });

  if (form.notes) {
    payload.notes = form.notes;
  }

  const visceralFat = numberOrUndefined(form.visceral_fat);
  if (visceralFat != null) {
    payload.visceral_fat = visceralFat;
  }

  const sfValues = {
    sf_pectoral: numberOrUndefined(form.sf_pectoral),
    sf_midaxillary: numberOrUndefined(form.sf_midaxillary),
    sf_triceps: numberOrUndefined(form.sf_triceps),
    sf_biceps: numberOrUndefined(form.sf_biceps),
    sf_subscapular: numberOrUndefined(form.sf_subscapular),
    sf_suprailiac: numberOrUndefined(form.sf_suprailiac),
    sf_abdominal: numberOrUndefined(form.sf_abdominal),
    sf_thigh_sf: numberOrUndefined(form.sf_thigh_sf),
    sf_calf_sf: numberOrUndefined(form.sf_calf_sf),
  };

  Object.entries(sfValues).forEach(([field, value]) => {
    if (value != null) {
      payload[field] = value;
    }
  });

  const sfResult = calcBodyFat(protocol, sfValues, patientAge, genderKey);
  if (sfResult) {
    payload.sf_protocol = protocol;
    payload.body_density =
      sfResult.density > 0 ? parseFloat(sfResult.density.toFixed(6)) : 0;
  }

  const weight = numberOrUndefined(form.weight) ?? null;
  const bioFatPct = numberOrUndefined(form.bio_fat_pct);
  const bioLeanKg = numberOrUndefined(form.bio_lean_kg);

  if (officialSource === "bio" && bioFatPct != null) {
    payload.body_fat = bioFatPct;
    payload.lean_mass =
      bioLeanKg != null
        ? bioLeanKg
        : weight != null
          ? parseFloat((weight * (1 - bioFatPct / 100)).toFixed(2))
          : undefined;
  } else if (officialSource === "skinfold" && sfResult) {
    payload.body_fat = parseFloat(sfResult.fatPct.toFixed(2));
    payload.lean_mass =
      weight != null
        ? parseFloat((weight * (1 - sfResult.fatPct / 100)).toFixed(2))
        : undefined;
  } else if (officialSource === null) {
    if (sfResult) {
      payload.body_fat = parseFloat(sfResult.fatPct.toFixed(2));
      payload.lean_mass =
        weight != null
          ? parseFloat((weight * (1 - sfResult.fatPct / 100)).toFixed(2))
          : undefined;
    } else if (bioFatPct != null) {
      payload.body_fat = bioFatPct;
      payload.lean_mass =
        bioLeanKg != null
          ? bioLeanKg
          : weight != null
            ? parseFloat((weight * (1 - bioFatPct / 100)).toFixed(2))
            : undefined;
    }
  }

  const fourComponentErrors = validateFourComponentProtocol({
    weightKg: weight ?? undefined,
    heightCm: numberOrUndefined(form.height),
    bodyFatPct: typeof payload.body_fat === "number" ? payload.body_fat : undefined,
    biestyloidDiameterMm: numberOrUndefined(form.biestyloid_diameter_mm),
    biepicondylarFemurDiameterMm: numberOrUndefined(form.biepicondylar_femur_diameter_mm),
    reference: form.four_component_reference,
  });
  if (fourComponentErrors.length > 0) {
    throw new Error(fourComponentErrors[0]);
  }
  if (
    numberOrUndefined(form.biestyloid_diameter_mm) != null &&
    numberOrUndefined(form.biepicondylar_femur_diameter_mm) != null &&
    (form.four_component_reference === "M" || form.four_component_reference === "F")
  ) {
    payload.four_component_reference = form.four_component_reference;
  }

  return payload;
}

export const toMeasurementRecord = (payload: Record<string, unknown>) =>
  payload as Measurement;

export const buildLatestMeasurementSummary = (
  latest?: Measurement | null,
  latestBmi?: string | null,
): LatestMeasurementSummaryItem[] => [
  {
    label: "Peso",
    value: latest?.weight != null ? `${latest.weight} kg` : "—",
    badge: null,
  },
  {
    label: "Altura",
    value: latest?.height != null ? `${latest.height} cm` : "—",
    badge: null,
  },
  {
    label: "IMC",
    value: latestBmi ?? "—",
    badge: latestBmi ?? null,
  },
  {
    label: "% Gordura",
    value: latest?.body_fat != null ? `${latest.body_fat}%` : "—",
    badge: null,
  },
  {
    label: "Cintura",
    value: latest?.waist != null ? `${latest.waist} cm` : "—",
    badge: null,
  },
];

export const formatMeasurementHistoryCount = (count: number) =>
  count === 1
    ? "1 avaliação registrada"
    : `${count} avaliações registradas`;

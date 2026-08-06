import type { Patient } from "@/lib/supabase";

export const PATIENT_PROFILE_TRACKED_FIELDS: readonly (keyof Patient)[] = [
  "name",
  "cpf",
  "email",
  "phone",
  "city",
  "birth_date",
  "gender",
  "occupation",
  "notes",
];

export function formatCPF(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number.parseInt(digits[index], 10) * (10 - index);
  }

  let verifier = (sum * 10) % 11;
  if (verifier >= 10) verifier = 0;
  if (verifier !== Number.parseInt(digits[9], 10)) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number.parseInt(digits[index], 10) * (11 - index);
  }

  verifier = (sum * 10) % 11;
  if (verifier >= 10) verifier = 0;

  return verifier === Number.parseInt(digits[10], 10);
}

export function hasPatientProfileChanges(form: Patient, patient: Patient): boolean {
  return PATIENT_PROFILE_TRACKED_FIELDS.some(
    (field) => String(form[field] ?? "") !== String(patient[field] ?? ""),
  );
}

import type { Booking, Patient } from "@/lib/supabase";

const digitsOnly = (value?: string | null) => value?.replace(/\D/g, "") ?? "";

const normalizeIdentityText = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function bookingBelongsToPatient(
  patient: Pick<Patient, "id" | "name" | "email" | "phone" | "cpf">,
  booking: Pick<
    Booking,
    "patient_id" | "client_name" | "client_email" | "client_phone" | "client_cpf"
  >,
) {
  if (booking.patient_id === patient.id) return true;

  const patientEmail = patient.email?.trim().toLowerCase();
  const patientCpf = digitsOnly(patient.cpf);
  const patientPhone = digitsOnly(patient.phone);
  const patientName = normalizeIdentityText(patient.name);

  const bookingEmail = booking.client_email?.trim().toLowerCase();
  const bookingCpf = digitsOnly(booking.client_cpf);
  const bookingPhone = digitsOnly(booking.client_phone);
  const bookingName = normalizeIdentityText(booking.client_name);

  const cpfMatches =
    patientCpf.length === 11 &&
    bookingCpf.length === 11 &&
    patientCpf === bookingCpf;
  const emailMatches = Boolean(patientEmail && bookingEmail === patientEmail);
  const phoneAndNameMatch = Boolean(
    patientPhone &&
      bookingPhone &&
      patientPhone === bookingPhone &&
      patientName &&
      bookingName &&
      patientName === bookingName,
  );

  return cpfMatches || emailMatches || phoneAndNameMatch;
}

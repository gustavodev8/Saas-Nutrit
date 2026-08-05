import type { Patient, PatientOperationalIndicators } from "@/lib/supabase";

export const PATIENT_SEGMENT_KEYS = [
  "sem_proximo_agendamento",
  "sem_plano_ativo",
  "exames_pendentes",
  "cadastro_incompleto",
  "inativo_30d",
  "inativo_60d",
  "inativo_90d",
  "retorno_vencido",
] as const;

export type PatientSegmentKey = (typeof PATIENT_SEGMENT_KEYS)[number];

export interface PatientSegmentDefinition {
  key: PatientSegmentKey;
  label: string;
  description: string;
}

export const PATIENT_SEGMENT_DEFINITIONS: Record<
  PatientSegmentKey,
  PatientSegmentDefinition
> = {
  sem_proximo_agendamento: {
    key: "sem_proximo_agendamento",
    label: "Sem proximo agendamento",
    description: "Paciente sem consulta futura confirmada ou pendente.",
  },
  sem_plano_ativo: {
    key: "sem_plano_ativo",
    label: "Sem plano ativo",
    description: "Paciente sem plano alimentar vigente no periodo atual.",
  },
  exames_pendentes: {
    key: "exames_pendentes",
    label: "Exames pendentes",
    description: "Paciente com solicitacoes de exames ainda pendentes.",
  },
  cadastro_incompleto: {
    key: "cadastro_incompleto",
    label: "Cadastro incompleto",
    description: "Faltam dados essenciais de perfil e contato.",
  },
  inativo_30d: {
    key: "inativo_30d",
    label: "Inativo ha 30 dias",
    description: "Sem interacao recente ha pelo menos 30 dias.",
  },
  inativo_60d: {
    key: "inativo_60d",
    label: "Inativo ha 60 dias",
    description: "Sem interacao recente ha pelo menos 60 dias.",
  },
  inativo_90d: {
    key: "inativo_90d",
    label: "Inativo ha 90 dias",
    description: "Sem interacao recente ha pelo menos 90 dias.",
  },
  retorno_vencido: {
    key: "retorno_vencido",
    label: "Retorno vencido",
    description: "Data prevista de retorno ja passou e nao ha proximo agendamento.",
  },
};

export const PATIENT_SEGMENT_LABELS: Record<PatientSegmentKey, string> =
  PATIENT_SEGMENT_KEYS.reduce(
    (acc, key) => {
      acc[key] = PATIENT_SEGMENT_DEFINITIONS[key].label;
      return acc;
    },
    {} as Record<PatientSegmentKey, string>,
  );

export const REQUIRED_PATIENT_PROFILE_FIELDS = [
  "email",
  "phone",
  "birth_date",
  "cpf",
  "city",
  "gender",
  "occupation",
] as const;

export type RequiredPatientProfileField =
  (typeof REQUIRED_PATIENT_PROFILE_FIELDS)[number];

export interface PatientSegmentOperationalFlags {
  hasNextBooking: boolean;
  hasActiveMealPlan: boolean;
  hasPendingExams: boolean;
}

export interface PatientLastInteraction {
  lastInteractionAt?: string | null;
  nextReturnDate?: string | null;
  nextBookingDate?: string | null;
}

export interface PatientSegmentInput {
  patient: Pick<
    Patient,
    | "id"
    | "created_at"
    | "email"
    | "phone"
    | "birth_date"
    | "cpf"
    | "city"
    | "gender"
    | "occupation"
  >;
  operationalFlags?: Partial<PatientSegmentOperationalFlags> | null;
  lastInteraction?: PatientLastInteraction | null;
  now?: Date | string;
}

const DEFAULT_OPERATIONAL_FLAGS: PatientSegmentOperationalFlags = {
  hasNextBooking: false,
  hasActiveMealPlan: false,
  hasPendingExams: false,
};

export function resolvePatientOperationalFlags(
  patientId: number | null | undefined,
  indicators?: PatientOperationalIndicators | null,
): PatientSegmentOperationalFlags {
  if (!patientId || !indicators) return { ...DEFAULT_OPERATIONAL_FLAGS };

  return {
    hasNextBooking: indicators.withoutNextBookingIds
      ? !indicators.withoutNextBookingIds.includes(patientId)
      : false,
    hasActiveMealPlan: indicators.withoutActiveMealPlanIds
      ? !indicators.withoutActiveMealPlanIds.includes(patientId)
      : false,
    hasPendingExams: indicators.pendingExamRequestPatientIds
      ? indicators.pendingExamRequestPatientIds.includes(patientId)
      : false,
  };
}

export function getMissingPatientProfileFields(
  patient: PatientSegmentInput["patient"],
): RequiredPatientProfileField[] {
  return REQUIRED_PATIENT_PROFILE_FIELDS.filter((field) => {
    const value = patient[field];
    return typeof value === "string" ? value.trim().length === 0 : !value;
  });
}

export function isReturnOverdue(
  lastInteraction?: PatientLastInteraction | null,
  operationalFlags?: Partial<PatientSegmentOperationalFlags> | null,
  now?: Date | string,
): boolean {
  const effectiveFlags = {
    ...DEFAULT_OPERATIONAL_FLAGS,
    ...operationalFlags,
  };

  if (effectiveFlags.hasNextBooking) return false;

  const today = startOfDay(resolveNow(now));
  const nextBookingDate = startOfDay(parseDate(lastInteraction?.nextBookingDate));
  if (nextBookingDate && nextBookingDate >= today) return false;

  const nextReturnDate = startOfDay(parseDate(lastInteraction?.nextReturnDate));
  return Boolean(nextReturnDate && nextReturnDate < today);
}

export function derivePatientSegments({
  patient,
  operationalFlags,
  lastInteraction,
  now,
}: PatientSegmentInput): PatientSegmentKey[] {
  const effectiveFlags = {
    ...DEFAULT_OPERATIONAL_FLAGS,
    ...operationalFlags,
  };

  const segments: PatientSegmentKey[] = [];

  if (!effectiveFlags.hasNextBooking) {
    segments.push("sem_proximo_agendamento");
  }

  if (!effectiveFlags.hasActiveMealPlan) {
    segments.push("sem_plano_ativo");
  }

  if (effectiveFlags.hasPendingExams) {
    segments.push("exames_pendentes");
  }

  if (getMissingPatientProfileFields(patient).length > 0) {
    segments.push("cadastro_incompleto");
  }

  const inactiveDays = getInactiveDays(
    lastInteraction?.lastInteractionAt ?? patient.created_at,
    now,
  );

  if (inactiveDays >= 30) segments.push("inativo_30d");
  if (inactiveDays >= 60) segments.push("inativo_60d");
  if (inactiveDays >= 90) segments.push("inativo_90d");

  if (isReturnOverdue(lastInteraction, effectiveFlags, now)) {
    segments.push("retorno_vencido");
  }

  return segments;
}

function getInactiveDays(
  lastInteractionAt?: string | null,
  now?: Date | string,
): number {
  const lastInteractionDate = startOfDay(parseDate(lastInteractionAt));
  if (!lastInteractionDate) return 0;

  const today = startOfDay(resolveNow(now));
  const diffMs = today.getTime() - lastInteractionDate.getTime();
  if (diffMs <= 0) return 0;

  return Math.floor(diffMs / DAY_IN_MS);
}

function resolveNow(value?: Date | string): Date {
  return value instanceof Date ? new Date(value.getTime()) : parseDate(value) ?? new Date();
}

function parseDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoDateOnly = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
  const parsed = new Date(isoDateOnly ? `${trimmed}T00:00:00` : trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date | null): Date | null {
  if (!date) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

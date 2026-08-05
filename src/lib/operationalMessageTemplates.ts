import type { Booking } from "@/lib/supabase";

export const OPERATIONAL_MESSAGE_TEMPLATE_KEYS = [
  "confirmacao",
  "lembrete_consulta",
  "lembrete_retorno",
  "exame_pendente",
  "pos_consulta",
  "sem_retorno",
] as const;

export type OperationalMessageTemplateKey =
  (typeof OPERATIONAL_MESSAGE_TEMPLATE_KEYS)[number];

export const OPERATIONAL_MESSAGE_VARIABLE_KEYS = [
  "patient_name",
  "patient_first_name",
  "professional_name",
  "appointment_date",
  "appointment_time",
  "appointment_datetime",
  "booking_summary",
  "plan_name",
  "consultation_type",
  "exam_name",
  "return_window",
  "follow_up_channel",
] as const;

export type OperationalMessageVariableKey =
  (typeof OPERATIONAL_MESSAGE_VARIABLE_KEYS)[number];

export interface OperationalMessageTemplate {
  key: OperationalMessageTemplateKey;
  title: string;
  description: string;
  body: string;
  variables: OperationalMessageVariableKey[];
}

type BookingMessageContext = Pick<
  Booking,
  | "client_name"
  | "appointment_date"
  | "appointment_time"
  | "plan_name"
  | "type"
>;

export interface OperationalMessageContext {
  patientName?: string | null;
  professionalName?: string | null;
  booking?: Partial<BookingMessageContext> | null;
  customVariables?: Partial<
    Record<OperationalMessageVariableKey | string, string | number | null | undefined>
  >;
}

const DEFAULT_PROFESSIONAL_NAME = "Dr. Fillipe";
const DEFAULT_EXAM_NAME = "os exames pendentes";
const DEFAULT_RETURN_WINDOW = "os proximos dias";
const DEFAULT_FOLLOW_UP_CHANNEL = "por aqui";

const TEMPLATE_RECORD: Record<
  OperationalMessageTemplateKey,
  OperationalMessageTemplate
> = {
  confirmacao: {
    key: "confirmacao",
    title: "Confirmacao de consulta",
    description: "Confirma uma consulta ou retorno ja agendado.",
    body:
      "Oi {{patient_first_name}}! Sua consulta de {{plan_name}} esta confirmada para {{booking_summary}}. Se precisar ajustar algo, me avise por aqui.\n\n{{professional_name}}",
    variables: [
      "patient_first_name",
      "plan_name",
      "booking_summary",
      "professional_name",
    ],
  },
  lembrete_consulta: {
    key: "lembrete_consulta",
    title: "Lembrete de consulta",
    description: "Lembra o paciente do horario da consulta.",
    body:
      "Oi {{patient_first_name}}! Passando para lembrar da sua consulta de {{plan_name}} em {{booking_summary}}. Se surgir algum imprevisto, me chama com antecedencia.\n\n{{professional_name}}",
    variables: [
      "patient_first_name",
      "plan_name",
      "booking_summary",
      "professional_name",
    ],
  },
  lembrete_retorno: {
    key: "lembrete_retorno",
    title: "Lembrete de retorno",
    description: "Incentiva o paciente a marcar o proximo retorno.",
    body:
      "Oi {{patient_first_name}}! Estou passando para te lembrar de agendar seu retorno para {{return_window}} e manter o acompanhamento em dia. Se quiser, eu posso te orientar nas opcoes de horario.\n\n{{professional_name}}",
    variables: [
      "patient_first_name",
      "return_window",
      "professional_name",
    ],
  },
  exame_pendente: {
    key: "exame_pendente",
    title: "Exame pendente",
    description: "Solicita o envio ou retorno de exames pendentes.",
    body:
      "Oi {{patient_first_name}}! Quando voce conseguir, me envia {{exam_name}} para eu seguir com sua avaliacao da melhor forma. Qualquer dificuldade, me avise.\n\n{{professional_name}}",
    variables: [
      "patient_first_name",
      "exam_name",
      "professional_name",
    ],
  },
  pos_consulta: {
    key: "pos_consulta",
    title: "Pos-consulta",
    description: "Mantem o follow-up logo apos a consulta.",
    body:
      "Oi {{patient_first_name}}! Foi otimo te atender hoje. Se pintar qualquer duvida sobre o plano ou as orientacoes, pode me chamar {{follow_up_channel}}.\n\n{{professional_name}}",
    variables: [
      "patient_first_name",
      "follow_up_channel",
      "professional_name",
    ],
  },
  sem_retorno: {
    key: "sem_retorno",
    title: "Paciente sem retorno",
    description: "Reativa pacientes que ainda nao marcaram o proximo passo.",
    body:
      "Oi {{patient_first_name}}! Notei que ainda nao ficou um proximo retorno agendado. Se fizer sentido para voce, podemos organizar a continuidade do acompanhamento e revisar sua evolucao.\n\n{{professional_name}}",
    variables: ["patient_first_name", "professional_name"],
  },
};

const templateList = OPERATIONAL_MESSAGE_TEMPLATE_KEYS.map(
  (key) => TEMPLATE_RECORD[key],
);

export function listOperationalMessageTemplates(): OperationalMessageTemplate[] {
  return templateList;
}

export function getOperationalMessageTemplate(
  key: OperationalMessageTemplateKey,
): OperationalMessageTemplate {
  return TEMPLATE_RECORD[key];
}

export function buildOperationalMessageVariables(
  context: OperationalMessageContext = {},
): Record<OperationalMessageVariableKey, string> {
  const booking = context.booking ?? {};
  const patientName = firstNonEmptyString(
    context.patientName,
    booking.client_name,
  );
  const patientFirstName = getFirstName(patientName);
  const appointmentDate = formatAppointmentDate(booking.appointment_date);
  const appointmentTime = formatAppointmentTime(booking.appointment_time);
  const appointmentDateTime = [appointmentDate, appointmentTime]
    .filter(Boolean)
    .join(" as ");
  const consultationType = formatConsultationType(booking.type);
  const bookingSummary = [appointmentDateTime, consultationType]
    .filter(Boolean)
    .join(" ");

  return {
    patient_name: patientName,
    patient_first_name: patientFirstName,
    professional_name:
      firstNonEmptyString(context.professionalName) ||
      DEFAULT_PROFESSIONAL_NAME,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    appointment_datetime: appointmentDateTime,
    booking_summary: bookingSummary,
    plan_name: firstNonEmptyString(booking.plan_name),
    consultation_type: consultationType,
    exam_name: DEFAULT_EXAM_NAME,
    return_window: DEFAULT_RETURN_WINDOW,
    follow_up_channel: DEFAULT_FOLLOW_UP_CHANNEL,
  };
}

export function renderOperationalMessage(
  key: OperationalMessageTemplateKey,
  context: OperationalMessageContext = {},
): string {
  const template = getOperationalMessageTemplate(key);
  const variables = {
    ...buildOperationalMessageVariables(context),
    ...normalizeCustomVariables(context.customVariables),
  };

  const rendered = template.body.replace(
    /\{\{\s*([a-z0-9_]+)\s*\}\}/gi,
    (_, variableName: string) => variables[variableName] ?? "",
  );

  return normalizeRenderedMessage(rendered);
}

function normalizeCustomVariables(
  customVariables?: OperationalMessageContext["customVariables"],
): Record<string, string> {
  if (!customVariables) return {};

  return Object.entries(customVariables).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      const normalized = normalizeValue(value);
      if (normalized) acc[key] = normalized;
      return acc;
    },
    {},
  );
}

function firstNonEmptyString(
  ...values: Array<string | null | undefined>
): string {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized) return normalized;
  }

  return "";
}

function getFirstName(fullName: string): string {
  return normalizeValue(fullName).split(/\s+/)[0] || "";
}

function formatAppointmentDate(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) return "";

  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return normalized;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function formatAppointmentTime(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) return "";

  const match = normalized.match(/^(\d{2}):(\d{2})/);
  if (!match) return normalized;

  const [, hours, minutes] = match;
  return `${hours}:${minutes}`;
}

function formatConsultationType(
  value?: BookingMessageContext["type"] | null,
): string {
  if (value === "online") return "(online)";
  if (value === "presencial") return "(presencial)";
  return "";
}

function normalizeRenderedMessage(message: string): string {
  const lines = message
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd());

  const compact: string[] = [];
  for (const line of lines) {
    const isEmpty = line.trim().length === 0;
    const lastLine = compact[compact.length - 1];
    if (isEmpty && lastLine === "") continue;
    compact.push(isEmpty ? "" : line);
  }

  return compact.join("\n").trim();
}

function normalizeValue(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return "";
  return value.trim();
}

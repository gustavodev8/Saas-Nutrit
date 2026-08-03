export type OperationalArea = "email" | "pdf" | "payment" | "booking" | "system";
export type OperationalStatus = "success" | "warning" | "error";

export interface OperationalLogInput {
  area: OperationalArea;
  status: OperationalStatus;
  action: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface OperationalLogEvent extends OperationalLogInput {
  id: string;
  createdAt: string;
  page: string;
}

const STORAGE_KEY = "nutri_admin_operational_logs";
const MAX_LOGS = 120;
const MAX_FIELD_LENGTH = 240;
const SENSITIVE_KEY_PATTERN = /(email|mail|cpf|phone|telefone|customer|client|patient|paciente|name|nome)/i;

const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `op_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

export const sanitizeOperationalContext = (
  context: Record<string, unknown> = {},
): Record<string, string | number | boolean | null> => {
  const safe: Record<string, string | number | boolean | null> = {};

  Object.entries(context).forEach(([key, value]) => {
    if (value === undefined) return;
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      safe[key] = "[redacted]";
      return;
    }
    if (typeof value === "string") {
      safe[key] = value.length > MAX_FIELD_LENGTH ? `${value.slice(0, MAX_FIELD_LENGTH)}...` : value;
      return;
    }
    if (typeof value === "number" || typeof value === "boolean" || value === null) {
      safe[key] = value;
      return;
    }
    if (value instanceof Error) {
      safe[key] = value.message;
      return;
    }
    safe[key] = JSON.stringify(value).slice(0, MAX_FIELD_LENGTH);
  });

  return safe;
};

export const readOperationalLogs = (): OperationalLogEvent[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OperationalLogEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeOperationalLogs = (logs: OperationalLogEvent[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
};

export const clearOperationalLogs = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("operational-logs-updated"));
};

export const recordOperationalEvent = (input: OperationalLogInput): OperationalLogEvent => {
  const event: OperationalLogEvent = {
    ...input,
    context: sanitizeOperationalContext(input.context),
    id: makeId(),
    createdAt: new Date().toISOString(),
    page: isBrowser() ? window.location.pathname : "server",
  };

  const logs = [event, ...readOperationalLogs()].slice(0, MAX_LOGS);
  writeOperationalLogs(logs);

  if (isBrowser()) window.dispatchEvent(new Event("operational-logs-updated"));
  return event;
};

export const getOperationalErrorMessage = (
  area: OperationalArea,
  fallback = "Tente novamente em alguns instantes.",
) => {
  const hints: Record<OperationalArea, string> = {
    email: "Verifique o email do paciente, anexos e configuracao do envio. O evento foi registrado em Operacao.",
    pdf: "Confira os dados do registro e tente gerar novamente. O evento foi registrado em Operacao.",
    payment: "Confira o status do pagamento e tente novamente. O evento foi registrado em Operacao.",
    booking: "Confira disponibilidade, status e conexao com o Supabase. O evento foi registrado em Operacao.",
    system: "O evento foi registrado em Operacao para diagnostico.",
  };

  return `${fallback} ${hints[area]}`;
};

export const summarizeOperationalLogs = (logs: OperationalLogEvent[]) => {
  const byArea = logs.reduce<Record<OperationalArea, number>>(
    (acc, log) => {
      acc[log.area] += 1;
      return acc;
    },
    { email: 0, pdf: 0, payment: 0, booking: 0, system: 0 },
  );

  const errorCount = logs.filter((log) => log.status === "error").length;
  const warningCount = logs.filter((log) => log.status === "warning").length;
  const successCount = logs.filter((log) => log.status === "success").length;

  return { byArea, errorCount, warningCount, successCount, total: logs.length };
};

export type BroadcastSource = "ebooks" | "bookings" | "patients" | "leads";

export interface BroadcastFilters {
  sources?: string[];
  periodDays?: number | null;
  productName?: string | null;
  manualEmails?: string[];
}

export interface BroadcastAudienceSummary {
  ebooks: number;
  bookings: number;
  patients: number;
  leads: number;
  manual: number;
  totalRecipients: number;
}

export interface BroadcastAudienceResult {
  recipients: string[];
  summary: BroadcastAudienceSummary;
}

const EMAIL_FIELDS: Record<BroadcastSource, string> = {
  ebooks: "customer_email",
  bookings: "client_email",
  patients: "email",
  leads: "email",
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createSourceSummary(): BroadcastAudienceSummary {
  return {
    ebooks: 0,
    bookings: 0,
    patients: 0,
    leads: 0,
    manual: 0,
    totalRecipients: 0,
  };
}

function normalizeSources(sources?: string[]): BroadcastSource[] {
  const requested = Array.isArray(sources) ? sources : ["ebooks", "bookings", "patients", "leads"];
  const allowed = new Set<BroadcastSource>(["ebooks", "bookings", "patients", "leads"]);
  return requested.filter((source): source is BroadcastSource => allowed.has(source as BroadcastSource));
}

async function fetchRows(
  url: string,
  headers: Record<string, string>,
): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    console.error("broadcast audience fetch error:", response.status, url);
    return [];
  }

  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

export async function resolveBroadcastAudience({
  supabaseUrl,
  serviceKey,
  filters,
}: {
  supabaseUrl: string;
  serviceKey: string;
  filters?: BroadcastFilters;
}): Promise<BroadcastAudienceResult> {
  const sources = normalizeSources(filters?.sources);
  const periodDays = typeof filters?.periodDays === "number" && filters.periodDays > 0
    ? filters.periodDays
    : null;
  const productName = filters?.productName?.trim() || null;
  const manualEmails = Array.isArray(filters?.manualEmails) ? filters.manualEmails : [];

  const since = periodDays
    ? new Date(Date.now() - periodDays * 86400 * 1000).toISOString()
    : null;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  const emails = new Set<string>();
  const summary = createSourceSummary();

  const addEmail = (raw: unknown, source: keyof BroadcastAudienceSummary) => {
    if (typeof raw !== "string") return;

    const normalized = normalizeEmail(raw);
    if (!isValidEmail(normalized)) return;
    if (emails.has(normalized)) return;

    emails.add(normalized);
    summary[source] += 1;
  };

  if (sources.includes("ebooks")) {
    let url = `${supabaseUrl}/rest/v1/payment_logs?select=${EMAIL_FIELDS.ebooks}&status=eq.approved`;
    if (since) url += `&created_at=gte.${since}`;
    if (productName) url += `&product_name=ilike.*${encodeURIComponent(productName)}*`;

    const rows = await fetchRows(url, headers);
    for (const row of rows) addEmail(row[EMAIL_FIELDS.ebooks], "ebooks");
  }

  if (sources.includes("bookings")) {
    let url = `${supabaseUrl}/rest/v1/bookings?select=${EMAIL_FIELDS.bookings}&status=neq.cancelled`;
    if (since) url += `&created_at=gte.${since}`;

    const rows = await fetchRows(url, headers);
    for (const row of rows) addEmail(row[EMAIL_FIELDS.bookings], "bookings");
  }

  if (sources.includes("patients")) {
    let url = `${supabaseUrl}/rest/v1/patients?select=${EMAIL_FIELDS.patients}`;
    if (since) url += `&created_at=gte.${since}`;

    const rows = await fetchRows(url, headers);
    for (const row of rows) addEmail(row[EMAIL_FIELDS.patients], "patients");
  }

  if (sources.includes("leads")) {
    let url = `${supabaseUrl}/rest/v1/leads?select=${EMAIL_FIELDS.leads}`;
    if (since) url += `&created_at=gte.${since}`;

    const rows = await fetchRows(url, headers);
    for (const row of rows) addEmail(row[EMAIL_FIELDS.leads], "leads");
  }

  for (const email of manualEmails) {
    addEmail(email, "manual");
  }

  summary.totalRecipients = emails.size;

  return {
    recipients: [...emails],
    summary,
  };
}

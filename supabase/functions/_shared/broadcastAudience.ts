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
  scope,
}: {
  supabaseUrl: string;
  serviceKey: string;
  filters?: BroadcastFilters;
  /** This helper is intentionally limited to the original Fillipe operation. */
  scope: "legacy-fillipe";
}): Promise<BroadcastAudienceResult> {
  if (scope !== "legacy-fillipe") {
    throw new Error("Broadcast audience helper is restricted to the legacy Fillipe scope");
  }
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
    const url = new URL(`${supabaseUrl}/rest/v1/payment_logs`);
    url.searchParams.set("select", EMAIL_FIELDS.ebooks);
    url.searchParams.set("status", "eq.approved");
    url.searchParams.set("workspace_id", "is.null");
    if (since) url.searchParams.set("created_at", `gte.${since}`);
    if (productName) url.searchParams.set("product_name", `ilike.*${productName}*`);

    const rows = await fetchRows(url.toString(), headers);
    for (const row of rows) addEmail(row[EMAIL_FIELDS.ebooks], "ebooks");
  }

  if (sources.includes("bookings")) {
    const url = new URL(`${supabaseUrl}/rest/v1/bookings`);
    url.searchParams.set("select", EMAIL_FIELDS.bookings);
    url.searchParams.set("status", "neq.cancelled");
    url.searchParams.set("workspace_id", "is.null");
    if (since) url.searchParams.set("created_at", `gte.${since}`);

    const rows = await fetchRows(url.toString(), headers);
    for (const row of rows) addEmail(row[EMAIL_FIELDS.bookings], "bookings");
  }

  if (sources.includes("patients")) {
    const url = new URL(`${supabaseUrl}/rest/v1/patients`);
    url.searchParams.set("select", EMAIL_FIELDS.patients);
    url.searchParams.set("workspace_id", "is.null");
    if (since) url.searchParams.set("created_at", `gte.${since}`);

    const rows = await fetchRows(url, headers);
    for (const row of rows) addEmail(row[EMAIL_FIELDS.patients], "patients");
  }

  if (sources.includes("leads")) {
    // Leads have no workspace ownership. This explicitly legacy-only function
    // must never be reused for a tenant audience.
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

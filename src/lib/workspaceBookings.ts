import { supabase } from "./supabase";
import { workspaceSupabase } from "./workspaceSupabase";

// ── Types ────────────────────────────────────────────────────────────────────────

export interface BookingSettings {
  id: string;
  workspace_id: string;
  slug: string;
  pix_key: string | null;
  pix_key_type: "cpf" | "email" | "phone" | "random";
  active: boolean;
  presentation_name: string | null;
  bio: string | null;
  buffer_minutes: number;
  min_notice_hours: number;
  max_advance_days: number;
  slot_interval_min: number;
}

export interface BookingService {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_min: number;
  active: boolean;
  sort_order: number;
}

export interface BookingAvailability {
  id: string;
  workspace_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
  sort_order?: number;
}

export interface WorkspaceBooking {
  id: string;
  workspace_id: string;
  service_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  booking_date: string;
  booking_time: string;
  status: "pending_payment" | "paid" | "confirmed" | "cancelled" | "completed" | "no_show";
  mp_payment_id: string | null;
  total_amount_cents: number;
  platform_fee_cents: number;
  repasse_amount_cents: number;
  repasse_status: "pending" | "sent" | "failed";
  service_duration_min: number;
  created_at: string;
}

/** A booked slot with its duration — used for overlap detection */
export interface BookedSlot {
  time: string;        // "HH:MM"
  durationMin: number;
}

export interface BookingSlot {
  time: string; // "HH:MM"
  available: boolean;
}

/** Public booking data deliberately excludes workspace IDs and payment credentials. */
export interface PublicBookingSettings {
  slug: string;
  presentation_name: string | null;
  bio: string | null;
  min_notice_hours: number;
  max_advance_days: number;
  active_days: number[];
  blocked_dates: string[];
}

export interface PublicBookingService {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_min: number;
  sort_order: number;
}

export interface SlotOptions {
  /** Minutes of break after each appointment. Default 0. */
  bufferMin?: number;
  /** Minutes of advance notice required from now. Default 120 (2 h). */
  minNoticeMin?: number;
  /** Step between generated slot options. Default = serviceDurationMin. */
  slotIntervalMin?: number;
}

export const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const FULL_DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const PIX_KEY_TYPE_LABELS: Record<string, string> = {
  cpf: "CPF",
  email: "E-mail",
  phone: "Telefone",
  random: "Chave aleatória",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Realizado",
  no_show: "Não compareceu",
};

export const BOOKING_STATUS_CLS: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  confirmed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
  completed: "bg-gray-100 text-gray-600",
  no_show: "bg-red-50 text-red-500",
};

// cents → "R$ X,XX"
export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// slugify workspace name
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

// ── Core slot generation ─────────────────────────────────────────────────────────

/**
 * Generates available time slots for a given date and service.
 *
 * Key invariants:
 * - A slot is unavailable if it overlaps any existing booking (considering durations)
 * - Overlap: [slot, slot+serviceDuration) ∩ [booking, booking+bookingDuration+buffer) ≠ ∅
 * - Past dates always return []
 * - Today's slots before (now + minNoticeMin) are skipped
 */
export function generateTimeSlots(
  date: string,            // "YYYY-MM-DD"
  startTime: string,       // "HH:MM"
  endTime: string,         // "HH:MM"
  serviceDurationMin: number,
  existingBookings: BookedSlot[],
  opts: SlotOptions = {},
): BookingSlot[] {
  const { bufferMin = 0, minNoticeMin = 120, slotIntervalMin } = opts;
  const interval = slotIntervalMin ?? serviceDurationMin;

  // Reject past dates
  const [yyyy, mm, dd] = date.split("-").map(Number);
  const targetDay = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (targetDay < today) return [];

  const isToday = targetDay.getTime() === today.getTime();

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  // Earliest allowed slot start (minutes from midnight)
  const now = new Date();
  const minStart = isToday ? now.getHours() * 60 + now.getMinutes() + minNoticeMin : 0;

  // Pre-compute existing bookings in minutes
  const bookings = existingBookings.map((b) => {
    const [bh, bm] = b.time.split(":").map(Number);
    return { startMin: bh * 60 + bm, endMin: bh * 60 + bm + b.durationMin + bufferMin };
  });

  const slots: BookingSlot[] = [];

  for (let t = startTotal; t + serviceDurationMin <= endTotal; t += interval) {
    if (t < minStart) continue;

    // Each appointment reserves its own post-consultation buffer. The candidate
    // therefore conflicts before an existing booking when its buffered end crosses it.
    const hasConflict = bookings.some(
      (b) => t < b.endMin && t + serviceDurationMin + bufferMin > b.startMin,
    );

    slots.push({
      time: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
      available: !hasConflict,
    });
  }

  return slots;
}

// ── Workspace-authenticated operations ──────────────────────────────────────────

export async function fetchBookingSettings(workspaceId: string): Promise<BookingSettings | null> {
  const { data } = await workspaceSupabase
    .from("workspace_booking_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data as BookingSettings | null;
}

export async function upsertBookingSettings(
  workspaceId: string,
  patch: Partial<Omit<BookingSettings, "id" | "workspace_id">>,
): Promise<void> {
  const existing = await fetchBookingSettings(workspaceId);
  if (existing) {
    await workspaceSupabase
      .from("workspace_booking_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId);
  } else {
    await workspaceSupabase
      .from("workspace_booking_settings")
      .insert({ workspace_id: workspaceId, slug: generateSlug("nutri"), ...patch });
  }
}

export async function fetchBookingServices(workspaceId: string): Promise<BookingService[]> {
  const { data } = await workspaceSupabase
    .from("workspace_booking_services")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []) as BookingService[];
}

export async function upsertBookingService(
  workspaceId: string,
  service: Partial<BookingService> & { name: string; price_cents: number },
): Promise<void> {
  if (service.id) {
    await workspaceSupabase
      .from("workspace_booking_services")
      .update({
        name: service.name,
        description: service.description,
        price_cents: service.price_cents,
        duration_min: service.duration_min ?? 60,
        active: service.active ?? true,
      })
      .eq("id", service.id)
      .eq("workspace_id", workspaceId);
  } else {
    await workspaceSupabase
      .from("workspace_booking_services")
      .insert({
        workspace_id: workspaceId,
        name: service.name,
        description: service.description ?? null,
        price_cents: service.price_cents,
        duration_min: service.duration_min ?? 60,
      });
  }
}

export async function deleteBookingService(id: string, workspaceId: string): Promise<void> {
  await workspaceSupabase
    .from("workspace_booking_services")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
}

export async function fetchBookingAvailability(workspaceId: string): Promise<BookingAvailability[]> {
  const { data } = await workspaceSupabase
    .from("workspace_booking_availability")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("day_of_week", { ascending: true });
  return (data ?? []) as BookingAvailability[];
}

export async function upsertAvailability(
  workspaceId: string,
  day: number,
  startTime: string,
  endTime: string,
  active: boolean,
): Promise<void> {
  const { data: existing } = await workspaceSupabase
    .from("workspace_booking_availability")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("day_of_week", day)
    .maybeSingle();

  if (existing) {
    await workspaceSupabase
      .from("workspace_booking_availability")
      .update({ start_time: startTime, end_time: endTime, active })
      .eq("id", existing.id);
  } else {
    await workspaceSupabase
      .from("workspace_booking_availability")
      .insert({ workspace_id: workspaceId, day_of_week: day, start_time: startTime, end_time: endTime, active });
  }
}

/** Adds a new availability window (one of possibly several per day). */
export async function addAvailabilityWindow(
  workspaceId: string,
  day: number,
  startTime: string,
  endTime: string,
  sortOrder = 0,
): Promise<void> {
  await workspaceSupabase
    .from("workspace_booking_availability")
    .insert({
      workspace_id: workspaceId,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      active: true,
      sort_order: sortOrder,
    });
}

/** Updates start/end time of a single availability window. */
export async function updateAvailabilityWindow(
  id: string,
  workspaceId: string,
  startTime: string,
  endTime: string,
): Promise<void> {
  await workspaceSupabase
    .from("workspace_booking_availability")
    .update({ start_time: startTime, end_time: endTime })
    .eq("id", id)
    .eq("workspace_id", workspaceId);
}

/** Deletes a single availability window. */
export async function deleteAvailabilityWindow(id: string, workspaceId: string): Promise<void> {
  await workspaceSupabase
    .from("workspace_booking_availability")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
}

/** Sets `active` on every availability window of a given weekday. */
export async function setDayActive(workspaceId: string, day: number, active: boolean): Promise<void> {
  await workspaceSupabase
    .from("workspace_booking_availability")
    .update({ active })
    .eq("workspace_id", workspaceId)
    .eq("day_of_week", day);
}

/**
 * Groups availability windows by day_of_week (pure, no I/O).
 * Within each day: sort_order asc, ties broken by start_time asc.
 * Does not filter by `active`; every row is returned.
 */
export function groupAvailabilityByDay(rows: BookingAvailability[]): Map<number, BookingAvailability[]> {
  const grouped = new Map<number, BookingAvailability[]>();
  for (const row of rows) {
    const list = grouped.get(row.day_of_week);
    if (list) {
      list.push(row);
    } else {
      grouped.set(row.day_of_week, [row]);
    }
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0;
    });
  }
  return grouped;
}

export async function fetchWorkspaceBookings(workspaceId: string): Promise<WorkspaceBooking[]> {
  const { data } = await workspaceSupabase
    .from("workspace_bookings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .limit(200);
  return (data ?? []) as WorkspaceBooking[];
}

export async function updateBookingStatus(
  id: string,
  workspaceId: string,
  status: WorkspaceBooking["status"],
): Promise<void> {
  await workspaceSupabase
    .from("workspace_bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId);
}

export async function fetchBlockedDates(workspaceId: string): Promise<string[]> {
  const { data } = await workspaceSupabase
    .from("workspace_booking_blocked_dates")
    .select("blocked_date")
    .eq("workspace_id", workspaceId);
  return (data ?? []).map((r: { blocked_date: string }) => r.blocked_date);
}

export async function toggleBlockedDate(
  workspaceId: string,
  date: string,
  reason?: string,
): Promise<void> {
  const { data: existing } = await workspaceSupabase
    .from("workspace_booking_blocked_dates")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("blocked_date", date)
    .maybeSingle();

  if (existing) {
    await workspaceSupabase
      .from("workspace_booking_blocked_dates")
      .delete()
      .eq("id", existing.id);
  } else {
    await workspaceSupabase
      .from("workspace_booking_blocked_dates")
      .insert({ workspace_id: workspaceId, blocked_date: date, reason: reason ?? null });
  }
}

// ── Public (anon) operations — RPC-only, no direct table access ─────────────────

function publicRpcError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function fetchPublicBookingSettings(slug: string): Promise<PublicBookingSettings | null> {
  const { data, error } = await supabase.rpc("get_public_workspace_booking_profile", {
    p_slug: slug,
  });
  publicRpcError(error);
  const rows = (data ?? []) as PublicBookingSettings[];
  return rows[0] ?? null;
}

export async function fetchPublicServices(slug: string): Promise<PublicBookingService[]> {
  const { data, error } = await supabase.rpc("get_public_workspace_booking_services", {
    p_slug: slug,
  });
  publicRpcError(error);
  return (data ?? []) as PublicBookingService[];
}

interface PublicBookingSlotRow {
  slot_time: string;
}

/** Returns only times that can still be selected; the database never returns booking rows. */
export async function fetchPublicAvailableSlots(
  slug: string,
  serviceId: string,
  date: string,
): Promise<BookingSlot[]> {
  const { data, error } = await supabase.rpc("get_public_workspace_booking_slots", {
    p_slug: slug,
    p_service_id: serviceId,
    p_booking_date: date,
  });
  publicRpcError(error);

  return ((data ?? []) as PublicBookingSlotRow[]).map((slot) => ({
    time: slot.slot_time.slice(0, 5),
    available: true,
  }));
}

export async function fetchPublicBookingPaymentStatus(
  bookingId: string,
  paymentId: string,
): Promise<WorkspaceBooking["status"] | null> {
  const { data, error } = await supabase.rpc("get_public_workspace_booking_payment_status", {
    p_booking_id: bookingId,
    p_payment_id: paymentId,
  });
  publicRpcError(error);
  const rows = (data ?? []) as Array<{ status: WorkspaceBooking["status"] }>;
  return rows[0]?.status ?? null;
}

/** TTL (minutes) after which an unpaid pending_payment booking stops blocking its slot. */
export const PENDING_TTL_MIN = 15;

/** Booking row normalized for TTL filtering. */
interface BookedRow {
  time: string;        // "HH:MM"
  durationMin: number;
  status: string;
  createdAtMs: number;
}

/**
 * Keeps only the bookings that still block a slot.
 * - Any status other than "pending_payment" always blocks.
 * - "pending_payment" blocks only while its age is within ttlMin minutes.
 * Pure: no I/O, no clock access (nowMs is injected).
 */
export function pruneExpiredPending(
  rows: BookedRow[],
  nowMs: number,
  ttlMin = PENDING_TTL_MIN,
): BookedSlot[] {
  const ttlMs = ttlMin * 60 * 1000;
  return rows
    .filter((r) => r.status !== "pending_payment" || nowMs - r.createdAtMs <= ttlMs)
    .map((r) => ({ time: r.time, durationMin: r.durationMin }));
}

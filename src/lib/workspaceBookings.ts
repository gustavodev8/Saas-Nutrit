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

    // Overlap: new slot [t, t+serviceDurationMin) intersects existing [B.start, B.start+duration+buffer)?
    // i.e. t < B.endMin AND t + serviceDurationMin > B.startMin
    const hasConflict = bookings.some(
      (b) => t < b.endMin && t + serviceDurationMin > b.startMin,
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

// ── Public (anon) operations — used by the public booking page ───────────────────

export async function fetchPublicBookingSettings(slug: string): Promise<BookingSettings | null> {
  const { data } = await supabase
    .from("workspace_booking_settings")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  return data as BookingSettings | null;
}

export async function fetchPublicServices(workspaceId: string): Promise<BookingService[]> {
  const { data } = await supabase
    .from("workspace_booking_services")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as BookingService[];
}

export async function fetchPublicAvailability(workspaceId: string): Promise<BookingAvailability[]> {
  const { data } = await supabase
    .from("workspace_booking_availability")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("active", true);
  return (data ?? []) as BookingAvailability[];
}

export async function fetchPublicBlockedDates(workspaceId: string): Promise<string[]> {
  const { data } = await supabase
    .from("workspace_booking_blocked_dates")
    .select("blocked_date")
    .eq("workspace_id", workspaceId);
  return (data ?? []).map((r: { blocked_date: string }) => r.blocked_date);
}

/**
 * Returns existing bookings for a workspace+date with time and service duration.
 * Includes pending_payment to prevent race-condition double-bookings.
 */
export async function fetchBookedSlots(workspaceId: string, date: string): Promise<BookedSlot[]> {
  const { data } = await supabase
    .from("workspace_bookings")
    .select("booking_time, service_duration_min")
    .eq("workspace_id", workspaceId)
    .eq("booking_date", date)
    .in("status", ["pending_payment", "paid", "confirmed", "completed"]);
  return (data ?? []).map((r: { booking_time: string; service_duration_min: number }) => ({
    time: r.booking_time.slice(0, 5),
    durationMin: r.service_duration_min ?? 60,
  }));
}

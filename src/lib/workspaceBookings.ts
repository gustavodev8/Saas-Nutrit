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
  created_at: string;
}

export interface BookingSlot {
  time: string; // "HH:MM"
  available: boolean;
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
      .update({ name: service.name, description: service.description, price_cents: service.price_cents, duration_min: service.duration_min ?? 60, active: service.active ?? true })
      .eq("id", service.id)
      .eq("workspace_id", workspaceId);
  } else {
    await workspaceSupabase
      .from("workspace_booking_services")
      .insert({ workspace_id: workspaceId, name: service.name, description: service.description ?? null, price_cents: service.price_cents, duration_min: service.duration_min ?? 60 });
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
    .limit(100);
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

export async function fetchBookedSlots(workspaceId: string, date: string): Promise<string[]> {
  const { data } = await supabase
    .from("workspace_bookings")
    .select("booking_time")
    .eq("workspace_id", workspaceId)
    .eq("booking_date", date)
    .in("status", ["paid", "confirmed", "completed"]);
  return (data ?? []).map((r: { booking_time: string }) => r.booking_time.slice(0, 5));
}

// Generate HH:MM slots within a window for a given duration
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMin: number,
  bookedTimes: string[],
  date: string,
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);

  for (let t = startTotal; t + durationMin <= endTotal; t += durationMin) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    // Skip past slots for today
    if (isToday) {
      const slotDate = new Date();
      slotDate.setHours(h, m, 0, 0);
      if (slotDate <= now) continue;
    }

    const available = !bookedTimes.includes(timeStr);
    slots.push({ time: timeStr, available });
  }

  return slots;
}

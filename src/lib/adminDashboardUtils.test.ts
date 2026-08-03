import { describe, expect, it } from "vitest";
import type { Booking, Patient } from "@/lib/supabase";
import { buildAdminDashboardData, isActiveBooking, parseBookingDateTime } from "@/lib/adminDashboardUtils";

const booking = (overrides: Partial<Booking>): Booking => ({
  booking_group_id: "group-1",
  session_number: 1,
  total_sessions: 1,
  client_name: "Maria Souza",
  client_email: "maria@example.com",
  client_phone: "75999999999",
  plan_name: "Consulta inicial",
  plan_index: 0,
  appointment_date: "2026-08-03",
  appointment_time: "09:00",
  type: "online",
  status: "confirmed",
  payment_status: "paid",
  ...overrides,
});

const patient = (id: number, createdAt: string): Patient => ({
  id,
  name: `Paciente ${id}`,
  created_at: createdAt,
});

describe("adminDashboardUtils", () => {
  it("keeps only operational active bookings in dashboard cards", () => {
    const now = new Date("2026-08-03T08:00:00");
    const data = buildAdminDashboardData(
      [
        booking({ id: 1, appointment_time: "10:00", payment_status: "pending" }),
        booking({ id: 2, appointment_time: "08:30", payment_status: "paid" }),
        booking({ id: 3, status: "cancelled", appointment_time: "11:00" }),
        booking({ id: 4, status: "no_show", appointment_time: "12:00" }),
        booking({ id: 5, status: "completed", appointment_date: "2026-08-01", payment_status: "pending" }),
      ],
      [],
      now,
    );

    expect(data.todayBookings.map((item) => item.id)).toEqual([2, 1]);
    expect(data.pendingPayments.map((item) => item.id)).toEqual([1]);
    expect(data.completedThisMonth.map((item) => item.id)).toEqual([5]);
  });

  it("sorts upcoming bookings and recent patients for daily operation", () => {
    const now = new Date("2026-08-03T08:00:00");
    const data = buildAdminDashboardData(
      [
        booking({ id: 1, appointment_date: "2026-08-04", appointment_time: "14:00" }),
        booking({ id: 2, appointment_date: "2026-08-03", appointment_time: "09:00" }),
        booking({ id: 3, appointment_date: "2026-08-02", appointment_time: "09:00" }),
      ],
      [
        patient(1, "2026-08-01T10:00:00"),
        patient(2, "2026-08-03T10:00:00"),
        patient(3, "2026-07-31T10:00:00"),
        patient(4, "2026-08-02T10:00:00"),
        patient(5, "2026-07-30T10:00:00"),
        patient(6, "2026-07-29T10:00:00"),
      ],
      now,
    );

    expect(data.nextBookings.map((item) => item.id)).toEqual([2, 1]);
    expect(data.recentPatients.map((item) => item.id)).toEqual([2, 4, 1, 3, 5]);
  });

  it("parses date/time and classifies inactive statuses", () => {
    const parsed = parseBookingDateTime(booking({ appointment_date: "2026-08-04", appointment_time: "" }));
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getDate()).toBe(4);
    expect(parsed.getHours()).toBe(0);
    expect(isActiveBooking(booking({ status: "confirmed" }))).toBe(true);
    expect(isActiveBooking(booking({ status: "cancelled" }))).toBe(false);
    expect(isActiveBooking(booking({ status: "no_show" }))).toBe(false);
  });
});

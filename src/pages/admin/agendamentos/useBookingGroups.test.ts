import { describe, expect, it } from "vitest";
import type { Booking } from "@/lib/supabase";
import { getBookingGroupsData } from "./useBookingGroups";

const booking = (overrides: Partial<Booking>): Booking => ({
  booking_group_id: "group-1",
  session_number: 1,
  total_sessions: 1,
  client_name: "Ana Costa",
  client_email: "ana@example.com",
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

const baseParams = {
  detail: null,
  filter: "all" as const,
  search: "",
  filterType: "all" as const,
  filterDateFrom: "",
  filterDateTo: "",
  filterPlan: "",
  adminTodayISO: "2026-08-03",
};

describe("getBookingGroupsData", () => {
  it("builds operational card counts by booking group", () => {
    const data = getBookingGroupsData({
      ...baseParams,
      bookings: [
        booking({ id: 1, booking_group_id: "today", appointment_time: "10:00" }),
        booking({ id: 2, booking_group_id: "pending", status: "pending", appointment_date: "2026-08-04" }),
        booking({ id: 3, booking_group_id: "done", status: "completed", session_number: 2, total_sessions: 2, appointment_date: "2026-08-01" }),
        booking({ id: 4, booking_group_id: "cancelled", status: "cancelled", appointment_date: "2026-08-05" }),
        booking({ id: 5, booking_group_id: "return", status: "completed", session_number: 1, total_sessions: 2, appointment_date: "2026-08-01" }),
      ],
    });

    expect(data.counts).toMatchObject({
      all: 5,
      today: 1,
      confirmed: 1,
      pending: 1,
      retornos: 1,
      completed: 1,
      cancelled: 1,
    });
  });

  it("filters by search, type, date range and plan using latest session", () => {
    const data = getBookingGroupsData({
      ...baseParams,
      search: "performance",
      filterType: "presencial",
      filterDateFrom: "2026-08-05",
      filterDateTo: "2026-08-10",
      filterPlan: "Performance",
      bookings: [
        booking({
          id: 1,
          booking_group_id: "match",
          client_name: "Bruno Lima",
          client_email: "bruno@example.com",
          plan_name: "Performance",
          type: "online",
          appointment_date: "2026-08-01",
          session_number: 1,
          total_sessions: 2,
        }),
        booking({
          id: 2,
          booking_group_id: "match",
          client_name: "Bruno Lima",
          client_email: "bruno@example.com",
          plan_name: "Performance",
          type: "presencial",
          appointment_date: "2026-08-07",
          session_number: 2,
          total_sessions: 2,
        }),
        booking({
          id: 3,
          booking_group_id: "wrong-plan",
          plan_name: "Consulta inicial",
          type: "presencial",
          appointment_date: "2026-08-07",
        }),
      ],
    });

    expect(data.groupEntries.map(([groupId]) => groupId)).toEqual(["match"]);
    expect(data.detailFirst).toBeUndefined();
  });

  it("returns today sessions ordered by time and detail sessions ordered by session number", () => {
    const data = getBookingGroupsData({
      ...baseParams,
      detail: "group-1",
      bookings: [
        booking({ id: 2, session_number: 2, appointment_time: "14:00" }),
        booking({ id: 1, session_number: 1, appointment_time: "08:00" }),
        booking({ id: 3, booking_group_id: "other", appointment_time: "07:30" }),
      ],
    });

    expect(data.todaySessions.map(({ session }) => session.id)).toEqual([3, 1, 2]);
    expect(data.detailGroup.map((session) => session.session_number)).toEqual([1, 2]);
  });
});

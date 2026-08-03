import { describe, expect, it } from "vitest";
import type { Booking } from "@/lib/supabase";
import { calcBMI, getBookingCity, normalizePersonName, toLocalISO } from "./bookingDateUtils";

const booking = (notes?: string): Booking => ({
  booking_group_id: "group-1",
  session_number: 1,
  total_sessions: 1,
  client_name: "Joao",
  client_email: "joao@example.com",
  client_phone: "75999999999",
  plan_name: "Consulta",
  plan_index: 0,
  appointment_date: "2026-08-03",
  appointment_time: "09:00",
  type: "online",
  status: "confirmed",
  notes,
});

describe("bookingDateUtils", () => {
  it("normalizes dates, BMI and patient names for patient filters", () => {
    expect(toLocalISO(new Date("2026-08-03T12:00:00"))).toBe("2026-08-03");
    expect(calcBMI(80, 180)).toBe("24.7");
    expect(calcBMI(0, 180)).toBeNull();
    expect(normalizePersonName("  João   DA Silva ")).toBe("joao da silva");
  });

  it("extracts booking city safely from notes", () => {
    expect(getBookingCity(booking('{"_city":"Alagoinhas"}'))).toBe("Alagoinhas");
    expect(getBookingCity(booking('{"city":"Salvador"}'))).toBe("Salvador");
    expect(getBookingCity(booking("not-json"))).toBeNull();
    expect(getBookingCity(booking('{"city":"   "}'))).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { generateTimeSlots, generateSlug, formatBRL } from "../workspaceBookings";

// A date far in the future — always "available" (never today or past)
const FUTURE = "2099-06-15";
// A date in the past — slots should always be empty
const PAST = "2020-01-01";

// ── generateTimeSlots ────────────────────────────────────────────────────────────

describe("generateTimeSlots", () => {
  describe("basic slot generation", () => {
    it("returns empty when window is too short for service", () => {
      expect(generateTimeSlots(FUTURE, "09:00", "09:30", 60, [])).toHaveLength(0);
    });

    it("returns empty when start equals end", () => {
      expect(generateTimeSlots(FUTURE, "10:00", "10:00", 60, [])).toHaveLength(0);
    });

    it("generates correct slots for a full day with 60-min service and 60-min interval", () => {
      const slots = generateTimeSlots(FUTURE, "09:00", "18:00", 60, [], { slotIntervalMin: 60 });
      // 09:00 through 17:00 = 9 slots (last slot ends at 18:00)
      expect(slots).toHaveLength(9);
      expect(slots[0].time).toBe("09:00");
      expect(slots[8].time).toBe("17:00");
    });

    it("generates slots with 30-min interval for 60-min service (more options)", () => {
      const slots = generateTimeSlots(FUTURE, "09:00", "11:00", 60, [], { slotIntervalMin: 30 });
      // 09:00 (ends 10:00) ✓, 09:30 (ends 10:30) ✓, 10:00 (ends 11:00) ✓, 10:30 (ends 11:30) ✗
      expect(slots).toHaveLength(3);
      expect(slots.map((s) => s.time)).toEqual(["09:00", "09:30", "10:00"]);
    });

    it("marks all slots available when no bookings", () => {
      const slots = generateTimeSlots(FUTURE, "09:00", "12:00", 60, []);
      expect(slots.every((s) => s.available)).toBe(true);
    });
  });

  describe("past date handling", () => {
    it("returns empty array for a past date", () => {
      expect(generateTimeSlots(PAST, "09:00", "18:00", 60, [])).toHaveLength(0);
    });

    it("returns empty array for far past date even with no bookings", () => {
      expect(generateTimeSlots("2000-01-01", "00:00", "23:00", 30, [])).toHaveLength(0);
    });
  });

  describe("exact-time conflict detection", () => {
    it("marks booked time as unavailable", () => {
      const slots = generateTimeSlots(FUTURE, "09:00", "12:00", 60, [
        { time: "10:00", durationMin: 60 },
      ], { slotIntervalMin: 60 });
      expect(slots.find((s) => s.time === "10:00")?.available).toBe(false);
    });

    it("leaves adjacent slots available when no overlap", () => {
      const slots = generateTimeSlots(FUTURE, "09:00", "12:00", 60, [
        { time: "10:00", durationMin: 60 },
      ], { slotIntervalMin: 60 });
      expect(slots.find((s) => s.time === "09:00")?.available).toBe(true);
      expect(slots.find((s) => s.time === "11:00")?.available).toBe(true);
    });
  });

  describe("duration-aware overlap detection", () => {
    it("blocks a slot that would run into an existing booking", () => {
      // Existing: 10:00 for 60 min → occupies 10:00–11:00
      // New 60-min slot at 09:30 → runs 09:30–10:30 → overlaps 10:00–11:00
      const slots = generateTimeSlots(FUTURE, "09:00", "12:00", 60, [
        { time: "10:00", durationMin: 60 },
      ], { slotIntervalMin: 30 });
      expect(slots.find((s) => s.time === "09:30")?.available).toBe(false);
    });

    it("allows a slot that ends exactly when the next booking starts", () => {
      // Existing: 10:00 for 60 min
      // New 60-min slot at 09:00 → runs 09:00–10:00 → ends at 10:00, booking starts at 10:00
      // No overlap (intervals are half-open: [09:00, 10:00) doesn't intersect [10:00, 11:00))
      const slots = generateTimeSlots(FUTURE, "09:00", "12:00", 60, [
        { time: "10:00", durationMin: 60 },
      ], { slotIntervalMin: 60 });
      expect(slots.find((s) => s.time === "09:00")?.available).toBe(true);
    });

    it("blocks a slot that starts right when an existing booking is still ongoing", () => {
      // Existing: 09:00 for 90 min → occupies 09:00–10:30
      // New 60-min slot at 10:00 → starts at 10:00 < 10:30 (ongoing) → conflict
      const slots = generateTimeSlots(FUTURE, "09:00", "13:00", 60, [
        { time: "09:00", durationMin: 90 },
      ], { slotIntervalMin: 30 });
      expect(slots.find((s) => s.time === "10:00")?.available).toBe(false);
      // 10:30 → starts exactly when 90-min booking ends → no conflict
      expect(slots.find((s) => s.time === "10:30")?.available).toBe(true);
    });

    it("handles 90-min service overlapping a 60-min booking", () => {
      // Existing: 11:00 for 60 min → 11:00–12:00
      // New 90-min slot at 10:00 → runs 10:00–11:30 → overlaps 11:00–12:00
      const slots = generateTimeSlots(FUTURE, "09:00", "14:00", 90, [
        { time: "11:00", durationMin: 60 },
      ], { slotIntervalMin: 30 });
      expect(slots.find((s) => s.time === "10:00")?.available).toBe(false);
      // 09:00+90=10:30 → ends before 11:00 → no conflict
      expect(slots.find((s) => s.time === "09:00")?.available).toBe(true);
    });
  });

  describe("buffer time", () => {
    it("blocks a booking that ends before the next one but whose own buffer crosses it", () => {
      // Candidate 10:00-11:00 with a 15 min buffer cannot precede an 11:00 booking.
      const slots = generateTimeSlots(FUTURE, "09:00", "13:00", 60, [
        { time: "11:00", durationMin: 60 },
      ], { bufferMin: 15, slotIntervalMin: 15 });
      expect(slots.find((s) => s.time === "10:00")?.available).toBe(false);
      expect(slots.find((s) => s.time === "09:45")?.available).toBe(true);
    });

    it("blocks a slot within the buffer window after a booking", () => {
      // Existing: 09:00 for 60 min + 15 min buffer → protected until 10:15
      // New 60-min slot at 10:00 → 10:00 < 10:15 → conflict
      const slots = generateTimeSlots(FUTURE, "09:00", "13:00", 60, [
        { time: "09:00", durationMin: 60 },
      ], { bufferMin: 15, slotIntervalMin: 15 });
      expect(slots.find((s) => s.time === "10:00")?.available).toBe(false);
    });

    it("allows a slot that starts exactly after the buffer window", () => {
      // Buffer ends at 09:00+60+15=10:15 → slot at 10:15 is free
      const slots = generateTimeSlots(FUTURE, "09:00", "13:00", 60, [
        { time: "09:00", durationMin: 60 },
      ], { bufferMin: 15, slotIntervalMin: 15 });
      expect(slots.find((s) => s.time === "10:15")?.available).toBe(true);
    });

    it("respects zero buffer (no extra blocking)", () => {
      // Without buffer: 10:00 is free right after 09:00+60=10:00
      const slots = generateTimeSlots(FUTURE, "09:00", "13:00", 60, [
        { time: "09:00", durationMin: 60 },
      ], { bufferMin: 0, slotIntervalMin: 60 });
      expect(slots.find((s) => s.time === "10:00")?.available).toBe(true);
    });
  });

  describe("multiple bookings", () => {
    it("handles two non-overlapping bookings correctly", () => {
      const bookings = [
        { time: "09:00", durationMin: 60 },
        { time: "14:00", durationMin: 60 },
      ];
      const slots = generateTimeSlots(FUTURE, "09:00", "18:00", 60, bookings, {
        slotIntervalMin: 60,
      });
      expect(slots.find((s) => s.time === "09:00")?.available).toBe(false);
      expect(slots.find((s) => s.time === "10:00")?.available).toBe(true);
      expect(slots.find((s) => s.time === "13:00")?.available).toBe(true);
      expect(slots.find((s) => s.time === "14:00")?.available).toBe(false);
      expect(slots.find((s) => s.time === "15:00")?.available).toBe(true);
    });

    it("handles back-to-back bookings with buffer", () => {
      // Two bookings at 09:00 and 11:00, each 60 min, 15 min buffer
      // Protected: [09:00–10:15) and [11:00–12:15)
      // Slot at 10:15 (60 min) → runs 10:15–11:15 → overlaps [11:00, 12:15) → conflict
      // Slot at 10:00 → runs 10:00–11:00 → 10:00 < 10:15 (first booking buffer end) → conflict
      const bookings = [
        { time: "09:00", durationMin: 60 },
        { time: "11:00", durationMin: 60 },
      ];
      const slots = generateTimeSlots(FUTURE, "09:00", "14:00", 60, bookings, {
        bufferMin: 15,
        slotIntervalMin: 15,
      });
      expect(slots.find((s) => s.time === "10:00")?.available).toBe(false);
      // 10:15+60=11:15 overlaps [11:00, 12:15) → conflict
      expect(slots.find((s) => s.time === "10:15")?.available).toBe(false);
      // 12:15 → starts at 12:15, runs to 13:15, no conflicts
      expect(slots.find((s) => s.time === "12:15")?.available).toBe(true);
    });

    it("fully booked day shows no available slots", () => {
      // Service 60 min, 1-hour slots from 09:00 to 12:00 → 3 slots, all booked
      const bookings = [
        { time: "09:00", durationMin: 60 },
        { time: "10:00", durationMin: 60 },
        { time: "11:00", durationMin: 60 },
      ];
      const slots = generateTimeSlots(FUTURE, "09:00", "12:00", 60, bookings, {
        slotIntervalMin: 60,
      });
      expect(slots.every((s) => !s.available)).toBe(true);
    });
  });

  describe("future date independence", () => {
    it("future dates are unaffected by minNoticeMin", () => {
      const slots = generateTimeSlots(FUTURE, "09:00", "12:00", 60, [], {
        minNoticeMin: 1440, // 24 hours — doesn't apply to a future date
      });
      expect(slots.every((s) => s.available)).toBe(true);
    });
  });
});

// ── generateSlug ─────────────────────────────────────────────────────────────────

describe("generateSlug", () => {
  it("produces only lowercase alphanumeric and hyphens", () => {
    const slug = generateSlug("Clínica São João");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("strips accents", () => {
    const slug = generateSlug("ÁéíÓú");
    expect(slug).not.toMatch(/[^\x00-\x7F]/);
  });

  it("generates unique slugs for the same name", () => {
    const a = generateSlug("nutri");
    const b = generateSlug("nutri");
    expect(a).not.toBe(b);
  });

  it("caps base at 40 characters (plus 7-char suffix)", () => {
    const slug = generateSlug("a".repeat(100));
    expect(slug.length).toBeLessThanOrEqual(48); // 40 base + 1 hyphen + 6 suffix
  });
});

// ── formatBRL ────────────────────────────────────────────────────────────────────

describe("formatBRL", () => {
  it("formats 0 as R$ 0,00", () => {
    expect(formatBRL(0)).toMatch(/0,00/);
  });

  it("formats 10000 as R$ 100,00", () => {
    expect(formatBRL(10000)).toMatch(/100,00/);
  });

  it("formats 9990 as R$ 99,90", () => {
    expect(formatBRL(9990)).toMatch(/99,90/);
  });
});

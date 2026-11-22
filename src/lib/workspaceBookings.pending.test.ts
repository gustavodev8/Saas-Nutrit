import { describe, it, expect } from "vitest";
import { pruneExpiredPending, PENDING_TTL_MIN } from "./workspaceBookings";

const NOW = Date.parse("2026-11-22T10:00:00.000Z");
const minutesAgo = (min: number) => NOW - min * 60 * 1000;

describe("pruneExpiredPending", () => {
  it("PENDING_TTL_MIN is 15 minutes", () => {
    expect(PENDING_TTL_MIN).toBe(15);
  });

  it("blocks a fresh pending_payment (age 5 min)", () => {
    const result = pruneExpiredPending(
      [{ time: "09:00", durationMin: 60, status: "pending_payment", createdAtMs: minutesAgo(5) }],
      NOW,
    );
    expect(result).toEqual([{ time: "09:00", durationMin: 60 }]);
  });

  it("ignores an expired pending_payment (age 20 min)", () => {
    const result = pruneExpiredPending(
      [{ time: "09:00", durationMin: 60, status: "pending_payment", createdAtMs: minutesAgo(20) }],
      NOW,
    );
    expect(result).toEqual([]);
  });

  it("keeps a pending_payment exactly at the TTL boundary (age 15 min)", () => {
    const result = pruneExpiredPending(
      [{ time: "09:00", durationMin: 60, status: "pending_payment", createdAtMs: minutesAgo(15) }],
      NOW,
    );
    expect(result).toHaveLength(1);
  });

  it.each(["paid", "confirmed", "completed"])(
    "always blocks status %s regardless of age",
    (status) => {
      const result = pruneExpiredPending(
        [
          { time: "10:00", durationMin: 30, status, createdAtMs: minutesAgo(5) },
          { time: "11:00", durationMin: 30, status, createdAtMs: minutesAgo(60 * 24 * 30) },
        ],
        NOW,
      );
      expect(result).toEqual([
        { time: "10:00", durationMin: 30 },
        { time: "11:00", durationMin: 30 },
      ]);
    },
  );

  it("returns only time and durationMin (no status/createdAtMs)", () => {
    const result = pruneExpiredPending(
      [{ time: "08:30", durationMin: 45, status: "paid", createdAtMs: minutesAgo(1) }],
      NOW,
    );
    expect(Object.keys(result[0]).sort()).toEqual(["durationMin", "time"]);
  });

  it("filters mixed rows correctly", () => {
    const result = pruneExpiredPending(
      [
        { time: "08:00", durationMin: 60, status: "pending_payment", createdAtMs: minutesAgo(20) },
        { time: "09:00", durationMin: 60, status: "pending_payment", createdAtMs: minutesAgo(5) },
        { time: "10:00", durationMin: 60, status: "confirmed", createdAtMs: minutesAgo(90) },
      ],
      NOW,
    );
    expect(result).toEqual([
      { time: "09:00", durationMin: 60 },
      { time: "10:00", durationMin: 60 },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { ageYears, formatBirthDate, formatIsoDate } from "@/lib/patientReportUtils";

describe("patientReportUtils", () => {
  it("formats report and birth ISO dates for clinical reports", () => {
    expect(formatIsoDate("2026-08-03")).toBe("03/08/2026");
    expect(formatBirthDate("1990-01-05")).toBe("05/01/1990");
    expect(formatIsoDate("2026-08")).toBeNull();
  });

  it("calculates age respecting birthdays", () => {
    expect(ageYears("1990-08-03", new Date("2026-08-02T12:00:00"))).toBe(35);
    expect(ageYears("1990-08-03", new Date("2026-08-03T12:00:00"))).toBe(36);
    expect(ageYears("data-invalida", new Date("2026-08-03T12:00:00"))).toBeNull();
  });
});

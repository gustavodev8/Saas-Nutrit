import { describe, expect, it } from "vitest";
import {
  formatPortalStatus,
  getInitials,
  isFuturePortalDate,
} from "@/pages/portal/portalUtils";

describe("portalUtils", () => {
  it("formats known booking statuses", () => {
    expect(formatPortalStatus("confirmed")).toBe("Confirmada");
    expect(formatPortalStatus("completed")).toBe("Concluida");
    expect(formatPortalStatus("pending")).toBe("Pendente");
  });

  it("builds patient initials safely", () => {
    expect(getInitials("Maria Silva")).toBe("MS");
    expect(getInitials("")).toBe("P");
  });

  it("detects future dates from today onward", () => {
    expect(isFuturePortalDate("2999-01-01")).toBe(true);
    expect(isFuturePortalDate("2000-01-01")).toBe(false);
  });
});

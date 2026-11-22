import { describe, expect, it } from "vitest";
import { isPastDate, parseISODate, toISODate } from "@/lib/bookingDates";

describe("toISODate", () => {
  it("retorna o dia local para uma data conhecida", () => {
    expect(toISODate(new Date(2026, 0, 1, 23, 30))).toBe("2026-01-01");
  });

  it("trata virada de ano corretamente", () => {
    expect(toISODate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});

describe("parseISODate", () => {
  it("cria Date local com componentes que batem com a string", () => {
    const d = parseISODate("2026-03-10");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(10);
  });
});

describe("isPastDate", () => {
  const now = new Date(2026, 5, 15, 10, 0);

  it("ontem é passado", () => {
    expect(isPastDate("2026-06-14", now)).toBe(true);
  });

  it("hoje não é passado", () => {
    expect(isPastDate("2026-06-15", now)).toBe(false);
  });

  it("amanhã não é passado", () => {
    expect(isPastDate("2026-06-16", now)).toBe(false);
  });
});

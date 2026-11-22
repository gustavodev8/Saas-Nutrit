import { describe, it, expect } from "vitest";
import { buildMonthGrid, canGoPrevMonth, canGoNextMonth, findNextAvailableDate } from "./bookingCalendar";
import { toISODate } from "./bookingDates";

// Meses 0-based. Novembro/2026 = 10.
const ALL_DOWS = new Set([0, 1, 2, 3, 4, 5, 6]);
const day = (y: number, m: number, d: number) => new Date(y, m, d, 0, 0, 0, 0);

describe("buildMonthGrid", () => {
  it("retorna 42 células", () => {
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: ALL_DOWS, blocked: new Set(),
      minDate: day(2026, 10, 1), maxDate: day(2027, 0, 31),
    });
    expect(grid).toHaveLength(42);
  });

  it("primeira célula é domingo", () => {
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: ALL_DOWS, blocked: new Set(),
      minDate: day(2026, 10, 1), maxDate: day(2027, 0, 31),
    });
    expect(grid[0].date.getDay()).toBe(0);
  });

  it("dias fora do mês têm inMonth=false e nunca são selecionáveis", () => {
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: ALL_DOWS, blocked: new Set(),
      minDate: day(2026, 0, 1), maxDate: day(2027, 11, 31),
    });
    for (const c of grid) {
      if (c.date.getMonth() !== 10) {
        expect(c.inMonth).toBe(false);
        expect(c.selectable).toBe(false);
      } else {
        expect(c.inMonth).toBe(true);
      }
    }
  });

  it("dia ativo, não bloqueado e dentro do intervalo é selecionável", () => {
    // 2026-11-16 é uma segunda-feira (dow 1)
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: new Set([1]), blocked: new Set(),
      minDate: day(2026, 10, 1), maxDate: day(2026, 11, 30),
    });
    const target = grid.find(c => c.iso === "2026-11-16");
    expect(target?.selectable).toBe(true);
  });

  it("dia passado (< minDate) não é selecionável", () => {
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: ALL_DOWS, blocked: new Set(),
      minDate: day(2026, 10, 15), maxDate: day(2026, 11, 30),
    });
    expect(grid.find(c => c.iso === "2026-11-14")?.selectable).toBe(false);
    expect(grid.find(c => c.iso === "2026-11-15")?.selectable).toBe(true);
  });

  it("dia > maxDate não é selecionável", () => {
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: ALL_DOWS, blocked: new Set(),
      minDate: day(2026, 10, 1), maxDate: day(2026, 10, 20),
    });
    expect(grid.find(c => c.iso === "2026-11-20")?.selectable).toBe(true);
    expect(grid.find(c => c.iso === "2026-11-21")?.selectable).toBe(false);
  });

  it("dia bloqueado não é selecionável", () => {
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: ALL_DOWS, blocked: new Set(["2026-11-18"]),
      minDate: day(2026, 10, 1), maxDate: day(2026, 11, 30),
    });
    expect(grid.find(c => c.iso === "2026-11-18")?.selectable).toBe(false);
    expect(grid.find(c => c.iso === "2026-11-19")?.selectable).toBe(true);
  });

  it("dow sem disponibilidade não é selecionável", () => {
    // Apenas segunda (1) ativa; 2026-11-17 é terça (2)
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: new Set([1]), blocked: new Set(),
      minDate: day(2026, 10, 1), maxDate: day(2026, 11, 30),
    });
    expect(grid.find(c => c.iso === "2026-11-17")?.selectable).toBe(false);
  });

  it("iso usa toISODate (data local)", () => {
    const grid = buildMonthGrid({
      year: 2026, month: 10, activeDows: ALL_DOWS, blocked: new Set(),
      minDate: day(2026, 10, 1), maxDate: day(2026, 11, 30),
    });
    for (const c of grid) expect(c.iso).toBe(toISODate(c.date));
  });
});

describe("canGoPrevMonth", () => {
  it("false quando (year,month) é o mês de minDate", () => {
    expect(canGoPrevMonth(2026, 10, day(2026, 10, 22))).toBe(false);
  });

  it("true quando minDate está em mês anterior", () => {
    expect(canGoPrevMonth(2026, 10, day(2026, 9, 30))).toBe(true);
  });
});

describe("canGoNextMonth", () => {
  it("false quando (year,month) é o mês de maxDate", () => {
    expect(canGoNextMonth(2026, 10, day(2026, 10, 30))).toBe(false);
  });

  it("true quando maxDate está em mês posterior", () => {
    expect(canGoNextMonth(2026, 10, day(2026, 11, 1))).toBe(true);
  });
});

describe("findNextAvailableDate", () => {
  // 2026-11-16 = segunda (1); 17 = terça (2); 18 = quarta (3); 23 = segunda (1)
  it("retorna o primeiro dia cujo dow está em activeDows dentro do range", () => {
    expect(findNextAvailableDate(day(2026, 10, 17), day(2026, 10, 30), new Set([1]), new Set()))
      .toBe("2026-11-23");
  });

  it("pula dias bloqueados e dows sem disponibilidade", () => {
    // Seg(1) e Qua(3) ativos; 18 (qua) e 23 (seg) bloqueados; próximo elegível = qua 25
    expect(
      findNextAvailableDate(day(2026, 10, 17), day(2026, 10, 30), new Set([1, 3]), new Set(["2026-11-18", "2026-11-23"])),
    ).toBe("2026-11-25");
  });

  it("retorna null quando nenhum dia do range é elegível", () => {
    expect(findNextAvailableDate(day(2026, 10, 17), day(2026, 10, 30), new Set(), new Set())).toBeNull();
    expect(
      findNextAvailableDate(day(2026, 10, 17), day(2026, 10, 18), new Set([2, 3]), new Set(["2026-11-17", "2026-11-18"])),
    ).toBeNull();
  });

  it("respeita fromDate (não retorna data anterior)", () => {
    // Segunda 16 seria elegível, mas fromDate é sexta 20
    expect(findNextAvailableDate(day(2026, 10, 20), day(2026, 10, 30), new Set([1]), new Set()))
      .toBe("2026-11-23");
  });

  it("respeita maxDate (não ultrapassa, inclusive no limite)", () => {
    expect(findNextAvailableDate(day(2026, 10, 17), day(2026, 10, 22), new Set([1]), new Set())).toBeNull();
    expect(findNextAvailableDate(day(2026, 10, 17), day(2026, 10, 23), new Set([1]), new Set())).toBe("2026-11-23");
  });
});

import { describe, it, expect } from "vitest";
import { groupAvailabilityByDay, type BookingAvailability } from "./workspaceBookings";

function row(
  id: string,
  day: number,
  start: string,
  end: string,
  sortOrder?: number,
): BookingAvailability {
  return {
    id,
    workspace_id: "ws-1",
    day_of_week: day,
    start_time: start,
    end_time: end,
    active: true,
    sort_order: sortOrder,
  };
}

describe("groupAvailabilityByDay", () => {
  it("agrupa janelas do mesmo dia na mesma chave e dias diferentes em chaves diferentes", () => {
    const rows = [
      row("a", 1, "08:00", "12:00", 0),
      row("b", 1, "14:00", "18:00", 1),
      row("c", 3, "09:00", "10:00", 0),
    ];

    const grouped = groupAvailabilityByDay(rows);

    expect(grouped.get(1)?.map((r) => r.id)).toEqual(["a", "b"]);
    expect(grouped.get(3)?.map((r) => r.id)).toEqual(["c"]);
    expect(grouped.size).toBe(2);
  });

  it("ordena por sort_order e desempata por start_time", () => {
    const rows = [
      row("late-order1", 2, "15:00", "16:00", 1),
      row("tie-afternoon", 2, "14:00", "15:00", 0),
      row("tie-morning", 2, "08:00", "09:00", 0),
      row("order1-early", 2, "07:00", "08:00", 1),
    ];

    const ids = groupAvailabilityByDay(rows).get(2)?.map((r) => r.id);

    expect(ids).toEqual(["tie-morning", "tie-afternoon", "order1-early", "late-order1"]);
  });

  it("nao inclui dias sem linhas e devolve linhas inativas", () => {
    const inactive: BookingAvailability = { ...row("off", 5, "08:00", "09:00", 0), active: false };
    const grouped = groupAvailabilityByDay([inactive]);

    expect(grouped.has(0)).toBe(false);
    expect(grouped.has(5)).toBe(true);
    expect(grouped.get(5)).toHaveLength(1);
  });

  it("retorna Map vazio para entrada vazia", () => {
    expect(groupAvailabilityByDay([]).size).toBe(0);
  });
});

import { describe, expect, it, vi } from "vitest";

// Evita a inicialização do cliente Supabase (exige env vars) ao importar o módulo.
vi.mock("@/lib/workspaceSupabase", () => ({ workspaceSupabase: {} }));

import { duplicatePlanName, nextDuplicateDayLabel } from "./workspaceTraining";

describe("duplicatePlanName", () => {
  it("adds (cópia) when no copy exists", () => {
    expect(duplicatePlanName("Treino", [])).toBe("Treino (cópia)");
  });

  it("increments when (cópia) already exists", () => {
    expect(duplicatePlanName("Treino", ["Treino (cópia)"])).toBe("Treino (cópia 2)");
  });

  it("keeps incrementing past existing copies", () => {
    expect(duplicatePlanName("Treino", ["Treino (cópia)", "Treino (cópia 2)"])).toBe(
      "Treino (cópia 3)",
    );
  });

  it("ignores unrelated names", () => {
    expect(duplicatePlanName("Treino", ["Outro (cópia)"])).toBe("Treino (cópia)");
  });
});

describe("nextDuplicateDayLabel", () => {
  it("returns the next free letter", () => {
    expect(nextDuplicateDayLabel("A", ["A", "B"])).toBe("C");
  });

  it("returns B when only A exists", () => {
    expect(nextDuplicateDayLabel("A", ["A"])).toBe("B");
  });

  it("falls back to (cópia) for non-letter labels", () => {
    expect(nextDuplicateDayLabel("Segunda", ["Segunda"])).toBe("Segunda (cópia)");
  });

  it("falls back to (cópia) when no letter is free", () => {
    const all = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    expect(nextDuplicateDayLabel("A", all)).toBe("A (cópia)");
  });

  it("compares case-insensitively", () => {
    expect(nextDuplicateDayLabel("a", ["A", "b"])).toBe("C");
  });
});

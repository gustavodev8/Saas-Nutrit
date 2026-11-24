import { describe, expect, it, vi } from "vitest";

// Evita a inicialização do cliente Supabase (exige env vars) ao importar o módulo.
vi.mock("@/lib/workspaceSupabase", () => ({ workspaceSupabase: {} }));

import { duplicateMealPlanTitle } from "./workspaceMealPlans";

describe("duplicateMealPlanTitle", () => {
  it("adds (cópia) when no copy exists", () => {
    expect(duplicateMealPlanTitle("Dieta", [])).toBe("Dieta (cópia)");
  });

  it("increments when (cópia) already exists", () => {
    expect(duplicateMealPlanTitle("Dieta", ["Dieta (cópia)"])).toBe("Dieta (cópia 2)");
  });

  it("keeps incrementing past existing copies", () => {
    expect(duplicateMealPlanTitle("Dieta", ["Dieta (cópia)", "Dieta (cópia 2)"])).toBe("Dieta (cópia 3)");
  });

  it("compares case-insensitively", () => {
    expect(duplicateMealPlanTitle("Dieta", ["DIETA (CÓPIA)"].map((t) => t.toLowerCase()))).toBe("Dieta (cópia 2)");
    expect(duplicateMealPlanTitle("Dieta", ["dieta (CÓPIA)"])).toBe("Dieta (cópia 2)");
  });

  it("trims the title borders", () => {
    expect(duplicateMealPlanTitle("  Dieta  ", [" Dieta (cópia) "])).toBe("Dieta (cópia 2)");
    expect(duplicateMealPlanTitle("  Dieta  ", [])).toBe("Dieta (cópia)");
  });

  it("handles an empty list", () => {
    expect(duplicateMealPlanTitle("Plano", [])).toBe("Plano (cópia)");
  });
});

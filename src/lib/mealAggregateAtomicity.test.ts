import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(
  process.cwd(),
  "supabase/migrations/20261202000000_admin_meal_aggregate_atomic_saves_candidate.sql",
), "utf8");
const api = readFileSync(resolve(process.cwd(), "src/lib/supabase.ts"), "utf8");
const adminPage = readFileSync(resolve(process.cwd(), "src/pages/admin/AdminPlanoAlimentar.tsx"), "utf8");

describe("atomic admin meal aggregate save contract", () => {
  it("defines three definer RPCs with explicit authenticated admin gates and parent locks", () => {
    for (const name of [
      "save_admin_meal_plan_aggregate",
      "save_admin_diet_template_aggregate",
      "save_admin_meal_preset_aggregate",
    ]) {
      const start = migration.indexOf(`FUNCTION public.${name}`);
      expect(start, `${name} exists`).toBeGreaterThanOrEqual(0);
      const next = migration.indexOf("CREATE OR REPLACE FUNCTION", start + 1);
      const body = migration.slice(start, next < 0 ? migration.length : next);
      expect(body).toContain("SECURITY DEFINER");
      expect(body).toContain("SET search_path TO ''");
      expect(body).toContain("auth.role() IS DISTINCT FROM 'authenticated'");
      expect(body).toContain("auth.uid() IS NULL");
      expect(body).toContain("public.is_admin_email()");
      expect(body).toContain("FOR UPDATE");
    }
  });

  it("bounds and validates nested JSON and grants execution only to authenticated callers", () => {
    expect(migration).toContain("invalid or oversized meal plan payload");
    expect(migration).toContain("invalid or oversized template payload");
    expect(migration).toContain("invalid or oversized preset payload");
    expect(migration).toContain("FROM PUBLIC, anon, service_role");
    expect(migration.match(/TO authenticated;/g)).toHaveLength(3);
    expect(migration).not.toMatch(/CREATE\s+POLICY|DROP\s+POLICY|ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(migration).toContain("last-writer-wins");
  });

  it("routes DAO saves through RPCs and sends complete payloads from the three editor handlers", () => {
    for (const rpc of [
      "save_admin_meal_plan_aggregate",
      "save_admin_diet_template_aggregate",
      "save_admin_meal_preset_aggregate",
    ]) expect(api).toContain(`rpc("${rpc}"`);
    expect(adminPage).toContain("saveMealPlanAggregate(planWithLineage, dbMeals");
    expect(adminPage).toContain("saveDietTemplateAggregate({");
    expect(adminPage).toContain("saveMealPresetAggregate({");
    expect(adminPage).not.toMatch(/saveMeals\(|saveDietTemplateMeals\(|saveMealPresetFoods\(/);
  });
});

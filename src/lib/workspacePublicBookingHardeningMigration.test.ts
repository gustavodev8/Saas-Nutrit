import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const additiveMigration = readFileSync(resolve(
  process.cwd(),
  "supabase/migrations/20261205000000_workspace_public_booking_hardening_candidate.sql",
), "utf8");
const contractionMigration = readFileSync(resolve(
  process.cwd(),
  "supabase/migrations/20261206000000_workspace_public_booking_contract_candidate.sql",
), "utf8");
const publicPage = readFileSync(resolve(process.cwd(), "src/pages/WorkspacePublicBookingPage.tsx"), "utf8");
const edgeFunction = readFileSync(resolve(
  process.cwd(),
  "supabase/functions/create-workspace-booking-payment/index.ts",
), "utf8");

describe("workspace public booking hardening contract", () => {
  it("keeps Phase A additive: it creates public RPCs without revoking legacy table access", () => {
    for (const rpc of [
      "get_public_workspace_booking_profile",
      "get_public_workspace_booking_services",
      "get_public_workspace_booking_slots",
      "get_public_workspace_booking_payment_status",
    ]) {
      expect(additiveMigration).toContain(`FUNCTION public.${rpc}`);
      expect(additiveMigration).toContain(`GRANT EXECUTE ON FUNCTION public.${rpc}`);
    }

    expect(additiveMigration).not.toMatch(/DROP\s+POLICY/i);
    expect(additiveMigration).not.toMatch(/REVOKE\s+ALL\s+ON\s+TABLE/i);
    expect(additiveMigration).toContain("all patient data");
    expect(additiveMigration).toContain("SAAS_RATE_LIMIT_HMAC_SECRET");
  });

  it("moves anon policy and table privilege removal to the post-smoke contraction migration", () => {
    expect(contractionMigration).toContain('DROP POLICY IF EXISTS "bookings_anon_slots_read"');
    expect(contractionMigration).toContain('DROP POLICY IF EXISTS "bookings_anon_insert"');
    expect(contractionMigration).toContain("REVOKE ALL ON TABLE public.workspace_bookings FROM anon;");
    expect(contractionMigration).toContain("smoke-tested");
    expect(contractionMigration).toContain("cache coexistence");
    expect(contractionMigration).toContain("force refresh");
  });

  it("enforces scheduling eligibility inside the advisory-locked atomic insert", () => {
    const start = additiveMigration.indexOf("CREATE OR REPLACE FUNCTION public.create_workspace_booking_atomic");
    const atomicInsert = additiveMigration.slice(start);

    expect(atomicInsert).toContain("pg_advisory_xact_lock");
    expect(atomicInsert).toContain("setting.active = true");
    expect(atomicInsert).toContain("service.workspace_id = p_workspace_id");
    expect(atomicInsert).toContain("service.active = true");
    expect(atomicInsert).toContain("p_booking_date + p_booking_time < now()");
    expect(atomicInsert).toContain("workspace_booking_blocked_dates");
    expect(atomicInsert).toContain("workspace_booking_availability");
    expect(atomicInsert).toContain("mod(");
    expect(atomicInsert).toContain("v_new_end + v_buffer_minutes >");
    expect(additiveMigration).toContain("+ v_duration_min\n          + v_buffer_minutes");
    expect(atomicInsert).toContain("BOOKING_CONFLICT");
    expect(atomicInsert).toContain("BOOKING_UNAVAILABLE");
  });

  it("keeps the public page on RPCs rather than direct workspace booking REST reads", () => {
    expect(publicPage).toContain("fetchPublicAvailableSlots");
    expect(publicPage).toContain("fetchPublicBookingPaymentStatus");
    expect(publicPage).toContain("workspace_slug: settings!.slug");
    expect(publicPage).not.toContain("workspace_bookings?mp_payment_id");
    expect(publicPage).not.toContain("workspace_id: settings!.workspace_id");
  });

  it("keeps the payment function rate-limited and compatible with legacy and slug clients", () => {
    expect(edgeFunction).toContain('endpoint: "workspace-booking-payment"');
    expect(edgeFunction).toContain("SAAS_RATE_LIMIT_HMAC_SECRET");
    expect(edgeFunction).toContain("identityKey:");
    expect(edgeFunction).toContain("workspace_slug?: unknown");
    expect(edgeFunction).toContain("workspace_id?: unknown");
    expect(edgeFunction).toContain('settingsQuery.set("slug"');
    expect(edgeFunction).toContain('settingsQuery.set("workspace_id"');
    expect(edgeFunction).toContain("get_public_workspace_booking_slots");
    expect(edgeFunction).toContain("BOOKING_UNAVAILABLE");
  });
});

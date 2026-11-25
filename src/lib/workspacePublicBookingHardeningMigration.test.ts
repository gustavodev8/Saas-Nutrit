import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const additiveMigrationPath = "supabase/migrations/20261206000000_workspace_public_booking_hardening_candidate.sql";
const contractionMigrationPath = "supabase/migrations/20261207000000_workspace_public_booking_contract_candidate.sql";

const additiveMigration = readFileSync(resolve(
  process.cwd(),
  additiveMigrationPath,
), "utf8");
const contractionMigration = readFileSync(resolve(
  process.cwd(),
  contractionMigrationPath,
), "utf8");
const publicPage = readFileSync(resolve(process.cwd(), "src/pages/WorkspacePublicBookingPage.tsx"), "utf8");
const edgeFunction = readFileSync(resolve(
  process.cwd(),
  "supabase/functions/create-workspace-booking-payment/index.ts",
), "utf8");

describe("workspace public booking hardening contract", () => {
  it("keeps Phase A additive while creating minimal public RPCs", () => {
    for (const rpc of [
      "get_public_workspace_booking_profile",
      "get_public_workspace_booking_services",
      "get_public_workspace_booking_slots",
      "get_public_workspace_booking_payment_status",
    ]) {
      expect(additiveMigration).toContain(`FUNCTION public.${rpc}`);
      expect(additiveMigration).toContain(`GRANT EXECUTE ON FUNCTION public.${rpc}`);
    }

    expect(additiveMigration).not.toContain('DROP POLICY IF EXISTS "bookings_anon_slots_read" ON public.workspace_bookings;');
    expect(additiveMigration).not.toContain('DROP POLICY IF EXISTS "bookings_anon_insert" ON public.workspace_bookings;');
    expect(additiveMigration).not.toContain("REVOKE ALL ON TABLE public.workspace_bookings FROM anon;");
    expect(additiveMigration).toContain("all patient data");
    expect(additiveMigration).toContain("SAAS_RATE_LIMIT_HMAC_SECRET");
  });

  it("moves all anonymous booking-table ACL contraction to the immediate post-smoke Phase B", () => {
    const phaseAVersion = additiveMigrationPath.match(/(\d{14})_/u)?.[1];
    const phaseBVersion = contractionMigrationPath.match(/(\d{14})_/u)?.[1];

    expect(phaseAVersion).toBe("20261206000000");
    expect(phaseBVersion).toBe("20261207000000");
    expect(phaseAVersion! < phaseBVersion!).toBe(true);
    for (const signature of [
      "public.get_public_workspace_booking_profile(text)",
      "public.get_public_workspace_booking_services(text)",
      "public.get_public_workspace_booking_slots(text,uuid,date)",
      "public.get_public_workspace_booking_payment_status(uuid,text)",
      "public.create_workspace_booking_atomic(uuid,uuid,text,text,text,date,time,integer,integer,integer,integer,integer)",
    ]) {
      expect(contractionMigration).toContain(`to_regprocedure('${signature}') IS NULL`);
    }
    expect(contractionMigration).toContain("Phase A functions are missing");
    expect(contractionMigration).not.toContain("supabase_migrations.schema_migrations");
    expect(contractionMigration).toContain('DROP POLICY IF EXISTS "bookings_anon_slots_read"');
    expect(contractionMigration).toContain('DROP POLICY IF EXISTS "bookings_anon_insert"');
    expect(contractionMigration).toContain("REVOKE ALL ON TABLE public.workspace_bookings FROM anon;");
    expect(contractionMigration).toContain("smoke-tested");
    expect(contractionMigration).toContain("cache coexistence");
    expect(contractionMigration).toContain("force refresh");
    expect(contractionMigration).toContain("smoke-tested");
  });

  it("enforces scheduling eligibility inside the advisory-locked atomic insert", () => {
    const slotsStart = additiveMigration.indexOf("CREATE OR REPLACE FUNCTION public.get_public_workspace_booking_slots");
    const slotsEnd = additiveMigration.indexOf("CREATE OR REPLACE FUNCTION public.get_public_workspace_booking_payment_status");
    const publicSlots = additiveMigration.slice(slotsStart, slotsEnd);
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
    expect(publicSlots).toMatch(/\+\s*v_duration_min\s*\+\s*v_buffer_minutes/);
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

  it("uses a preliminary lookup limit, then canonical workspace limits for slug and UUID clients", () => {
    expect(edgeFunction).toContain("SAAS_RATE_LIMIT_HMAC_SECRET");
    expect(edgeFunction).toContain("getWorkspaceBookingRateLimits");
    expect(edgeFunction).toContain("getWorkspaceBookingLookupRateLimit");
    expect(edgeFunction).toContain("const clientIp = getTrustedSupabaseClientIp(req);");
    expect(edgeFunction).toContain("if (!clientIp) return responseJson({ error: \"Serviço temporariamente indisponível.\" }, 503);");
    expect(edgeFunction).not.toContain("getClientIp(req)");
    expect(edgeFunction).toContain("...getWorkspaceBookingLookupRateLimit(clientIp)");
    expect(edgeFunction).toContain("for (const rateLimit of getWorkspaceBookingRateLimits(");
    expect(edgeFunction).toContain("settings.workspace_id,");
    expect(edgeFunction).not.toContain("workspaceSlug ?? requestedWorkspaceId,\n      patientEmail");
    expect(edgeFunction).toContain("if (rateLimitError) return rateLimitError;");
    expect(edgeFunction).toContain("workspace_slug?: unknown");
    expect(edgeFunction).toContain("workspace_id?: unknown");
    expect(edgeFunction).toContain('settingsQuery.set("slug"');
    expect(edgeFunction).toContain('settingsQuery.set("workspace_id"');
    expect(edgeFunction).toContain("get_public_workspace_booking_slots");
    expect(edgeFunction).toContain("BOOKING_UNAVAILABLE");
  });
});

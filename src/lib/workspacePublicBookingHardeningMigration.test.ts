import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(
  process.cwd(),
  "supabase/migrations/20261205000000_workspace_public_booking_hardening_candidate.sql",
), "utf8");
const publicPage = readFileSync(resolve(process.cwd(), "src/pages/WorkspacePublicBookingPage.tsx"), "utf8");
const edgeFunction = readFileSync(resolve(
  process.cwd(),
  "supabase/functions/create-workspace-booking-payment/index.ts",
), "utf8");

describe("workspace public booking hardening contract", () => {
  it("provides minimal RPCs and revokes anonymous table access", () => {
    for (const rpc of [
      "get_public_workspace_booking_profile",
      "get_public_workspace_booking_services",
      "get_public_workspace_booking_slots",
      "get_public_workspace_booking_payment_status",
    ]) {
      expect(migration).toContain(`FUNCTION public.${rpc}`);
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION public.${rpc}`);
    }

    expect(migration).toContain("DROP POLICY IF EXISTS \"bookings_anon_slots_read\"");
    expect(migration).toContain("DROP POLICY IF EXISTS \"bookings_anon_insert\"");
    expect(migration).toContain("REVOKE ALL ON TABLE public.workspace_bookings FROM anon;");
    expect(migration).toContain("REVOKE ALL ON TABLE public.workspace_booking_settings FROM anon;");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("No patient data is returned");
  });

  it("keeps the public page on RPCs rather than direct workspace booking REST reads", () => {
    expect(publicPage).toContain("fetchPublicAvailableSlots");
    expect(publicPage).toContain("fetchPublicBookingPaymentStatus");
    expect(publicPage).toContain("workspace_slug: settings!.slug");
    expect(publicPage).not.toContain("workspace_bookings?mp_payment_id");
    expect(publicPage).not.toContain("workspace_id: settings!.workspace_id");
  });

  it("makes the payment function rate-limit and verify a server-calculated slot", () => {
    expect(edgeFunction).toContain('endpoint: "workspace-booking-payment"');
    expect(edgeFunction).toContain("get_public_workspace_booking_slots");
    expect(edgeFunction).toContain("workspace_slug");
    expect(edgeFunction).toContain("Este horário não está mais disponível");
    expect(edgeFunction).not.toContain("workspace_id?: unknown");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc },
}));

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: {},
}));

import {
  fetchPublicAvailableSlots,
  fetchPublicBookingPaymentStatus,
  fetchPublicBookingSettings,
  fetchPublicServices,
} from "./workspaceBookings";

describe("public workspace booking RPC contract", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("loads the public profile through its minimal RPC", async () => {
    const profile = {
      slug: "clinica-exemplo",
      presentation_name: "Clínica Exemplo",
      bio: "Nutrição clínica",
      min_notice_hours: 2,
      max_advance_days: 60,
      active_days: [1, 3],
      blocked_dates: ["2099-01-01"],
    };
    rpc.mockResolvedValueOnce({ data: [profile], error: null });

    await expect(fetchPublicBookingSettings(profile.slug)).resolves.toEqual(profile);
    expect(rpc).toHaveBeenCalledWith("get_public_workspace_booking_profile", {
      p_slug: profile.slug,
    });
  });

  it("uses slug-scoped RPCs for services and slots, exposing no booking rows", async () => {
    rpc
      .mockResolvedValueOnce({
        data: [{
          id: "00000000-0000-4000-8000-000000000001",
          name: "Consulta",
          description: null,
          price_cents: 15000,
          duration_min: 60,
          sort_order: 0,
        }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ slot_time: "09:30:00" }, { slot_time: "11:00:00" }],
        error: null,
      });

    await expect(fetchPublicServices("clinica-exemplo")).resolves.toHaveLength(1);
    await expect(fetchPublicAvailableSlots(
      "clinica-exemplo",
      "00000000-0000-4000-8000-000000000001",
      "2099-01-02",
    )).resolves.toEqual([
      { time: "09:30", available: true },
      { time: "11:00", available: true },
    ]);

    expect(rpc).toHaveBeenNthCalledWith(1, "get_public_workspace_booking_services", {
      p_slug: "clinica-exemplo",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "get_public_workspace_booking_slots", {
      p_slug: "clinica-exemplo",
      p_service_id: "00000000-0000-4000-8000-000000000001",
      p_booking_date: "2099-01-02",
    });
  });

  it("requires both opaque identifiers to read a payment status", async () => {
    rpc.mockResolvedValueOnce({ data: [{ status: "paid" }], error: null });

    await expect(fetchPublicBookingPaymentStatus(
      "00000000-0000-4000-8000-000000000002",
      "mp-payment-123",
    )).resolves.toBe("paid");
    expect(rpc).toHaveBeenCalledWith("get_public_workspace_booking_payment_status", {
      p_booking_id: "00000000-0000-4000-8000-000000000002",
      p_payment_id: "mp-payment-123",
    });
  });

  it("fails instead of silently falling back to a direct table query", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } });

    await expect(fetchPublicServices("clinica-exemplo")).rejects.toThrow("permission denied");
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});

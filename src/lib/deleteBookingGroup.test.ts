import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://synthetic.supabase.test");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "synthetic-anon-key");
  return { from: vi.fn(), delete: vi.fn(), eq: vi.fn() };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

import { deleteBookingGroup } from "./supabase";

describe("deleteBookingGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ delete: mocks.delete });
    mocks.delete.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockResolvedValue({ error: null });
  });

  it("classifies only the consultation foreign key as a clinical block", async () => {
    mocks.eq.mockResolvedValue({
      error: {
        code: "23503",
        message: 'violates foreign key constraint "consultation_records_booking_id_fkey"',
      },
    });

    await expect(deleteBookingGroup("synthetic-group")).resolves.toBe("blocked-by-consultation");
  });

  it("returns generic failure for unrelated database errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.eq.mockResolvedValue({ error: { code: "23503", message: "unrelated foreign key" } });

    await expect(deleteBookingGroup("synthetic-group")).resolves.toBe("failed");
    vi.restoreAllMocks();
  });

  it("returns deleted on success", async () => {
    await expect(deleteBookingGroup("synthetic-group")).resolves.toBe("deleted");
  });
});

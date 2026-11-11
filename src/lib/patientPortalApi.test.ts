import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/patientPortalSupabase", () => ({
  patientPortalSupabase: {
    auth: { getSession: mocks.getSession },
    rpc: mocks.rpc,
    from: mocks.from,
  },
}));

import { fetchCurrentPortalPatient } from "@/lib/patientPortalApi";

describe("fetchCurrentPortalPatient linked profiles", () => {
  afterEach(() => vi.clearAllMocks());

  it("loads one active linked patient through scoped RPCs without selecting patients", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-a" } } } });
    mocks.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({
        data: [{ workspace_id: "10000000-0000-4000-8000-000000000001", patient_id: "42" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ patient_id: 42, patient_name: "Paciente teste", patient_email: null, patient_phone: "75999999999" }],
        error: null,
      });

    await expect(fetchCurrentPortalPatient()).resolves.toEqual({
      id: 42,
      workspace_id: "10000000-0000-4000-8000-000000000001",
      name: "Paciente teste",
      email: undefined,
      phone: "75999999999",
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(3, "get_my_linked_patient_profile", {
      p_workspace_id: "10000000-0000-4000-8000-000000000001",
      p_patient_id: 42,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("fails closed when more than one active patient link needs selection", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-a" } } } });
    mocks.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: [{}, {}], error: null });

    await expect(fetchCurrentPortalPatient()).resolves.toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
});

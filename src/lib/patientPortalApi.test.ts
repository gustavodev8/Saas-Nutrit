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

import { createPortalTrainingLog, fetchCurrentPortalPatient } from "@/lib/patientPortalApi";

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

describe("createPortalTrainingLog idempotency", () => {
  afterEach(() => vi.clearAllMocks());

  it("envia a mesma chave de requisição para a RPC idempotente", async () => {
    mocks.rpc.mockResolvedValue({ data: 91, error: null });

    await expect(createPortalTrainingLog({
      requestId: "10000000-0000-4000-8000-000000000010",
      versionId: 20,
      sessionId: 30,
      patientId: 40,
      performedAt: "2026-11-15T12:00:00.000Z",
      difficulty: "moderate",
      notes: "Teste",
      loads: [{ exerciseId: 50, exerciseName: "Agachamento", loadUsed: "20 kg" }],
    })).resolves.toBe(true);

    expect(mocks.rpc).toHaveBeenCalledWith("create_workout_session_log_v2", expect.objectContaining({
      p_request_id: "10000000-0000-4000-8000-000000000010",
      p_workout_session_id: 30,
    }));
  });
});

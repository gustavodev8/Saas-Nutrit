import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrainingPlan } from "@/lib/trainingPlans";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  deleteCalls: 0,
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    rpc: mocks.rpc,
    from: mocks.from,
    auth: { getUser: mocks.getUser },
  },
}));

import { saveTrainingPlan } from "@/lib/trainingPlans";

const draft: TrainingPlan = {
  id: 10,
  workout_plan_id: 5,
  patient_id: 7,
  workspace_id: "10000000-0000-4000-8000-000000000001",
  title: "Treino seguro",
  goal: "Força",
  frequency: "3x",
  valid_from: null,
  valid_until: null,
  general_notes: "",
  status: "draft",
  version: 1,
  revision: 4,
  created_at: "2026-11-15T00:00:00.000Z",
  published_at: null,
  sessions: [{
    title: "Treino A",
    notes: "",
    sort_order: 0,
    exercises: [{
      name: "Agachamento",
      sets: "3",
      repetitions: "12",
      reference_load: "20 kg",
      rest: "60 s",
      instructions: "",
      demo_url: "",
      sort_order: 0,
    }],
  }],
};

describe("saveTrainingPlan atomic RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteCalls = 0;
    mocks.rpc.mockResolvedValue({ data: 5, error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { email: "test@example.invalid" } }, error: null });

    const results = new Map<string, unknown[]>([
      ["workout_plan_versions", [{ data: { ...draft, revision: 5 }, error: null }]],
      ["workout_plans", [{ data: { patient_id: 7 }, error: null }]],
      ["workout_sessions", [{ data: [], error: null }]],
      ["patients", [{ data: { name: "Paciente teste" }, error: null }]],
      ["patient_audit_logs", [{ data: null, error: null }]],
    ]);

    mocks.from.mockImplementation((table: string) => {
      const result = results.get(table)?.shift() ?? { data: null, error: null };
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        order: vi.fn(async () => result),
        single: vi.fn(async () => result),
        maybeSingle: vi.fn(async () => result),
        insert: vi.fn(() => builder),
        delete: vi.fn(() => { mocks.deleteCalls += 1; return builder; }),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });
  });

  it("envia snapshot e revisão esperada sem apagar sessões pelo cliente", async () => {
    const saved = await saveTrainingPlan(draft);

    expect(mocks.rpc).toHaveBeenCalledWith("save_workout_plan_draft", expect.objectContaining({
      p_version_id: 10,
      p_expected_revision: 4,
      p_sessions: [expect.objectContaining({
        title: "Treino A",
        exercises: [expect.objectContaining({ name: "Agachamento" })],
      })],
    }));
    expect(mocks.deleteCalls).toBe(0);
    expect(saved.revision).toBe(5);
  });

  it("não tenta reconstruir a ficha quando a RPC rejeita conflito", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error("revision conflict") });

    await expect(saveTrainingPlan(draft)).rejects.toThrow("revision conflict");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

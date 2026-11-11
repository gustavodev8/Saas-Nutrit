import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  responses: new Map<string, Array<{ data: unknown; error: unknown }>>(),
  calls: new Map<string, number>(),
  inserts: [] as Array<{ table: string; payload: unknown }>,
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: mocks.from,
    auth: { getUser: mocks.getUser },
  },
}));

import { createTrainingPlanVersion, type TrainingPlan } from "@/lib/trainingPlans";

const plan: TrainingPlan = {
  id: 12,
  workout_plan_id: 4,
  patient_id: 9,
  workspace_id: "ws-test",
  title: "Treino A",
  goal: "",
  frequency: "3x",
  valid_from: null,
  valid_until: null,
  general_notes: "",
  status: "published",
  version: 2,
  created_at: "2026-01-01T00:00:00Z",
  published_at: "2026-01-02T00:00:00Z",
};

function response(data: unknown = null, error: unknown = null) {
  return { data, error };
}

function configureScenario(firstInsertError: { code: string } | null) {
  const newVersion = { ...plan, id: 13, version: 3, status: "draft" as const };
  mocks.responses = new Map([
    ["workout_plan_versions", [
      ...(firstInsertError ? [response(null, firstInsertError)] : []),
      response(newVersion), // initial insert, or legacy fallback insert
      response(plan), // load source version
      response(newVersion), // save draft metadata
      response(newVersion), // reload saved draft
    ]],
    ["workout_plans", [response({ patient_id: plan.patient_id }), response({ patient_id: plan.patient_id })]],
    ["workout_sessions", [response([]), response(null), response([])]],
    ["patients", [response({ name: "Paciente teste" })]],
    ["patient_audit_logs", [response(null)]],
  ]);
  mocks.calls = new Map();
}

describe("createTrainingPlanVersion lineage compatibility", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.inserts = [];
    mocks.getUser.mockResolvedValue({ data: { user: { email: "test@example.invalid" } }, error: null });
    mocks.from.mockImplementation((table: string) => {
      const index = mocks.calls.get(table) ?? 0;
      mocks.calls.set(table, index + 1);
      const queued = mocks.responses.get(table) ?? [];
      const result = queued[index] ?? response(null);
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        order: vi.fn(async () => result),
        single: vi.fn(async () => result),
        maybeSingle: vi.fn(async () => result),
        insert: vi.fn((payload: unknown) => {
          mocks.inserts.push({ table, payload });
          return builder;
        }),
        update: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    });
  });

  it("inserts parent and origin lineage when the columns are available", async () => {
    configureScenario(null);
    await createTrainingPlanVersion(plan);

    expect(mocks.inserts[0]).toEqual({
      table: "workout_plan_versions",
      payload: expect.objectContaining({ parent_version_id: 12, origin_type: "version_copy" }),
    });
    expect(mocks.inserts.filter((call) => call.table === "workout_plan_versions")).toHaveLength(1);
  });

  it.each(["PGRST204", "42703"])("retries without lineage only for missing-column error %s", async (code) => {
    configureScenario({ code });
    await createTrainingPlanVersion(plan);

    const versionInserts = mocks.inserts.filter((call) => call.table === "workout_plan_versions");
    expect(versionInserts).toHaveLength(2);
    expect(versionInserts[0].payload).toEqual(expect.objectContaining({ parent_version_id: 12, origin_type: "version_copy" }));
    expect(versionInserts[1].payload).toEqual(expect.not.objectContaining({ parent_version_id: expect.anything(), origin_type: expect.anything() }));
  });
});


import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchWorkspaceAnamnesis,
  upsertWorkspaceAnamnesis,
  WORKSPACE_ANAMNESIS_GATE_MESSAGE,
} from "./workspaceAnamnesis";
import type { WorkspacePatient } from "./workspacePatients";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/lib/workspaceSupabase", () => ({ workspaceSupabase: { from: mocks.from } }));

const patient: WorkspacePatient = {
  id: 41,
  workspace_id: "workspace-a",
  name: "Ana",
  email: null,
  phone: null,
  birth_date: null,
  gender: "F",
  occupation: null,
  city: null,
  created_at: null,
};

describe("workspaceAnamnesis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_WORKSPACE_ANAMNESIS_ENABLED", "true");
    const chain = {
      select: mocks.select,
      eq: mocks.eq,
      maybeSingle: mocks.maybeSingle,
      insert: mocks.insert,
      update: mocks.update,
      single: mocks.single,
    };
    mocks.from.mockReturnValue(chain);
    mocks.select.mockReturnValue(chain);
    mocks.eq.mockReturnValue(chain);
    mocks.insert.mockReturnValue(chain);
    mocks.update.mockReturnValue(chain);
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.single.mockResolvedValue({
      data: { id: 7, workspace_id: "workspace-a", patient_id: 41, structured_data: { goal_primary: "saude_geral" } },
      error: null,
    });
  });

  it("reads only the requested workspace and patient", async () => {
    await fetchWorkspaceAnamnesis("workspace-a", 41);
    expect(mocks.from).toHaveBeenCalledWith("anamnesis");
    expect(mocks.select).toHaveBeenCalledWith(expect.stringContaining("workspace_id"));
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "workspace_id", "workspace-a");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "patient_id", 41);
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("updates with workspace, patient, and row ID predicates", async () => {
    await upsertWorkspaceAnamnesis("workspace-a", patient, { goal_primary: "saude_geral" }, 7);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: "workspace-a",
      patient_id: 41,
      structured_data: { goal_primary: "saude_geral" },
    }));
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "workspace_id", "workspace-a");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "patient_id", 41);
    expect(mocks.eq).toHaveBeenNthCalledWith(3, "id", 7);
  });

  it("rejects a cross-workspace patient before contacting Supabase", async () => {
    await expect(upsertWorkspaceAnamnesis("workspace-b", patient, {})).rejects.toThrow(/não pertence ao workspace/i);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("does not query while the release gate is closed", async () => {
    vi.stubEnv("VITE_WORKSPACE_ANAMNESIS_ENABLED", "false");
    await expect(fetchWorkspaceAnamnesis("workspace-a", 41)).rejects.toThrow(WORKSPACE_ANAMNESIS_GATE_MESSAGE);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("converts schema and policy failures into the closed gate", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: "42501", message: "permission denied" } });
    await expect(fetchWorkspaceAnamnesis("workspace-a", 41)).rejects.toThrow(WORKSPACE_ANAMNESIS_GATE_MESSAGE);
  });
});

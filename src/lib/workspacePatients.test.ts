import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWorkspacePatient,
  fetchWorkspacePatients,
  filterWorkspacePatients,
  getWorkspacePatientCities,
  paginateWorkspacePatients,
  updateWorkspacePatient,
  type WorkspacePatient,
  type WorkspacePatientInput,
} from "./workspacePatients";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/lib/workspaceSupabase", () => ({ workspaceSupabase: { from: mocks.from } }));

function patient(overrides: Partial<WorkspacePatient> = {}): WorkspacePatient {
  return {
    id: 1,
    workspace_id: "workspace-a",
    name: "Ana",
    email: "ana@example.test",
    phone: "111",
    birth_date: "1990-02-10",
    gender: "F",
    occupation: "Professora",
    city: "Salvador",
    created_at: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

const input: WorkspacePatientInput = {
  name: " Bruno ",
  email: " bruno@example.test ",
  phone: " 333 ",
  birth_date: "1988-07-04",
  gender: "M",
  occupation: " Engenheiro ",
  city: " Alagoinhas ",
};

describe("workspacePatients service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = {
      select: mocks.select,
      eq: mocks.eq,
      order: mocks.order,
      insert: mocks.insert,
      update: mocks.update,
      single: mocks.single,
    };
    mocks.from.mockReturnValue(chain);
    mocks.select.mockReturnValue(chain);
    mocks.eq.mockReturnValue(chain);
    mocks.insert.mockReturnValue(chain);
    mocks.update.mockReturnValue(chain);
    mocks.order.mockResolvedValue({ data: [patient()], error: null });
    mocks.single.mockResolvedValue({ data: patient(), error: null });
  });

  it("fetches only patients in the requested workspace and selects supported profile fields", async () => {
    await expect(fetchWorkspacePatients("workspace-a")).resolves.toEqual([patient()]);
    expect(mocks.from).toHaveBeenCalledWith("patients");
    expect(mocks.select).toHaveBeenCalledWith("id, workspace_id, name, email, phone, birth_date, gender, occupation, city, created_at");
    expect(mocks.eq).toHaveBeenCalledWith("workspace_id", "workspace-a");
    expect(mocks.order).toHaveBeenCalledWith("name");
  });

  it("persists all supported profile fields on create and trims blank values to null", async () => {
    await createWorkspacePatient("workspace-a", input);
    expect(mocks.from).toHaveBeenCalledWith("patients");
    expect(mocks.insert).toHaveBeenCalledWith({
      workspace_id: "workspace-a",
      name: "Bruno",
      email: "bruno@example.test",
      phone: "333",
      birth_date: "1988-07-04",
      gender: "M",
      occupation: "Engenheiro",
      city: "Alagoinhas",
    });

    await createWorkspacePatient("workspace-a", { ...input, email: " ", phone: "", birth_date: "", gender: "", occupation: " ", city: "" });
    expect(mocks.insert).toHaveBeenLastCalledWith({
      workspace_id: "workspace-a",
      name: "Bruno",
      email: null,
      phone: null,
      birth_date: null,
      gender: null,
      occupation: null,
      city: null,
    });
  });

  it("updates only the requested patient inside the workspace with supported fields", async () => {
    await updateWorkspacePatient("workspace-a", 7, input);
    expect(mocks.update).toHaveBeenCalledWith({
      name: "Bruno",
      email: "bruno@example.test",
      phone: "333",
      birth_date: "1988-07-04",
      gender: "M",
      occupation: "Engenheiro",
      city: "Alagoinhas",
    });
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "workspace_id", "workspace-a");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "id", 7);
  });

  it("deduplicates city labels case-insensitively with a deterministic display form", () => {
    const capitalizedFirst = [patient({ city: "Salvador" }), patient({ id: 2, city: "salvador" })];
    const lowercaseFirst = [...capitalizedFirst].reverse();

    expect(getWorkspacePatientCities(capitalizedFirst)).toEqual(["Salvador"]);
    expect(getWorkspacePatientCities(lowercaseFirst)).toEqual(["Salvador"]);
  });

  it("filters by text, gender, and city, then paginates deterministically", () => {
    const patients = [
      patient({ id: 1, name: "Ana", gender: "F", city: "Salvador", created_at: "2026-11-01T10:00:00Z" }),
      patient({ id: 2, name: "Bia", gender: "F", city: "Salvador", created_at: "2026-11-03T10:00:00Z" }),
      patient({ id: 3, name: "Bruno", gender: "M", city: "Alagoinhas", created_at: "2026-11-02T10:00:00Z" }),
    ];
    expect(getWorkspacePatientCities(patients)).toEqual(["Alagoinhas", "Salvador"]);
    const filtered = filterWorkspacePatients(patients, { query: " bia ", gender: "F", city: "salvador", sort: "recent" });
    expect(filtered.map(({ name }) => name)).toEqual(["Bia"]);
    expect(filterWorkspacePatients(patients, { query: "", gender: "all", city: "", sort: "recent" }).map(({ name }) => name))
      .toEqual(["Bia", "Bruno", "Ana"]);
    expect(paginateWorkspacePatients(patients, 2, 2)).toEqual({ items: [patients[2]], page: 2, pageCount: 2, total: 3 });
    expect(paginateWorkspacePatients(patients, 9, 2).page).toBe(2);
  });
});

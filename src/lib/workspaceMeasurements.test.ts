import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWorkspaceMeasurement,
  fetchWorkspaceMeasurements,
  updateWorkspaceMeasurement,
  validateWorkspaceMeasurementInput,
} from "./workspaceMeasurements";
import type { WorkspacePatient } from "./workspacePatients";

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

const patient: WorkspacePatient = {
  id: 41,
  workspace_id: "workspace-a",
  name: "Ana",
  email: null,
  phone: null,
  birth_date: "1990-02-10",
  gender: "F",
  occupation: null,
  city: null,
  created_at: null,
};

describe("workspaceMeasurements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_WORKSPACE_MEASUREMENTS_ENABLED", "true");
    mocks.from.mockReturnValue({
      select: mocks.select,
      eq: mocks.eq,
      order: mocks.order,
      insert: mocks.insert,
      update: mocks.update,
      single: mocks.single,
    });
    mocks.select.mockReturnThis();
    mocks.eq.mockReturnThis();
    mocks.order.mockReturnThis();
    mocks.insert.mockReturnThis();
    mocks.update.mockReturnThis();
    mocks.single.mockResolvedValue({ data: { id: 7, workspace_id: "workspace-a", patient_id: 41 }, error: null });
  });

  it("lists measurements scoped by workspace and patient, newest first", async () => {
    mocks.order.mockReturnValueOnce({ order: mocks.order }).mockReturnValueOnce({
      data: [{ id: 7, workspace_id: "workspace-a", patient_id: 41 }], error: null,
    });

    const result = await fetchWorkspaceMeasurements("workspace-a", 41);

    expect(result).toHaveLength(1);
    expect(mocks.from).toHaveBeenCalledWith("measurements");
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "workspace_id", "workspace-a");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "patient_id", 41);
    expect(mocks.order).toHaveBeenNthCalledWith(1, "assessment_date", { ascending: false });
  });

  it("inserts only after validating and includes both workspace and patient IDs", async () => {
    const created = await createWorkspaceMeasurement("workspace-a", patient, {
      assessment_date: "2026-11-07",
      weight: "70",
      height: "170",
      bio_fat_pct: "20",
      bio_lean_kg: "55",
      visceral_fat: "7",
      sf_pectoral: "10",
      sf_midaxillary: "11",
      sf_triceps: "12",
      sf_biceps: "13",
      sf_subscapular: "14",
      sf_suprailiac: "15",
      sf_abdominal: "16",
      sf_thigh_sf: "17",
      sf_calf_sf: "18",
      biestyloid_diameter_mm: "55",
      biepicondylar_femur_diameter_mm: "90",
      four_component_reference: "F",
      neck: "32",
      shoulder: "100",
      chest: "90",
      waist: "80",
      abdomen: "82",
      hip: "96",
      arm_relax_r: "28",
      arm_relax_l: "27",
      arm_contract_r: "30",
      arm_contract_l: "29",
      forearm_r: "24",
      forearm_l: "23",
      wrist_r: "16",
      wrist_l: "15",
      thigh_prox_r: "55",
      thigh_prox_l: "54",
      thigh_r: "50",
      thigh_l: "49",
      calf_r: "35",
      calf_l: "34",
      notes: "Revisão",
    }, "JP3F", "bio");

    expect(created.id).toBe(7);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: "workspace-a",
      patient_id: 41,
      assessment_date: "2026-11-07",
      weight: 70,
      height: 170,
      body_fat: 20,
      lean_mass: 55,
      visceral_fat: 7,
      sf_pectoral: 10,
      sf_midaxillary: 11,
      sf_triceps: 12,
      sf_biceps: 13,
      sf_subscapular: 14,
      sf_suprailiac: 15,
      sf_abdominal: 16,
      sf_thigh_sf: 17,
      sf_calf_sf: 18,
      biestyloid_diameter_mm: 55,
      biepicondylar_femur_diameter_mm: 90,
      four_component_reference: "F",
      neck: 32,
      shoulder: 100,
      chest: 90,
      waist: 80,
      abdomen: 82,
      hip: 96,
      arm_relax_r: 28,
      arm_relax_l: 27,
      arm_contract_r: 30,
      arm_contract_l: 29,
      forearm_r: 24,
      forearm_l: 23,
      wrist_r: 16,
      wrist_l: 15,
      thigh_prox_r: 55,
      thigh_prox_l: 54,
      thigh_r: 50,
      thigh_l: 49,
      calf_r: 35,
      calf_l: 34,
      notes: "Revisão",
    }));
  });

  it("updates a full assessment only within the matching workspace and patient", async () => {
    mocks.single.mockResolvedValueOnce({ data: { id: 7, workspace_id: "workspace-a", patient_id: 41 }, error: null });
    const result = await updateWorkspaceMeasurement("workspace-a", patient, 7, {
      assessment_date: "2026-11-07",
      weight: "71",
      bio_fat_pct: "19",
      sf_triceps: "13",
      arm_contract_l: "29",
      notes: "Atualizado",
    }, "JP3F", "bio");

    expect(result.id).toBe(7);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      patient_id: 41,
      workspace_id: "workspace-a",
      weight: 71,
      body_fat: 19,
      sf_triceps: 13,
      arm_contract_l: 29,
      notes: "Atualizado",
    }));
    expect(mocks.eq).toHaveBeenNthCalledWith(1, "workspace_id", "workspace-a");
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "patient_id", 41);
    expect(mocks.eq).toHaveBeenNthCalledWith(3, "id", 7);
  });

  it("rejects cross-workspace updates before querying and never exposes a delete operation", async () => {
    await expect(updateWorkspaceMeasurement("workspace-b", patient, 7, {
      assessment_date: "2026-11-07", weight: "70",
    }, "JP3F", null)).rejects.toThrow(/paciente não pertence ao workspace informado/i);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalledWith("measurements");
  });

  it("rejects a patient from another workspace without contacting Supabase", async () => {
    await expect(createWorkspaceMeasurement("workspace-b", patient, {
      assessment_date: "2026-11-07",
      weight: "70",
    })).rejects.toThrow(/paciente não pertence ao workspace informado/i);

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("does not query when the workspace-measurement feature gate is closed", async () => {
    vi.stubEnv("VITE_WORKSPACE_MEASUREMENTS_ENABLED", "false");

    await expect(fetchWorkspaceMeasurements("workspace-a", 41)).rejects.toThrow(/recurso bloqueado.*migration.*RLS validada/i);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("validates date, positive measures, and body-fat percentage", () => {
    expect(() => validateWorkspaceMeasurementInput({ assessment_date: "2026-02-30", weight: "70" })).toThrow(/data válida/i);
    expect(() => validateWorkspaceMeasurementInput({ assessment_date: "2026-11-07", weight: "0" })).toThrow(/maior que zero/i);
    expect(() => validateWorkspaceMeasurementInput({ assessment_date: "2026-11-07", bio_fat_pct: "101" })).toThrow(/entre 0 e 100/i);
    expect(() => validateWorkspaceMeasurementInput({ assessment_date: "2026-11-07" })).toThrow(/ao menos uma medida/i);
  });

  it.each(["PGRST204", "PGRST205", "42P01", "42501"])("converts schema/policy error %s into a controlled gate error", async (code) => {
    mocks.order.mockReturnValueOnce({ order: mocks.order }).mockReturnValueOnce({
      data: null,
      error: { code, message: "schema or policy unavailable" },
    });

    await expect(fetchWorkspaceMeasurements("workspace-a", 41)).rejects.toThrow(/recurso bloqueado.*migration.*RLS validada/i);
  });
});

import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PDFDocument } from "pdf-lib";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceMealPlanPage from "./WorkspaceMealPlanPage";
import type { WorkspacePatient } from "@/lib/workspacePatients";
import type { WorkspaceMealPlan } from "@/lib/workspaceMealPlans";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), fetchPatient: vi.fn(), fetchPlan: vi.fn(), save: vi.fn(), enabled: vi.fn(() => true), name: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  fetchSmartSubstitutions: vi.fn().mockResolvedValue([]),
  searchFoodsInSupabase: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: { from: () => ({ select: () => ({ eq: (_column: string, id: string) => ({ maybeSingle: () => mocks.name(id) }) }) }) },
}));
vi.mock("@/lib/generateMealPlanPdf", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/generateMealPlanPdf")>();
  return { ...original, generateMealPlanPdf: (...args: Parameters<typeof original.generateMealPlanPdf>) => {
    const doc = original.generateMealPlanPdf(...args);
    vi.spyOn(doc, "save").mockImplementation((name) => {
      mocks.download(name, doc.output("arraybuffer"));
      return doc;
    });
    return doc;
  } };
});
vi.mock("@/contexts/WorkspaceAuthContext", () => ({ useWorkspaceAuth: mocks.auth }));
vi.mock("@/lib/workspacePatients", () => ({ fetchWorkspacePatient: mocks.fetchPatient }));
vi.mock("@/lib/workspaceMealPlans", () => ({
  fetchWorkspaceMealPlan: mocks.fetchPlan,
  saveWorkspaceMealPlan: mocks.save,
  isWorkspaceMealPlansEnabled: mocks.enabled,
  WORKSPACE_MEAL_PLANS_GATE_MESSAGE: "Planos bloqueados",
}));

function patient(workspace_id: string, name: string): WorkspacePatient {
  return { id: 41, workspace_id, name, email: null, phone: null, birth_date: null, gender: null, occupation: null, city: null, created_at: null };
}

function plan(workspace_id: string, title: string): WorkspaceMealPlan {
  return { id: 10, workspace_id, patient_id: 41, title, meals: [] };
}

function renderPage(planId = "10") {
  return render(<MemoryRouter initialEntries={[`/workspace/patients/41/plan/${planId}`]}><Routes><Route path="/workspace/patients/:id/plan/:planId" element={<WorkspaceMealPlanPage />} /></Routes></MemoryRouter>);
}

describe("WorkspaceMealPlanPage scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.name.mockImplementation(async (id: string) => ({ data: { name: id === "workspace-a" ? "Clinica Alfa" : "Clinica Beta" } }));
    mocks.auth.mockReturnValue({ membership: { workspaceId: "workspace-a", role: "owner" } });
    mocks.fetchPatient.mockResolvedValue(patient("workspace-a", "Ana A"));
    mocks.fetchPlan.mockResolvedValue(plan("workspace-a", "Plano A"));
  });

  it("does not offer a download for an unsaved plan", async () => {
    renderPage("novo");
    await screen.findByRole("heading", { name: "Ana A" });
    expect(screen.queryByRole("button", { name: /PDF/ })).not.toBeInTheDocument();
    expect(mocks.download).not.toHaveBeenCalled();
  });

  it("exports the persisted revision after updating an existing plan", async () => {
    mocks.fetchPlan.mockResolvedValueOnce(plan("workspace-a", "Primeira versao"))
      .mockResolvedValueOnce(plan("workspace-a", "Versao salva"));
    mocks.save.mockResolvedValueOnce(10);
    renderPage();
    await screen.findByDisplayValue("Primeira versao");
    fireEvent.change(screen.getByLabelText("Título do plano"), { target: { value: "Versao salva" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar plano alimentar" }));
    await vi.waitFor(() => expect(mocks.fetchPlan).toHaveBeenCalledTimes(2));
    fireEvent.click(await screen.findByRole("button", { name: "PDF do plano salvo" }));
    fireEvent.click(screen.getByRole("button", { name: "Baixar PDF" }));
    const bytes = mocks.download.mock.calls[0][1] as ArrayBuffer;
    const stream = new TextDecoder("latin1").decode(bytes);
    expect(stream).toContain("Versao salva");
    expect(stream).not.toContain("Primeira versao");
  });

  it("does not render the previous plan while the workspace scope changes", async () => {
    const view = renderPage();
    expect(await screen.findByRole("heading", { name: "Ana A" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Plano A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "PDF do plano salvo" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    let resolvePatient!: (value: WorkspacePatient) => void;
    let resolvePlan!: (value: WorkspaceMealPlan) => void;
    mocks.fetchPatient.mockReturnValueOnce(new Promise((resolve) => { resolvePatient = resolve; }));
    mocks.fetchPlan.mockReturnValueOnce(new Promise((resolve) => { resolvePlan = resolve; }));
    mocks.auth.mockReturnValue({ membership: { workspaceId: "workspace-b", role: "owner" } });
    view.rerender(<MemoryRouter initialEntries={["/workspace/patients/41/plan/10"]}><Routes><Route path="/workspace/patients/:id/plan/:planId" element={<WorkspaceMealPlanPage />} /></Routes></MemoryRouter>);

    expect(screen.queryByRole("heading", { name: "Ana A" })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Plano A")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /PDF/ })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/carregando/i);

    await act(async () => { resolvePatient(patient("workspace-b", "Bia B")); });
    await vi.waitFor(() => expect(mocks.fetchPlan).toHaveBeenCalledTimes(2));
    const saved = plan("workspace-b", "Plano B");
    saved.meals = [{ workspace_id: "workspace-b", plan_id: 10, meal_name: "Jantar", foods: [
      { workspace_id: "workspace-b", meal_id: 12, food_name: "Arroz", quantity: 100, unit: "g", kcal_per_100g: 150, calories: 150 },
    ], alternative_meals: [{ meal_name: "Alternativa B", foods: [{ meal_id: 12, food_name: "Batata", calories: 900 }] }],
    substitution_items: [{ food_name: "Inhame" }] }];
    await act(async () => { resolvePlan(saved); });
    expect(await screen.findByRole("heading", { name: "Bia B" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Plano B")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "PDF do plano salvo" }));
    fireEvent.click(screen.getByRole("button", { name: /Lado a lado/ }));
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todas" }));
    fireEvent.click(screen.getByRole("button", { name: "Baixar PDF" }));
    expect(mocks.download).toHaveBeenCalledTimes(1);
    const [filename, bytes] = mocks.download.mock.calls[0] as [string, ArrayBuffer];
    expect(filename).toBe("plano-alimentar-bia-b.pdf");
    const pdf = await PDFDocument.load(new Uint8Array(bytes));
    const page = pdf.getPages()[0];
    expect(page.getWidth()).toBeGreaterThan(page.getHeight());
    const stream = new TextDecoder("latin1").decode(bytes);
    for (const label of ["Bia B", "Plano B", "Clinica Beta", "Arroz", "Batata", "Inhame", "150 kcal"]) expect(stream).toContain(label);
    expect(stream).not.toMatch(/Ana A|Plano A\)|Clinica Alfa|Fillipe|1050 kcal/i);
  });
});

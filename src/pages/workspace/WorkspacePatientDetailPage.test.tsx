import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspacePatientDetailPage from "./WorkspacePatientDetailPage";
import type { WorkspacePatient } from "@/lib/workspacePatients";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fetch: vi.fn(),
  update: vi.fn(),
  fetchMealPlans: vi.fn(),
  mealPlansEnabled: vi.fn(),
  workspaceFrom: vi.fn(),
  workspaceSelect: vi.fn(),
  workspaceEq: vi.fn(),
  workspaceMaybeSingle: vi.fn(),
  fetchAnamnesis: vi.fn(),
  saveAnamnesis: vi.fn(),
  anamnesisEnabled: vi.fn(),
  fetchMeasurements: vi.fn(),
  measurementsEnabled: vi.fn(),
  useConsultation: vi.fn(),
}));

vi.mock("@/contexts/WorkspaceAuthContext", () => ({ useWorkspaceAuth: mocks.auth }));
vi.mock("@/lib/workspacePatients", () => ({
  fetchWorkspacePatient: mocks.fetch,
  updateWorkspacePatient: mocks.update,
}));
vi.mock("@/lib/workspaceMealPlans", () => ({
  fetchWorkspaceMealPlans: mocks.fetchMealPlans,
  isWorkspaceMealPlansEnabled: mocks.mealPlansEnabled,
}));
vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: { from: mocks.workspaceFrom },
}));
vi.mock("@/lib/supabase", () => ({
  fetchMeasurements: vi.fn(), insertMeasurement: vi.fn(), updateMeasurement: vi.fn(),
  deleteMeasurement: vi.fn(), fetchAnamnesis: vi.fn(), upsertAnamnesis: vi.fn(),
}));
vi.mock("@/lib/workspaceAnamnesis", () => ({
  fetchWorkspaceAnamnesis: mocks.fetchAnamnesis,
  upsertWorkspaceAnamnesis: mocks.saveAnamnesis,
  isWorkspaceAnamnesisEnabled: mocks.anamnesisEnabled,
  WORKSPACE_ANAMNESIS_GATE_MESSAGE: "Anamnese bloqueada",
}));
vi.mock("@/lib/workspaceMeasurements", () => ({
  fetchWorkspaceMeasurements: mocks.fetchMeasurements,
  createWorkspaceMeasurement: vi.fn(),
  updateWorkspaceMeasurement: vi.fn(),
  isWorkspaceMeasurementsEnabled: mocks.measurementsEnabled,
  WORKSPACE_MEASUREMENTS_GATE_MESSAGE: "Avaliação bloqueada",
}));
vi.mock("@/contexts/ConsultationContext", () => ({ useConsultation: mocks.useConsultation }));

function patient(overrides: Partial<WorkspacePatient> = {}): WorkspacePatient {
  return {
    id: 41,
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/workspace/patients/41"]}>
      <Link to="/workspace/patients/42">Abrir outro paciente</Link>
      <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
    </MemoryRouter>,
  );
}

function openTab(name: string) {
  fireEvent.click(screen.getByRole("tab", { name }));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

describe("WorkspacePatientDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mealPlansEnabled.mockReturnValue(true);
    mocks.anamnesisEnabled.mockReturnValue(true);
    mocks.measurementsEnabled.mockReturnValue(true);
    mocks.fetchAnamnesis.mockResolvedValue(null);
    mocks.saveAnamnesis.mockResolvedValue({ id: 1, structured_data: {} });
    mocks.fetchMeasurements.mockResolvedValue([]);
    mocks.auth.mockReturnValue({
      authReady: true,
      membershipReady: true,
      isAuthenticated: true,
      authUserId: "auth-user-a",
      userEmail: "owner-a@example.test",
      membership: { workspaceId: "workspace-a", role: "owner" },
    });
    mocks.fetch.mockResolvedValue(patient());
    mocks.fetchMealPlans.mockResolvedValue([]);
    mocks.update.mockImplementation(async (_workspaceId: string, _patientId: number, input: Record<string, string>) => patient({ name: input.name, city: input.city }));
    mocks.workspaceFrom.mockReturnValue({ select: mocks.workspaceSelect });
    mocks.workspaceSelect.mockReturnValue({ eq: mocks.workspaceEq });
    mocks.workspaceEq.mockReturnValue({ maybeSingle: mocks.workspaceMaybeSingle });
    mocks.workspaceMaybeSingle.mockResolvedValue({ data: { name: "Workspace Piloto" }, error: null });
  });

  it("loads a direct ID through the active workspace and exposes its profile tab", async () => {
    renderPage();

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(mocks.fetch).toHaveBeenCalledWith("workspace-a", 41);
    expect(screen.getByRole("tab", { name: "Central" })).toHaveAttribute("aria-selected", "true");
    openTab("Perfil");
    expect(screen.getByLabelText("Nome")).toHaveValue("Ana");
    expect(screen.getByRole("tab", { name: "Perfil" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText(/portal|prescrição/i)).not.toBeInTheDocument();
  });

  it("updates only the active workspace patient through the scoped service", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Ana" });
    openTab("Perfil");
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana editada" } });
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Alagoinhas" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(
      "workspace-a",
      41,
      expect.objectContaining({ name: "Ana editada", city: "Alagoinhas" }),
    ));
  });

  it("ignores a delayed save from workspace A after switching to workspace B", async () => {
    const saveA = deferred<WorkspacePatient>();
    mocks.update.mockReturnValueOnce(saveA.promise);
    const view = renderPage();
    await screen.findByRole("heading", { name: "Ana" });
    openTab("Perfil");
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana salva tarde" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    mocks.fetch.mockResolvedValueOnce(patient({ workspace_id: "workspace-b", name: "Bia" }));
    mocks.auth.mockReturnValue({
      authReady: true,
      membershipReady: true,
      isAuthenticated: true,
      authUserId: "auth-user-b",
      userEmail: "owner-b@example.test",
      membership: { workspaceId: "workspace-b", role: "owner" },
    });
    view.rerender(
      <MemoryRouter initialEntries={["/workspace/patients/41"]}>
        <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Bia" })).toBeInTheDocument();

    await act(async () => { saveA.resolve(patient({ name: "Ana salva tarde" })); });
    expect(screen.getByRole("heading", { name: "Bia" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Bia");
    expect(screen.queryByText("Ana salva tarde")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
  });

  it("clears the previous patient while a changed workspace is loading", async () => {
    let resolveB!: (value: WorkspacePatient) => void;
    mocks.fetch.mockResolvedValueOnce(patient()).mockReturnValueOnce(new Promise<WorkspacePatient>((resolve) => { resolveB = resolve; }));
    const view = renderPage();
    await screen.findByRole("heading", { name: "Ana" });

    mocks.auth.mockReturnValue({
      authReady: true,
      membershipReady: true,
      isAuthenticated: true,
      authUserId: "auth-user-b",
      userEmail: "owner-b@example.test",
      membership: { workspaceId: "workspace-b", role: "owner" },
    });
    view.rerender(
      <MemoryRouter initialEntries={["/workspace/patients/41"]}>
        <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: "Ana" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Avaliação antropométrica" })).not.toBeInTheDocument();
    resolveB(patient({ workspace_id: "workspace-b", name: "Bia" }));
    expect(await screen.findByRole("heading", { name: "Bia" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ana" })).not.toBeInTheDocument();
  });

  it("loads real anamnesis and anthropometry scoped to B after switching workspace with the same patient ID", async () => {
    mocks.fetchAnamnesis
      .mockResolvedValueOnce({ id: 11, structured_data: { clinical_allergies: "A-only allergy" } })
      .mockResolvedValueOnce({ id: 22, structured_data: { clinical_allergies: "B-only allergy" } });
    mocks.fetchMeasurements.mockImplementation(async (workspaceId: string) => workspaceId === "workspace-a"
      ? [{ id: 101, workspace_id: "workspace-a", patient_id: 41, assessment_date: "2026-11-01", weight: 70, height: 170 }]
      : [{ id: 202, workspace_id: "workspace-b", patient_id: 41, assessment_date: "2026-11-02", weight: 82, height: 175 }]);
    const view = renderPage();
    await screen.findByRole("heading", { name: "Ana" });
    openTab("Anamnese");
    expect(await screen.findByPlaceholderText(/^Ex: lactose/)).toHaveValue("A-only allergy");
    openTab("Medidas");
    expect(await screen.findByText("70 kg")).toBeInTheDocument();

    mocks.fetch.mockResolvedValueOnce(patient({ workspace_id: "workspace-b", name: "Bia" }));
    mocks.auth.mockReturnValue({ authReady: true, membershipReady: true, isAuthenticated: true,
      authUserId: "auth-user-b", userEmail: "owner-b@example.test",
      membership: { workspaceId: "workspace-b", role: "owner" } });
    view.rerender(<MemoryRouter initialEntries={["/workspace/patients/41"]}>
      <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
    </MemoryRouter>);

    expect(screen.queryByDisplayValue("A-only allergy")).not.toBeInTheDocument();
    expect(screen.queryByText("70 kg")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Bia" })).toBeInTheDocument();
    openTab("Anamnese");
    expect(await screen.findByPlaceholderText(/^Ex: lactose/)).toHaveValue("B-only allergy");
    openTab("Medidas");
    expect(await screen.findByText("82 kg")).toBeInTheDocument();
    expect(mocks.fetchAnamnesis).toHaveBeenCalledWith("workspace-a", 41);
    expect(mocks.fetchAnamnesis).toHaveBeenCalledWith("workspace-b", 41);
    expect(mocks.fetchMeasurements).toHaveBeenCalledWith("workspace-a", 41);
    expect(mocks.fetchMeasurements).toHaveBeenCalledWith("workspace-b", 41);
  });

  it("rejects an invalid direct ID without querying the data service", async () => {
    render(
      <MemoryRouter initialEntries={["/workspace/patients/not-a-number"]}>
        <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/inválido/i);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("lists only the active patient's workspace plans and links to edit or create", async () => {
    mocks.fetchMealPlans.mockResolvedValueOnce([
      { id: 73, patient_id: 41, workspace_id: "workspace-a", title: "Plano de novembro", start_date: "2026-11-05", meals: [] },
      { id: 72, patient_id: 41, workspace_id: "workspace-a", title: "Plano anterior", created_at: "2026-10-12T10:00:00.000Z", meals: [] },
    ]);
    renderPage();
    await screen.findByRole("heading", { name: "Ana" });
    openTab("Planos");
    expect(await screen.findByRole("link", { name: "Plano de novembro" })).toHaveAttribute("href", "/workspace/patients/41/plan/73");
    expect(screen.getByRole("link", { name: "Plano anterior" })).toHaveAttribute("href", "/workspace/patients/41/plan/72");
    expect(screen.getByRole("link", { name: "Novo plano" })).toHaveAttribute("href", "/workspace/patients/41/plan/novo");
    expect(screen.getByText("05/11/2026")).toBeInTheDocument();
    expect(mocks.fetchMealPlans).toHaveBeenCalledWith("workspace-a", 41);
  });

  it("shows an accessible empty state", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Ana" });
    openTab("Planos");
    expect(await screen.findByText("Nenhum plano alimentar criado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar primeiro plano" })).toHaveAttribute("href", "/workspace/patients/41/plan/novo");
  });

  it("shows an accessible error without retaining previous plans", async () => {
    mocks.fetchMealPlans.mockRejectedValueOnce(new Error("database detail"));
    renderPage();
    await screen.findByRole("heading", { name: "Ana" });
    openTab("Planos");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os planos alimentares");
    expect(screen.queryByText("database detail")).not.toBeInTheDocument();
  });

  it("does not query or render meal plans while the feature gate is disabled", async () => {
    mocks.mealPlansEnabled.mockReturnValue(false);
    renderPage();

    await screen.findByRole("heading", { name: "Ana" });
    openTab("Planos");
    expect(mocks.fetchMealPlans).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Módulo de planos alimentares não está ativo");
    expect(screen.queryByText("Nenhum plano alimentar criado")).not.toBeInTheDocument();
  });

  it("discards stale plan results and hides prior workspace data during a scope change", async () => {
    const plansA = deferred<Array<{ id: number; patient_id: number; workspace_id: string; title: string; meals: [] }>>();
    const plansB = deferred<Array<{ id: number; patient_id: number; workspace_id: string; title: string; meals: [] }>>();
    mocks.fetchMealPlans.mockReturnValueOnce(plansA.promise).mockReturnValueOnce(plansB.promise);
    const view = renderPage();
    await screen.findByRole("heading", { name: "Ana" });
    openTab("Planos");
    await waitFor(() => expect(mocks.fetchMealPlans).toHaveBeenCalledWith("workspace-a", 41));

    mocks.fetch.mockResolvedValueOnce(patient({ workspace_id: "workspace-b", name: "Bia" }));
    mocks.auth.mockReturnValue({
      authReady: true,
      membershipReady: true,
      isAuthenticated: true,
      authUserId: "auth-user-b",
      userEmail: "owner-b@example.test",
      membership: { workspaceId: "workspace-b", role: "owner" },
    });
    view.rerender(
      <MemoryRouter initialEntries={["/workspace/patients/41"]}>
        <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: "Plano A" })).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Bia" })).toBeInTheDocument();
    await waitFor(() => expect(mocks.fetchMealPlans).toHaveBeenCalledWith("workspace-b", 41));

    await act(async () => {
      plansB.resolve([{ id: 84, patient_id: 41, workspace_id: "workspace-b", title: "Plano B", meals: [] }]);
    });
    expect(await screen.findByRole("link", { name: "Plano B" })).toBeInTheDocument();
    await act(async () => {
      plansA.resolve([{ id: 83, patient_id: 41, workspace_id: "workspace-a", title: "Plano A", meals: [] }]);
    });
    expect(screen.getByRole("link", { name: "Plano B" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Plano A" })).not.toBeInTheDocument();
  });

  it("hides the complete chart while a new identity membership is unresolved", async () => {
    const stalePlans = deferred<Array<{ id: number; patient_id: number; workspace_id: string; title: string; meals: [] }>>();
    mocks.fetchMealPlans.mockReturnValueOnce(stalePlans.promise);
    const view = renderPage();
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    openTab("Planos");
    await waitFor(() => expect(mocks.fetchMealPlans).toHaveBeenCalledWith("workspace-a", 41));

    mocks.auth.mockReturnValue({
      authReady: true,
      membershipReady: false,
      isAuthenticated: true,
      authUserId: "auth-user-b",
      userEmail: "owner-b@example.test",
      membership: { workspaceId: "workspace-a", role: "owner" },
    });
    view.rerender(
      <MemoryRouter initialEntries={["/workspace/patients/41"]}>
        <Link to="/workspace/patients/42">Abrir outro paciente</Link>
        <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Validando acesso ao workspace");
    expect(screen.queryByRole("heading", { name: "Ana" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Anamnese" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Avaliação antropométrica" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Novo plano alimentar" })).not.toBeInTheDocument();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);

    mocks.fetch.mockResolvedValueOnce(patient({ workspace_id: "workspace-b", name: "Bia" }));
    mocks.auth.mockReturnValue({
      authReady: true,
      membershipReady: true,
      isAuthenticated: true,
      authUserId: "auth-user-b",
      userEmail: "owner-b@example.test",
      membership: { workspaceId: "workspace-b", role: "owner" },
    });
    mocks.fetchMealPlans.mockResolvedValueOnce([]);
    view.rerender(
      <MemoryRouter initialEntries={["/workspace/patients/41"]}>
        <Link to="/workspace/patients/42">Abrir outro paciente</Link>
        <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Bia" })).toBeInTheDocument();

    await act(async () => {
      stalePlans.resolve([{ id: 83, patient_id: 41, workspace_id: "workspace-a", title: "Plano antigo", meals: [] }]);
    });
    expect(screen.queryByRole("link", { name: "Plano antigo" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bia" })).toBeInTheDocument();
  });

  it("invalidates chart and plan state when only the Supabase user UUID changes", async () => {
    const oldUserPlans = deferred<Array<{ id: number; patient_id: number; workspace_id: string; title: string; meals: [] }>>();
    mocks.fetchMealPlans.mockReturnValueOnce(oldUserPlans.promise).mockResolvedValueOnce([
      { id: 92, patient_id: 41, workspace_id: "workspace-a", title: "Plano do usuário novo", meals: [] },
    ]);
    const view = renderPage();
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    openTab("Planos");
    await waitFor(() => expect(mocks.fetchMealPlans).toHaveBeenCalledWith("workspace-a", 41));

    mocks.auth.mockReturnValue({
      authReady: true,
      membershipReady: false,
      isAuthenticated: true,
      authUserId: "auth-user-b",
      userEmail: "owner-a@example.test",
      membership: { workspaceId: "workspace-a", role: "owner" },
    });
    view.rerender(
      <MemoryRouter initialEntries={["/workspace/patients/41"]}>
        <Link to="/workspace/patients/42">Abrir outro paciente</Link>
        <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Validando acesso ao workspace");
    expect(screen.queryByRole("heading", { name: "Ana" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Anamnese" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Avaliação antropométrica" })).not.toBeInTheDocument();

    mocks.fetch.mockResolvedValueOnce(patient());
    mocks.auth.mockReturnValue({
      authReady: true,
      membershipReady: true,
      isAuthenticated: true,
      authUserId: "auth-user-b",
      userEmail: "owner-a@example.test",
      membership: { workspaceId: "workspace-a", role: "owner" },
    });
    view.rerender(
      <MemoryRouter initialEntries={["/workspace/patients/41"]}>
        <Link to="/workspace/patients/42">Abrir outro paciente</Link>
        <Routes><Route path="/workspace/patients/:id" element={<WorkspacePatientDetailPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Plano do usuário novo" })).toHaveAttribute("href", "/workspace/patients/41/plan/92");

    await act(async () => {
      oldUserPlans.resolve([{ id: 91, patient_id: 41, workspace_id: "workspace-a", title: "Plano do usuário anterior", meals: [] }]);
    });
    expect(screen.queryByRole("link", { name: "Plano do usuário anterior" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plano do usuário novo" })).toBeInTheDocument();
  });

  it("discards delayed patient and plan responses after changing route IDs in one workspace", async () => {
    const plansA = deferred<Array<{ id: number; patient_id: number; workspace_id: string; title: string; meals: [] }>>();
    const plansB = deferred<Array<{ id: number; patient_id: number; workspace_id: string; title: string; meals: [] }>>();
    const patientB = deferred<WorkspacePatient>();
    mocks.fetchMealPlans.mockReturnValueOnce(plansA.promise).mockReturnValueOnce(plansB.promise);
    mocks.fetch.mockResolvedValueOnce(patient()).mockReturnValueOnce(patientB.promise);
    const view = renderPage();
    expect(await screen.findByRole("heading", { name: "Ana" })).toBeInTheDocument();
    openTab("Planos");
    await waitFor(() => expect(mocks.fetchMealPlans).toHaveBeenCalledWith("workspace-a", 41));

    fireEvent.click(screen.getByRole("link", { name: "Abrir outro paciente" }));
    expect(screen.queryByRole("heading", { name: "Ana" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Anamnese" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Avaliação antropométrica" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando prontuário");
    await act(async () => { patientB.resolve(patient({ id: 42, name: "Bia" })); });
    expect(await screen.findByRole("heading", { name: "Bia" })).toBeInTheDocument();
    openTab("Planos");
    await waitFor(() => expect(mocks.fetchMealPlans).toHaveBeenCalledWith("workspace-a", 42));

    await act(async () => {
      plansB.resolve([{ id: 84, patient_id: 42, workspace_id: "workspace-a", title: "Plano de Bia", meals: [] }]);
    });
    expect(await screen.findByRole("link", { name: "Plano de Bia" })).toHaveAttribute("href", "/workspace/patients/42/plan/84");
    await act(async () => {
      plansA.resolve([{ id: 83, patient_id: 41, workspace_id: "workspace-a", title: "Plano de Ana atrasado", meals: [] }]);
    });
    expect(screen.getByRole("heading", { name: "Bia" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Plano de Ana atrasado" })).not.toBeInTheDocument();
  });
});

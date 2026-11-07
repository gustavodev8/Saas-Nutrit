import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspacePatientsPage from "./WorkspacePatientsPage";
import type { WorkspacePatient } from "@/lib/workspacePatients";
import type { WorkspaceMeasurement } from "@/lib/workspaceMeasurements";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fetch: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  fetchMeasurements: vi.fn(),
  createMeasurement: vi.fn(),
  updateMeasurement: vi.fn(),
  measurementsEnabled: vi.fn(),
  legacyFetchMeasurements: vi.fn(),
  legacyInsertMeasurement: vi.fn(),
  legacyUpdateMeasurement: vi.fn(),
  legacyDeleteMeasurement: vi.fn(),
}));

vi.mock("@/contexts/WorkspaceAuthContext", () => ({ useWorkspaceAuth: mocks.auth }));
vi.mock("@/lib/supabase", () => ({
  fetchMeasurements: mocks.legacyFetchMeasurements,
  insertMeasurement: mocks.legacyInsertMeasurement,
  updateMeasurement: mocks.legacyUpdateMeasurement,
  deleteMeasurement: mocks.legacyDeleteMeasurement,
}));
vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Workspace Piloto" }, error: null }) })),
      })),
    })),
  },
}));
vi.mock("@/lib/workspacePatients", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/workspacePatients")>();
  return {
    ...actual,
    fetchWorkspacePatients: mocks.fetch,
    createWorkspacePatient: mocks.create,
    updateWorkspacePatient: mocks.update,
  };
});
vi.mock("@/lib/workspaceMeasurements", () => ({
  fetchWorkspaceMeasurements: mocks.fetchMeasurements,
  createWorkspaceMeasurement: mocks.createMeasurement,
  updateWorkspaceMeasurement: mocks.updateMeasurement,
  isWorkspaceMeasurementsEnabled: mocks.measurementsEnabled,
  WORKSPACE_MEASUREMENTS_GATE_MESSAGE: "Recurso bloqueado: avaliações do workspace só serão liberadas após aprovação e aplicação da migration com RLS validada. Nenhum dado global será consultado.",
}));

function makePatient(overrides: Partial<WorkspacePatient> = {}): WorkspacePatient {
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

function makeMeasurement(overrides: Partial<WorkspaceMeasurement> = {}): WorkspaceMeasurement {
  return {
    id: 10,
    workspace_id: "workspace-a",
    patient_id: 1,
    assessment_date: "2026-11-06",
    weight: 70,
    height: 170,
    body_fat: 20,
    waist: 80,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

function inputForLabel(label: string): HTMLInputElement {
  const input = screen.getByText(label, { exact: true }).parentElement?.querySelector("input");
  if (!(input instanceof HTMLInputElement)) throw new Error(`Input for ${label} not found`);
  return input;
}

describe("WorkspacePatientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("scrollTo", vi.fn());
    mocks.auth.mockReturnValue({
      membership: { workspaceId: "workspace-a", role: "owner" },
      userEmail: "owner@example.test",
      logout: vi.fn(),
    });
    mocks.fetch.mockResolvedValue([makePatient()]);
    mocks.create.mockResolvedValue(makePatient({ id: 2, name: "Bruno" }));
    mocks.update.mockResolvedValue(makePatient({ name: "Ana editada" }));
    mocks.measurementsEnabled.mockReturnValue(true);
    mocks.fetchMeasurements.mockResolvedValue([makeMeasurement()]);
    mocks.createMeasurement.mockResolvedValue(makeMeasurement({ id: 11, assessment_date: "2026-11-07", weight: 72 }));
    mocks.updateMeasurement.mockResolvedValue(makeMeasurement({ id: 10, weight: 71, sf_triceps: 12 }));
  });

  it("creates a patient with the complete supported profile fields", async () => {
    render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Bruno" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "bruno@example.test" } });
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "333" } });
    fireEvent.change(screen.getByLabelText("Nascimento"), { target: { value: "1988-07-04" } });
    fireEvent.change(screen.getByLabelText("Sexo", { selector: "select" }), { target: { value: "M" } });
    fireEvent.change(screen.getByLabelText("Ocupação"), { target: { value: "Engenheiro" } });
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Alagoinhas" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar paciente" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith("workspace-a", {
      name: "Bruno",
      email: "bruno@example.test",
      phone: "333",
      birth_date: "1988-07-04",
      gender: "M",
      occupation: "Engenheiro",
      city: "Alagoinhas",
    }));
  });

  it("edits supported profile fields and never exposes delete", async () => {
    render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Editar Ana" }));
    expect(screen.getByLabelText("Nascimento")).toHaveValue("1990-02-10");
    expect(screen.getByLabelText("Sexo", { selector: "select" })).toHaveValue("F");
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana editada" } });
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Feira de Santana" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("workspace-a", 1, {
      name: "Ana editada",
      email: "ana@example.test",
      phone: "111",
      birth_date: "1990-02-10",
      gender: "F",
      occupation: "Professora",
      city: "Feira de Santana",
    }));
    expect(screen.queryByRole("button", { name: /excluir|deletar/i })).not.toBeInTheDocument();
  });

  it("combines text, gender, and city filters while keeping workspace-only KPIs", async () => {
    mocks.fetch.mockResolvedValue([
      makePatient({ id: 1, name: "Ana", gender: "F", city: "Salvador" }),
      makePatient({ id: 2, name: "Bia", gender: "F", city: "Salvador" }),
      makePatient({ id: 3, name: "Bruno", gender: "M", city: "Alagoinhas", email: null }),
    ]);
    render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.change(screen.getByLabelText("Buscar pacientes"), { target: { value: "Bia" } });
    fireEvent.change(screen.getByLabelText("Filtrar por sexo"), { target: { value: "F" } });
    fireEvent.change(screen.getByLabelText("Filtrar por cidade"), { target: { value: "Salvador" } });

    expect(await screen.findByText("Bia")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.queryByText("Bruno")).not.toBeInTheDocument();
    expect(screen.getByText("Pacientes no workspace").parentElement).toHaveTextContent("3");
    expect(screen.getByText("Com e-mail").parentElement).toHaveTextContent("2");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
  });

  it("sorts by recency and paginates the filtered workspace list", async () => {
    mocks.fetch.mockResolvedValue(Array.from({ length: 12 }, (_, index) => makePatient({
      id: index + 1,
      name: `Paciente ${String(index + 1).padStart(2, "0")}`,
      created_at: `2026-11-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
    })));
    render(<WorkspacePatientsPage />);
    expect(await screen.findByText("Paciente 01")).toBeInTheDocument();
    expect(screen.queryByText("Paciente 11")).not.toBeInTheDocument();
    expect(screen.getByText("12 pacientes · Página 1 de 2")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ordenar pacientes"), { target: { value: "recent" } });
    expect(await screen.findByText("Paciente 12")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(await screen.findByText("Paciente 02")).toBeInTheDocument();
    expect(screen.getByText("12 pacientes · Página 2 de 2")).toBeInTheDocument();
  });

  it("loads patient history and records a workspace-scoped anthropometric assessment", async () => {
    render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Ana" }));

    expect(await screen.findByText("Histórico · 1 avaliação")).toBeInTheDocument();
    expect(mocks.fetchMeasurements).toHaveBeenCalledWith("workspace-a", 1);
    expect(screen.getAllByText("24.2").length).toBeGreaterThan(0);
    expect(inputForLabel("Massa Muscular (kg)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Fracionamento Antropométrico/ }));
    expect(inputForLabel("Diâmetro biestiloide (mm)")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /relatório/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();

    fireEvent.change(inputForLabel("Peso (kg)"), { target: { value: "72" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar Avaliação" }));

    await waitFor(() => expect(mocks.createMeasurement).toHaveBeenCalledWith(
      "workspace-a",
      expect.objectContaining({ id: 1, name: "Ana" }),
      expect.objectContaining({ weight: "72" }),
      expect.any(String),
      null,
    ));
    expect(await screen.findByText(/Histórico.*2 avaliações/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /Abrir relatório da avaliação/ })[0]);
    const weightComparison = screen.getByRole("row", { name: /Peso/ });
    expect(weightComparison).toHaveTextContent("+2.0");
    expect(screen.getByTestId("workspace-measurement-print-header")).toHaveTextContent("Ana");
    expect(screen.getByTestId("workspace-measurement-print-header")).toHaveTextContent("Workspace Piloto");
  });

  it("keeps the anthropometry form closed until workspace isolation is enabled", async () => {
    mocks.measurementsEnabled.mockReturnValue(false);
    render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Ana" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/recurso bloqueado.*migration.*RLS validada/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/nenhum dado global será consultado/i);
    expect(screen.queryByText("Dados Básicos")).not.toBeInTheDocument();
    expect(mocks.fetchMeasurements).not.toHaveBeenCalled();
    expect(mocks.createMeasurement).not.toHaveBeenCalled();
  });

  it("opens a historical measurement in the shared full wizard and updates it in the same workspace", async () => {
    mocks.fetchMeasurements.mockResolvedValue([makeMeasurement({ sf_triceps: 12, arm_contract_l: 31 })]);
    render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Ana" }));
    await screen.findByText(/Histórico/);
    fireEvent.click(await screen.findByRole("button", { name: "Editar avaliação" }));

    const weightInput = inputForLabel("Peso (kg)");
    expect(weightInput).toHaveValue(70);
    expect(inputForLabel("Tríceps")).toHaveValue(12);
    fireEvent.click(screen.getByRole("button", { name: /Circunferências — Membros Superiores/ }));
    expect(inputForLabel("Braço Con. E")).toHaveValue(31);
    fireEvent.change(weightInput, { target: { value: "71" } });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    await waitFor(() => expect(mocks.updateMeasurement).toHaveBeenCalledWith(
      "workspace-a",
      expect.objectContaining({ id: 1, workspace_id: "workspace-a" }),
      10,
      expect.objectContaining({ weight: "71", sf_triceps: "12", arm_contract_l: "31" }),
      expect.any(String),
      expect.anything(),
    ));
  });

  it("preserves the full wizard form when workspace persistence fails", async () => {
    mocks.createMeasurement.mockRejectedValueOnce(new Error("offline"));
    render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Ana" }));
    await screen.findByText(/Histórico/);
    const weightInput = inputForLabel("Peso (kg)");
    fireEvent.change(weightInput, { target: { value: "72" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar Avaliação" }));

    await waitFor(() => expect(mocks.createMeasurement).toHaveBeenCalled());
    expect(weightInput).toHaveValue(72);
  });

  it("hides patient form and history immediately when membership changes workspace", async () => {
    mocks.fetch.mockResolvedValueOnce([makePatient()]).mockReturnValueOnce(new Promise<WorkspacePatient[]>(() => {}));
    const view = render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Ana" }));
    expect(await screen.findByText("Histórico · 1 avaliação")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Editar Ana" }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.test");

    mocks.auth.mockReturnValue({
      membership: { workspaceId: "workspace-b", role: "owner" },
      userEmail: "other-owner@example.test",
      logout: vi.fn(),
    });
    view.rerender(<WorkspacePatientsPage />);

    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.queryByText("Histórico · 1 avaliação")).not.toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveValue("");
    expect(screen.getByRole("heading", { name: "Novo paciente" })).toBeInTheDocument();
    expect(mocks.fetchMeasurements).toHaveBeenCalledTimes(1);
  });

  it("ignores a delayed patient list response from workspace A after switching to B", async () => {
    const delayedA = deferred<WorkspacePatient[]>();
    mocks.fetch.mockResolvedValueOnce([makePatient()]).mockReturnValueOnce(delayedA.promise);
    const view = render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");

    mocks.auth.mockReturnValue({
      membership: { workspaceId: "workspace-a", role: "nutritionist" },
      userEmail: "owner@example.test",
      logout: vi.fn(),
    });
    view.rerender(<WorkspacePatientsPage />);
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2));

    mocks.fetch.mockResolvedValueOnce([makePatient({ id: 2, workspace_id: "workspace-b", name: "Bia" })]);
    mocks.auth.mockReturnValue({
      membership: { workspaceId: "workspace-b", role: "owner" },
      userEmail: "other-owner@example.test",
      logout: vi.fn(),
    });
    view.rerender(<WorkspacePatientsPage />);
    expect(await screen.findByText("Bia")).toBeInTheDocument();

    await act(async () => { delayedA.resolve([makePatient({ id: 9, name: "Ana atrasada" })]); });
    expect(screen.getByText("Bia")).toBeInTheDocument();
    expect(screen.queryByText("Ana atrasada")).not.toBeInTheDocument();
  });

  it("ignores a delayed anthropometry history response from workspace A after switching to B", async () => {
    const delayedHistoryA = deferred<WorkspaceMeasurement[]>();
    const patientB = makePatient({ id: 2, workspace_id: "workspace-b", name: "Bia" });
    mocks.fetch.mockResolvedValueOnce([makePatient()]).mockResolvedValueOnce([patientB]);
    mocks.fetchMeasurements
      .mockReturnValueOnce(delayedHistoryA.promise)
      .mockResolvedValueOnce([makeMeasurement({ id: 20, workspace_id: "workspace-b", patient_id: 2, weight: 60 })]);

    const view = render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Ana" }));
    await waitFor(() => expect(mocks.fetchMeasurements).toHaveBeenCalledWith("workspace-a", 1));

    mocks.auth.mockReturnValue({
      membership: { workspaceId: "workspace-b", role: "owner" },
      userEmail: "other-owner@example.test",
      logout: vi.fn(),
    });
    view.rerender(<WorkspacePatientsPage />);
    await screen.findByText("Bia");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Bia" }));
    expect(await screen.findByText("60 kg")).toBeInTheDocument();

    await act(async () => {
      delayedHistoryA.resolve([makeMeasurement({ id: 11, weight: 99, notes: "resultado antigo A" })]);
    });
    expect(screen.getAllByText("60 kg").length).toBeGreaterThan(0);
    expect(screen.queryByText("99 kg")).not.toBeInTheDocument();
    expect(screen.queryByText("resultado antigo A")).not.toBeInTheDocument();
  });

  it("discards an open workspace report when the membership changes", async () => {
    const patientB = makePatient({ id: 2, workspace_id: "workspace-b", name: "Bia" });
    mocks.fetch.mockResolvedValueOnce([makePatient()]).mockResolvedValueOnce([patientB]);
    mocks.fetchMeasurements
      .mockResolvedValueOnce([makeMeasurement({ notes: "Detalhe privado A" })])
      .mockResolvedValueOnce([makeMeasurement({ id: 20, workspace_id: "workspace-b", patient_id: 2, weight: 60, notes: "Detalhe B" })]);

    const view = render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Ana" }));
    await screen.findByText(/Histórico/);
    fireEvent.click(screen.getByRole("button", { name: /Abrir relatório da avaliação/ }));
    expect(await screen.findByTestId("workspace-measurement-report")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-measurement-print-header")).toHaveTextContent("Ana");
    await waitFor(() => expect(screen.getByTestId("workspace-measurement-print-header")).toHaveTextContent("Workspace Piloto"));
    expect(screen.getAllByText(/Detalhe privado A/).length).toBeGreaterThan(0);

    mocks.auth.mockReturnValue({ membership: { workspaceId: "workspace-b", role: "owner" }, userEmail: "other-owner@example.test", logout: vi.fn() });
    view.rerender(<WorkspacePatientsPage />);
    expect(screen.queryByTestId("workspace-measurement-report")).not.toBeInTheDocument();
    expect(screen.queryByText(/Detalhe privado A/)).not.toBeInTheDocument();

    await screen.findByText("Bia");
    fireEvent.click(screen.getByRole("button", { name: "Abrir prontuário antropométrico de Bia" }));
    await screen.findByText(/Histórico/);
    fireEvent.click(screen.getByRole("button", { name: /Abrir relatório da avaliação/ }));
    expect(await screen.findByTestId("workspace-measurement-report")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-measurement-print-header")).toHaveTextContent("Bia");
    await waitFor(() => expect(screen.getByTestId("workspace-measurement-print-header")).toHaveTextContent("Workspace Piloto"));
    expect(screen.getAllByText(/Detalhe B/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Detalhe privado A/)).not.toBeInTheDocument();
  });
});

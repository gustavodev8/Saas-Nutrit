import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspacePatientsPage from "./WorkspacePatientsPage";
import type { WorkspacePatient } from "@/lib/workspacePatients";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fetch: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  fetchMeasurements: vi.fn(),
  createMeasurement: vi.fn(),
  updateMeasurement: vi.fn(),
  legacyFetchMeasurements: vi.fn(),
}));

vi.mock("@/contexts/WorkspaceAuthContext", () => ({ useWorkspaceAuth: mocks.auth }));
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
}));
vi.mock("@/lib/supabase", () => ({ fetchMeasurements: mocks.legacyFetchMeasurements }));

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function renderPage(path = "/workspace/patients") {
  const view = render(<MemoryRouter initialEntries={[path]}><WorkspacePatientsPage /></MemoryRouter>);
  return {
    ...view,
    rerenderPage: () => view.rerender(<MemoryRouter initialEntries={[path]}><WorkspacePatientsPage /></MemoryRouter>),
  };
}

function setWorkspace(workspaceId: string, role = "owner") {
  mocks.auth.mockReturnValue({ membership: { workspaceId, role } });
}

// Removed here: directory-side anthropometry history, wizard create/update, and report UI.
// Replaced below by scoped navigation, no clinical/global reads, save-failure retention,
// and stale-workspace checks. These do not prove the detail page wizard/report flows.
describe("WorkspacePatientsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setWorkspace("workspace-a");
    mocks.fetch.mockResolvedValue([makePatient()]);
    mocks.create.mockResolvedValue(makePatient({ id: 2, name: "Bruno" }));
    mocks.update.mockResolvedValue(makePatient({ name: "Ana editada" }));
  });

  it("keeps future ages blank, birth dates bounded, and row actions accessible", async () => {
    const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    mocks.fetch.mockResolvedValue([
      makePatient({ name: "Ana", birth_date: dateString(today) }),
      makePatient({ id: 2, name: "Bia", birth_date: dateString(tomorrow) }),
    ]);

    renderPage();

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText(/0 anos/)).toBeInTheDocument();
    expect(screen.queryByText(/-\d+ anos/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir prontuário de Bia" })).toHaveAttribute("href", "/workspace/patients/2");
    expect(screen.getByRole("button", { name: "Editar Bia" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nascimento")).toHaveAttribute("max", dateString(today));
  });

  it("loads patients only for the active workspace", async () => {
    renderPage();

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(mocks.fetch).toHaveBeenCalledWith("workspace-a");
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.legacyFetchMeasurements).not.toHaveBeenCalled();
  });

  it("creates a patient with every supported profile field in the active workspace", async () => {
    renderPage();
    await screen.findByText("Ana");
    fireEvent.change(screen.getByLabelText("Nome *"), { target: { value: "Bruno" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "bruno@example.test" } });
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "333" } });
    fireEvent.change(screen.getByLabelText("Nascimento"), { target: { value: "1988-07-04" } });
    fireEvent.change(screen.getByLabelText("Sexo", { selector: "select" }), { target: { value: "M" } });
    fireEvent.change(screen.getByLabelText("Ocupação"), { target: { value: "Engenheiro" } });
    fireEvent.change(screen.getByLabelText("Cidade", { selector: "input" }), { target: { value: "Alagoinhas" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar paciente" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith("workspace-a", {
      name: "Bruno", email: "bruno@example.test", phone: "333", birth_date: "1988-07-04",
      gender: "M", occupation: "Engenheiro", city: "Alagoinhas",
    }));
    expect(screen.getByLabelText("Nome *")).toHaveValue("");
  });

  it("edits the scoped patient and never exposes delete", async () => {
    renderPage();
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Editar Ana" }));
    expect(screen.getByLabelText("Nascimento")).toHaveValue("1990-02-10");
    expect(screen.getByLabelText("Sexo", { selector: "select" })).toHaveValue("F");
    fireEvent.change(screen.getByLabelText("Nome *"), { target: { value: "Ana editada" } });
    fireEvent.change(screen.getByLabelText("Cidade", { selector: "input" }), { target: { value: "Feira de Santana" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("workspace-a", 1, {
      name: "Ana editada", email: "ana@example.test", phone: "111", birth_date: "1990-02-10",
      gender: "F", occupation: "Professora", city: "Feira de Santana",
    }));
    expect(screen.queryByRole("button", { name: /excluir|deletar/i })).not.toBeInTheDocument();
  });

  it("combines text, sex, and city filters while retaining workspace totals", async () => {
    mocks.fetch.mockResolvedValue([
      makePatient({ id: 1, name: "Ana", gender: "F", city: "Salvador" }),
      makePatient({ id: 2, name: "Bia", gender: "F", city: "Salvador" }),
      makePatient({ id: 3, name: "Bruno", gender: "M", city: "Alagoinhas", email: null }),
    ]);
    renderPage();
    await screen.findByText("Ana");
    fireEvent.change(screen.getByPlaceholderText("Buscar nome, contato, cidade…"), { target: { value: "Bia" } });
    fireEvent.change(screen.getByLabelText("Filtrar por sexo"), { target: { value: "F" } });
    fireEvent.change(screen.getByLabelText("Filtrar por cidade"), { target: { value: "Salvador" } });

    expect(await screen.findByText("Bia")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.queryByText("Bruno")).not.toBeInTheDocument();
    expect(screen.getByText("3 pacientes cadastrados")).toBeInTheDocument();
    expect(screen.getByText("com e-mail").parentElement).toHaveTextContent("2");
    expect(screen.getByText("1 resultado")).toBeInTheDocument();
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
  });

  it("sorts by recency and paginates the filtered directory", async () => {
    mocks.fetch.mockResolvedValue(Array.from({ length: 12 }, (_, index) => makePatient({
      id: index + 1,
      name: `Paciente ${String(index + 1).padStart(2, "0")}`,
      created_at: `2026-11-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
    })));
    renderPage();
    expect(await screen.findByText("Paciente 01")).toBeInTheDocument();
    expect(screen.queryByText("Paciente 11")).not.toBeInTheDocument();
    expect(screen.getByText("12 pacientes · Pág. 1/2")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ordenar pacientes"), { target: { value: "recent" } });
    expect(await screen.findByText("Paciente 12")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(await screen.findByText("Paciente 02")).toBeInTheDocument();
    expect(screen.getByText("12 pacientes · Pág. 2/2")).toBeInTheDocument();
  });

  it("routes to the scoped prontuário instead of loading history or creating an assessment in the directory", async () => {
    renderPage();
    await screen.findByText("Ana");

    expect(screen.getByRole("link", { name: "Abrir prontuário de Ana" })).toHaveAttribute("href", "/workspace/patients/1");
    expect(screen.queryByText(/Histórico.*avaliaç/)).not.toBeInTheDocument();
    expect(mocks.fetchMeasurements).not.toHaveBeenCalled();
    expect(mocks.createMeasurement).not.toHaveBeenCalled();
    expect(mocks.legacyFetchMeasurements).not.toHaveBeenCalled();
  });

  it("does not bypass the anthropometry gate from the patient directory", async () => {
    renderPage();
    await screen.findByText("Ana");

    expect(screen.queryByRole("button", { name: /Salvar Avaliação|Editar avaliação/ })).not.toBeInTheDocument();
    expect(mocks.fetchMeasurements).not.toHaveBeenCalled();
    expect(mocks.createMeasurement).not.toHaveBeenCalled();
    expect(mocks.updateMeasurement).not.toHaveBeenCalled();
  });

  it("keeps historical assessment editing and reports out of the directory", async () => {
    renderPage();
    await screen.findByText("Ana");

    expect(screen.getByRole("link", { name: "Abrir prontuário de Ana" })).toHaveAttribute("href", "/workspace/patients/1");
    expect(screen.queryByRole("button", { name: /Atualizar avaliação|Abrir relatório/ })).not.toBeInTheDocument();
    expect(mocks.updateMeasurement).not.toHaveBeenCalled();
    expect(mocks.legacyFetchMeasurements).not.toHaveBeenCalled();
  });

  it("preserves the patient form when scoped persistence fails", async () => {
    mocks.create.mockRejectedValueOnce(new Error("offline"));
    renderPage();
    await screen.findByText("Ana");
    fireEvent.change(screen.getByLabelText("Nome *"), { target: { value: "Bruno" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar paciente" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith("workspace-a", expect.objectContaining({ name: "Bruno" })));
    expect(screen.getByLabelText("Nome *")).toHaveValue("Bruno");
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("offline");
    expect(mocks.createMeasurement).not.toHaveBeenCalled();
  });

  it("hides the previous workspace list and edit form immediately on membership change", async () => {
    mocks.fetch.mockResolvedValueOnce([makePatient()]).mockReturnValueOnce(new Promise<WorkspacePatient[]>(() => {}));
    const view = renderPage();
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Editar Ana" }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.test");

    setWorkspace("workspace-b");
    view.rerenderPage();

    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveValue("");
    expect(screen.getByRole("heading", { name: "Novo paciente" })).toBeInTheDocument();
    expect(mocks.fetchMeasurements).not.toHaveBeenCalled();
  });

  it("ignores a delayed patient list response from workspace A after switching to B", async () => {
    const delayedA = deferred<WorkspacePatient[]>();
    mocks.fetch.mockResolvedValueOnce([makePatient()]).mockReturnValueOnce(delayedA.promise);
    const view = renderPage();
    await screen.findByText("Ana");

    setWorkspace("workspace-a", "nutritionist");
    view.rerenderPage();
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2));

    mocks.fetch.mockResolvedValueOnce([makePatient({ id: 2, workspace_id: "workspace-b", name: "Bia" })]);
    setWorkspace("workspace-b");
    view.rerenderPage();
    expect(await screen.findByText("Bia")).toBeInTheDocument();

    await act(async () => { delayedA.resolve([makePatient({ id: 9, name: "Ana atrasada" })]); });
    expect(screen.getByText("Bia")).toBeInTheDocument();
    expect(screen.queryByText("Ana atrasada")).not.toBeInTheDocument();
  });

  it("ignores a delayed workspace A failure after B has loaded", async () => {
    const delayedA = deferred<WorkspacePatient[]>();
    mocks.fetch.mockResolvedValueOnce([makePatient()]).mockReturnValueOnce(delayedA.promise);
    const view = renderPage();
    await screen.findByText("Ana");

    setWorkspace("workspace-a", "nutritionist");
    view.rerenderPage();
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2));
    mocks.fetch.mockResolvedValueOnce([makePatient({ id: 2, workspace_id: "workspace-b", name: "Bia" })]);
    setWorkspace("workspace-b");
    view.rerenderPage();
    expect(await screen.findByText("Bia")).toBeInTheDocument();

    await act(async () => { delayedA.reject(new Error("Erro privado A")); });
    expect(screen.getByText("Bia")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("discards previous workspace patient links when selecting a template", async () => {
    mocks.fetch.mockResolvedValueOnce([makePatient()]).mockResolvedValueOnce([
      makePatient({ id: 2, workspace_id: "workspace-b", name: "Bia" }),
    ]);
    const view = renderPage("/workspace/patients?selectFor=template&templateId=7");
    await screen.findByText("Ana");
    expect(screen.getByRole("link", { name: /Usar modelo/ })).toHaveAttribute("href", "/workspace/patients/1?tab=planos&templateId=7");

    setWorkspace("workspace-b");
    view.rerenderPage();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(await screen.findByText("Bia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Usar modelo/ })).toHaveAttribute("href", "/workspace/patients/2?tab=planos&templateId=7");
    expect(mocks.fetchMeasurements).not.toHaveBeenCalled();
  });
});

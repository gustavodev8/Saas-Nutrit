import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PatientAnthropometryTab } from "./PatientAnthropometryTab";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  workspaceFetch: vi.fn(),
  workspaceCreate: vi.fn(),
  workspaceUpdate: vi.fn(),
  workspaceEnabled: vi.fn(),
  useConsultation: vi.fn(),
}));

vi.mock("@/contexts/ConsultationContext", () => ({ useConsultation: mocks.useConsultation }));
vi.mock("@/lib/supabase", () => ({
  fetchMeasurements: mocks.fetch,
  insertMeasurement: mocks.insert,
  updateMeasurement: mocks.update,
  deleteMeasurement: mocks.remove,
}));
vi.mock("@/lib/workspaceMeasurements", () => ({
  fetchWorkspaceMeasurements: mocks.workspaceFetch,
  createWorkspaceMeasurement: mocks.workspaceCreate,
  updateWorkspaceMeasurement: mocks.workspaceUpdate,
  isWorkspaceMeasurementsEnabled: mocks.workspaceEnabled,
  WORKSPACE_MEASUREMENTS_GATE_MESSAGE: "Recurso bloqueado: migration e RLS ainda não foram validadas.",
}));

const legacyMeasurement = {
  id: 8,
  patient_id: 41,
  assessment_date: "2026-11-06",
  weight: 70,
  height: 170,
  body_fat: 20,
};

describe("PatientAnthropometryTab legacy defaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useConsultation.mockReturnValue({ setMeasurement: vi.fn() });
    mocks.workspaceEnabled.mockReturnValue(false);
    mocks.fetch.mockResolvedValue([legacyMeasurement]);
    mocks.remove.mockResolvedValue(true);
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("keeps the legacy report routes and delete action without workspace props", async () => {
    const { container } = render(
      <MemoryRouter>
        <PatientAnthropometryTab
          patientId="41"
          patient={{ id: 41, name: "Ana", gender: "F", birth_date: "1990-02-10" }}
        />
      </MemoryRouter>,
    );

    await screen.findByText(/Histórico/);
    const reportLinks = Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href"));
    expect(reportLinks).toContain("/admin/pacientes/41/relatorio-antropometrico");
    expect(reportLinks).toContain("/admin/pacientes/41/relatorio-antropometrico?measurement=8");
    fireEvent.click(screen.getByRole("button", { name: "Excluir avaliação" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(8));
    expect(mocks.workspaceFetch).not.toHaveBeenCalled();
    expect(mocks.workspaceCreate).not.toHaveBeenCalled();
    expect(mocks.workspaceUpdate).not.toHaveBeenCalled();
  });

  it("mounts the workspace adapter without ConsultationProvider", async () => {
    mocks.useConsultation.mockImplementation(() => {
      throw new Error("useConsultation must not run for workspace mode");
    });

    render(
      <PatientAnthropometryTab
        patientId="41"
        patient={{ id: 41, name: "Ana", gender: "F" }}
        workspaceId="workspace-a"
        workspaceName="Consultório Piloto"
        workspacePatient={{
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
        }}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/recurso bloqueado/i);
    expect(mocks.useConsultation).not.toHaveBeenCalled();
  });

  it("opens a selected workspace report, compares the loaded previous assessment, and returns to history", async () => {
    mocks.workspaceEnabled.mockReturnValue(true);
    mocks.workspaceFetch.mockResolvedValue([
      { ...legacyMeasurement, workspace_id: "workspace-a", patient_id: 41, id: 8, waist: 80 },
      { ...legacyMeasurement, workspace_id: "workspace-a", patient_id: 41, id: 7, assessment_date: "2026-10-06", weight: 74, waist: 84 },
    ]);
    render(
      <PatientAnthropometryTab
        patientId="41"
        patient={{ id: 41, name: "Ana", gender: "F" }}
        workspaceId="workspace-a"
        workspaceName="Consultório Piloto"
        workspacePatient={{
          id: 41, workspace_id: "workspace-a", name: "Ana", email: null, phone: null,
          birth_date: null, gender: "F", occupation: null, city: null, created_at: null,
        }}
      />,
    );

    await screen.findByText("Histórico · 2 avaliações");
    fireEvent.click(screen.getAllByRole("button", { name: /Abrir relatório da avaliação/ })[0]);
    expect(await screen.findByTestId("workspace-measurement-report")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comparação histórica das avaliações selecionadas" })).toBeInTheDocument();
    expect(screen.getByTestId("workspace-measurement-print-header")).toHaveTextContent("Ana");
    expect(screen.getByTestId("workspace-measurement-print-header")).toHaveTextContent("Consultório Piloto");
    const detailView = screen.getByTestId("patient-measurement-detail-view");
    expect(detailView).not.toHaveClass("min-h-screen");
    expect(detailView.querySelector(".sticky")).toHaveClass("print:hidden");
    const weightComparison = screen.getByRole("row", { name: /Peso/ });
    expect(weightComparison).toHaveTextContent("74.0 kg");
    expect(weightComparison).toHaveTextContent("70.0 kg");
    expect(weightComparison).toHaveTextContent("−4.0");
    expect(mocks.workspaceFetch).toHaveBeenCalledExactlyOnceWith("workspace-a", 41);
    expect(mocks.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao Prontuario" }));
    expect(await screen.findByText("Histórico · 2 avaliações")).toBeInTheDocument();
  });
});

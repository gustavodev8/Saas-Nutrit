import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceReportsTab } from "./WorkspaceReportsTab";
import type { WorkspacePatient } from "@/lib/workspacePatients";
import type { WorkspacePatientReport } from "@/lib/workspaceReports";

const mocks = vi.hoisted(() => ({
  fetchReports: vi.fn(),
}));

vi.mock("@/lib/workspaceReports", () => ({
  fetchWorkspaceReports: mocks.fetchReports,
  createWorkspaceReport: vi.fn(),
  updateWorkspaceReport: vi.fn(),
  duplicateWorkspaceReport: vi.fn(),
  deleteWorkspaceReport: vi.fn(),
  workspaceReportsErrorMessage: (err: unknown) => (err instanceof Error ? err.message : "erro"),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

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
  archived_at: null,
};

const savedReport: WorkspacePatientReport = {
  id: 9,
  workspace_id: "workspace-a",
  patient_id: 41,
  title: "Evolução de teste",
  report_date: "2026-11-01",
  report_text: "Paciente com boa adesão.",
};

describe("WorkspaceReportsTab", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the empty state scoped by workspace and patient", async () => {
    mocks.fetchReports.mockResolvedValue([]);
    render(<WorkspaceReportsTab workspaceId="workspace-a" patient={patient} />);

    expect(await screen.findByText("Nenhum relatório salvo")).toBeInTheDocument();
    expect(screen.getByText("Relatório clínico")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar relatório/ })).toBeInTheDocument();
    expect(mocks.fetchReports).toHaveBeenCalledWith("workspace-a", 41);
  });

  it("loads saved reports into the editor and history", async () => {
    mocks.fetchReports.mockResolvedValue([savedReport]);
    render(<WorkspaceReportsTab workspaceId="workspace-a" patient={patient} professionalName="Clínica X" />);

    await waitFor(() =>
      expect(screen.getByLabelText("Título do relatório")).toHaveValue("Evolução de teste"),
    );
    expect(screen.getByLabelText("Texto do relatório")).toHaveValue("Paciente com boa adesão.");
    expect(screen.getByText("Relatórios clínicos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Excluir/ })).toBeEnabled();
  });
});

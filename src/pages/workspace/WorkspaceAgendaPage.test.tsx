import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceAgendaPage from "./WorkspaceAgendaPage";

const mocks = vi.hoisted(() => ({ fetchRecentConsultations: vi.fn() }));

vi.mock("@/contexts/WorkspaceAuthContext", () => ({
  useWorkspaceAuth: () => ({ membership: { workspaceId: "workspace-a" } }),
}));
vi.mock("@/lib/workspaceConsultations", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/workspaceConsultations")>();
  return { ...original, fetchRecentConsultations: mocks.fetchRecentConsultations };
});

function renderPage() {
  return render(<MemoryRouter><WorkspaceAgendaPage /></MemoryRouter>);
}

describe("WorkspaceAgendaPage empty states", () => {
  beforeEach(() => vi.clearAllMocks());

  it("directs an empty workspace to patients", async () => {
    mocks.fetchRecentConsultations.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole("heading", { name: "Nenhuma consulta registrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para pacientes" })).toHaveAttribute("href", "/workspace/patients");
    expect(mocks.fetchRecentConsultations).toHaveBeenCalledWith("workspace-a", 100);
  });

  it("distinguishes an empty filter and restores all consultations", async () => {
    mocks.fetchRecentConsultations.mockResolvedValue([{
      id: 1, patient_id: 7, patient_name: "Ana Silva", consulted_at: "2026-11-20",
      type: "retorno", status: "realizada", duration_min: 45, notes: null,
    }]);
    renderPage();
    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Agendada (0)" }));
    expect(screen.getByRole("button", { name: "Agendada (0)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { name: "Nenhuma consulta neste filtro" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ir para pacientes" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver todas as consultas" }));
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
  });
});

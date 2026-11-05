import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspacePatientsPage from "./WorkspacePatientsPage";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fetch: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/contexts/WorkspaceAuthContext", () => ({ useWorkspaceAuth: mocks.auth }));
vi.mock("@/lib/workspacePatients", () => ({
  fetchWorkspacePatients: mocks.fetch,
  createWorkspacePatient: mocks.create,
  updateWorkspacePatient: mocks.update,
}));

describe("WorkspacePatientsPage", () => {
  beforeEach(() => {
    mocks.auth.mockReturnValue({
      membership: { workspaceId: "workspace-a", role: "owner" },
      userEmail: "owner@example.test",
      logout: vi.fn(),
    });
    mocks.fetch.mockResolvedValue([{ id: 1, workspace_id: "workspace-a", name: "Ana", email: "ana@example.test", phone: "111" }]);
    mocks.create.mockResolvedValue({ id: 2, workspace_id: "workspace-a", name: "Bruno", email: null, phone: null });
    mocks.update.mockResolvedValue({ id: 1, workspace_id: "workspace-a", name: "Ana editada", email: "ana@example.test", phone: "222" });
  });

  it("lists patients and creates one using only the pilot fields", async () => {
    render(<WorkspacePatientsPage />);
    expect(await screen.findByText("Ana")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Bruno" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "bruno@example.test" } });
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "333" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar paciente" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith("workspace-a", { name: "Bruno", email: "bruno@example.test", phone: "333" }));
  });

  it("edits name, email, and phone without exposing delete", async () => {
    render(<WorkspacePatientsPage />);
    await screen.findByText("Ana");
    fireEvent.click(screen.getByRole("button", { name: "Editar Ana" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana editada" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("workspace-a", 1, { name: "Ana editada", email: "ana@example.test", phone: "111" }));
    expect(screen.queryByRole("button", { name: /excluir|deletar/i })).not.toBeInTheDocument();
  });
});

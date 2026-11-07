import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspacePatientsPage from "./WorkspacePatientsPage";
import type { WorkspacePatient } from "@/lib/workspacePatients";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fetch: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/contexts/WorkspaceAuthContext", () => ({ useWorkspaceAuth: mocks.auth }));
vi.mock("@/lib/workspaceSupabase", () => ({ workspaceSupabase: {} }));
vi.mock("@/lib/workspacePatients", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/workspacePatients")>();
  return {
    ...actual,
    fetchWorkspacePatients: mocks.fetch,
    createWorkspacePatient: mocks.create,
    updateWorkspacePatient: mocks.update,
  };
});

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

describe("WorkspacePatientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockReturnValue({
      membership: { workspaceId: "workspace-a", role: "owner" },
      userEmail: "owner@example.test",
      logout: vi.fn(),
    });
    mocks.fetch.mockResolvedValue([makePatient()]);
    mocks.create.mockResolvedValue(makePatient({ id: 2, name: "Bruno" }));
    mocks.update.mockResolvedValue(makePatient({ name: "Ana editada" }));
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
});

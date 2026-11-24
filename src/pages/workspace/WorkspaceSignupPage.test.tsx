import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceSignupPage from "./WorkspaceSignupPage";

const mocks = vi.hoisted(() => ({ signUp: vi.fn() }));

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: { auth: { signUp: mocks.signUp } },
}));

function renderPage() {
  render(<MemoryRouter><WorkspaceSignupPage /></MemoryRouter>);
}

function fillForm(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText("Nome da clínica ou consultório"), { target: { value: "Clínica Teste" } });
  fireEvent.change(screen.getByLabelText("E-mail profissional"), { target: { value: "Pro@Example.test" } });
  fireEvent.change(screen.getByLabelText("Senha", { exact: true }), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: confirmation } });
  fireEvent.click(screen.getByRole("button", { name: "Criar conta grátis" }));
}

describe("WorkspaceSignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it("keeps mismatched passwords local and does not call signup", () => {
    renderPage();
    expect(screen.getByText("30 dias grátis · R$79,90/mês")).toBeInTheDocument();
    expect(screen.getByText("Crie seu workspace. O período gratuito começa após a confirmação do e-mail.")).toBeInTheDocument();
    fillForm("password-123", "different-123");

    expect(screen.getByRole("alert")).toHaveTextContent("As senhas não conferem.");
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("preserves signup metadata and redirect before showing verification", async () => {
    mocks.signUp.mockResolvedValue({ error: null });
    renderPage();
    fillForm("password-123", "password-123");

    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith({
      email: "pro@example.test",
      password: "password-123",
      options: {
        data: { workspace_name: "Clínica Teste" },
        emailRedirectTo: `${window.location.origin}/workspace`,
      },
    }));
    expect(await screen.findByRole("heading", { name: "Verifique seu e-mail" })).toBeInTheDocument();
    expect(screen.getByText(/pro@example.test/i)).toBeInTheDocument();
  });
});

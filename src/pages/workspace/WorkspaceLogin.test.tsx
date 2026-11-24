import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceLogin from "./WorkspaceLogin";
import WorkspaceForgotPasswordPage from "./WorkspaceForgotPasswordPage";

const mocks = vi.hoisted(() => ({ login: vi.fn(), resetPasswordForEmail: vi.fn() }));

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: { auth: { resetPasswordForEmail: mocks.resetPasswordForEmail } },
}));

vi.mock("@/contexts/WorkspaceAuthContext", () => ({
  useWorkspaceAuth: () => ({
    login: mocks.login,
    isAuthenticated: false,
    authReady: false,
  }),
}));

describe("WorkspaceLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests professional recovery using only the existing shared callback and returns to login", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <Routes>
          <Route path="/workspace/login" element={<WorkspaceLogin />} />
          <Route path="/workspace/forgot-password" element={<WorkspaceForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Esqueci minha senha" }));
    fireEvent.change(screen.getByLabelText("E-mail profissional"), { target: { value: "Pro@Example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link de recuperação" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Se houver uma conta");
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledExactlyOnceWith("pro@example.test", {
      redirectTo: `${window.location.origin}/platform/reset-password`,
    });
    fireEvent.click(screen.getByRole("link", { name: "Voltar ao login profissional" }));
    expect(screen.getByRole("button", { name: "Entrar no workspace" })).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("uses the same generic response for provider errors and allows a retry", async () => {
    mocks.resetPasswordForEmail.mockRejectedValueOnce(new Error("internal details")).mockResolvedValueOnce({ error: new Error("account-specific details") });
    render(<MemoryRouter><WorkspaceForgotPasswordPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("E-mail profissional"), { target: { value: "pro@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link de recuperação" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Se houver uma conta");
    expect(screen.queryByText(/internal details/)).not.toBeInTheDocument();
    expect(screen.queryByText(/account-specific details/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Solicitar outro link" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar link de recuperação" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Se houver uma conta");
  });

  it("does not link to the pilot root, which redirects back to login", () => {
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <WorkspaceLogin />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Voltar ao site" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar meu workspace" })).toHaveAttribute("href", "/workspace/signup");
  });

  it("guides a platform administrator to invitations when workspace membership is missing", async () => {
    mocks.login.mockResolvedValue({
      ok: false,
      message: "Este usuario nao possui uma membership workspace valida.",
    });
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <Routes>
          <Route path="/workspace/login" element={<WorkspaceLogin />} />
          <Route path="/platform/invitations" element={<p>Convites da plataforma</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "master@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "test-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar no workspace" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O login profissional é para nutricionistas convidados e exige uma membership ativa.",
    );
    const platformLink = screen.getByRole("link", { name: "Abrir convites da plataforma" });
    expect(platformLink).toHaveAttribute("href", "/platform/invitations");
    fireEvent.click(platformLink);
    expect(await screen.findByText("Convites da plataforma")).toBeInTheDocument();
  });
});

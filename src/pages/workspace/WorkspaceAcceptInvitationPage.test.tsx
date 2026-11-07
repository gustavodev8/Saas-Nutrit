import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceAcceptInvitationPage from "./WorkspaceAcceptInvitationPage";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  invokeSignup: vi.fn(),
  signInWithPassword: vi.fn(),
  validateInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  refreshMembership: vi.fn(),
}));

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: mocks.signInWithPassword,
    },
    functions: { invoke: mocks.invokeSignup },
    rpc: (functionName: string, args: Record<string, unknown>) => {
      if (functionName === "validate_workspace_invitation_before_signup") {
        return mocks.validateInvitation(args);
      }
      return mocks.acceptInvitation(functionName, args);
    },
  },
}));
vi.mock("@/contexts/WorkspaceAuthContext", () => ({
  useWorkspaceAuth: () => ({ refreshMembership: mocks.refreshMembership }),
}));

function Destination() {
  const location = useLocation();
  return <p>Destino: {location.pathname}</p>;
}

function renderPage(path: string) {
  window.history.replaceState({}, "", path);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workspace/accept" element={<WorkspaceAcceptInvitationPage />} />
        <Route path="/workspace/patients" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

const confirmedSession = {
  user: { id: "user-1", email: "invitee@example.test", email_confirmed_at: "2026-11-04T10:00:00Z" },
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
};

describe("WorkspaceAcceptInvitationPage", () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mocks.invokeSignup.mockResolvedValue({ data: { ok: true }, error: null });
    mocks.signInWithPassword.mockResolvedValue({ data: { session: confirmedSession }, error: null });
    mocks.validateInvitation.mockResolvedValue({ data: true, error: null });
    mocks.acceptInvitation.mockResolvedValue({ data: "workspace-1", error: null });
    mocks.refreshMembership.mockResolvedValue(true);
  });

  it("does not expose signup or call Auth without an invitation token", () => {
    renderPage("/workspace/accept");
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível validar este convite");
    expect(screen.queryByRole("button", { name: "Criar conta e aceitar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Voltar ao site" })).not.toBeInTheDocument();
    expect(mocks.invokeSignup).not.toHaveBeenCalled();
  });

  it("creates the account server-side, signs in, and accepts the pending invitation", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderPage("/workspace/accept?token=" + "a".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    await screen.findByText("Destino: /workspace/patients");
    expect(mocks.invokeSignup).toHaveBeenCalledWith("workspace-invitation-signup", {
      body: { token: "a".repeat(64), email: "invitee@example.test", password: "strong-password" },
    });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "invitee@example.test", password: "strong-password" });
    expect(mocks.validateInvitation).toHaveBeenCalledWith({ p_token: "a".repeat(64), p_email: "invitee@example.test" });
    expect(window.location.search).toBe("");
    expect(replaceState).toHaveBeenCalledWith(expect.anything(), "", "/workspace/accept");
    expect(mocks.acceptInvitation).toHaveBeenCalledWith("accept_workspace_invitation", { p_token: "a".repeat(64) });
    expect(mocks.refreshMembership).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBeNull();
  });

  it("removes the session token when signup returns a definitive invalid-invitation result", async () => {
    mocks.invokeSignup.mockResolvedValue({ data: { ok: false, code: "invitation_invalid" }, error: null });
    const token = "5".repeat(64);
    renderPage(`/workspace/accept?token=${token}`);
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBe(token);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível validar este convite");
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBeNull();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("switches to login after invitation acceptance when membership refresh fails", async () => {
    mocks.refreshMembership.mockResolvedValue(false);
    renderPage("/workspace/accept?token=" + "1".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Convite aceito, mas seu acesso não carregou");
    expect(status).toHaveTextContent("Atualize a página ou entre novamente com esta conta");
    expect(status).toHaveTextContent("Não crie outra conta");
    expect(screen.getByRole("button", { name: "Entrar e aceitar convite" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar conta e aceitar" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toHaveValue("");
    expect(mocks.acceptInvitation).toHaveBeenCalledWith("accept_workspace_invitation", { p_token: "1".repeat(64) });
  });

  it("does not create an account when the server rejects the token/email pair", async () => {
    mocks.invokeSignup.mockResolvedValue({ data: { ok: false, code: "invitation_invalid" }, error: null });
    renderPage("/workspace/accept?token=" + "e".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "other@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível validar este convite");
    expect(mocks.invokeSignup).toHaveBeenCalledWith("workspace-invitation-signup", {
      body: { token: "e".repeat(64), email: "other@example.test", password: "strong-password" },
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBeNull();
  });

  it("fails closed and preserves the invitation when the signup endpoint errors", async () => {
    mocks.invokeSignup.mockResolvedValue({ data: null, error: { message: "signup unavailable" } });
    renderPage("/workspace/accept?token=" + "f".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível criar a conta agora");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBe("f".repeat(64));
  });

  it("switches to login for an existing account without changing its password", async () => {
    mocks.invokeSignup.mockResolvedValue({ data: { ok: false, code: "account_exists" }, error: null });
    renderPage("/workspace/accept?token=" + "7".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "existing-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Já existe uma conta para este e-mail");
    expect(screen.getByRole("button", { name: "Entrar e aceitar convite" })).toBeInTheDocument();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBe("7".repeat(64));
  });

  it("keeps acceptance recoverable when account creation succeeds but immediate sign-in fails", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: { message: "temporary auth failure" } });
    renderPage("/workspace/accept?token=" + "6".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("A conta foi criada, mas não foi possível entrar automaticamente");
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBe("6".repeat(64));
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar e aceitar convite" }));

    await screen.findByText("Destino: /workspace/patients");
    expect(mocks.signInWithPassword).toHaveBeenCalledTimes(2);
    expect(mocks.acceptInvitation).toHaveBeenCalledWith("accept_workspace_invitation", { p_token: "6".repeat(64) });
  });

  it("explains a revoked invitation after account creation and accepts a resent invite with the same account", async () => {
    const originalToken = "2".repeat(64);
    const resentToken = "3".repeat(64);
    mocks.acceptInvitation
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: "workspace-1", error: null });
    const firstRender = renderPage(`/workspace/accept?token=${originalToken}`);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    const recovery = await screen.findByRole("status");
    expect(recovery).toHaveTextContent("Sua conta foi criada, mas o acesso ao workspace não foi concluído");
    expect(recovery).toHaveTextContent("Não crie outra conta");
    expect(recovery).toHaveTextContent("reenviar o convite para este mesmo e-mail");
    expect(recovery).toHaveTextContent("não pode ser recuperado");
    expect(screen.getByRole("button", { name: "Entrar e aceitar convite" })).toBeInTheDocument();
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBeNull();
    expect(mocks.invokeSignup).toHaveBeenCalledTimes(1);

    firstRender.unmount();
    mocks.getSession.mockResolvedValue({ data: { session: confirmedSession }, error: null });
    renderPage(`/workspace/accept?token=${resentToken}`);

    await screen.findByText("Destino: /workspace/patients");
    expect(mocks.acceptInvitation).toHaveBeenNthCalledWith(2, "accept_workspace_invitation", { p_token: resentToken });
    expect(mocks.invokeSignup).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBeNull();
  });

  it("keeps a post-creation invite token on transient acceptance RPC errors and directs recovery", async () => {
    const token = "4".repeat(64);
    mocks.acceptInvitation.mockResolvedValue({ data: null, error: { message: "temporary RPC error" } });
    renderPage(`/workspace/accept?token=${token}`);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    const recovery = await screen.findByRole("status");
    expect(recovery).toHaveTextContent("Sua conta foi criada, mas não foi possível concluir o acesso ao workspace");
    expect(recovery).toHaveTextContent("Não crie outra conta");
    expect(recovery).toHaveTextContent("peça ao administrador para reenviá-lo");
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBe(token);
    expect(mocks.invokeSignup).toHaveBeenCalledTimes(1);
  });

  it("accepts an existing account after login", async () => {
    renderPage("/workspace/accept?token=" + "b".repeat(64));
    fireEvent.click(screen.getByRole("button", { name: "Já tem uma conta? Entrar" }));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar e aceitar convite" }));

    await screen.findByText("Destino: /workspace/patients");
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "invitee@example.test", password: "strong-password" });
    expect(mocks.validateInvitation).toHaveBeenCalledWith({ p_token: "b".repeat(64), p_email: "invitee@example.test" });
    expect(mocks.acceptInvitation).toHaveBeenCalledWith("accept_workspace_invitation", { p_token: "b".repeat(64) });
    expect(mocks.refreshMembership).toHaveBeenCalledTimes(1);
  });

  it("restores the invitation from session storage on the clean confirmation return URL", async () => {
    window.sessionStorage.setItem("workspace-invitation-token", "d".repeat(64));
    mocks.getSession.mockResolvedValue({ data: { session: confirmedSession }, error: null });
    renderPage("/workspace/accept");

    await screen.findByText("Destino: /workspace/patients");
    expect(window.location.search).toBe("");
    expect(mocks.acceptInvitation).toHaveBeenCalledWith("accept_workspace_invitation", { p_token: "d".repeat(64) });
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBeNull();
  });

  it("does not consume an invitation when the current session does not match it", async () => {
    const otherSession = {
      ...confirmedSession,
      user: { ...confirmedSession.user, id: "other-user", email: "different@example.test" },
    };
    const token = "9".repeat(64);
    mocks.getSession.mockResolvedValue({ data: { session: otherSession }, error: null });
    mocks.validateInvitation.mockResolvedValue({ data: false, error: null });
    renderPage(`/workspace/accept?token=${token}`);

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("associar esta sessão a um convite válido ou pendente");
    expect(status).toHaveTextContent("Confira se está usando o e-mail do convite ou solicite um novo convite");
    expect(status).toHaveTextContent("o link foi mantido");
    expect(mocks.validateInvitation).toHaveBeenCalledWith({ p_token: token, p_email: "different@example.test" });
    expect(mocks.acceptInvitation).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBe(token);
  });

  it("keeps the invitation when server validation for an existing session fails", async () => {
    const token = "8".repeat(64);
    mocks.getSession.mockResolvedValue({ data: { session: confirmedSession }, error: null });
    mocks.validateInvitation.mockResolvedValue({ data: null, error: { message: "validation unavailable" } });
    renderPage(`/workspace/accept?token=${token}`);

    expect(await screen.findByRole("status")).toHaveTextContent("Não foi possível verificar o convite agora");
    expect(mocks.acceptInvitation).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBe(token);
  });

  it("shows a neutral failure when the invitation is expired or rejected", async () => {
    mocks.acceptInvitation.mockResolvedValue({ data: null, error: null });
    renderPage("/workspace/accept?token=" + "c".repeat(64));
    fireEvent.click(screen.getByRole("button", { name: "Já tem uma conta? Entrar" }));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar e aceitar convite" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível validar este convite");
    expect(screen.queryByText("Destino: /workspace/patients")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBeNull();
  });
});

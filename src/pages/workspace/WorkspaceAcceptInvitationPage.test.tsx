import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceAcceptInvitationPage from "./WorkspaceAcceptInvitationPage";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signUp: vi.fn(),
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
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
    },
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
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocks.signInWithPassword.mockResolvedValue({ data: { session: confirmedSession }, error: null });
    mocks.validateInvitation.mockResolvedValue({ data: true, error: null });
    mocks.acceptInvitation.mockResolvedValue({ data: "workspace-1", error: null });
    mocks.refreshMembership.mockResolvedValue(true);
  });

  it("does not expose signup or call Auth without an invitation token", () => {
    renderPage("/workspace/accept");
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível validar este convite");
    expect(screen.queryByRole("button", { name: "Criar conta e aceitar" })).not.toBeInTheDocument();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("removes the token from browser history, keeps it in session storage, and accepts after confirmation", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderPage("/workspace/accept?token=" + "a".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledTimes(1));
    expect(mocks.validateInvitation).toHaveBeenCalledWith({ p_token: "a".repeat(64), p_email: "invitee@example.test" });
    expect(mocks.validateInvitation.mock.invocationCallOrder[0]).toBeLessThan(mocks.signUp.mock.invocationCallOrder[0]);
    expect(window.location.search).toBe("");
    expect(replaceState).toHaveBeenCalledWith(expect.anything(), "", "/workspace/accept");
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBe("a".repeat(64));
    const signUpOptions = mocks.signUp.mock.calls[0][0].options;
    const redirect = new URL(signUpOptions.emailRedirectTo);
    expect(redirect.pathname).toBe("/workspace/accept");
    expect(redirect.searchParams.get("token")).toBe("a".repeat(64));
    expect(signUpOptions.data).toEqual({ workspace_invitation_token: "a".repeat(64) });
    expect(await screen.findByRole("status")).toHaveTextContent("Enviamos um link para confirmar seu e-mail");
    expect(mocks.acceptInvitation).not.toHaveBeenCalled();

    const authCallback = mocks.onAuthStateChange.mock.calls[0][0] as (_event: string, session: typeof confirmedSession) => void;
    authCallback("SIGNED_IN", confirmedSession);
    await screen.findByText("Destino: /workspace/patients");
    expect(mocks.acceptInvitation).toHaveBeenCalledWith("accept_workspace_invitation", { p_token: "a".repeat(64) });
    expect(mocks.refreshMembership).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem("workspace-invitation-token")).toBeNull();
  });

  it("does not create an account when the server rejects the token/email pair", async () => {
    mocks.validateInvitation.mockResolvedValue({ data: false, error: null });
    renderPage("/workspace/accept?token=" + "e".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "other@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível validar este convite");
    expect(mocks.validateInvitation).toHaveBeenCalledWith({ p_token: "e".repeat(64), p_email: "other@example.test" });
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("fails closed and does not create an account when server validation errors", async () => {
    mocks.validateInvitation.mockResolvedValue({ data: null, error: { message: "validation unavailable" } });
    renderPage("/workspace/accept?token=" + "f".repeat(64));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta e aceitar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível validar este convite");
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("accepts an existing account after login", async () => {
    renderPage("/workspace/accept?token=" + "b".repeat(64));
    fireEvent.click(screen.getByRole("button", { name: "Já tem uma conta? Entrar" }));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar e aceitar convite" }));

    await screen.findByText("Destino: /workspace/patients");
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "invitee@example.test", password: "strong-password" });
    expect(mocks.validateInvitation).not.toHaveBeenCalled();
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

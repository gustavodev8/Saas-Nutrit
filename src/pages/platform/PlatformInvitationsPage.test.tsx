import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlatformInvitationsPage from "./PlatformInvitationsPage";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signOut: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: mocks.signInWithPassword,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signOut: mocks.signOut,
    },
    functions: { invoke: mocks.invoke },
  },
}));

const session = { access_token: "access-token", user: { email: "platform@example.test" } };
const approvedRequest = {
  id: "00000000-0000-4000-8000-000000000511",
  applicant_name: "Ana Nutricionista",
  professional_email: "invitee@example.test",
  phone: null,
  crn: null,
  need_category: "meal_planning",
  status: "approved",
  created_at: "2026-11-05T10:00:00Z",
  reviewed_at: "2026-11-05T11:00:00Z",
};

const mockApprovedQueue = () => {
  mocks.invoke.mockImplementation(async (functionName: string, options: { body: { action?: string } }) => {
    if (functionName === "workspace-access-request-admin" && options.body.action === "list") {
      return { data: { ok: true, requests: [approvedRequest] }, error: null };
    }
    return { data: { ok: true }, error: null };
  });
};

describe("PlatformInvitationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mocks.signInWithPassword.mockResolvedValue({ data: { session }, error: null });
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mockApprovedQueue();
  });

  it("authenticates and loads the invitation queue", async () => {
    render(<PlatformInvitationsPage accessRequestsEnabled />);
    fireEvent.change(await screen.findByLabelText("E-mail"), { target: { value: "admin@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await screen.findByText("Ana Nutricionista");
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "admin@example.test", password: "password123" });
    fireEvent.click(screen.getByRole("button", { name: "Preparar convite" }));
    expect(await screen.findByLabelText("E-mail do profissional")).toHaveValue("invitee@example.test");
    expect(screen.getByLabelText("Nome do workspace")).toHaveValue("Ana Nutricionista");
  });

  it("requests password recovery with the pilot reset route", async () => {
    render(<PlatformInvitationsPage />);
    fireEvent.change(await screen.findByLabelText("E-mail"), { target: { value: " Admin@Example.Test " } });
    fireEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));

    await waitFor(() => expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "admin@example.test",
      { redirectTo: `${window.location.origin}/platform/reset-password` },
    ));
    expect(await screen.findByRole("status")).toHaveTextContent("Se o e-mail estiver associado a uma conta");
  });

  it("validates the recovery email without calling Supabase", async () => {
    render(<PlatformInvitationsPage />);
    await screen.findByLabelText("E-mail");
    fireEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe um e-mail válido");
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("sends an invitation for an approved request with normalized fields", async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    render(<PlatformInvitationsPage accessRequestsEnabled />);

    await screen.findByText("Ana Nutricionista");
    fireEvent.click(screen.getByRole("button", { name: "Preparar convite" }));
    fireEvent.change(await screen.findByLabelText("E-mail do profissional"), { target: { value: "  Invitee@Example.Test " } });
    fireEvent.change(screen.getByLabelText("Nome do workspace"), { target: { value: "  Consultório Novo  " } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("workspace-invitation", {
      body: { email: "invitee@example.test", workspaceName: "Consultório Novo" },
    }));
    expect(await screen.findByRole("status")).toHaveTextContent("Convite enviado");
  });

  it("uses a safe fallback when the server error has no recognized code", async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.invoke.mockImplementation(async (functionName: string, options: { body: { action?: string } }) => {
      if (functionName === "workspace-access-request-admin") {
        return { data: { ok: true, requests: [approvedRequest] }, error: null };
      }
      return options.body.action ? { data: { ok: true }, error: null } : { data: null, error: new Error("forbidden") };
    });
    render(<PlatformInvitationsPage accessRequestsEnabled />);

    await screen.findByText("Ana Nutricionista");
    fireEvent.click(screen.getByRole("button", { name: "Preparar convite" }));
    fireEvent.change(await screen.findByLabelText("E-mail do profissional"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Nome do workspace"), { target: { value: "Workspace" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível confirmar o status do convite");
    expect(alert).not.toHaveTextContent("forbidden");
  });

  it("explains email delivery failure without exposing recipient, workspace, token, or upstream details", async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    const upstreamBody = {
      ok: false,
      code: "email_delivery_failed",
      recipient: "kaguei3.com@gmail.com",
      workspace: "3333",
      token: "raw-invitation-token",
      secret: "resend-private-detail",
    };
    const error = Object.assign(new Error("raw Resend failure details"), {
      context: new Response(JSON.stringify(upstreamBody), { status: 400 }),
    });
    mocks.invoke.mockResolvedValue({ data: null, error });
    render(<PlatformInvitationsPage />);

    fireEvent.change(await screen.findByLabelText("E-mail do profissional"), { target: { value: "kaguei3.com@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Nome do workspace"), { target: { value: "3333" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("O convite foi registrado, mas o e-mail não foi enviado");
    expect(alert).toHaveTextContent("verifique o convite pendente");
    for (const privateValue of ["kaguei3.com@gmail.com", "3333", "raw-invitation-token", "resend-private-detail", "raw Resend failure details"]) {
      expect(alert).not.toHaveTextContent(privateValue);
    }
  });

  it("uses neutral pending-status guidance when Resend outcome is ambiguous", async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.invoke.mockImplementation(async (functionName: string, options: { body: { action?: string } }) => {
      if (functionName === "workspace-access-request-admin") {
        return { data: { ok: true, requests: [] }, error: null };
      }
      if (options.body.action) return { data: { ok: true }, error: null };
      return { data: { ok: false, code: "invitation_status_unknown" }, error: null };
    });
    render(<PlatformInvitationsPage />);

    fireEvent.change(await screen.findByLabelText("E-mail do profissional"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Nome do workspace"), { target: { value: "Workspace" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível confirmar o status do convite");
    expect(alert).toHaveTextContent("Verifique se há um convite pendente");
    expect(alert).not.toHaveTextContent("o e-mail não foi enviado");
  });

  it("keeps manual invitations available without loading the request queue when intake is disabled", async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    render(<PlatformInvitationsPage />);

    fireEvent.change(await screen.findByLabelText("E-mail do profissional"), { target: { value: "manual@example.test" } });
    fireEvent.change(screen.getByLabelText("Nome do workspace"), { target: { value: "Consultório Manual" } });
    expect(mocks.invoke).not.toHaveBeenCalledWith("workspace-access-request-admin", expect.anything());

    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("workspace-invitation", {
      body: { email: "manual@example.test", workspaceName: "Consultório Manual" },
    }));
  });
});

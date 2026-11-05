import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlatformInvitationsPage from "./PlatformInvitationsPage";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
    functions: { invoke: mocks.invoke },
  },
}));

const session = { access_token: "access-token", user: { email: "platform@example.test" } };

describe("PlatformInvitationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mocks.signInWithPassword.mockResolvedValue({ data: { session }, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it("authenticates then invokes the platform invitation function with normalized fields", async () => {
    render(<PlatformInvitationsPage />);
    fireEvent.change(await screen.findByLabelText("E-mail"), { target: { value: "admin@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    fireEvent.change(await screen.findByLabelText("E-mail do profissional"), { target: { value: "  Invitee@Example.Test " } });
    fireEvent.change(screen.getByLabelText("Nome do workspace"), { target: { value: "  Consultório Novo  " } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith("workspace-invitation", {
      body: { email: "invitee@example.test", workspaceName: "Consultório Novo" },
    }));
    expect(await screen.findByRole("status")).toHaveTextContent("Convite enviado");
  });

  it("shows a generic error when the server rejects or cannot send an invitation", async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.invoke.mockResolvedValue({ data: null, error: new Error("forbidden") });
    render(<PlatformInvitationsPage />);

    fireEvent.change(await screen.findByLabelText("E-mail do profissional"), { target: { value: "invitee@example.test" } });
    fireEvent.change(screen.getByLabelText("Nome do workspace"), { target: { value: "Workspace" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar o convite");
  });
});

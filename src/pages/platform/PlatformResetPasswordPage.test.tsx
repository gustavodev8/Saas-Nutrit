import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlatformResetPasswordPage from "./PlatformResetPasswordPage";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  authListener: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      updateUser: mocks.updateUser,
      signOut: mocks.signOut,
    },
  },
}));

const recoverySession = { access_token: "recovery-access-token", user: { id: "admin-user-id", email: "admin@example.test" } };

describe("PlatformResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/platform/reset-password");
    mocks.getSession.mockResolvedValue({ data: { session: recoverySession }, error: null });
    mocks.onAuthStateChange.mockImplementation((callback) => {
      mocks.authListener.mockImplementation(callback);
      return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
    });
    mocks.updateUser.mockResolvedValue({ data: { user: recoverySession.user }, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("does not authorize a regular session from a recovery hash alone", async () => {
    window.history.replaceState(null, "", "/platform/reset-password#type=recovery");
    render(<MemoryRouter><PlatformResetPasswordPage /></MemoryRouter>);

    expect(await screen.findByRole("alert")).toHaveTextContent("inválido, expirou ou já foi utilizado");
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao login" })).toHaveAttribute("href", "/platform/invitations");
    expect(window.sessionStorage.getItem("platform-password-recovery")).toBeNull();
  });

  it.each([
    ["another user", "other-user-id", Date.now() + 60_000],
    ["expired", "admin-user-id", Date.now() - 1],
  ])("rejects a %s recovery marker", async (_description, userId, expiresAt) => {
    window.sessionStorage.setItem("platform-password-recovery", JSON.stringify({ userId, expiresAt }));
    render(<MemoryRouter><PlatformResetPasswordPage /></MemoryRouter>);

    expect(await screen.findByRole("alert")).toHaveTextContent("inválido, expirou ou já foi utilizado");
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("platform-password-recovery")).toBeNull();
  });

  it("allows a valid unexpired recovery marker for the current user", async () => {
    window.sessionStorage.setItem("platform-password-recovery", JSON.stringify({
      userId: "admin-user-id",
      expiresAt: Date.now() + 60_000,
    }));
    render(<MemoryRouter><PlatformResetPasswordPage /></MemoryRouter>);

    expect(await screen.findByLabelText("Nova senha")).toBeInTheDocument();
  });

  it("validates confirmation and updates the password after a recovery event", async () => {
    render(<MemoryRouter><PlatformResetPasswordPage /></MemoryRouter>);
    await screen.findByRole("status");
    act(() => mocks.authListener("PASSWORD_RECOVERY", recoverySession));

    fireEvent.change(await screen.findByLabelText("Nova senha"), { target: { value: "new-password-123" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "different-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar senha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("As senhas não conferem");
    expect(mocks.updateUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), { target: { value: "new-password-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar senha" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Senha atualizada");
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "new-password-123" });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(screen.getByRole("link", { name: "Voltar ao login" })).toHaveAttribute("href", "/platform/invitations");
    expect(window.sessionStorage.getItem("platform-password-recovery")).toBeNull();
  });

  it("allows the recovery event for the current mount when session storage is unavailable", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    const { unmount } = render(<MemoryRouter><PlatformResetPasswordPage /></MemoryRouter>);
    await screen.findByRole("status");
    act(() => mocks.authListener("PASSWORD_RECOVERY", recoverySession));
    expect(await screen.findByLabelText("Nova senha")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("platform-password-recovery")).toBeNull();

    unmount();
    setItem.mockRestore();
    window.sessionStorage.clear();
    mocks.authListener.mockReset();
    render(<MemoryRouter><PlatformResetPasswordPage /></MemoryRouter>);
    expect(await screen.findByRole("alert")).toHaveTextContent("inválido, expirou ou já foi utilizado");
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
  });
});

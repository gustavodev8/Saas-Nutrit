import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { WorkspaceAuthProvider, useWorkspaceAuth } from "./WorkspaceAuthContext";

const mocks = vi.hoisted(() => ({
  adminSignOut: vi.fn(),
  workspaceSignOut: vi.fn(),
  workspaceSignIn: vi.fn(),
  workspaceGetSession: vi.fn(),
  workspaceAuthListener: vi.fn(),
  workspaceAuthCallback: vi.fn(),
  workspaceMembersSelect: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: mocks.adminSignOut,
    },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })) })) })),
  },
}));

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: {
    auth: {
      getSession: mocks.workspaceGetSession,
      onAuthStateChange: mocks.workspaceAuthListener,
      signInWithPassword: mocks.workspaceSignIn,
      signOut: mocks.workspaceSignOut,
    },
    from: vi.fn(() => ({ select: mocks.workspaceMembersSelect })),
  },
}));

function AuthProbe() {
  const admin = useAuth();
  const workspace = useWorkspaceAuth();
  return (
    <div>
      <button type="button" onClick={() => void workspace.login("pilot@example.test", "password")} data-admin-ready={admin.authReady}>
        {workspace.authReady ? "ready" : "loading"}
      </button>
      <button type="button" onClick={() => void workspace.refreshMembership()}>
        Refresh: {workspace.membership?.workspaceId ?? "none"}
      </button>
    </div>
  );
}

describe("workspace and legacy admin auth coexistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.workspaceGetSession.mockResolvedValue({ data: { session: null } });
    mocks.workspaceMembersSelect.mockResolvedValue({ data: [], error: null });
    mocks.workspaceAuthListener.mockImplementation((callback) => {
      mocks.workspaceAuthCallback.mockImplementation(callback);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    mocks.workspaceSignIn.mockResolvedValue({ error: null, data: { session: { user: { email: "pilot@example.test" } } } });
    mocks.workspaceSignOut.mockResolvedValue({ error: null });
  });

  it("rejects an unassigned workspace session without signing out the legacy admin client", async () => {
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider>
          <WorkspaceAuthProvider>
            <AuthProbe />
          </WorkspaceAuthProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "ready" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "ready" }));

    await waitFor(() => expect(mocks.workspaceSignOut).toHaveBeenCalledTimes(1));
    expect(mocks.adminSignOut).not.toHaveBeenCalled();
  });

  it("keeps an unassigned session alive on the invitation route and refreshes membership after acceptance", async () => {
    const session = { user: { id: "invitee-id", email: "pilot@example.test" } };
    render(
      <MemoryRouter initialEntries={["/workspace/accept"]}>
        <AuthProvider><WorkspaceAuthProvider><AuthProbe /></WorkspaceAuthProvider></AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "ready" })).toBeInTheDocument());

    mocks.workspaceGetSession.mockResolvedValue({ data: { session } });
    mocks.workspaceAuthCallback("SIGNED_IN", session);
    await waitFor(() => expect(mocks.workspaceSignOut).not.toHaveBeenCalled());

    mocks.workspaceMembersSelect.mockResolvedValue({ data: [{ workspace_id: "workspace-1", role: "owner", status: "active" }], error: null });
    fireEvent.click(screen.getByRole("button", { name: "Refresh: none" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Refresh: workspace-1" })).toBeInTheDocument());
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });
});

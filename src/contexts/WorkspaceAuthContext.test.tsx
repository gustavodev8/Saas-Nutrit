import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
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
  const [loginCompleted, setLoginCompleted] = useState(false);
  return (
    <div>
      <button type="button" onClick={async () => { await workspace.login("pilot@example.test", "password"); setLoginCompleted(true); }} data-admin-ready={admin.authReady}>
        {workspace.authReady ? "ready" : "loading"}
      </button>
      {loginCompleted && <p>login-complete</p>}
      <p>workspace-authenticated:{String(workspace.isAuthenticated)}</p>
      <p>{workspace.membershipReady ? "membership-ready" : "membership-loading"}</p>
      <button type="button" onClick={() => void workspace.refreshMembership()}>
        Refresh: {workspace.membership?.workspaceId ?? "none"}
      </button>
    </div>
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
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

  it("preserves an unassigned platform session on workspace login without authenticating it clinically", async () => {
    mocks.workspaceGetSession.mockResolvedValue({ data: { session: { user: { id: "platform-admin", email: "pilot@example.test" } } } });
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider>
          <WorkspaceAuthProvider>
            <AuthProbe />
          </WorkspaceAuthProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "ready" }));
    await screen.findByText("login-complete");
    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh: none" })).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
    expect(mocks.adminSignOut).not.toHaveBeenCalled();
  });

  it("continues signing out when workspace membership lookup errors on login", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider>
          <WorkspaceAuthProvider>
            <AuthProbe />
          </WorkspaceAuthProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    mocks.workspaceMembersSelect.mockRejectedValueOnce(new Error("membership lookup unavailable"));
    fireEvent.click(await screen.findByRole("button", { name: "ready" }));
    await screen.findByText("login-complete");

    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).toHaveBeenCalledTimes(1);
  });

  it("keeps an unassigned session alive on the invitation route and refreshes membership after acceptance", async () => {
    const session = { user: { id: "invitee-id", email: "pilot@example.test" } };
    render(
      <MemoryRouter initialEntries={["/workspace/accept"]}>
        <AuthProvider><WorkspaceAuthProvider><AuthProbe /></WorkspaceAuthProvider></AuthProvider>
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: "ready" });
    await screen.findByText("membership-ready");

    mocks.workspaceGetSession.mockResolvedValue({ data: { session } });
    const unassignedLookup = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    mocks.workspaceMembersSelect.mockReturnValueOnce(unassignedLookup.promise);
    mocks.workspaceAuthCallback("SIGNED_IN", session);
    await screen.findByText("membership-loading");
    unassignedLookup.resolve({ data: [], error: null });
    await screen.findByText("membership-ready");
    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();

    mocks.workspaceMembersSelect.mockResolvedValueOnce({ data: [{ workspace_id: "workspace-1", role: "owner", status: "active" }], error: null });
    fireEvent.click(screen.getByRole("button", { name: "Refresh: none" }));
    await screen.findByRole("button", { name: "Refresh: workspace-1" });
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });
});

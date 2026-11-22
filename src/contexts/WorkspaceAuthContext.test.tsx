import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { WorkspaceAuthProvider, useWorkspaceAuth } from "./WorkspaceAuthContext";
import WorkspaceProtectedRoute from "@/components/workspace/WorkspaceProtectedRoute";

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
      <button type="button" onClick={async () => { await workspace.login("login-a@example.test", "password"); setLoginCompleted(true); }}>
        Start login A
      </button>
      {loginCompleted && <p>login-complete</p>}
      <p>workspace-authenticated:{String(workspace.isAuthenticated)}</p>
      <p>workspace-user-id:{workspace.authUserId ?? "none"}</p>
      <p>workspace-user-email:{workspace.userEmail ?? "none"}</p>
      <p>{workspace.membershipReady ? "membership-ready" : "membership-loading"}</p>
      <button type="button" onClick={() => void workspace.refreshMembership()}>
        Refresh: {workspace.membership?.workspaceId ?? "none"}
      </button>
      <button type="button" onClick={() => void workspace.logout()}>Logout</button>
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
    mocks.workspaceSignIn.mockResolvedValue({ error: null, data: { session: { user: { id: "pilot-user-id", email: "pilot@example.test" } } } });
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

    await screen.findByRole("button", { name: "ready" });
    expect(screen.getByText("workspace-user-id:platform-admin")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ready" }));
    await screen.findByText("login-complete");
    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-id:pilot-user-id")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh: none" })).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
    expect(mocks.adminSignOut).not.toHaveBeenCalled();
  });

  it("keeps an authenticated identity when membership lookup errors during login", async () => {
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
    expect(screen.getByText("workspace-user-id:pilot-user-id")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:pilot@example.test")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
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
    expect(screen.getByText("workspace-user-id:invitee-id")).toBeInTheDocument();
    unassignedLookup.resolve({ data: [], error: null });
    await screen.findByText("membership-ready");
    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();

    mocks.workspaceMembersSelect.mockResolvedValueOnce({ data: [{ workspace_id: "workspace-1", role: "owner", status: "active" }], error: null });
    fireEvent.click(screen.getByRole("button", { name: "Refresh: none" }));
    await screen.findByRole("button", { name: "Refresh: workspace-1" });
    expect(screen.getByText("workspace-user-id:invitee-id")).toBeInTheDocument();
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });

  it("tracks the Supabase user UUID across initial sync, auth changes, refresh, login, and logout", async () => {
    const firstSession = { user: { id: "auth-user-one", email: "same@example.test" } };
    mocks.workspaceGetSession.mockResolvedValue({ data: { session: firstSession } });
    mocks.workspaceMembersSelect.mockResolvedValue({ data: [{ workspace_id: "workspace-1", role: "owner", status: "active" }], error: null });
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider><WorkspaceAuthProvider><AuthProbe /></WorkspaceAuthProvider></AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("workspace-user-id:auth-user-one")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Refresh: workspace-1" })).toBeInTheDocument();

    const secondSession = { user: { id: "auth-user-two", email: "same@example.test" } };
    mocks.workspaceGetSession.mockResolvedValue({ data: { session: secondSession } });
    const nextMembership = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    mocks.workspaceMembersSelect.mockReturnValueOnce(nextMembership.promise);
    mocks.workspaceAuthCallback("SIGNED_IN", secondSession);

    expect(await screen.findByText("workspace-user-id:auth-user-two")).toBeInTheDocument();
    expect(await screen.findByText("membership-loading")).toBeInTheDocument();
    nextMembership.resolve({ data: [{ workspace_id: "workspace-1", role: "owner", status: "active" }], error: null });
    await screen.findByText("membership-ready");
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await screen.findByText("workspace-user-id:none");
    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).toHaveBeenCalledTimes(1);
  });

  it("does not let an older membership resolution overwrite the newer session", async () => {
    const initialSession = { user: { id: "session-initial", email: "initial@example.test" } };
    mocks.workspaceGetSession.mockResolvedValue({ data: { session: initialSession } });
    mocks.workspaceMembersSelect.mockResolvedValue({ data: [{ workspace_id: "workspace-initial", role: "owner", status: "active" }], error: null });
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider><WorkspaceAuthProvider><AuthProbe /></WorkspaceAuthProvider></AuthProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("button", { name: "Refresh: workspace-initial" })).toBeInTheDocument();

    const olderSession = { user: { id: "session-older", email: "older@example.test" } };
    const olderMembership = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    mocks.workspaceGetSession.mockResolvedValueOnce({ data: { session: olderSession } });
    mocks.workspaceMembersSelect.mockReturnValueOnce(olderMembership.promise);
    await act(async () => { mocks.workspaceAuthCallback("SIGNED_IN", olderSession); });
    await waitFor(() => expect(mocks.workspaceMembersSelect).toHaveBeenCalledTimes(2));
    expect(screen.getByText("workspace-user-id:session-older")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:older@example.test")).toBeInTheDocument();

    const newerSession = { user: { id: "session-newer", email: "newer@example.test" } };
    const newerMembership = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    mocks.workspaceGetSession.mockResolvedValueOnce({ data: { session: newerSession } });
    mocks.workspaceMembersSelect.mockReturnValueOnce(newerMembership.promise);
    await act(async () => { mocks.workspaceAuthCallback("SIGNED_IN", newerSession); });
    await waitFor(() => expect(mocks.workspaceMembersSelect).toHaveBeenCalledTimes(3));
    expect(screen.getByText("workspace-user-id:session-newer")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:newer@example.test")).toBeInTheDocument();

    await act(async () => {
      newerMembership.resolve({ data: [{ workspace_id: "workspace-newer", role: "owner", status: "active" }], error: null });
    });
    expect(await screen.findByRole("button", { name: "Refresh: workspace-newer" })).toBeInTheDocument();
    expect(screen.getByText("workspace-user-id:session-newer")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:newer@example.test")).toBeInTheDocument();
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();

    await act(async () => {
      olderMembership.resolve({ data: [{ workspace_id: "workspace-older", role: "owner", status: "active" }], error: null });
    });
    expect(screen.getByRole("button", { name: "Refresh: workspace-newer" })).toBeInTheDocument();
    expect(screen.getByText("workspace-user-id:session-newer")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:newer@example.test")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh: workspace-older" })).not.toBeInTheDocument();
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });

  it("lets a distinct account session supersede a login with a pending membership lookup", async () => {
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider><WorkspaceAuthProvider><AuthProbe /></WorkspaceAuthProvider></AuthProvider>
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: "ready" });
    await screen.findByText("membership-ready");

    const loginA = { user: { id: "login-a-id", email: "login-a@example.test" } };
    const signInA = deferred<{ data: { session: typeof loginA }; error: null }>();
    const membershipA = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    mocks.workspaceSignIn.mockReturnValueOnce(signInA.promise);
    mocks.workspaceMembersSelect.mockReturnValueOnce(membershipA.promise);
    fireEvent.click(screen.getByRole("button", { name: "Start login A" }));
    await act(async () => { signInA.resolve({ data: { session: loginA }, error: null }); });
    await waitFor(() => expect(mocks.workspaceMembersSelect).toHaveBeenCalledTimes(1));
    expect(screen.getByText("workspace-user-id:login-a-id")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:login-a@example.test")).toBeInTheDocument();

    await act(async () => { mocks.workspaceAuthCallback("SIGNED_IN", loginA); });
    expect(mocks.workspaceGetSession).toHaveBeenCalledTimes(1);
    expect(mocks.workspaceMembersSelect).toHaveBeenCalledTimes(1);

    const sessionB = { user: { id: "session-b-id", email: "session-b@example.test" } };
    const membershipB = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    mocks.workspaceGetSession.mockResolvedValueOnce({ data: { session: sessionB } });
    mocks.workspaceMembersSelect.mockReturnValueOnce(membershipB.promise);
    await act(async () => { mocks.workspaceAuthCallback("SIGNED_IN", sessionB); });
    await waitFor(() => expect(mocks.workspaceMembersSelect).toHaveBeenCalledTimes(2));
    expect(screen.getByText("workspace-user-id:session-b-id")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:session-b@example.test")).toBeInTheDocument();

    await act(async () => {
      membershipB.resolve({ data: [{ workspace_id: "workspace-b", role: "owner", status: "active" }], error: null });
    });
    expect(await screen.findByRole("button", { name: "Refresh: workspace-b" })).toBeInTheDocument();
    expect(screen.getByText("workspace-user-id:session-b-id")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:session-b@example.test")).toBeInTheDocument();

    await act(async () => {
      membershipA.resolve({ data: [{ workspace_id: "workspace-a", role: "owner", status: "active" }], error: null });
    });
    await screen.findByText("login-complete");
    expect(screen.getByRole("button", { name: "Refresh: workspace-b" })).toBeInTheDocument();
    expect(screen.getByText("workspace-user-id:session-b-id")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:session-b@example.test")).toBeInTheDocument();
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh: workspace-a" })).not.toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });

  it("reconciles a queued same-email sign-in after the pending login reveals its UUID", async () => {
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider><WorkspaceAuthProvider><AuthProbe /></WorkspaceAuthProvider></AuthProvider>
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: "ready" });
    await screen.findByText("membership-ready");

    const sessionA = { user: { id: "same-email-user-a", email: "shared@example.test" } };
    const sessionB = { user: { id: "same-email-user-b", email: "shared@example.test" } };
    const signInA = deferred<{ data: { session: typeof sessionA }; error: null }>();
    const membershipB = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    mocks.workspaceSignIn.mockReturnValueOnce(signInA.promise);
    mocks.workspaceGetSession.mockResolvedValueOnce({ data: { session: sessionB } });
    mocks.workspaceMembersSelect.mockReturnValueOnce(membershipB.promise);
    fireEvent.click(screen.getByRole("button", { name: "Start login A" }));

    await act(async () => { mocks.workspaceAuthCallback("SIGNED_IN", sessionB); });
    expect(mocks.workspaceGetSession).toHaveBeenCalledTimes(1);
    expect(mocks.workspaceMembersSelect).not.toHaveBeenCalled();

    await act(async () => { signInA.resolve({ data: { session: sessionA }, error: null }); });
    await waitFor(() => expect(mocks.workspaceMembersSelect).toHaveBeenCalledTimes(1));
    expect(mocks.workspaceGetSession).toHaveBeenCalledTimes(2);
    expect(screen.getByText("workspace-user-id:same-email-user-b")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:shared@example.test")).toBeInTheDocument();

    await act(async () => {
      membershipB.resolve({ data: [{ workspace_id: "workspace-b", role: "owner", status: "active" }], error: null });
    });
    expect(await screen.findByRole("button", { name: "Refresh: workspace-b" })).toBeInTheDocument();
    expect(screen.getByText("workspace-user-id:same-email-user-b")).toBeInTheDocument();
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });

  it("blocks the login UUID when queued identity conflicts but getSession still returns that login", async () => {
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider><WorkspaceAuthProvider><AuthProbe /></WorkspaceAuthProvider></AuthProvider>
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: "ready" });
    await screen.findByText("membership-ready");

    const sessionA = { user: { id: "blocked-user-a", email: "shared@example.test" } };
    const sessionB = { user: { id: "queued-user-b", email: "shared@example.test" } };
    const signInA = deferred<{ data: { session: typeof sessionA }; error: null }>();
    mocks.workspaceSignIn.mockReturnValueOnce(signInA.promise);
    fireEvent.click(screen.getByRole("button", { name: "Start login A" }));

    await act(async () => { mocks.workspaceAuthCallback("SIGNED_IN", sessionB); });
    expect(mocks.workspaceGetSession).toHaveBeenCalledTimes(1);
    mocks.workspaceGetSession.mockResolvedValueOnce({ data: { session: sessionA } });
    await act(async () => { signInA.resolve({ data: { session: sessionA }, error: null }); });
    await waitFor(() => expect(mocks.workspaceGetSession).toHaveBeenCalledTimes(2));
    await screen.findByText("workspace-user-id:blocked-user-a");
    await screen.findByText("membership-ready");
    expect(screen.getByText("workspace-user-email:shared@example.test")).toBeInTheDocument();
    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(mocks.workspaceMembersSelect).not.toHaveBeenCalled();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();

    mocks.workspaceGetSession.mockResolvedValueOnce({ data: { session: sessionA } });
    await act(async () => { mocks.workspaceAuthCallback("TOKEN_REFRESHED", sessionA); });
    await waitFor(() => expect(mocks.workspaceGetSession).toHaveBeenCalledTimes(3));
    await screen.findByText("membership-ready");
    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(mocks.workspaceMembersSelect).not.toHaveBeenCalled();

    mocks.workspaceGetSession.mockResolvedValueOnce({ data: { session: sessionA } });
    fireEvent.click(screen.getByRole("button", { name: "Refresh: none" }));
    await waitFor(() => expect(mocks.workspaceGetSession).toHaveBeenCalledTimes(4));
    await screen.findByText("membership-ready");
    expect(screen.getByText("workspace-authenticated:false")).toBeInTheDocument();
    expect(mocks.workspaceMembersSelect).not.toHaveBeenCalled();

    mocks.workspaceSignIn.mockResolvedValueOnce({ data: { session: sessionA }, error: null });
    mocks.workspaceMembersSelect.mockResolvedValueOnce({ data: [{ workspace_id: "workspace-a", role: "owner", status: "active" }], error: null });
    fireEvent.click(screen.getByRole("button", { name: "Start login A" }));
    expect(await screen.findByRole("button", { name: "Refresh: workspace-a" })).toBeInTheDocument();
    expect(screen.getByText("workspace-user-id:blocked-user-a")).toBeInTheDocument();
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });

  it("keeps the same-email newer session after an older login membership resolves late", async () => {
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <AuthProvider><WorkspaceAuthProvider><AuthProbe /></WorkspaceAuthProvider></AuthProvider>
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: "ready" });
    await screen.findByText("membership-ready");

    const sessionA = { user: { id: "shared-user-a", email: "shared@example.test" } };
    const sessionB = { user: { id: "shared-user-b", email: "shared@example.test" } };
    const membershipA = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    const membershipB = deferred<{ data: { workspace_id: string; role: string; status: string }[]; error: null }>();
    mocks.workspaceSignIn.mockResolvedValueOnce({ data: { session: sessionA }, error: null });
    mocks.workspaceMembersSelect.mockReturnValueOnce(membershipA.promise);
    fireEvent.click(screen.getByRole("button", { name: "Start login A" }));
    await waitFor(() => expect(mocks.workspaceMembersSelect).toHaveBeenCalledTimes(1));

    mocks.workspaceGetSession.mockResolvedValueOnce({ data: { session: sessionB } });
    mocks.workspaceMembersSelect.mockReturnValueOnce(membershipB.promise);
    await act(async () => { mocks.workspaceAuthCallback("SIGNED_IN", sessionB); });
    await waitFor(() => expect(mocks.workspaceMembersSelect).toHaveBeenCalledTimes(2));
    await act(async () => {
      membershipB.resolve({ data: [{ workspace_id: "workspace-b", role: "owner", status: "active" }], error: null });
    });
    expect(await screen.findByRole("button", { name: "Refresh: workspace-b" })).toBeInTheDocument();

    await act(async () => {
      membershipA.resolve({ data: [{ workspace_id: "workspace-a", role: "owner", status: "active" }], error: null });
    });
    await screen.findByText("login-complete");
    expect(screen.getByRole("button", { name: "Refresh: workspace-b" })).toBeInTheDocument();
    expect(screen.getByText("workspace-user-id:shared-user-b")).toBeInTheDocument();
    expect(screen.getByText("workspace-user-email:shared@example.test")).toBeInTheDocument();
    expect(screen.getByText("workspace-authenticated:true")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh: workspace-a" })).not.toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });

  it("denies clinical routes while preserving a session without workspace membership", async () => {
    mocks.workspaceGetSession.mockResolvedValue({
      data: { session: { user: { id: "unassigned-user", email: "unassigned@example.test" } } },
    });
    mocks.workspaceMembersSelect.mockResolvedValue({ data: [], error: null });
    render(
      <MemoryRouter initialEntries={["/workspace/patients"]}>
        <WorkspaceAuthProvider>
          <Routes>
            <Route path="/workspace/patients" element={<WorkspaceProtectedRoute><p>clinical-chart-content</p></WorkspaceProtectedRoute>} />
            <Route path="/workspace/login" element={<p>workspace-login-screen</p>} />
          </Routes>
        </WorkspaceAuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("workspace-login-screen")).toBeInTheDocument();
    expect(screen.queryByText("clinical-chart-content")).not.toBeInTheDocument();
    expect(mocks.workspaceSignOut).not.toHaveBeenCalled();
  });
});

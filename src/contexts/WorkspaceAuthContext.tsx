import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { resolveWorkspaceMembership, type WorkspaceMembership, type ValidWorkspaceMembership } from "@/lib/workspaceAuth";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

interface WorkspaceAuthContextValue {
  authReady: boolean;
  membershipReady: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  membership: ValidWorkspaceMembership | null;
  refreshMembership: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const WorkspaceAuthContext = createContext<WorkspaceAuthContextValue | null>(null);

async function resolveCurrentMembership(): Promise<ValidWorkspaceMembership | null> {
  const { data, error } = await workspaceSupabase
    .from("workspace_members")
    .select("workspace_id, role, status");
  if (error) throw new Error(error.message);
  return resolveWorkspaceMembership((data ?? []) as WorkspaceMembership[]);
}

export function WorkspaceAuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isInvitationRoute = location.pathname === "/workspace/accept";
  const [authReady, setAuthReady] = useState(false);
  const [membershipReady, setMembershipReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [membership, setMembership] = useState<ValidWorkspaceMembership | null>(null);

  const syncSession = useCallback(async () => {
    const { data } = await workspaceSupabase.auth.getSession();
    const email = data.session?.user.email?.trim().toLowerCase() ?? null;
    setUserEmail(email);
    setAuthReady(true);

    if (!email) {
      setMembership(null);
      setMembershipReady(true);
      return;
    }

    setMembershipReady(false);
    try {
      const nextMembership = await resolveCurrentMembership();
      setMembership(nextMembership);
      if (!nextMembership && !isInvitationRoute) await workspaceSupabase.auth.signOut();
    } catch (error) {
      console.error("[WorkspaceAuth] membership lookup failed:", error);
      setMembership(null);
      if (!isInvitationRoute) await workspaceSupabase.auth.signOut().catch(() => null);
    } finally {
      setMembershipReady(true);
    }
  }, [isInvitationRoute]);

  const refreshMembership = useCallback(async () => {
    const { data } = await workspaceSupabase.auth.getSession();
    const email = data.session?.user.email?.trim().toLowerCase() ?? null;
    setUserEmail(email);
    setAuthReady(true);
    setMembershipReady(false);
    if (!email) {
      setMembership(null);
      setMembershipReady(true);
      return false;
    }

    try {
      const nextMembership = await resolveCurrentMembership();
      setMembership(nextMembership);
      setMembershipReady(true);
      return Boolean(nextMembership);
    } catch (error) {
      console.error("[WorkspaceAuth] membership refresh failed:", error);
      setMembership(null);
      setMembershipReady(true);
      return false;
    }
  }, []);

  useEffect(() => {
    void syncSession();
    const { data: listener } = workspaceSupabase.auth.onAuthStateChange(() => {
      void syncSession();
    });
    return () => listener.subscription.unsubscribe();
  }, [syncSession]);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return { ok: false, message: "Informe e-mail e senha." };

    const { error } = await workspaceSupabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) return { ok: false, message: "E-mail ou senha incorretos." };

    try {
      const nextMembership = await resolveCurrentMembership();
      if (!nextMembership) {
        await workspaceSupabase.auth.signOut();
        return { ok: false, message: "Este usuario nao possui uma membership workspace valida." };
      }
      setUserEmail(normalizedEmail);
      setMembership(nextMembership);
      setAuthReady(true);
      setMembershipReady(true);
      return { ok: true };
    } catch (lookupError) {
      console.error("[WorkspaceAuth] login membership lookup failed:", lookupError);
      await workspaceSupabase.auth.signOut().catch(() => null);
      return { ok: false, message: "Nao foi possivel validar o acesso workspace." };
    }
  }, []);

  const logout = useCallback(async () => {
    await workspaceSupabase.auth.signOut().catch(() => null);
    setUserEmail(null);
    setMembership(null);
  }, []);

  const value = useMemo(() => ({
    authReady,
    membershipReady,
    isAuthenticated: Boolean(userEmail && membership),
    userEmail,
    membership,
    refreshMembership,
    login,
    logout,
  }), [authReady, login, logout, membership, membershipReady, refreshMembership, userEmail]);

  return <WorkspaceAuthContext.Provider value={value}>{children}</WorkspaceAuthContext.Provider>;
}

export function useWorkspaceAuth() {
  const context = useContext(WorkspaceAuthContext);
  if (!context) throw new Error("useWorkspaceAuth must be used within WorkspaceAuthProvider");
  return context;
}

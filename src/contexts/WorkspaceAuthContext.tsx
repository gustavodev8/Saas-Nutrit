import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { resolveWorkspaceMembership, type WorkspaceMembership, type ValidWorkspaceMembership } from "@/lib/workspaceAuth";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

interface WorkspaceAuthContextValue {
  authReady: boolean;
  membershipReady: boolean;
  isAuthenticated: boolean;
  authUserId: string | null;
  userEmail: string | null;
  membership: ValidWorkspaceMembership | null;
  refreshMembership: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
}

interface LoginInProgress {
  operationId: number;
  authUserId: string | null;
  queuedSignInUserId: string | null;
  hasQueuedSignIn: boolean;
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
  const [authReady, setAuthReady] = useState(false);
  const [membershipReady, setMembershipReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [membership, setMembership] = useState<ValidWorkspaceMembership | null>(null);
  const authOperationRef = useRef(0);
  const loginInProgressRef = useRef<LoginInProgress | null>(null);
  const blockedAuthUserIdRef = useRef<string | null>(null);

  const syncSession = useCallback(async () => {
    const operationId = ++authOperationRef.current;
    let sessionResolved = false;
    setMembershipReady(false);
    setAuthUserId(null);
    setUserEmail(null);
    setMembership(null);
    try {
      const { data } = await workspaceSupabase.auth.getSession();
      if (operationId !== authOperationRef.current) return;
      sessionResolved = true;
      const authUser = data.session?.user;
      const userId = authUser?.id ?? null;
      const email = authUser?.email?.trim().toLowerCase() ?? null;
      setAuthUserId(userId);
      setUserEmail(email);
      setAuthReady(true);

      if (userId && blockedAuthUserIdRef.current && userId !== blockedAuthUserIdRef.current) {
        blockedAuthUserIdRef.current = null;
      }
      if (userId && userId === blockedAuthUserIdRef.current) {
        setMembership(null);
        return;
      }

      if (!userId || !email) {
        setAuthUserId(null);
        setUserEmail(null);
        setMembership(null);
        return;
      }

      const nextMembership = await resolveCurrentMembership();
      if (operationId !== authOperationRef.current) return;
      setMembership(nextMembership);
    } catch (error) {
      if (operationId !== authOperationRef.current) return;
      console.error("[WorkspaceAuth] membership lookup failed:", error);
      setAuthReady(true);
      setMembership(null);
      if (!sessionResolved) {
        setAuthUserId(null);
        setUserEmail(null);
      }
    } finally {
      if (operationId === authOperationRef.current) setMembershipReady(true);
    }
  }, []);

  const refreshMembership = useCallback(async () => {
    const operationId = ++authOperationRef.current;
    let sessionResolved = false;
    setMembershipReady(false);
    try {
      const { data } = await workspaceSupabase.auth.getSession();
      if (operationId !== authOperationRef.current) return false;
      sessionResolved = true;
      const authUser = data.session?.user;
      const userId = authUser?.id ?? null;
      const email = authUser?.email?.trim().toLowerCase() ?? null;
      setAuthUserId(userId);
      setUserEmail(email);
      setAuthReady(true);
      if (userId && blockedAuthUserIdRef.current && userId !== blockedAuthUserIdRef.current) {
        blockedAuthUserIdRef.current = null;
      }
      if (userId && userId === blockedAuthUserIdRef.current) {
        setMembership(null);
        return false;
      }
      if (!userId || !email) {
        setAuthUserId(null);
        setUserEmail(null);
        setMembership(null);
        return false;
      }

      const nextMembership = await resolveCurrentMembership();
      if (operationId !== authOperationRef.current) return false;
      setMembership(nextMembership);
      return Boolean(nextMembership);
    } catch (error) {
      if (operationId !== authOperationRef.current) return false;
      console.error("[WorkspaceAuth] membership refresh failed:", error);
      setAuthReady(true);
      if (!sessionResolved) {
        setAuthUserId(null);
        setUserEmail(null);
      }
      setMembership(null);
      return false;
    } finally {
      if (operationId === authOperationRef.current) setMembershipReady(true);
    }
  }, []);

  useEffect(() => {
    void syncSession();
    const { data: listener } = workspaceSupabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED and INITIAL_SESSION are silent background events — the session is
      // still valid and the membership hasn't changed, so there is no need to re-sync.
      // Re-syncing on these events zeros out membershipReady and causes a visible flash
      // ("reload") whenever Chrome resumes a suspended/minimized tab.
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;

      const pendingLogin = loginInProgressRef.current;
      if (event === "SIGNED_IN" && pendingLogin) {
        const eventUser = session?.user;
        if (!pendingLogin.authUserId) {
          loginInProgressRef.current = {
            ...pendingLogin,
            queuedSignInUserId: eventUser?.id ?? null,
            hasQueuedSignIn: true,
          };
          return;
        }
        if (eventUser?.id === pendingLogin.authUserId) return;
      }
      void syncSession();
    });
    return () => listener.subscription.unsubscribe();
  }, [syncSession]);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return { ok: false, message: "Informe e-mail e senha." };

    const operationId = ++authOperationRef.current;
    loginInProgressRef.current = {
      operationId,
      authUserId: null,
      queuedSignInUserId: null,
      hasQueuedSignIn: false,
    };
    setMembershipReady(false);
    try {
      const { data, error } = await workspaceSupabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (operationId !== authOperationRef.current) return { ok: false, message: "A sessão foi alterada durante o login." };
      if (error) {
        void syncSession();
        return { ok: false, message: "E-mail ou senha incorretos." };
      }

      const authUser = data.session?.user;
      const userId = authUser?.id ?? null;
      const authenticatedEmail = authUser?.email?.trim().toLowerCase() ?? normalizedEmail;
      if (!userId) {
        setAuthUserId(null);
        setUserEmail(null);
        setMembership(null);
        setAuthReady(true);
        return { ok: false, message: "Não foi possível identificar a sessão autenticada." };
      }
      const pendingLogin = loginInProgressRef.current;
      if (pendingLogin?.operationId === operationId) {
        if (pendingLogin.hasQueuedSignIn && pendingLogin.queuedSignInUserId !== userId) {
          blockedAuthUserIdRef.current = userId;
          setAuthUserId(userId);
          setUserEmail(authenticatedEmail);
          setMembership(null);
          setAuthReady(true);
          void syncSession();
          return { ok: false, message: "A sessão foi alterada durante o login." };
        }
        loginInProgressRef.current = {
          operationId,
          authUserId: userId,
          queuedSignInUserId: null,
          hasQueuedSignIn: false,
        };
      }
      blockedAuthUserIdRef.current = null;
      setAuthUserId(userId);
      setUserEmail(authenticatedEmail);
      setMembership(null);
      setAuthReady(true);

      const nextMembership = await resolveCurrentMembership();
      if (operationId !== authOperationRef.current) return { ok: false, message: "A sessão foi alterada durante o login." };
      if (!nextMembership) {
        setAuthUserId(userId);
        setUserEmail(authenticatedEmail);
        setMembership(null);
        setMembershipReady(true);
        return { ok: false, message: "Este usuario nao possui uma membership workspace valida." };
      }
      setAuthUserId(userId);
      setUserEmail(authenticatedEmail);
      setMembership(nextMembership);
      setAuthReady(true);
      setMembershipReady(true);
      return { ok: true };
    } catch (lookupError) {
      if (operationId !== authOperationRef.current) return { ok: false, message: "A sessão foi alterada durante o login." };
      console.error("[WorkspaceAuth] login membership lookup failed:", lookupError);
      setMembership(null);
      setAuthReady(true);
      setMembershipReady(true);
      return { ok: false, message: "Nao foi possivel validar o acesso workspace." };
    } finally {
      if (loginInProgressRef.current?.operationId === operationId) loginInProgressRef.current = null;
      if (operationId === authOperationRef.current) setMembershipReady(true);
    }
  }, [syncSession]);

  const logout = useCallback(async () => {
    ++authOperationRef.current;
    setAuthUserId(null);
    setUserEmail(null);
    setMembership(null);
    setAuthReady(true);
    setMembershipReady(true);
    await workspaceSupabase.auth.signOut().catch(() => null);
  }, []);

  const value = useMemo(() => ({
    authReady,
    membershipReady,
    isAuthenticated: Boolean(authUserId && userEmail && membership),
    authUserId,
    userEmail,
    membership,
    refreshMembership,
    login,
    logout,
  }), [authReady, authUserId, login, logout, membership, membershipReady, refreshMembership, userEmail]);

  return <WorkspaceAuthContext.Provider value={value}>{children}</WorkspaceAuthContext.Provider>;
}

export function useWorkspaceAuth() {
  const context = useContext(WorkspaceAuthContext);
  if (!context) throw new Error("useWorkspaceAuth must be used within WorkspaceAuthProvider");
  return context;
}

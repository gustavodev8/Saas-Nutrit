import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { resolveWorkspaceMembership, type WorkspaceMembership, type ValidWorkspaceMembership } from "@/lib/workspaceAuth";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { fetchWorkspaceSubscription, type WorkspaceSubscription } from "@/lib/workspaceSubscription";

const WORKSPACE_NAME_KEY = "ws_signup_clinic_name";

interface WorkspaceAuthContextValue {
  authReady: boolean;
  membershipReady: boolean;
  isAuthenticated: boolean;
  authUserId: string | null;
  userEmail: string | null;
  membership: ValidWorkspaceMembership | null;
  subscription: WorkspaceSubscription | null;
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

async function tryAutoCreateWorkspace(userId: string): Promise<ValidWorkspaceMembership | null> {
  // Try stored clinic name from signup form (sessionStorage) or user metadata
  let clinicName: string | null = null;
  try { clinicName = sessionStorage.getItem(WORKSPACE_NAME_KEY); } catch {}
  if (!clinicName) {
    const { data } = await workspaceSupabase.auth.getUser();
    clinicName = (data?.user?.user_metadata?.workspace_name as string | undefined) ?? null;
  }
  if (!clinicName?.trim()) return null;

  try {
    await workspaceSupabase.rpc("create_workspace_self_signup", {
      p_workspace_name: clinicName.trim(),
    });
    try { sessionStorage.removeItem(WORKSPACE_NAME_KEY); } catch {}

    // Fire-and-forget admin notification
    void (async () => {
      try {
        const supabaseUrl = (import.meta.env as Record<string, string>).VITE_SUPABASE_URL ?? "";
        const { data: authData } = await workspaceSupabase.auth.getSession();
        const token = authData.session?.access_token ?? "";
        const { data: userData } = await workspaceSupabase.auth.getUser();
        const ownerEmail = userData?.user?.email ?? "";
        if (supabaseUrl && token) {
          await fetch(`${supabaseUrl}/functions/v1/send-workspace-email`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ type: "admin-new-signup", email: ownerEmail, workspace_name: clinicName!.trim() }),
          });
        }
      } catch {}
    })();

    return await resolveCurrentMembership();
  } catch {
    return null;
  }
}

export function WorkspaceAuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [membershipReady, setMembershipReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [membership, setMembership] = useState<ValidWorkspaceMembership | null>(null);
  const [subscription, setSubscription] = useState<WorkspaceSubscription | null>(null);
  const authOperationRef = useRef(0);
  const loginInProgressRef = useRef<LoginInProgress | null>(null);
  const blockedAuthUserIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const loadSubscription = useCallback(async (workspaceId: string, operationId: number) => {
    try {
      const sub = await fetchWorkspaceSubscription(workspaceId);
      if (operationId !== authOperationRef.current) return;
      setSubscription(sub);
    } catch {
      if (operationId !== authOperationRef.current) return;
      setSubscription(null);
    }
  }, []);

  const syncSession = useCallback(async () => {
    const operationId = ++authOperationRef.current;
    let sessionResolved = false;
    setMembershipReady(false);
    setAuthUserId(null);
    setUserEmail(null);
    setMembership(null);
    setSubscription(null);
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
      currentUserIdRef.current = userId;

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

      let nextMembership = await resolveCurrentMembership();
      if (operationId !== authOperationRef.current) return;

      // Self-signup flow: authenticated user with no workspace yet — auto-create
      if (!nextMembership) {
        nextMembership = await tryAutoCreateWorkspace(userId);
        if (operationId !== authOperationRef.current) return;
      }

      setMembership(nextMembership);
      if (nextMembership) void loadSubscription(nextMembership.workspaceId, operationId);
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
  }, [loadSubscription]);

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
      if (nextMembership) void loadSubscription(nextMembership.workspaceId, operationId);
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
  }, [loadSubscription]);

  useEffect(() => {
    void syncSession();
    const { data: listener } = workspaceSupabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED and INITIAL_SESSION are silent background events — the session is
      // still valid and the membership hasn't changed, so there is no need to re-sync.
      // Re-syncing on these events zeros out membershipReady and causes a visible flash
      // ("reload") whenever Chrome resumes a suspended/minimized tab.
      if (event === "INITIAL_SESSION") return;
      if (event === "TOKEN_REFRESHED" && session?.user?.id !== blockedAuthUserIdRef.current) return;

      // SIGNED_IN / USER_UPDATED for the same user (tab regain focus, background refresh)
      // should not trigger a full re-sync — it would reset membershipReady and show the
      // loading screen unnecessarily.
      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session?.user?.id &&
        session.user.id === currentUserIdRef.current
      ) return;

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
      void loadSubscription(nextMembership.workspaceId, operationId);
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
  }, [syncSession, loadSubscription]);

  const logout = useCallback(async () => {
    ++authOperationRef.current;
    setAuthUserId(null);
    setUserEmail(null);
    setMembership(null);
    setSubscription(null);
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
    subscription,
    refreshMembership,
    login,
    logout,
  }), [authReady, authUserId, login, logout, membership, membershipReady, refreshMembership, subscription, userEmail]);

  return <WorkspaceAuthContext.Provider value={value}>{children}</WorkspaceAuthContext.Provider>;
}

export function useWorkspaceAuth() {
  const context = useContext(WorkspaceAuthContext);
  if (!context) throw new Error("useWorkspaceAuth must be used within WorkspaceAuthProvider");
  return context;
}

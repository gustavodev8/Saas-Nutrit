import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() || null;

interface AuthContextValue {
  isAuthenticated: boolean;
  authReady: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean | string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function hasAllowlistedAdminAccess(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  if (adminEmail && normalizedEmail !== adminEmail) {
    return false;
  }

  const { data, error } = await supabase
    .from("admin_emails")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("[Auth] admin allowlist lookup failed:", error.message);
    return Boolean(adminEmail && normalizedEmail === adminEmail);
  }

  return data?.email?.trim().toLowerCase() === normalizedEmail;
}

async function resolveAdminSessionState(
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"],
) {
  const sessionEmail = session?.user.email?.trim().toLowerCase() ?? null;

  if (!session || !sessionEmail) {
    return { allowed: false, email: sessionEmail };
  }

  const allowed = await hasAllowlistedAdminAccess(sessionEmail);
  return { allowed, email: sessionEmail };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncSessionState = async (
      session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"],
    ) => {
      const next = await resolveAdminSessionState(session);
      if (!mounted) return;

      setIsAuthenticated(next.allowed);
      setUserEmail(next.email);
      setAuthReady(true);

      if (session && next.email && !next.allowed) {
        await supabase.auth.signOut().catch(() => null);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      void syncSessionState(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSessionState(session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; message?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (adminEmail && normalizedEmail !== adminEmail) {
      return { ok: false, message: "Este usuario nao tem acesso ao painel administrativo." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, message: "E-mail ou senha incorretos." };
    }

    const allowed = await hasAllowlistedAdminAccess(normalizedEmail);
    if (!allowed) {
      await supabase.auth.signOut().catch(() => null);
      return { ok: false, message: "Este usuario nao foi liberado na allowlist administrativa." };
    }

    setIsAuthenticated(Boolean(data.session));
    setUserEmail(normalizedEmail);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut().catch(() => null);
    setIsAuthenticated(false);
    setUserEmail(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean | string> => {
    const email = userEmail;
    if (!email) return "Sessao invalida. Faca login novamente.";
    if (newPassword.length < 8) return "A nova senha deve ter pelo menos 8 caracteres.";
    if (!/[A-Z]/.test(newPassword)) return "A nova senha deve conter ao menos uma letra maiuscula.";
    if (!/[0-9]/.test(newPassword)) return "A nova senha deve conter ao menos um numero.";
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (reauthError) return "Senha atual incorreta.";
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) return "Nao foi possivel atualizar a senha agora.";
    return true;
  }, [userEmail]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authReady, userEmail, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

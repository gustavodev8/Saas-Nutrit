import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Leaf, Loader2, Mail } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

type FormMode = "signup" | "login";
const INVITATION_TOKEN_STORAGE_KEY = "workspace-invitation-token";

const INVALID_INVITATION_MESSAGE = "Não foi possível validar este convite. Verifique o link ou solicite um novo.";

export default function WorkspaceAcceptInvitationPage() {
  const navigate = useNavigate();
  const { refreshMembership } = useWorkspaceAuth();
  const [token, setToken] = useState("");
  const [tokenReady, setTokenReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const tokenIsValid = /^[a-fA-F0-9]{64}$/.test(token);
  const [mode, setMode] = useState<FormMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"error" | "info">("error");
  const inFlight = useRef(new Set<string>());
  const accepted = useRef(new Set<string>());

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const queryHasToken = currentUrl.searchParams.has("token");
    const queryToken = currentUrl.searchParams.get("token")?.trim() ?? "";
    let capturedToken = "";

    try {
      if (queryHasToken) {
        if (/^[a-fA-F0-9]{64}$/.test(queryToken)) {
          window.sessionStorage.setItem(INVITATION_TOKEN_STORAGE_KEY, queryToken);
          capturedToken = queryToken;
        } else {
          window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
        }
      } else {
        capturedToken = window.sessionStorage.getItem(INVITATION_TOKEN_STORAGE_KEY)?.trim() ?? "";
        if (!/^[a-fA-F0-9]{64}$/.test(capturedToken)) {
          window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
          capturedToken = "";
        }
      }
    } catch {
      setStorageUnavailable(true);
    }

    if (queryHasToken) {
      currentUrl.searchParams.delete("token");
      window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    }
    setToken(capturedToken);
    setTokenReady(true);
  }, []);

  const acceptInvitation = useCallback(async (session: Session) => {
    if (!tokenIsValid) return;
    const userId = session.user.id;
    const attemptKey = `${userId}:${token.toLowerCase()}`;
    if (accepted.current.has(attemptKey) || inFlight.current.has(attemptKey)) return;

    if (!session.user.email_confirmed_at) {
      setMessageKind("info");
      setMessage("Confirme seu e-mail pelo link enviado e volte a esta página para concluir o convite.");
      return;
    }

    inFlight.current.add(attemptKey);
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await workspaceSupabase.rpc("accept_workspace_invitation", { p_token: token });
      if (error || !data) {
        if (!error) window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
        setMessageKind("error");
        setMessage(INVALID_INVITATION_MESSAGE);
        return;
      }
      if (!await refreshMembership()) {
        setMessageKind("error");
        setMessage("Convite aceito, mas não foi possível carregar seu acesso. Atualize a página para tentar novamente.");
        return;
      }
      window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
      accepted.current.add(attemptKey);
      navigate("/workspace/patients", { replace: true });
    } catch {
      setMessageKind("error");
      setMessage(INVALID_INVITATION_MESSAGE);
    } finally {
      inFlight.current.delete(attemptKey);
      setBusy(false);
    }
  }, [navigate, refreshMembership, token, tokenIsValid]);

  useEffect(() => {
    if (!tokenReady || !tokenIsValid) return;
    let active = true;
    const { data: listener } = workspaceSupabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.setTimeout(() => { if (active) void acceptInvitation(session); }, 0);
    });
    void workspaceSupabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void acceptInvitation(data.session);
    }).catch(() => {
      if (active) {
        setMessageKind("error");
        setMessage(INVALID_INVITATION_MESSAGE);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [acceptInvitation, tokenIsValid, tokenReady]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tokenIsValid || busy) return;
    setBusy(true);
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (mode === "signup") {
        const { data: invitationIsValid, error: validationError } = await workspaceSupabase.rpc(
          "validate_workspace_invitation_before_signup",
          { p_token: token, p_email: normalizedEmail },
        );
        if (validationError || invitationIsValid !== true) {
          setMessageKind("error");
          setMessage(INVALID_INVITATION_MESSAGE);
          return;
        }

        const redirect = new URL("/workspace/accept", window.location.origin);
        redirect.searchParams.set("token", token);
        const { data, error } = await workspaceSupabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: redirect.toString(),
            data: { workspace_invitation_token: token },
          },
        });
        if (error) {
          setMessageKind("error");
          setMessage("Não foi possível concluir a solicitação. Confira os dados ou tente entrar com sua conta.");
        } else if (data.session) {
          await acceptInvitation(data.session);
        } else {
          setMessageKind("info");
          setMessage("Enviamos um link para confirmar seu e-mail. Abra-o e volte a esta página para concluir o convite.");
        }
      } else {
        const { data, error } = await workspaceSupabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error || !data.session) {
          setMessageKind("error");
          setMessage("Não foi possível entrar ou validar o convite. Confira os dados e tente novamente.");
        } else {
          await acceptInvitation(data.session);
        }
      }
    } catch {
      setMessageKind("error");
      setMessage("Não foi possível concluir a solicitação. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm sm:p-8" aria-labelledby="invitation-title">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Leaf size={20} aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Acesso profissional</p>
            <h1 id="invitation-title" className="text-xl font-semibold">Aceitar convite</h1>
          </div>
        </div>

        {!tokenReady ? (
          <p role="status" className="text-sm text-muted-foreground">Preparando o convite...</p>
        ) : storageUnavailable ? (
          <p role="alert" className="text-sm text-destructive">Não foi possível guardar o convite nesta sessão. Abra novamente o link recebido.</p>
        ) : !tokenIsValid ? (
          <p role="alert" className="text-sm text-destructive">{INVALID_INVITATION_MESSAGE}</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">Use o e-mail associado ao convite para criar sua conta ou entrar.</p>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="invitation-email">E-mail</Label>
                <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="invitation-email" className="pl-9" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitation-password">Senha</Label>
                <div className="relative"><KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="invitation-password" className="pl-9" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
              </div>
              {message && <p role={messageKind === "error" ? "alert" : "status"} className={`text-sm ${messageKind === "error" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}
              <Button className="w-full" type="submit" disabled={busy}>
                {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
                {mode === "signup" ? "Criar conta e aceitar" : "Entrar e aceitar convite"}
              </Button>
            </form>
            <button type="button" className="mt-5 w-full text-center text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}>
              {mode === "signup" ? "Já tem uma conta? Entrar" : "Ainda não tem uma conta? Criar conta"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}

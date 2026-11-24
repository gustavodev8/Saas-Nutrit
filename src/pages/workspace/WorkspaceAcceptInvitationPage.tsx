import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, Mail } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { WorkspaceAuthLayout } from "@/components/workspace/WorkspaceAuthLayout";

type FormMode = "signup" | "login";
const INVITATION_TOKEN_STORAGE_KEY = "workspace-invitation-token";

const INVALID_INVITATION_MESSAGE = "Não foi possível validar este convite. Verifique o link ou solicite um novo.";
const SESSION_INVITATION_MESSAGE = "Não foi possível associar esta sessão a um convite válido ou pendente. Confira se está usando o e-mail do convite ou solicite um novo convite; o link foi mantido.";
const INVITATION_CHECK_MESSAGE = "Não foi possível verificar o convite agora. Tente novamente com o e-mail associado a ele; o link foi mantido.";
const CREATED_ACCOUNT_INVITATION_MESSAGE = "Sua conta foi criada, mas o acesso ao workspace não foi concluído. Não crie outra conta. Peça ao administrador para reenviar o convite para este mesmo e-mail e abra o novo link; um convite expirado ou cancelado não pode ser recuperado.";
const CREATED_ACCOUNT_RETRY_MESSAGE = "Sua conta foi criada, mas não foi possível concluir o acesso ao workspace. Não crie outra conta. Tente novamente; se o convite expirou ou foi cancelado, peça ao administrador para reenviá-lo para este mesmo e-mail e abra o novo link.";

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
  const createdAccountEmail = useRef<string | null>(null);

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

    const normalizedEmail = session.user.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessageKind("info");
      setMessage(SESSION_INVITATION_MESSAGE);
      return;
    }
    const accountWasCreatedHere = createdAccountEmail.current === normalizedEmail;

    inFlight.current.add(attemptKey);
    setBusy(true);
    setMessage("");
    try {
      const { data: invitationMatchesSession, error: validationError } = await workspaceSupabase.rpc(
        "validate_workspace_invitation_before_signup",
        { p_token: token, p_email: normalizedEmail },
      );
      if (validationError) {
        setMessageKind("info");
        setMessage(accountWasCreatedHere ? CREATED_ACCOUNT_RETRY_MESSAGE : INVITATION_CHECK_MESSAGE);
        if (accountWasCreatedHere) setMode("login");
        return;
      }
      if (invitationMatchesSession !== true) {
        if (accountWasCreatedHere) {
          window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
          setMode("login");
          setPassword("");
          setMessageKind("info");
          setMessage(CREATED_ACCOUNT_INVITATION_MESSAGE);
          return;
        }
        setMessageKind("info");
        setMessage(SESSION_INVITATION_MESSAGE);
        return;
      }

      const { data, error } = await workspaceSupabase.rpc("accept_workspace_invitation", { p_token: token });
      if (error || !data) {
        if (accountWasCreatedHere) {
          if (!error) window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
          setMode("login");
          setPassword("");
          setMessageKind("info");
          setMessage(error ? CREATED_ACCOUNT_RETRY_MESSAGE : CREATED_ACCOUNT_INVITATION_MESSAGE);
        } else {
          if (!error) window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
          setMessageKind("error");
          setMessage(INVALID_INVITATION_MESSAGE);
        }
        return;
      }
      if (!await refreshMembership()) {
        setMode("login");
        setPassword("");
        setMessageKind("info");
        setMessage("Convite aceito, mas seu acesso não carregou. Atualize a página ou entre novamente com esta conta. Não crie outra conta.");
        return;
      }
      window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
      if (accountWasCreatedHere) createdAccountEmail.current = null;
      accepted.current.add(attemptKey);
      navigate("/workspace/patients", { replace: true });
    } catch {
      setMessageKind("info");
      setMessage(accountWasCreatedHere ? CREATED_ACCOUNT_RETRY_MESSAGE : INVITATION_CHECK_MESSAGE);
      if (accountWasCreatedHere) setMode("login");
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
        const submittedPassword = password;
        const { data, error } = await workspaceSupabase.functions.invoke("workspace-invitation-signup", {
          body: { token, email: normalizedEmail, password: submittedPassword },
        });
        if (error) {
          setMessageKind("error");
          setMessage("Não foi possível criar a conta agora. O convite foi mantido; tente novamente.");
          return;
        }

        const signupResult = data as { ok?: unknown; code?: unknown } | null;
        if (signupResult?.code === "account_exists") {
          setMode("login");
          setPassword("");
          setMessageKind("info");
          setMessage("Já existe uma conta para este e-mail. Entre com sua senha; ela não será alterada.");
        } else if (signupResult?.ok !== true) {
          if (signupResult?.code === "invitation_invalid") {
            window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
          }
          setMessageKind("error");
          setMessage(signupResult?.code === "invitation_invalid"
            ? INVALID_INVITATION_MESSAGE
            : "Não foi possível criar a conta. Confira os dados e tente novamente.");
        } else {
          createdAccountEmail.current = normalizedEmail;
          const { data: loginData, error: loginError } = await workspaceSupabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: submittedPassword,
          });
          setPassword("");
          if (loginError || !loginData.session) {
            setMode("login");
            setMessageKind("info");
            setMessage("A conta foi criada, mas não foi possível entrar automaticamente. Faça login para concluir o convite.");
          } else {
            await acceptInvitation(loginData.session);
          }
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
    <WorkspaceAuthLayout title="Aceitar convite" eyebrow="Acesso profissional" description={tokenReady && !storageUnavailable && tokenIsValid ? "Use o e-mail associado ao convite para criar sua conta ou entrar." : undefined}>
        {!tokenReady ? (
          <p role="status" className="text-sm text-muted-foreground dark:text-zinc-300">Preparando o convite...</p>
        ) : storageUnavailable ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200">Não foi possível guardar o convite nesta sessão. Abra novamente o link recebido.</p>
        ) : !tokenIsValid ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200">{INVALID_INVITATION_MESSAGE}</p>
        ) : (
          <>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="invitation-email">E-mail</Label>
                <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="invitation-email" className="h-11 pl-10" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitation-password">Senha</Label>
                <div className="relative"><KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="invitation-password" className="h-11 pl-10" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
              </div>
              {message && <p role={messageKind === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm leading-6 ${messageKind === "error" ? "border-destructive/30 bg-destructive/5 text-destructive dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200" : "border-primary/25 bg-primary/5 text-foreground"}`}>{message}</p>}
              <Button className="h-11 w-full" type="submit" disabled={busy}>
                {busy && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
                {mode === "signup" ? "Criar conta e aceitar" : "Entrar e aceitar convite"}
              </Button>
            </form>
            <button type="button" className="mt-5 min-h-10 w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}>
              {mode === "signup" ? "Já tem uma conta? Entrar" : "Ainda não tem uma conta? Criar conta"}
            </button>
          </>
        )}
    </WorkspaceAuthLayout>
  );
}

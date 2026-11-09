import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { KeyRound, Leaf, Loader2, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WorkspaceAccessRequestsPanel, { type WorkspaceAccessRequestRecord } from "@/components/saas/WorkspaceAccessRequestsPanel";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

type PlatformInvitationsPageProps = {
  accessRequestsEnabled?: boolean;
};

const INVITATION_ERROR_MESSAGES = {
  invalid_input: "Confira o e-mail e o nome do workspace e tente novamente.",
  unauthorized: "Sua sessão não foi autorizada. Entre novamente com a conta da plataforma.",
  forbidden: "Esta conta não tem permissão para emitir convites. Use uma conta autorizada da plataforma.",
  rate_limited: "Muitas tentativas em sequência. Aguarde um pouco antes de tentar novamente.",
  origin_not_allowed: "Esta página não está autorizada a emitir convites. Abra o endereço oficial da plataforma.",
  method_not_allowed: "Não foi possível enviar o convite por esta solicitação. Atualize a página e tente novamente.",
  service_unavailable: "O serviço de convites está indisponível. Tente novamente mais tarde.",
  invitation_not_created: "Não foi possível registrar o convite. Confira os dados e a permissão da conta antes de tentar novamente.",
  email_delivery_failed: "O convite foi registrado, mas o e-mail não foi enviado. Confira o endereço e verifique o convite pendente antes de tentar novamente.",
  invitation_status_unknown: "Não foi possível confirmar o status do convite. Verifique se há um convite pendente antes de tentar novamente.",
} as const;

const UNKNOWN_INVITATION_ERROR_MESSAGE = INVITATION_ERROR_MESSAGES.invitation_status_unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getInvitationErrorCode(value: unknown): keyof typeof INVITATION_ERROR_MESSAGES | null {
  if (!isRecord(value) || typeof value.code !== "string") return null;
  return Object.prototype.hasOwnProperty.call(INVITATION_ERROR_MESSAGES, value.code)
    ? value.code as keyof typeof INVITATION_ERROR_MESSAGES
    : null;
}

async function getInvitationErrorMessage(data: unknown, error: unknown): Promise<string> {
  const dataCode = getInvitationErrorCode(data);
  if (dataCode) return INVITATION_ERROR_MESSAGES[dataCode];

  if (isRecord(error) && error.context instanceof Response) {
    try {
      const responseBody = await error.context.clone().json();
      const responseCode = getInvitationErrorCode(responseBody);
      if (responseCode) return INVITATION_ERROR_MESSAGES[responseCode];
    } catch {
      return UNKNOWN_INVITATION_ERROR_MESSAGE;
    }
  }

  return UNKNOWN_INVITATION_ERROR_MESSAGE;
}

export default function PlatformInvitationsPage({ accessRequestsEnabled = false }: PlatformInvitationsPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [preparedRequestId, setPreparedRequestId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetRequestBusy, setResetRequestBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"error" | "success">("error");

  useEffect(() => {
    let active = true;
    void workspaceSupabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setAuthReady(true);
      }
    }).catch(() => { if (active) setAuthReady(true); });
    const { data: listener } = workspaceSupabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await workspaceSupabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error || !data.session) {
        setMessageKind("error");
        setMessage("Não foi possível autenticar. Confira os dados e tente novamente.");
      } else {
        setSession(data.session);
        setPassword("");
      }
    } catch {
      setMessageKind("error");
      setMessage("Não foi possível autenticar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessageKind("error");
      setMessage("Informe um e-mail válido para solicitar a recuperação.");
      return;
    }
    if (busy || resetRequestBusy) return;

    setResetRequestBusy(true);
    setMessage("");
    try {
      const { error } = await workspaceSupabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/platform/reset-password`,
      });
      if (error) {
        setMessageKind("error");
        setMessage("Não foi possível solicitar a recuperação agora. Tente novamente.");
      } else {
        setMessageKind("success");
        setMessage("Se o e-mail estiver associado a uma conta, você receberá as instruções para redefinir a senha.");
      }
    } catch {
      setMessageKind("error");
      setMessage("Não foi possível solicitar a recuperação agora. Tente novamente.");
    } finally {
      setResetRequestBusy(false);
    }
  };

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await workspaceSupabase.functions.invoke("workspace-invitation", {
        body: { email: inviteEmail.trim().toLowerCase(), workspaceName: workspaceName.trim() },
      });
      if (error || data?.ok !== true) {
        setMessageKind("error");
        setMessage(await getInvitationErrorMessage(data, error));
      } else {
        setMessageKind("success");
        setMessage("Convite enviado. O link expira em sete dias e pode ser usado uma vez.");
        setInviteEmail("");
        setWorkspaceName("");
        setPreparedRequestId(null);
      }
    } catch {
      setMessageKind("error");
      setMessage(UNKNOWN_INVITATION_ERROR_MESSAGE);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await workspaceSupabase.auth.signOut().catch(() => null);
    setSession(null);
    setMessage("");
  };

  const prepareApprovedRequest = (request: WorkspaceAccessRequestRecord) => {
    setPreparedRequestId(request.id);
    setInviteEmail(request.professional_email);
    setWorkspaceName(request.applicant_name);
    setMessage("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-sm sm:p-8" aria-labelledby="platform-invitations-title">
        <header className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Leaf size={20} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Administração da plataforma</p>
              <h1 id="platform-invitations-title" className="text-xl font-semibold">Convites de workspace</h1>
            </div>
          </div>
          {session && <Button type="button" variant="ghost" size="icon" aria-label="Sair" title="Sair" onClick={handleLogout}><LogOut /></Button>}
        </header>

        {!authReady ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Verificando sessão...</p>
        ) : !session ? (
          <form className="space-y-5" onSubmit={handleLogin}>
            <p className="text-sm text-muted-foreground">Entre com sua conta da plataforma para continuar.</p>
            <div className="space-y-2"><Label htmlFor="platform-admin-email">E-mail</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="platform-admin-email" className="pl-9" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></div>
            <div className="space-y-2"><Label htmlFor="platform-admin-password">Senha</Label><div className="relative"><KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="platform-admin-password" className="pl-9" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div></div>
            {message && <p role={messageKind === "success" ? "status" : "alert"} className={`text-sm ${messageKind === "success" ? "text-foreground" : "text-destructive"}`}>{message}</p>}
            <Button className="w-full" type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" aria-hidden="true" />}Entrar</Button>
            <Button className="w-full" type="button" variant="link" disabled={busy || resetRequestBusy} onClick={() => void handlePasswordReset()}>
              {resetRequestBusy && <Loader2 className="animate-spin" aria-hidden="true" />}
              Esqueci minha senha
            </Button>
          </form>
        ) : (
          <div className="space-y-8">
            {accessRequestsEnabled && <WorkspaceAccessRequestsPanel onPrepareInvite={prepareApprovedRequest} />}
            {accessRequestsEnabled && messageKind === "success" && message && <p role="status" className="text-sm text-foreground">{message}</p>}
            {(!accessRequestsEnabled || preparedRequestId) && (
              <form className="space-y-5" onSubmit={handleInvite}>
                <div>
                  {accessRequestsEnabled ? (
                    <>
                      <h2 className="font-semibold">Convite para pedido aprovado</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Confira o e-mail e defina o nome do workspace antes de enviar.</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">A permissão para emitir convites é conferida pelo servidor.</p>
                  )}
                </div>
                <div className="space-y-2"><Label htmlFor="invitee-email">E-mail do profissional</Label><Input id="invitee-email" type="email" autoComplete="off" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="invite-workspace-name">Nome do workspace</Label><Input id="invite-workspace-name" autoComplete="organization" maxLength={120} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} required /></div>
                {message && <p role={messageKind === "success" ? "status" : "alert"} className={`text-sm ${messageKind === "success" ? "text-foreground" : "text-destructive"}`}>{message}</p>}
                <Button className="w-full" type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" aria-hidden="true" />}Enviar convite</Button>
              </form>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, Leaf, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

const RECOVERY_SESSION_KEY = "platform-password-recovery";
const RECOVERY_MARKER_TTL_MS = 15 * 60 * 1000;

type RecoveryMarker = {
  userId: string;
  expiresAt: number;
};

function readRecoveryMarker(): RecoveryMarker | null {
  try {
    const raw = window.sessionStorage.getItem(RECOVERY_SESSION_KEY);
    if (!raw) return null;
    const marker: unknown = JSON.parse(raw);
    if (typeof marker !== "object" || marker === null) return null;
    const value = marker as Partial<RecoveryMarker>;
    return typeof value.userId === "string" && value.userId.length > 0
      && typeof value.expiresAt === "number" && Number.isFinite(value.expiresAt)
      ? { userId: value.userId, expiresAt: value.expiresAt }
      : null;
  } catch {
    return null;
  }
}

function clearRecoveryMarker() {
  try {
    window.sessionStorage.removeItem(RECOVERY_SESSION_KEY);
  } catch {
    // Ignore unavailable session storage.
  }
}

function storeRecoveryMarker(userId: string, expiresAt: number) {
  try {
    window.sessionStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify({ userId, expiresAt }));
  } catch {
    // The active PASSWORD_RECOVERY event remains valid for this mount.
  }
}

export default function PlatformResetPasswordPage() {
  const [authReady, setAuthReady] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const lastSessionUserId = useRef<string | null>(null);
  const recoveryEventUserId = useRef<string | null>(null);
  const recoveryExpiresAt = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const { data: listener } = workspaceSupabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        clearRecoveryMarker();
        lastSessionUserId.current = null;
        recoveryEventUserId.current = null;
        recoveryExpiresAt.current = null;
        setRecoveryReady(false);
        setAuthReady(true);
        return;
      }

      const userId = session?.user.id;
      if (!userId) return;

      const marker = readRecoveryMarker();
      const identityChanged = (lastSessionUserId.current !== null && lastSessionUserId.current !== userId)
        || (marker !== null && marker.userId !== userId);
      if (identityChanged) {
        clearRecoveryMarker();
        recoveryEventUserId.current = null;
        recoveryExpiresAt.current = null;
        setRecoveryReady(false);
      }
      lastSessionUserId.current = userId;

      if (event === "PASSWORD_RECOVERY") {
        const expiresAt = Date.now() + RECOVERY_MARKER_TTL_MS;
        recoveryEventUserId.current = userId;
        recoveryExpiresAt.current = expiresAt;
        storeRecoveryMarker(userId, expiresAt);
        setRecoveryReady(true);
        setAuthReady(true);
      }
    });

    void workspaceSupabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setAuthReady(true);
      const userId = data.session?.user.id;
      if (sessionError || !userId) {
        if (!recoveryEventUserId.current) {
          clearRecoveryMarker();
          setRecoveryReady(false);
        }
        return;
      }

      if (lastSessionUserId.current !== null && lastSessionUserId.current !== userId) {
        clearRecoveryMarker();
        recoveryEventUserId.current = null;
        recoveryExpiresAt.current = null;
        setRecoveryReady(false);
      }
      lastSessionUserId.current = userId;

      const marker = readRecoveryMarker();
      if (marker && marker.userId === userId && marker.expiresAt > Date.now()) {
        recoveryExpiresAt.current = marker.expiresAt;
        setRecoveryReady(true);
        return;
      }
      if (marker) clearRecoveryMarker();

      const currentMountRecovery = recoveryEventUserId.current === userId
        && recoveryExpiresAt.current !== null
        && recoveryExpiresAt.current > Date.now();
      setRecoveryReady(currentMountRecovery);
    }).catch(() => {
      if (active) setAuthReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !recoveryReady) return;
    if (!recoveryExpiresAt.current || recoveryExpiresAt.current <= Date.now()) {
      clearRecoveryMarker();
      recoveryEventUserId.current = null;
      recoveryExpiresAt.current = null;
      setRecoveryReady(false);
      setError("O link de recuperação expirou. Solicite um novo link.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { error: updateError } = await workspaceSupabase.auth.updateUser({ password });
      if (updateError) {
        setError("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
        return;
      }
      clearRecoveryMarker();
      recoveryEventUserId.current = null;
      recoveryExpiresAt.current = null;
      setRecoveryReady(false);
      setPassword("");
      setPasswordConfirmation("");

      let signOutFailed = false;
      try {
        const { error: signOutError } = await workspaceSupabase.auth.signOut({ scope: "local" });
        signOutFailed = Boolean(signOutError);
      } catch {
        signOutFailed = true;
      }
      setSuccess(true);
      if (signOutFailed) setError("Senha atualizada, mas não foi possível encerrar a sessão local. Saia antes de continuar.");
    } catch {
      setError("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-background p-8 shadow-sm" aria-labelledby="platform-reset-title">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Leaf size={20} aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Administração da plataforma</p>
            <h1 id="platform-reset-title" className="text-2xl font-semibold">Redefinir senha</h1>
          </div>
        </div>

        {!authReady ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Validando link de recuperação...</p>
        ) : success ? (
          <div className="space-y-5">
            <p role="status" className="text-sm text-foreground">Senha atualizada. Você já pode entrar na plataforma.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" asChild><Link to="/platform/invitations"><ArrowLeft aria-hidden="true" />Voltar ao login</Link></Button>
          </div>
        ) : !recoveryReady ? (
          <div className="space-y-5">
            <p role="alert" className="text-sm text-destructive">Este link de recuperação é inválido, expirou ou já foi utilizado. Solicite um novo link.</p>
            <Button className="w-full" variant="outline" asChild><Link to="/platform/invitations"><ArrowLeft aria-hidden="true" />Voltar ao login</Link></Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <p className="text-sm text-muted-foreground">Escolha uma nova senha para sua conta da plataforma.</p>
            <div className="space-y-2">
              <Label htmlFor="platform-new-password">Nova senha</Label>
              <div className="relative"><KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="platform-new-password" className="pl-9" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-confirm-password">Confirmar nova senha</Label>
              <Input id="platform-confirm-password" type="password" autoComplete="new-password" minLength={6} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" aria-hidden="true" />}Atualizar senha</Button>
          </form>
        )}
      </section>
    </main>
  );
}

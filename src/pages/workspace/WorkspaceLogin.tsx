import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Leaf, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";

export default function WorkspaceLogin() {
  const { login, isAuthenticated, authReady } = useWorkspaceAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [platformAdminGuidance, setPlatformAdminGuidance] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && isAuthenticated) navigate("/workspace/patients", { replace: true });
  }, [authReady, isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPlatformAdminGuidance(false);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from?.startsWith("/workspace") ? from : "/workspace/patients", { replace: true });
    } else {
      const membershipMissing = result.message === "Este usuario nao possui uma membership workspace valida.";
      setPlatformAdminGuidance(membershipMissing);
      setError(membershipMissing
        ? "O login profissional é para nutricionistas convidados e exige uma membership ativa. Se você é administrador da plataforma, use a área de convites."
        : result.message ?? "Nao foi possivel entrar.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Leaf size={20} /></span>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Acesso profissional</p><h1 className="text-2xl font-semibold">Workspace</h1></div>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2"><Label htmlFor="workspace-email">E-mail</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="workspace-email" className="pl-9" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></div>
          <div className="space-y-2"><Label htmlFor="workspace-password">Senha</Label><div className="relative"><KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="workspace-password" className="pl-9" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div></div>
          {error && (
            <div role="alert" className="space-y-2 text-sm text-destructive">
              <p>{error}</p>
              {platformAdminGuidance && (
                <p>
                  <Link className="font-medium underline underline-offset-2" to="/platform/invitations">
                    Abrir convites da plataforma
                  </Link>
                </p>
              )}
            </div>
          )}
          <Button className="w-full" type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Entrar no workspace</Button>
        </form>
      </section>
    </main>
  );
}

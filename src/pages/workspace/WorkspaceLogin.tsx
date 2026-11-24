import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { WorkspaceAuthLayout } from "@/components/workspace/WorkspaceAuthLayout";

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
    <WorkspaceAuthLayout title="Entrar no workspace" eyebrow="Acesso profissional" footer={<>Não tem conta? <Link className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/workspace/signup">Criar meu workspace</Link></>}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2"><Label htmlFor="workspace-email">E-mail</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="workspace-email" className="h-11 pl-10" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></div>
          <div className="space-y-2"><Label htmlFor="workspace-password">Senha</Label><div className="relative"><KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="workspace-password" className="h-11 pl-10" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div></div>
          <div className="text-right"><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/workspace/forgot-password">Esqueci minha senha</Link></div>
          {error && (
            <div role="alert" className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200">
              <p>{error}</p>
              {platformAdminGuidance && (
                <p>
                  <Link className="font-medium underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/platform/invitations">
                    Abrir convites da plataforma
                  </Link>
                </p>
              )}
            </div>
          )}
          <Button className="h-11 w-full" type="submit" disabled={loading}>{loading && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}Entrar no workspace</Button>
        </form>
    </WorkspaceAuthLayout>
  );
}

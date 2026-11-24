import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, KeyRound, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { WorkspaceAuthLayout } from "@/components/workspace/WorkspaceAuthLayout";

type Step = "form" | "verify";

const WORKSPACE_NAME_KEY = "ws_signup_clinic_name";

export default function WorkspaceSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // Store clinic name so the callback can create the workspace
      try { sessionStorage.setItem(WORKSPACE_NAME_KEY, clinicName.trim()); } catch {
        // Signup metadata still carries the workspace name when storage is unavailable.
      }

      const { error: signUpError } = await workspaceSupabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { workspace_name: clinicName.trim() },
          emailRedirectTo: `${window.location.origin}/workspace`,
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setError("Este e-mail já possui uma conta. Faça login.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      setStep("verify");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <WorkspaceAuthLayout title="Verifique seu e-mail" eyebrow="Confirmação de conta" centered>
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Mail size={23} aria-hidden="true" />
          </span>
          <p className="text-sm leading-6 text-muted-foreground dark:text-zinc-300">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Clique no link para ativar sua conta e acessar o workspace.
          </p>
          <p className="mt-6 text-sm text-muted-foreground dark:text-zinc-300">
            Já confirmou?{" "}
            <button
              type="button"
              className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => navigate("/workspace/login")}
            >
              Ir para o login
            </button>
          </p>
        </div>
      </WorkspaceAuthLayout>
    );
  }

  return (
    <WorkspaceAuthLayout title="Criar workspace" eyebrow="30 dias grátis · R$79,90/mês" description="Crie seu workspace. O período gratuito começa após a confirmação do e-mail." footer={<>Já tem uma conta? <Link className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/workspace/login">Entrar</Link></>}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="clinic-name">Nome da clínica ou consultório</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="clinic-name"
                className="h-11 pl-10"
                placeholder="Ex: Clínica Nutrição Bem Estar"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                maxLength={120}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">E-mail profissional</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="signup-email"
                className="h-11 pl-10"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Senha</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="signup-password"
                className="h-11 pl-10"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-confirm">Confirmar senha</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="signup-confirm"
                className="h-11 pl-10"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200">{error}</p>}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
            Criar conta grátis
          </Button>
        </form>

        <p className="mt-5 border-t border-border/70 pt-4 text-center text-xs leading-5 text-muted-foreground dark:text-zinc-300">
          Ao criar sua conta você concorda com os nossos termos de uso.
          O período gratuito de 30 dias começa após a confirmação do e-mail.
        </p>
    </WorkspaceAuthLayout>
  );
}

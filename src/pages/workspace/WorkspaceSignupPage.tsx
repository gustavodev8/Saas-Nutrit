import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, KeyRound, Leaf, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

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
      try { sessionStorage.setItem(WORKSPACE_NAME_KEY, clinicName.trim()); } catch {}

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
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <section className="w-full max-w-md rounded-lg border bg-background p-8 shadow-sm text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f1eb]">
            <Mail size={26} className="text-[#166b50]" />
          </span>
          <h1 className="text-2xl font-semibold">Verifique seu e-mail</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Clique no link para ativar sua conta e acessar o workspace.
          </p>
          <p className="mt-5 text-xs text-muted-foreground">
            Já confirmou?{" "}
            <button
              type="button"
              className="font-medium text-[#166b50] hover:underline"
              onClick={() => navigate("/workspace/login")}
            >
              Ir para o login
            </button>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e6f1eb]">
            <Leaf size={20} className="text-[#166b50]" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              30 dias grátis · R$79,90/mês
            </p>
            <h1 className="text-2xl font-semibold">Criar workspace</h1>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="clinic-name">Nome da clínica ou consultório</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="clinic-name"
                className="pl-9"
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
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-email"
                className="pl-9"
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
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-password"
                className="pl-9"
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
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-confirm"
                className="pl-9"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#166b50] hover:bg-[#145e45] text-white"
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin" />}
            Criar conta grátis
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link className="font-medium text-[#166b50] hover:underline" to="/workspace/login">
            Entrar
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Ao criar sua conta você concorda com os nossos termos de uso.
          O período gratuito de 30 dias começa após a confirmação do e-mail.
        </p>
      </section>
    </main>
  );
}

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

export default function WorkspaceForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      await workspaceSupabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/platform/reset-password`,
      });
    } catch {
      // Keep provider failures indistinguishable from unknown email addresses.
    }
    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-md space-y-5 rounded-lg border bg-background p-8 shadow-sm" aria-labelledby="forgot-title">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Acesso profissional</p>
          <h1 id="forgot-title" className="text-2xl font-semibold">Recuperar senha</h1>
        </header>
        {status === "sent" ? (
          <div className="space-y-3">
            <p role="status">Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha. Se não chegar, confira o endereço e tente novamente mais tarde.</p>
            <Button type="button" variant="outline" className="w-full" onClick={() => setStatus("idle")}>Solicitar outro link</Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={send}>
            <div className="space-y-2">
              <Label htmlFor="recovery-email">E-mail profissional</Label>
              <Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={status === "sending"}>
              {status === "sending" && <Loader2 className="animate-spin" aria-hidden="true" />}Enviar link de recuperação
            </Button>
          </form>
        )}
        <Link className="block text-center text-sm font-medium text-primary underline-offset-2 hover:underline" to="/workspace/login">Voltar ao login profissional</Link>
      </section>
    </main>
  );
}

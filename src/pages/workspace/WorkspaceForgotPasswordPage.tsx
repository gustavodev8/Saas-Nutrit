import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { WorkspaceAuthLayout } from "@/components/workspace/WorkspaceAuthLayout";

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
    <WorkspaceAuthLayout title="Recuperar senha" eyebrow="Acesso profissional" description="Informe seu e-mail profissional para receber um link de recuperação." footer={<Link className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/workspace/login">Voltar ao login profissional</Link>}>
        {status === "sent" ? (
          <div className="space-y-5">
            <p role="status" className="rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-6">Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha. Se não chegar, confira o endereço e tente novamente mais tarde.</p>
            <Button type="button" variant="outline" className="h-11 w-full" onClick={() => setStatus("idle")}>Solicitar outro link</Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={send}>
            <div className="space-y-2">
              <Label htmlFor="recovery-email">E-mail profissional</Label>
              <Input id="recovery-email" className="h-11" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={status === "sending"}>
              {status === "sending" && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}Enviar link de recuperação
            </Button>
          </form>
        )}
    </WorkspaceAuthLayout>
  );
}

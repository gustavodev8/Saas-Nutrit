import { useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";

export default function PatientPortalLogin() {
  const { userEmail, patient, requestAccess, authReady, patientReady } = usePatientPortalAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(
    null,
  );
  const [searchParams] = useSearchParams();

  const infoMessage = useMemo(() => {
    if (searchParams.get("status") === "sem-acesso") {
      return "Este e-mail nao esta vinculado a um paciente com acesso liberado.";
    }
    return null;
  }, [searchParams]);

  if (authReady && patientReady && userEmail && patient) {
    return <Navigate to="/portal" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const result = await requestAccess(email);
    setFeedback({
      type: result.ok ? "success" : "error",
      message: result.message,
    });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <Card className="w-full border-border/60 shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl tracking-tight">Portal do paciente</CardTitle>
              <CardDescription>
                Entre com o e-mail cadastrado no seu prontuario para receber um link seguro de acesso.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {infoMessage}
              </div>
            ) : null}

            {feedback ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-destructive/20 bg-destructive/10 text-destructive"
                }`}
              >
                {feedback.message}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="portal-email" className="text-sm font-medium text-foreground">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="portal-email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-xl pl-9"
                  />
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl font-semibold">
                {submitting ? "Enviando..." : "Receber link de acesso"}
              </Button>
            </form>

            <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Use o mesmo e-mail informado durante o atendimento. Se precisar ajustar o cadastro, fale com a clinica.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

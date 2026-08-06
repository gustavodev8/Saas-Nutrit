import { useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";
import { usePatientPortalSettings } from "@/contexts/usePatientPortalSettings";

export default function PatientPortalLogin() {
  const { settings } = usePatientPortalSettings();
  const { userEmail, patient, loginWithCredentials, authReady, patientReady } =
    usePatientPortalAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(
    null,
  );
  const [searchParams] = useSearchParams();

  const infoMessage = useMemo(() => {
    if (searchParams.get("status") === "sem-acesso") {
      return "Este login nao esta vinculado a um paciente com acesso ativo.";
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

    const result = await loginWithCredentials(login, password);
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
              <CardTitle className="text-2xl tracking-tight">
                {settings.branding.portalTitle}
              </CardTitle>
              <CardDescription>{settings.branding.welcomeMessage}</CardDescription>
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
                <label htmlFor="portal-login" className="text-sm font-medium text-foreground">
                  Login
                </label>
                <div className="relative">
                  <UserRound
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    id="portal-login"
                    type="text"
                    placeholder="seu.login"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    className="h-11 rounded-xl pl-9"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="portal-password" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    id="portal-password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 rounded-xl pl-9"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-xl font-semibold"
              >
                {submitting ? "Entrando..." : "Entrar no portal"}
              </Button>
            </form>

            <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Seu login e sua senha sao definidos pelo admin. Se precisar de acesso,{" "}
              {settings.branding.supportLabel.toLowerCase()}.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Dumbbell, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PatientPortalDisabledState from "@/components/patient/PatientPortalDisabledState";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";
import { usePatientPortalSettings } from "@/contexts/usePatientPortalSettings";
import {
  createPortalTrainingLog,
  fetchPortalTrainingLogs,
  fetchPortalTrainingPlans,
} from "@/lib/patientPortalApi";
import type { PortalTrainingLog, PortalTrainingPlan, PortalTrainingSession } from "@/lib/portalTrainingTypes";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

const difficultyLabels = ["", "Leve", "Moderado", "Intenso"] as const;

export default function PatientPortalTraining() {
  const { patient } = usePatientPortalAuth();
  const { settings } = usePatientPortalSettings();
  const [plans, setPlans] = useState<PortalTrainingPlan[]>([]);
  const [logs, setLogs] = useState<PortalTrainingLog[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [performedAt, setPerformedAt] = useState(today());
  const [difficulty, setDifficulty] = useState<"easy" | "moderate" | "hard">("moderate");
  const [notes, setNotes] = useState("");
  const [loads, setLoads] = useState<Record<number, string>>({});

  const loadData = async (patientId: number) => {
    setLoading(true);
    setError(null);
    try {
      const nextPlans = await fetchPortalTrainingPlans(patientId);
      const nextLogs = await fetchPortalTrainingLogs(patientId, nextPlans.map((plan) => plan.id));
      setPlans(nextPlans);
      setLogs(nextLogs);
      setSelectedVersionId((current) => nextPlans.some((plan) => plan.id === current)
        ? current
        : nextPlans[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os treinos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patient?.id) void loadData(patient.id);
  }, [patient?.id]);

  const selectedPlan = plans.find((plan) => plan.id === selectedVersionId) ?? null;
  const activeSession = selectedPlan?.sessions.find((session) => session.id === activeSessionId) ?? null;

  if (!settings.navigation.training) {
    return (
      <PatientPortalDisabledState
        title="Treinos temporariamente ocultos"
        description="O responsavel pelo portal retirou este modulo da navegacao."
      />
    );
  }

  const resetForm = () => {
    setPerformedAt(today());
    setDifficulty("moderate");
    setNotes("");
    setLoads({});
  };

  const openSessionForm = (session: PortalTrainingSession) => {
    setActiveSessionId(session.id);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patient?.id || !selectedPlan || !activeSession) return;
    setSaving(true);
    const success = await createPortalTrainingLog({
      versionId: selectedPlan.id,
      sessionId: activeSession.id,
      patientId: patient.id,
      performedAt: new Date(`${performedAt}T12:00:00`).toISOString(),
      difficulty,
      notes,
      loads: activeSession.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        loadUsed: loads[exercise.id] ?? "",
      })),
    });
    setSaving(false);
    if (!success) {
      toast.error("Nao foi possivel registrar o treino. Tente novamente.");
      return;
    }
    toast.success("Treino registrado com sucesso.");
    setActiveSessionId(null);
    resetForm();
    await loadData(patient.id);
  };

  if (loading) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-3xl border border-border/60 bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Acompanhamento</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Meus treinos</h1>
        <p className="mt-2 text-sm text-muted-foreground">Consulte sua ficha e registre cada sessao realizada.</p>
      </section>

      {error ? (
        <Card className="rounded-3xl border-destructive/40">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" onClick={() => patient?.id && void loadData(patient.id)}>Tentar novamente</Button>
          </CardContent>
        </Card>
      ) : null}

      {!error && plans.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-border/80">
          <CardContent className="p-6 text-sm text-muted-foreground">Nenhuma ficha de treino foi liberada para voce ainda.</CardContent>
        </Card>
      ) : null}

      {plans.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedVersionId(plan.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${plan.id === selectedVersionId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
            >
              {plan.title} · v{plan.version}
            </button>
          ))}
        </div>
      ) : null}

      {selectedPlan ? (
        <>
          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Dumbbell size={18} />
                <CardTitle>{selectedPlan.title}</CardTitle>
              </div>
              <CardDescription>
                {selectedPlan.goal?.trim() || "Ficha de treino"}
                {selectedPlan.frequency?.trim() ? ` · ${selectedPlan.frequency}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {(selectedPlan.valid_from || selectedPlan.valid_until) ? (
                <p>Vigencia: {selectedPlan.valid_from || "-"} a {selectedPlan.valid_until || "em aberto"}</p>
              ) : null}
              {selectedPlan.general_notes?.trim() ? <p className="whitespace-pre-wrap">{selectedPlan.general_notes}</p> : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {selectedPlan.sessions.map((session) => {
              const sessionLogs = logs.filter((log) => log.version_id === selectedPlan.id && log.workout_session_id === session.id);
              const isActive = activeSessionId === session.id;
              return (
                <Card key={session.id} className="rounded-3xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    {session.notes?.trim() ? <CardDescription>{session.notes}</CardDescription> : null}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.exercises.map((exercise) => (
                      <div key={exercise.id} className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold text-foreground">{exercise.name}</p>
                          {exercise.demo_url ? (
                            <a href={exercise.demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                              Demonstracao <ExternalLink size={13} />
                            </a>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {exercise.sets ? `${exercise.sets} series` : "Series nao informadas"}
                          {exercise.repetitions ? ` · ${exercise.repetitions} repeticoes` : ""}
                          {exercise.reference_load ? ` · Carga: ${exercise.reference_load}` : ""}
                          {exercise.rest ? ` · Descanso: ${exercise.rest}` : ""}
                        </p>
                        {exercise.instructions?.trim() ? <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{exercise.instructions}</p> : null}
                      </div>
                    ))}

                    <Button type="button" variant={isActive ? "secondary" : "outline"} className="w-full rounded-xl" onClick={() => isActive ? setActiveSessionId(null) : openSessionForm(session)}>
                      {isActive ? "Fechar registro" : "Registrar treino realizado"}
                    </Button>

                    {isActive ? (
                      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`performed-${session.id}`}>Data do treino</Label>
                            <Input id={`performed-${session.id}`} type="date" required value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`difficulty-${session.id}`}>Dificuldade percebida</Label>
                            <select id={`difficulty-${session.id}`} value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <option value="easy">Leve</option>
                              <option value="moderate">Moderado</option>
                              <option value="hard">Intenso</option>
                            </select>
                          </div>
                        </div>
                        {session.exercises.map((exercise) => (
                          <div key={exercise.id} className="space-y-2">
                            <Label htmlFor={`load-${exercise.id}`}>Carga usada · {exercise.name}</Label>
                            <Input id={`load-${exercise.id}`} value={loads[exercise.id] ?? ""} onChange={(event) => setLoads((current) => ({ ...current, [exercise.id]: event.target.value }))} placeholder="Ex.: 20 kg" />
                          </div>
                        ))}
                        <div className="space-y-2">
                          <Label htmlFor={`notes-${session.id}`}>Observacoes</Label>
                          <Textarea id={`notes-${session.id}`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Como foi o treino?" />
                        </div>
                        <Button type="submit" className="w-full rounded-xl" disabled={saving || !performedAt}>
                          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          Salvar registro
                        </Button>
                      </form>
                    ) : null}

                    {sessionLogs.length > 0 ? (
                      <details className="rounded-2xl border border-border/60 px-4 py-3">
                        <summary className="cursor-pointer text-sm font-semibold">Historico ({sessionLogs.length})</summary>
                        <div className="mt-3 space-y-3">
                          {sessionLogs.map((log) => (
                            <div key={log.id} className="border-t border-border/60 pt-3 text-sm">
                              <p className="font-medium">{new Date(log.performed_at).toLocaleDateString("pt-BR", { timeZone: "UTC" })} · Dificuldade {difficultyLabels[log.perceived_difficulty] ?? "registrada"}</p>
                              {log.exercises.map((item) => (
                                <p key={item.id ?? `${item.exercise_id}-${log.id}`} className="mt-1 text-muted-foreground">{item.exercise_name}: {item.load_used || "carga nao informada"}</p>
                              ))}
                              {log.notes?.trim() ? <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{log.notes}</p> : null}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
            {selectedPlan.sessions.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-border/80"><CardContent className="p-5 text-sm text-muted-foreground">Esta ficha ainda nao tem sessoes cadastradas.</CardContent></Card>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

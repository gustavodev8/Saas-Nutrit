import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react";
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

function formatIsoDate(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function MetaChip({ icon: Icon, children }: { icon: typeof Activity; children: string }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 text-xs font-medium text-muted-foreground">
      <Icon aria-hidden="true" size={14} className="text-primary" />
      {children}
    </span>
  );
}

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

  const loadData = useCallback(async (patientId: number) => {
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
      setActiveSessionId((current) => nextPlans.some((plan) =>
        plan.sessions.some((session) => session.id === current)) ? current : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os treinos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patient?.id) void loadData(patient.id);
  }, [patient?.id, loadData]);

  const selectedPlan = plans.find((plan) => plan.id === selectedVersionId) ?? null;
  const activeSession = selectedPlan?.sessions.find((session) => session.id === activeSessionId) ?? null;

  if (!settings.navigation.training) {
    return (
      <PatientPortalDisabledState
        title="Treinos temporariamente ocultos"
        description="O responsável pelo portal retirou este módulo da navegação."
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
    if (!patient?.id || !selectedPlan || !activeSession || saving) return;

    setSaving(true);
    let success = false;
    try {
      success = await createPortalTrainingLog({
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
    } catch {
      success = false;
    } finally {
      setSaving(false);
    }

    if (!success) {
      toast.error("Não foi possível registrar o treino. Tente novamente.");
      return;
    }

    toast.success("Treino registrado com sucesso.");
    setActiveSessionId(null);
    resetForm();
    await loadData(patient.id);
  };

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="space-y-4" aria-busy="true">
        <span className="sr-only">Carregando suas fichas de treino</span>
        <div className="rounded-3xl bg-primary/90 p-6 text-primary-foreground shadow-sm">
          <div className="h-3 w-28 animate-pulse rounded bg-white/25" />
          <div className="mt-4 h-7 w-52 animate-pulse rounded bg-white/25" />
          <div className="mt-3 h-4 max-w-sm animate-pulse rounded bg-white/20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <Card key={item} className="rounded-3xl border-border/60">
              <CardContent className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted/70" />
                <div className="h-16 w-full animate-pulse rounded-2xl bg-muted/50" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-2">
      <section className="overflow-hidden rounded-3xl bg-primary px-5 py-6 text-primary-foreground shadow-sm sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Acompanhamento</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Meus treinos</h1>
            <p className="mt-2 text-sm leading-6 opacity-90">
              Consulte sua ficha e registre cada sessão realizada no seu ritmo.
            </p>
          </div>
          {selectedPlan ? (
            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
              <Dumbbell aria-hidden="true" size={17} />
              <span>{selectedPlan.sessions.length} {selectedPlan.sessions.length === 1 ? "sessão" : "sessões"} na ficha</span>
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <Card role="alert" className="rounded-3xl border-destructive/30 bg-destructive/[0.03]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Activity aria-hidden="true" size={18} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Não foi possível carregar seus treinos</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => patient?.id && void loadData(patient.id)}>
              <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!error && plans.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-border/80 bg-card">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Dumbbell aria-hidden="true" size={24} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">Sua ficha ainda não está disponível</h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Quando uma ficha de treino for liberada para você, ela aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {plans.length > 1 ? (
        <section aria-labelledby="training-plan-list-title" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Suas fichas</p>
              <h2 id="training-plan-list-title" className="mt-1 text-base font-semibold text-foreground">Escolha uma ficha</h2>
            </div>
            <span className="text-xs text-muted-foreground">{plans.length} disponíveis</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan, index) => {
              const isSelected = plan.id === selectedVersionId;
              return (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedVersionId(plan.id);
                    setActiveSessionId(null);
                    resetForm();
                  }}
                  className={`rounded-3xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                      <Dumbbell aria-hidden="true" size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{plan.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">v{plan.version}</span>
                        {index === 0 ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Atual</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{plan.goal?.trim() || "Ficha de treino"}</p>
                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        {plan.sessions.length} {plan.sessions.length === 1 ? "sessão" : "sessões"}
                        {plan.frequency?.trim() ? ` · ${plan.frequency}` : ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedPlan ? (
        <>
          <Card className="overflow-hidden rounded-3xl border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/20 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Activity aria-hidden="true" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg leading-snug sm:text-xl">{selectedPlan.title}</CardTitle>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">Ficha publicada</span>
                  </div>
                  <CardDescription className="mt-1.5 text-sm">
                    {selectedPlan.goal?.trim() || "Acompanhe os exercícios e registre cada sessão."}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedPlan.frequency?.trim() ? <MetaChip icon={CalendarDays}>{selectedPlan.frequency}</MetaChip> : null}
                {(selectedPlan.valid_from || selectedPlan.valid_until) ? (
                  <MetaChip icon={Clock3}>
                    {formatIsoDate(selectedPlan.valid_from) ?? "Início não informado"} – {formatIsoDate(selectedPlan.valid_until) ?? "sem data final"}
                  </MetaChip>
                ) : null}
                <MetaChip icon={Dumbbell}>{selectedPlan.sessions.length} {selectedPlan.sessions.length === 1 ? "sessão" : "sessões"}</MetaChip>
              </div>
            </CardHeader>
            {selectedPlan.general_notes?.trim() ? (
              <CardContent className="p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Orientações da ficha</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/85">{selectedPlan.general_notes}</p>
              </CardContent>
            ) : null}
          </Card>

          <section aria-labelledby="training-sessions-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Programa</p>
                <h2 id="training-sessions-title" className="mt-1 text-base font-semibold text-foreground">Sessões da ficha</h2>
              </div>
              <span className="text-xs text-muted-foreground">{selectedPlan.sessions.length} no total</span>
            </div>

            {selectedPlan.sessions.length > 0 ? (
              <div className="space-y-4">
                {selectedPlan.sessions.map((session, sessionIndex) => {
                  const sessionLogs = logs.filter((log) => log.version_id === selectedPlan.id && log.workout_session_id === session.id);
                  const isActive = activeSessionId === session.id;
                  return (
                    <Card key={session.id} className={`overflow-hidden rounded-3xl border-border/60 shadow-sm ${isActive ? "ring-1 ring-primary/25" : ""}`}>
                      <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                              <span className="text-sm font-bold">{String(sessionIndex + 1).padStart(2, "0")}</span>
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-base sm:text-lg">{session.title}</CardTitle>
                              {session.notes?.trim() ? <CardDescription className="mt-1.5 leading-5">{session.notes}</CardDescription> : null}
                            </div>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Dumbbell aria-hidden="true" size={14} className="text-primary" />
                            {session.exercises.length} {session.exercises.length === 1 ? "exercício" : "exercícios"}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
                        {session.exercises.length > 0 ? (
                          <ol className="space-y-2.5">
                            {session.exercises.map((exercise, exerciseIndex) => (
                              <li key={exercise.id} className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-background text-[11px] font-semibold text-muted-foreground">
                                    {exerciseIndex + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                                      {exercise.demo_url ? (
                                        <a href={exercise.demo_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                          Ver demonstração <ExternalLink aria-hidden="true" size={13} />
                                        </a>
                                      ) : null}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {exercise.sets ? <MetaChip icon={Activity}>{exercise.sets} séries</MetaChip> : null}
                                      {exercise.repetitions ? <MetaChip icon={RefreshCw}>{exercise.repetitions} repetições</MetaChip> : null}
                                      {exercise.reference_load ? <MetaChip icon={Dumbbell}>Carga: {exercise.reference_load}</MetaChip> : null}
                                      {exercise.rest ? <MetaChip icon={Clock3}>Descanso: {exercise.rest}</MetaChip> : null}
                                      {!exercise.sets && !exercise.repetitions && !exercise.reference_load && !exercise.rest ? (
                                        <span className="text-xs text-muted-foreground">Detalhes não informados</span>
                                      ) : null}
                                    </div>
                                    {exercise.instructions?.trim() ? (
                                      <p className="mt-3 whitespace-pre-wrap border-l-2 border-primary/30 pl-3 text-sm leading-6 text-muted-foreground">{exercise.instructions}</p>
                                    ) : null}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                            Esta sessão ainda não tem exercícios detalhados.
                          </div>
                        )}

                        <Button
                          type="button"
                          variant={isActive ? "secondary" : "outline"}
                          className="w-full rounded-xl sm:w-auto"
                          aria-expanded={isActive}
                          aria-controls={`training-log-form-${session.id}`}
                          onClick={() => isActive ? setActiveSessionId(null) : openSessionForm(session)}
                        >
                          {isActive ? "Fechar registro" : "Registrar treino realizado"}
                        </Button>

                        {isActive ? (
                          <form id={`training-log-form-${session.id}`} onSubmit={(event) => void handleSubmit(event)} className="space-y-5 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CheckCircle2 aria-hidden="true" size={17} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">Registrar esta sessão</h3>
                                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Informe como foi o treino. O registro fica no seu histórico.</p>
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`performed-${session.id}`}>Data do treino</Label>
                                <Input id={`performed-${session.id}`} type="date" required max={today()} value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`difficulty-${session.id}`}>Dificuldade percebida</Label>
                                <select id={`difficulty-${session.id}`} value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                  <option value="easy">Leve</option>
                                  <option value="moderate">Moderado</option>
                                  <option value="hard">Intenso</option>
                                </select>
                              </div>
                            </div>

                            {session.exercises.length > 0 ? (
                              <fieldset className="space-y-3">
                                <legend className="text-sm font-semibold text-foreground">Carga usada por exercício <span className="font-normal text-muted-foreground">(opcional)</span></legend>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {session.exercises.map((exercise) => (
                                    <div key={exercise.id} className="space-y-2">
                                      <Label htmlFor={`load-${exercise.id}`} className="text-xs leading-5">{exercise.name}</Label>
                                      <Input id={`load-${exercise.id}`} value={loads[exercise.id] ?? ""} onChange={(event) => setLoads((current) => ({ ...current, [exercise.id]: event.target.value }))} placeholder="Ex.: 20 kg" className="rounded-xl" />
                                    </div>
                                  ))}
                                </div>
                              </fieldset>
                            ) : null}

                            <div className="space-y-2">
                              <Label htmlFor={`notes-${session.id}`}>Observações <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                              <Textarea id={`notes-${session.id}`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anote como se sentiu ou algo que queira lembrar." className="min-h-24 resize-y rounded-xl" />
                            </div>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                              <Button type="button" variant="ghost" className="rounded-xl" disabled={saving} onClick={() => setActiveSessionId(null)}>Cancelar</Button>
                              <Button type="submit" className="rounded-xl" disabled={saving || !performedAt}>
                                {saving ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />}
                                {saving ? "Salvando…" : "Salvar treino"}
                              </Button>
                            </div>
                          </form>
                        ) : null}

                        {sessionLogs.length > 0 ? (
                          <details className="group rounded-2xl border border-border/60 bg-muted/10">
                            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                              <History aria-hidden="true" size={16} className="text-primary" />
                              <span>Histórico de treinos</span>
                              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{sessionLogs.length}</span>
                              <span className="sr-only">Abrir ou fechar histórico</span>
                            </summary>
                            <div className="space-y-3 border-t border-border/60 px-4 py-3">
                              {sessionLogs.map((log) => (
                                <article key={log.id} className="rounded-xl bg-background/80 p-3">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <p className="text-sm font-semibold text-foreground">
                                      {new Date(log.performed_at).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                                    </p>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                      {difficultyLabels[log.perceived_difficulty] ?? "Dificuldade registrada"}
                                    </span>
                                  </div>
                                  {log.exercises.length > 0 ? (
                                    <ul className="mt-2 space-y-1">
                                      {log.exercises.map((item) => (
                                        <li key={item.id ?? `${item.exercise_id}-${log.id}`} className="text-xs leading-5 text-muted-foreground">
                                          <span className="font-medium text-foreground/80">{item.exercise_name}:</span> {item.load_used || "carga não informada"}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                  {log.notes?.trim() ? <p className="mt-2 whitespace-pre-wrap border-t border-border/50 pt-2 text-xs leading-5 text-muted-foreground">{log.notes}</p> : null}
                                </article>
                              ))}
                            </div>
                          </details>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="rounded-3xl border-dashed border-border/80">
                <CardContent className="flex flex-col items-center px-6 py-9 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Activity aria-hidden="true" size={21} />
                  </div>
                  <p className="mt-3 font-semibold text-foreground">Nenhuma sessão cadastrada</p>
                  <p className="mt-1 text-sm text-muted-foreground">As sessões desta ficha aparecerão aqui quando forem adicionadas.</p>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

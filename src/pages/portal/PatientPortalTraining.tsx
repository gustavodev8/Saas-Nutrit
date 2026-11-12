import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  ExternalLink,
  History,
  Loader2,
  Play,
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
    <span className="inline-flex min-h-8 max-w-full min-w-0 items-center gap-1.5 whitespace-normal break-words rounded-full border border-border/60 bg-background/80 px-3 text-xs font-medium text-muted-foreground max-[390px]:px-2.5">
      <Icon aria-hidden="true" size={14} className="text-primary" />
      {children}
    </span>
  );
}

function PrescriptionCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <span className="rounded-xl border border-border/60 bg-muted/20 px-2.5 py-2.5">
      <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="mt-1 block truncate text-xs font-semibold text-foreground">{value?.trim() || "—"}</span>
    </span>
  );
}

type TrainingLogDraft = {
  performedAt: string;
  difficulty: "easy" | "moderate" | "hard";
  notes: string;
  loads: Record<number, string>;
};

function emptyTrainingLogDraft(): TrainingLogDraft {
  return { performedAt: today(), difficulty: "moderate", notes: "", loads: {} };
}

export default function PatientPortalTraining() {
  const { patient } = usePatientPortalAuth();
  const { settings } = usePatientPortalSettings();
  const [plans, setPlans] = useState<PortalTrainingPlan[]>([]);
  const [logs, setLogs] = useState<PortalTrainingLog[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [focusedSessionId, setFocusedSessionId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [performedAt, setPerformedAt] = useState(today());
  const [difficulty, setDifficulty] = useState<"easy" | "moderate" | "hard">("moderate");
  const [notes, setNotes] = useState("");
  const [loads, setLoads] = useState<Record<number, string>>({});
  const [logDrafts, setLogDrafts] = useState<Record<number, TrainingLogDraft>>({});

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
      setFocusedSessionId((current) => {
        return nextPlans.some((plan) => plan.sessions.some((session) => session.id === current))
          ? current
          : nextPlans[0]?.sessions[0]?.id ?? null;
      });
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
  const focusedSession = selectedPlan?.sessions.find((session) => session.id === focusedSessionId)
    ?? selectedPlan?.sessions[0]
    ?? null;
  const focusedSessionIndex = focusedSession
    ? selectedPlan?.sessions.findIndex((session) => session.id === focusedSession.id) ?? -1
    : -1;
  const activeSession = selectedPlan?.sessions.find((session) => session.id === activeSessionId) ?? null;
  const sessionProgress = selectedPlan && focusedSessionIndex >= 0
    ? Math.round(((focusedSessionIndex + 1) / Math.max(selectedPlan.sessions.length, 1)) * 100)
    : 0;

  if (!settings.navigation.training) {
    return (
      <PatientPortalDisabledState
        title="Treinos temporariamente ocultos"
        description="O responsável pelo portal retirou este módulo da navegação."
      />
    );
  }

  const resetForm = (draft: TrainingLogDraft = emptyTrainingLogDraft()) => {
    setPerformedAt(draft.performedAt);
    setDifficulty(draft.difficulty);
    setNotes(draft.notes);
    setLoads({ ...draft.loads });
  };

  const saveCurrentDraft = () => {
    if (activeSessionId === null) return;
    setLogDrafts((current) => ({
      ...current,
      [activeSessionId]: { performedAt, difficulty, notes, loads: { ...loads } },
    }));
  };

  const switchToSession = (sessionId: number) => {
    saveCurrentDraft();
    setFocusedSessionId(sessionId);
    setActiveSessionId(null);
    resetForm(logDrafts[sessionId]);
  };

  const cancelSessionForm = () => {
    if (activeSessionId !== null) {
      setLogDrafts((current) => {
        const next = { ...current };
        delete next[activeSessionId];
        return next;
      });
    }
    setActiveSessionId(null);
    resetForm();
  };

  const openSessionForm = (session: PortalTrainingSession) => {
    setFocusedSessionId(session.id);
    setActiveSessionId(session.id);
    resetForm(logDrafts[session.id]);
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
    setLogDrafts((current) => {
      const next = { ...current };
      delete next[activeSession.id];
      return next;
    });
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
    <div className="space-y-5 pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:pb-2">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card px-5 py-6 shadow-sm max-[390px]:px-4 max-[390px]:py-5 sm:px-6">
        <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Acompanhamento</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Meus treinos</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Consulte sua ficha e registre cada sessão realizada no seu ritmo.
            </p>
          </div>
          {selectedPlan ? (
            <div className="flex max-w-full shrink-0 items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm max-[390px]:px-3 max-[390px]:py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Dumbbell aria-hidden="true" size={17} /></span>
              <span className="text-foreground"><strong className="block text-base leading-5">{selectedPlan.sessions.length}</strong><span className="text-xs text-muted-foreground">{selectedPlan.sessions.length === 1 ? "sessão disponível" : "sessões disponíveis"}</span></span>
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
        <section aria-labelledby="training-plan-list-title" className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-5">
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
                    setFocusedSessionId(plan.sessions[0]?.id ?? null);
                    setActiveSessionId(null);
                    setLogDrafts({});
                    resetForm();
                  }}
                    className={`rounded-3xl border p-4 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 max-[390px]:p-3.5 ${
                    isSelected
                      ? "border-primary bg-primary/[0.05] shadow-md shadow-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-md"
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
          <Card className="overflow-hidden rounded-3xl border-primary/15 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-primary/[0.035] p-5 sm:p-6">
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

          <section aria-labelledby="training-sessions-title" className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Programa</p>
                <h2 id="training-sessions-title" className="mt-1 text-base font-semibold text-foreground">Sessões da ficha</h2>
              </div>
              <span className="text-xs text-muted-foreground">{selectedPlan.sessions.length} no total</span>
            </div>

            {selectedPlan.sessions.length > 0 ? (
              <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                <nav aria-label="Navegar entre sessões" className="flex w-max min-w-full gap-2 sm:w-auto sm:min-w-0">
                  {selectedPlan.sessions.map((session, index) => {
                    const isFocused = focusedSession?.id === session.id;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        aria-current={isFocused ? "step" : undefined}
                        onClick={() => switchToSession(session.id)}
                        className={`flex min-h-12 min-w-32 max-w-56 items-center gap-2 rounded-2xl border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-w-36 ${
                          isFocused
                            ? "border-primary/30 bg-primary/[0.07] text-primary shadow-sm"
                            : "border-border/60 bg-card text-muted-foreground hover:border-primary/25 hover:bg-primary/[0.025]"
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${isFocused ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold">{session.title}</span>
                          <span className="mt-0.5 block text-[10px] opacity-75">{session.exercises.length} {session.exercises.length === 1 ? "exercício" : "exercícios"}</span>
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            ) : null}

            {selectedPlan.sessions.length > 0 ? (
              <div>
                {selectedPlan.sessions.filter((session) => session.id === focusedSession?.id).map((session) => {
                  const sessionIndex = focusedSessionIndex;
                  const sessionLogs = logs.filter((log) => log.version_id === selectedPlan.id && log.workout_session_id === session.id);
                  const isActive = activeSessionId === session.id;
                  return (
                    <Card key={session.id} className={`overflow-visible rounded-3xl border-border/60 shadow-sm transition-shadow motion-reduce:transition-none ${isActive ? "ring-1 ring-primary/25 shadow-md shadow-primary/5" : ""}`}>
                      <CardHeader className="rounded-t-3xl border-b border-border/50 bg-muted/[0.08] p-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                              <span className="text-sm font-bold">{String(sessionIndex + 1).padStart(2, "0")}</span>
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="break-words text-base sm:text-lg">{session.title}</CardTitle>
                              {session.notes?.trim() ? <CardDescription className="mt-1.5 leading-5">{session.notes}</CardDescription> : null}
                            </div>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Dumbbell aria-hidden="true" size={14} className="text-primary" />
                            {session.exercises.length} {session.exercises.length === 1 ? "exercício" : "exercícios"}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                            <span>Sessão {sessionIndex + 1} de {selectedPlan.sessions.length}</span>
                            <span>{sessionProgress}%</span>
                          </div>
                          <progress
                            value={sessionProgress}
                            max={100}
                            aria-label="Progresso entre as sessões"
                            className="h-1.5 w-full overflow-hidden rounded-full bg-muted accent-primary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
                          />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 p-5 pt-0 max-[390px]:px-3.5 max-[390px]:pb-3.5 sm:p-6 sm:pt-0">
                        {session.exercises.length > 0 ? (
                          <div className="rounded-2xl border border-border/60 bg-muted/[0.06]">
                            <div className="flex min-h-12 items-center gap-2 px-4 text-sm font-semibold text-foreground max-[390px]:px-3">
                              <Dumbbell aria-hidden="true" size={15} className="shrink-0 text-primary" />
                              <span>Exercícios</span>
                              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{session.exercises.length}</span>
                            </div>
                            <ol className="grid gap-2.5 border-t border-border/60 p-3 max-[390px]:p-2.5">
                            {session.exercises.map((exercise, exerciseIndex) => (
                              <li key={exercise.id} className="rounded-2xl border border-border/60 bg-background p-3.5 shadow-sm sm:p-4">
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[11px] font-bold text-primary">
                                    {String(exerciseIndex + 1).padStart(2, "0")}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <h3 className="break-words font-semibold text-foreground">{exercise.name}</h3>
                                      {exercise.demo_url ? (
                                        <a href={exercise.demo_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                          Ver demonstração <ExternalLink aria-hidden="true" size={13} />
                                        </a>
                                      ) : null}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                                      <PrescriptionCell label="Séries" value={exercise.sets} />
                                      <PrescriptionCell label="Repetições" value={exercise.repetitions} />
                                      <PrescriptionCell label="Carga" value={exercise.reference_load} />
                                      <PrescriptionCell label="Intervalo" value={exercise.rest} />
                                    </div>
                                    {exercise.instructions?.trim() ? (
                                      <details className="group mt-3 rounded-xl border border-border/50 bg-muted/10">
                                        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between px-3 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                                          Orientações de execução
                                          <ChevronRight aria-hidden="true" size={14} className="text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none" />
                                        </summary>
                                        <p className="whitespace-pre-wrap border-t border-border/50 px-3 py-2.5 text-sm leading-6 text-muted-foreground">{exercise.instructions}</p>
                                      </details>
                                    ) : null}
                                  </div>
                                </div>
                              </li>
                            ))}
                            </ol>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                            Esta sessão ainda não tem exercícios detalhados.
                          </div>
                        )}

                        <div className="sticky bottom-[calc(6rem_+_env(safe-area-inset-bottom)_+_0.75rem)] z-10 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-lg backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                          <Button
                            type="button"
                            variant={isActive ? "secondary" : "default"}
                            className="min-h-12 w-full rounded-xl sm:w-auto"
                            aria-expanded={isActive}
                            aria-controls={isActive ? `training-log-form-${session.id}` : undefined}
                            onClick={() => isActive ? setActiveSessionId(null) : openSessionForm(session)}
                          >
                            {!isActive ? <Play aria-hidden="true" className="mr-2 h-4 w-4 fill-current" /> : null}
                            {isActive ? "Fechar registro" : "Iniciar e registrar treino"}
                          </Button>
                        </div>

                        {isActive ? (
                          <form id={`training-log-form-${session.id}`} onSubmit={(event) => void handleSubmit(event)} className="space-y-5 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 shadow-sm max-[390px]:p-3.5 sm:p-5">
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
                                <select id={`difficulty-${session.id}`} value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} className="flex h-11 min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
                            <div className="sticky bottom-[calc(6rem_+_env(safe-area-inset-bottom)_+_0.75rem)] z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-border/60 bg-card/95 px-4 pb-1 pt-3 backdrop-blur-xl sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
                              <Button type="button" variant="ghost" className="min-h-11 rounded-xl" disabled={saving} onClick={cancelSessionForm}>Cancelar</Button>
                              <Button type="submit" className="min-h-11 rounded-xl" disabled={saving || !performedAt}>
                                {saving ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />}
                                {saving ? "Salvando…" : "Salvar treino"}
                              </Button>
                            </div>
                          </form>
                        ) : null}

                        {sessionLogs.length > 0 ? (
                          <details className="group rounded-2xl border border-border/60 bg-muted/[0.08]">
                            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
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
                        {selectedPlan.sessions.length > 1 ? (
                          <div className="flex items-center justify-between border-t border-border/50 pt-4">
                            <Button type="button" variant="ghost" className="min-h-11 rounded-xl px-3" disabled={sessionIndex <= 0} onClick={() => { const previousSessionId = selectedPlan.sessions[sessionIndex - 1]?.id; if (previousSessionId !== undefined) switchToSession(previousSessionId); }}>
                              <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" /> Anterior
                            </Button>
                            <span className="text-xs tabular-nums text-muted-foreground">{sessionIndex + 1} / {selectedPlan.sessions.length}</span>
                            <Button type="button" variant="ghost" className="min-h-11 rounded-xl px-3" disabled={sessionIndex >= selectedPlan.sessions.length - 1} onClick={() => { const nextSessionId = selectedPlan.sessions[sessionIndex + 1]?.id; if (nextSessionId !== undefined) switchToSession(nextSessionId); }}>
                              Próxima <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
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

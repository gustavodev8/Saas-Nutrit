import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardPlus,
  Dumbbell,
  FileText,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  archiveTrainingPlan,
  createTrainingPlan,
  createTrainingPlanVersion,
  fetchFullTrainingPlan,
  fetchTrainingPlans,
  publishTrainingPlan,
  saveTrainingPlan,
  type TrainingPlan,
  type TrainingSession,
} from "@/lib/trainingPlans";

const statusLabel: Record<TrainingPlan["status"], string> = {
  draft: "Rascunho",
  published: "Publicada",
  archived: "Arquivada",
};

const statusClass: Record<TrainingPlan["status"], string> = {
  draft: "border-border bg-muted/40 text-muted-foreground",
  published: "border-primary/20 bg-primary/10 text-primary",
  archived: "border-border bg-background text-muted-foreground",
};

function StatusBadge({ status }: { status: TrainingPlan["status"] }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass[status]}`}>
      {statusLabel[status]}
    </span>
  );
}

export function PatientTrainingTab({ patientId }: { patientId: number }) {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [selected, setSelected] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (selectedId?: number) => {
    setLoading(true);
    try {
      const next = await fetchTrainingPlans(patientId);
      setPlans(next);
      const id = selectedId ?? selected?.id;
      const active = id ? await fetchFullTrainingPlan(id) : null;
      setSelected(active ?? null);
      setError(null);
    } catch {
      setError("Não foi possível carregar as fichas. Verifique a conexão e as permissões do banco.");
    } finally {
      setLoading(false);
    }
  }, [patientId, selected?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const update = (patch: Partial<TrainingPlan>) => setSelected((current) => current ? { ...current, ...patch } : current);
  const updateSession = (index: number, patch: Partial<TrainingSession>) => setSelected((current) => current ? {
    ...current,
    sessions: (current.sessions ?? []).map((session, i) => i === index ? { ...session, ...patch } : session),
  } : current);

  const updateExercise = (
    sessionIndex: number,
    exerciseIndex: number,
    patch: Partial<TrainingSession["exercises"][number]>,
  ) => setSelected((current) => {
    if (!current) return current;
    return {
      ...current,
      sessions: (current.sessions ?? []).map((session, index) => index === sessionIndex
        ? {
          ...session,
          exercises: session.exercises.map((exercise, exerciseIndexInSession) => exerciseIndexInSession === exerciseIndex
            ? { ...exercise, ...patch }
            : exercise),
        }
        : session),
    };
  });

  const create = async () => {
    try {
      const plan = await createTrainingPlan(patientId);
      setSelected(plan);
      await refresh(plan.id);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível criar a ficha.");
    }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const saved = await saveTrainingPlan(selected);
      setSelected(saved);
      await refresh(saved.id);
      toast.success("Ficha salva.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível salvar a ficha.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const saved = await saveTrainingPlan(selected);
      await publishTrainingPlan(saved);
      await refresh(saved.id);
      toast.success("Ficha publicada no portal.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível publicar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card px-5 py-14 text-center" role="status" aria-live="polite">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">Carregando fichas de treino…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Acompanhamento</p>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Treinos</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Organize as sessões e compartilhe a ficha publicada no portal do paciente.
            </p>
          </div>
        </div>
        <Button onClick={() => void create()} className="w-full shrink-0 rounded-xl sm:w-auto">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Nova ficha
        </Button>
      </header>

      {error ? (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-destructive">
            <Activity className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} className="rounded-xl self-start sm:self-auto">
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {loading && plans.length > 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Atualizando fichas…
        </p>
      ) : null}

      {plans.length > 0 ? (
        <section aria-labelledby="training-plan-list-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Biblioteca do paciente</p>
              <h3 id="training-plan-list-heading" className="mt-1 text-base font-semibold text-foreground">Fichas cadastradas</h3>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {plans.length} {plans.length === 1 ? "ficha" : "fichas"}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="Selecionar ficha de treino">
            {plans.map((plan) => {
              const active = selected?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => void refresh(plan.id)}
                  className={`group min-w-0 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${active ? "border-primary/40 bg-primary/[0.04] shadow-sm" : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/20"}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground">{plan.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">Versão {plan.version}</span>
                    </span>
                    <StatusBadge status={plan.status} />
                  </span>
                  <span className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span>{plan.frequency || "Frequência não definida"}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${active ? "translate-x-0.5 text-primary" : "group-hover:translate-x-0.5"}`} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-border/70 bg-muted/10 px-5 py-10 text-center sm:py-14" aria-labelledby="training-empty-heading">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 id="training-empty-heading" className="mt-4 font-display text-lg font-semibold text-foreground">Nenhuma ficha por aqui</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Crie uma ficha para organizar os exercícios e acompanhar a rotina deste paciente.
          </p>
          <Button type="button" onClick={() => void create()} className="mt-5 rounded-xl">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Criar primeira ficha
          </Button>
        </section>
      )}

      {selected ? (
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm" aria-labelledby="training-editor-heading">
          <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/10 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="training-editor-heading" className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {selected.title || "Nova ficha de treino"}
                </h3>
                <StatusBadge status={selected.status} />
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Versão {selected.version}</span>
                <span aria-hidden="true">·</span>
                <span>{(selected.sessions ?? []).length} {(selected.sessions ?? []).length === 1 ? "sessão" : "sessões"}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              {selected.status === "draft" ? (
                <>
                  <Button type="button" variant="outline" onClick={() => void save()} disabled={saving} className="w-full rounded-xl sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}
                    Salvar rascunho
                  </Button>
                  <Button type="button" onClick={() => void publish()} disabled={saving} className="w-full rounded-xl sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}
                    Publicar no portal
                  </Button>
                </>
              ) : null}
              {selected.status === "published" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const next = await createTrainingPlanVersion(selected);
                        await refresh(next.id);
                        toast.success("Nova versão em rascunho criada.");
                      } catch (cause) {
                        toast.error(cause instanceof Error ? cause.message : "Falha ao criar versão.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="w-full rounded-xl sm:w-auto"
                  >
                    <ClipboardPlus className="mr-2 h-4 w-4" aria-hidden="true" />Nova versão
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await archiveTrainingPlan(selected);
                        await refresh(selected.id);
                        toast.success("Ficha arquivada.");
                      } catch {
                        toast.error("Não foi possível arquivar.");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="w-full rounded-xl sm:w-auto"
                  >
                    <Archive className="mr-2 h-4 w-4" aria-hidden="true" />Arquivar
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {selected.status === "published" ? (
            <div className="flex items-start gap-2 border-b border-border/60 bg-primary/[0.035] px-5 py-3 text-sm text-muted-foreground sm:px-6">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>Esta versão está publicada e permanece somente para consulta. Crie uma nova versão para fazer alterações.</p>
            </div>
          ) : null}
          {selected.status === "archived" ? (
            <div className="border-b border-border/60 px-5 py-3 text-sm text-muted-foreground sm:px-6">
              Esta ficha foi arquivada e não pode ser editada.
            </div>
          ) : null}

          <div className="space-y-7 p-5 sm:p-6">
            <fieldset disabled={selected.status !== "draft"} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`training-title-${selected.id}`}>Título da ficha</Label>
                <Input id={`training-title-${selected.id}`} value={selected.title} onChange={(event) => update({ title: event.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`training-goal-${selected.id}`}>Objetivo</Label>
                <Input id={`training-goal-${selected.id}`} value={selected.goal} onChange={(event) => update({ goal: event.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`training-frequency-${selected.id}`}>Frequência</Label>
                <Input id={`training-frequency-${selected.id}`} value={selected.frequency} onChange={(event) => update({ frequency: event.target.value })} placeholder="Ex.: 3 vezes por semana" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`training-start-${selected.id}`}>Data de início</Label>
                <Input id={`training-start-${selected.id}`} type="date" value={selected.valid_from ?? ""} onChange={(event) => update({ valid_from: event.target.value || null })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`training-end-${selected.id}`}>Data de término</Label>
                <Input id={`training-end-${selected.id}`} type="date" value={selected.valid_until ?? ""} onChange={(event) => update({ valid_until: event.target.value || null })} className="rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`training-notes-${selected.id}`}>Orientações gerais</Label>
                <Textarea id={`training-notes-${selected.id}`} value={selected.general_notes} onChange={(event) => update({ general_notes: event.target.value })} placeholder="Observações para a ficha completa" className="min-h-24 resize-y rounded-xl" />
              </div>
            </fieldset>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estrutura</p>
                  <h4 className="mt-1 text-base font-semibold text-foreground">Sessões e exercícios</h4>
                </div>
                {selected.status === "draft" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => update({ sessions: [...(selected.sessions ?? []), { title: `Treino ${String.fromCharCode(65 + (selected.sessions?.length ?? 0))}`, notes: "", sort_order: selected.sessions?.length ?? 0, exercises: [] }] })}
                    className="w-full rounded-xl sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Adicionar sessão
                  </Button>
                ) : null}
              </div>

              {(selected.sessions ?? []).length > 0 ? (
                <div className="space-y-4">
                  {(selected.sessions ?? []).map((session, sessionIndex) => (
                    <article key={session.id ?? sessionIndex} className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary" aria-hidden="true">
                            {sessionIndex + 1}
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <Label htmlFor={`training-session-${selected.id}-${sessionIndex}`} className="text-xs text-muted-foreground">Nome da sessão</Label>
                            <Input
                              id={`training-session-${selected.id}-${sessionIndex}`}
                              disabled={selected.status !== "draft"}
                              value={session.title}
                              onChange={(event) => updateSession(sessionIndex, { title: event.target.value })}
                              className="h-10 rounded-xl font-medium"
                            />
                          </div>
                        </div>
                        {selected.status === "draft" ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Remover sessão ${session.title || sessionIndex + 1}`}
                            onClick={() => update({ sessions: (selected.sessions ?? []).filter((_, index) => index !== sessionIndex) })}
                            className="self-end rounded-xl text-muted-foreground hover:text-destructive sm:self-auto"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>

                      <div className="space-y-4 p-4">
                        <div className="space-y-2">
                          <Label htmlFor={`training-session-notes-${selected.id}-${sessionIndex}`}>Orientações da sessão</Label>
                          <Textarea
                            id={`training-session-notes-${selected.id}-${sessionIndex}`}
                            disabled={selected.status !== "draft"}
                            value={session.notes}
                            onChange={(event) => updateSession(sessionIndex, { notes: event.target.value })}
                            placeholder="Ex.: sequência, aquecimento ou observações desta sessão"
                            className="min-h-20 resize-y rounded-xl"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Dumbbell className="h-4 w-4 text-primary" aria-hidden="true" />Exercícios
                            </h5>
                            <span className="text-xs text-muted-foreground">
                              {session.exercises.length} {session.exercises.length === 1 ? "item" : "itens"}
                            </span>
                          </div>

                          {session.exercises.length > 0 ? (
                            <ol className="space-y-3">
                              {session.exercises.map((exercise, exerciseIndex) => {
                                const fieldId = `training-exercise-${selected.id}-${sessionIndex}-${exerciseIndex}`;
                                return (
                                  <li key={exercise.id ?? exerciseIndex} className="rounded-2xl border border-border/60 bg-muted/[0.12] p-3 sm:p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exercício {exerciseIndex + 1}</span>
                                      {selected.status === "draft" ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => updateSession(sessionIndex, { exercises: session.exercises.filter((_, index) => index !== exerciseIndex) })}
                                          className="h-8 rounded-lg px-2 text-muted-foreground hover:text-destructive"
                                        >
                                          <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Remover
                                        </Button>
                                      ) : null}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                      <div className="space-y-1.5 sm:col-span-2 xl:col-span-4">
                                        <Label htmlFor={`${fieldId}-name`}>Exercício</Label>
                                        <Input id={`${fieldId}-name`} disabled={selected.status !== "draft"} value={exercise.name} placeholder="Ex.: agachamento" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { name: event.target.value })} className="rounded-xl" />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label htmlFor={`${fieldId}-sets`}>Séries</Label>
                                        <Input id={`${fieldId}-sets`} disabled={selected.status !== "draft"} value={exercise.sets} placeholder="Ex.: 3" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { sets: event.target.value })} className="rounded-xl" />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label htmlFor={`${fieldId}-reps`}>Repetições</Label>
                                        <Input id={`${fieldId}-reps`} disabled={selected.status !== "draft"} value={exercise.repetitions} placeholder="Ex.: 10–12" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { repetitions: event.target.value })} className="rounded-xl" />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label htmlFor={`${fieldId}-load`}>Carga de referência</Label>
                                        <Input id={`${fieldId}-load`} disabled={selected.status !== "draft"} value={exercise.reference_load} placeholder="Ex.: 20 kg" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { reference_load: event.target.value })} className="rounded-xl" />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label htmlFor={`${fieldId}-rest`}>Descanso</Label>
                                        <Input id={`${fieldId}-rest`} disabled={selected.status !== "draft"} value={exercise.rest} placeholder="Ex.: 60 s" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { rest: event.target.value })} className="rounded-xl" />
                                      </div>
                                      <div className="space-y-1.5 sm:col-span-2 xl:col-span-4">
                                        <Label htmlFor={`${fieldId}-instructions`}>Instruções</Label>
                                        <Textarea id={`${fieldId}-instructions`} disabled={selected.status !== "draft"} value={exercise.instructions} placeholder="Orientações para a execução" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { instructions: event.target.value })} className="min-h-20 resize-y rounded-xl" />
                                      </div>
                                      <div className="space-y-1.5 sm:col-span-2 xl:col-span-4">
                                        <Label htmlFor={`${fieldId}-demo`}>Link de demonstração <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                                        <Input id={`${fieldId}-demo`} type="url" disabled={selected.status !== "draft"} value={exercise.demo_url} placeholder="https://" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { demo_url: event.target.value })} className="rounded-xl" />
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          ) : (
                            <div className="rounded-xl border border-dashed border-border/70 px-4 py-5 text-center text-sm text-muted-foreground">
                              Nenhum exercício nesta sessão ainda.
                            </div>
                          )}

                          {selected.status === "draft" ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => updateSession(sessionIndex, {
                                exercises: [...session.exercises, { name: "", sets: "", repetitions: "", reference_load: "", rest: "", instructions: "", demo_url: "", sort_order: session.exercises.length }],
                              })}
                              className="w-full rounded-xl sm:w-auto"
                            >
                              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Adicionar exercício
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/[0.08] px-4 py-8 text-center">
                  <CalendarDays className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-foreground">Nenhuma sessão adicionada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Separe a ficha em sessões para organizar os exercícios.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

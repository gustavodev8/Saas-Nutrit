import { useCallback, useEffect, useMemo, useState } from "react";
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
  Star,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExerciseAutocomplete } from "@/components/admin/patient/training/ExerciseAutocomplete";
import { toast } from "sonner";
import { normalizeSearchText, searchNormalizedRecords } from "@/lib/normalizedSearch";
import { resolveWorkspaceScope } from "@/lib/workspaceScope";
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
import {
  archiveWorkoutExercisePreset,
  createWorkoutPlanFromPreset,
  createWorkoutPresetFromPlanVersion,
  fetchFavoriteWorkoutPresetIds,
  fetchWorkoutExerciseCatalog,
  fetchWorkoutExercisePresets,
  fetchWorkoutPresets,
  publishWorkoutPresetVersion,
  setWorkoutPresetFavorite,
  upsertWorkoutExercisePreset,
  type WorkoutExerciseCatalogItem,
  type WorkoutExercisePreset,
  type WorkoutPresetSummary,
} from "@/lib/workoutLibrary";

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
  const [creating, setCreating] = useState(false);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [exerciseCatalog, setExerciseCatalog] = useState<WorkoutExerciseCatalogItem[]>([]);
  const [exercisePresets, setExercisePresets] = useState<WorkoutExercisePreset[]>([]);
  const [workoutPresets, setWorkoutPresets] = useState<WorkoutPresetSummary[]>([]);
  const [favoriteWorkoutPresetIds, setFavoriteWorkoutPresetIds] = useState<Set<number>>(new Set());
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [presetSearch, setPresetSearch] = useState("");
  const [showExercisePresetPicker, setShowExercisePresetPicker] = useState(false);
  const [exercisePresetSearch, setExercisePresetSearch] = useState("");
  const [exercisePresetTarget, setExercisePresetTarget] = useState<{ sessionIndex: number; exerciseIndex: number } | null>(null);
  const [saveExercisePresetTarget, setSaveExercisePresetTarget] = useState<{ sessionIndex: number; exerciseIndex: number } | null>(null);
  const [exercisePresetName, setExercisePresetName] = useState("");
  const [saveModelOpen, setSaveModelOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [librarySaving, setLibrarySaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLibrary = useCallback(async () => {
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const scope = await resolveWorkspaceScope();
      if (scope.status === "denied") throw new Error("A biblioteca não está disponível para esta conta.");
      const nextWorkspaceId = scope.workspaceId;
      setWorkspaceId(nextWorkspaceId);
      const catalog = await fetchWorkoutExerciseCatalog(nextWorkspaceId);
      setExerciseCatalog(catalog);
      if (!nextWorkspaceId) {
        setExercisePresets([]);
        setWorkoutPresets([]);
        setFavoriteWorkoutPresetIds(new Set());
        return;
      }
      const [nextExercisePresets, nextWorkoutPresets, nextFavoritePresetIds] = await Promise.all([
        fetchWorkoutExercisePresets(nextWorkspaceId),
        fetchWorkoutPresets(nextWorkspaceId),
        fetchFavoriteWorkoutPresetIds(nextWorkspaceId),
      ]);
      setExercisePresets(nextExercisePresets);
      setWorkoutPresets(nextWorkoutPresets);
      setFavoriteWorkoutPresetIds(new Set(nextFavoritePresetIds));
    } catch (cause) {
      setLibraryError(cause instanceof Error ? cause.message : "Não foi possível carregar a biblioteca de treinos.");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => { void refreshLibrary(); }, [refreshLibrary]);

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

  const createBlank = async () => {
    setCreating(true);
    try {
      const plan = await createTrainingPlan(patientId);
      setSelected(plan);
      setShowCreateFlow(false);
      await refresh(plan.id);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível criar a ficha.");
    } finally {
      setCreating(false);
    }
  };

  const createFromLast = async () => {
    const latest = [...plans].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (!latest) return;
    setCreating(true);
    try {
      const source = await fetchFullTrainingPlan(latest.id);
      if (!source) throw new Error("A ficha escolhida não foi encontrada.");
      const draft = await createTrainingPlanVersion(source);
      setShowCreateFlow(false);
      await refresh(draft.id);
      toast.success("Nova ficha criada a partir da última versão.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível copiar a última ficha.");
    } finally {
      setCreating(false);
    }
  };

  const applySetRepShortcut = (sessionIndex: number, exerciseIndex: number, sets: string, repetitions: string) => {
    const exercise = selected?.sessions?.[sessionIndex]?.exercises[exerciseIndex];
    if (!exercise || selected?.status !== "draft") return;
    const hasValues = Boolean(exercise.sets.trim() || exercise.repetitions.trim());
    const alreadyApplied = exercise.sets.trim() === sets && exercise.repetitions.trim() === repetitions;
    if (hasValues && !alreadyApplied && !window.confirm(`Substituir séries e repetições atuais por ${sets} × ${repetitions}?`)) return;
    updateExercise(sessionIndex, exerciseIndex, { sets, repetitions });
  };

  const filteredWorkoutPresets = useMemo(() => {
    return searchNormalizedRecords(workoutPresets.map((preset) => ({
      ...preset,
      search_text: preset.description,
    })), presetSearch).sort((a, b) =>
      Number(favoriteWorkoutPresetIds.has(b.id)) - Number(favoriteWorkoutPresetIds.has(a.id)) || a.name.localeCompare(b.name));
  }, [favoriteWorkoutPresetIds, presetSearch, workoutPresets]);

  const filteredExercisePresets = useMemo(() => searchNormalizedRecords(exercisePresets.map((preset) => ({
    ...preset,
    search_text: [preset.sets, preset.repetitions, preset.reference_load, preset.rest, preset.instructions].join(" "),
  })), exercisePresetSearch), [exercisePresetSearch, exercisePresets]);

  const openSaveExercisePreset = (sessionIndex: number, exerciseIndex: number) => {
    const exercise = selected?.sessions?.[sessionIndex]?.exercises[exerciseIndex];
    if (!exercise) return;
    setSaveExercisePresetTarget({ sessionIndex, exerciseIndex });
    setExercisePresetName(exercise.name.trim()
      ? `${exercise.name.trim()}${exercise.sets || exercise.repetitions ? ` · ${exercise.sets || "—"}×${exercise.repetitions || "—"}` : ""}`
      : "Prescrição favorita");
  };

  const saveExercisePreset = async () => {
    if (!workspaceId || !selected || !saveExercisePresetTarget) return;
    const exercise = selected.sessions?.[saveExercisePresetTarget.sessionIndex]?.exercises[saveExercisePresetTarget.exerciseIndex];
    if (!exercise?.name.trim()) {
      toast.error("Informe o exercício antes de salvar como favorito.");
      return;
    }
    setLibrarySaving(true);
    try {
      const catalogItem = exerciseCatalog.find((item) => normalizeSearchText(item.name) === normalizeSearchText(exercise.name));
      await upsertWorkoutExercisePreset(workspaceId, {
        catalog_exercise_id: catalogItem?.id ?? null,
        name: exercisePresetName,
        search_aliases: catalogItem?.search_aliases ?? [],
        sets: exercise.sets,
        repetitions: exercise.repetitions,
        reference_load: exercise.reference_load,
        rest: exercise.rest,
        instructions: exercise.instructions,
        demo_url: exercise.demo_url,
      });
      await refreshLibrary();
      setSaveExercisePresetTarget(null);
      toast.success("Prescrição favorita salva.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível salvar a prescrição favorita.");
    } finally {
      setLibrarySaving(false);
    }
  };

  const applyExercisePreset = (preset: WorkoutExercisePreset) => {
    if (!selected || !exercisePresetTarget) return;
    const current = selected.sessions?.[exercisePresetTarget.sessionIndex]?.exercises[exercisePresetTarget.exerciseIndex];
    if (!current || selected.status !== "draft") return;
    const hasCurrentValues = [current.sets, current.repetitions, current.reference_load, current.rest, current.instructions, current.demo_url]
      .some((value) => value.trim());
    const hasDifferences = current.name !== preset.name || current.sets !== preset.sets || current.repetitions !== preset.repetitions
      || current.reference_load !== preset.reference_load || current.rest !== preset.rest
      || current.instructions !== preset.instructions || current.demo_url !== preset.demo_url;
    if (hasCurrentValues && hasDifferences && !window.confirm(`Aplicar “${preset.name}” substituirá os dados deste exercício. Continuar?`)) return;
    updateExercise(exercisePresetTarget.sessionIndex, exercisePresetTarget.exerciseIndex, {
      name: preset.name,
      sets: preset.sets,
      repetitions: preset.repetitions,
      reference_load: preset.reference_load,
      rest: preset.rest,
      instructions: preset.instructions,
      demo_url: preset.demo_url,
    });
    setShowExercisePresetPicker(false);
    setExercisePresetTarget(null);
  };

  const archiveExercisePreset = async (preset: WorkoutExercisePreset) => {
    if (!workspaceId || !window.confirm(`Arquivar a prescrição favorita “${preset.name}”?`)) return;
    try {
      await archiveWorkoutExercisePreset(preset.id, workspaceId);
      await refreshLibrary();
      toast.success("Prescrição favorita arquivada.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível arquivar a prescrição.");
    }
  };

  const toggleWorkoutPresetFavorite = async (preset: WorkoutPresetSummary) => {
    if (!workspaceId) return;
    const wasFavorite = favoriteWorkoutPresetIds.has(preset.id);
    try {
      await setWorkoutPresetFavorite(workspaceId, preset.id, !wasFavorite);
      setFavoriteWorkoutPresetIds((current) => {
        const next = new Set(current);
        if (wasFavorite) next.delete(preset.id);
        else next.add(preset.id);
        return next;
      });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível atualizar o favorito.");
    }
  };

  const applyWorkoutPreset = async (preset: WorkoutPresetSummary) => {
    if (!preset.latest_published_version_id) return;
    setCreating(true);
    try {
      const plan = await createWorkoutPlanFromPreset(patientId, preset.latest_published_version_id);
      setShowPresetPicker(false);
      setShowCreateFlow(false);
      setPresetSearch("");
      await refresh(plan.id);
      toast.success(`Nova ficha criada a partir de “${preset.name}”.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível aplicar o modelo.");
    } finally {
      setCreating(false);
    }
  };

  const saveSelectedAsWorkoutPreset = async () => {
    if (!selected || !workspaceId) return;
    setLibrarySaving(true);
    try {
      const source = selected.status === "draft" ? await saveTrainingPlan(selected) : selected;
      const presetVersion = await createWorkoutPresetFromPlanVersion(source.id, modelName.trim() || source.title);
      if (presetVersion.status === "draft") await publishWorkoutPresetVersion(presetVersion.id);
      await refreshLibrary();
      setSaveModelOpen(false);
      setModelName("");
      toast.success("Modelo salvo na biblioteca e disponibilizado para seleção.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível salvar o modelo.");
    } finally {
      setLibrarySaving(false);
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
        <Button onClick={() => setShowCreateFlow(true)} className="w-full shrink-0 rounded-xl sm:w-auto">
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

      {libraryError ? <p role="status" className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">Biblioteca de treinos indisponível: {libraryError}</p> : null}

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
          <Button type="button" onClick={() => setShowCreateFlow(true)} className="mt-5 rounded-xl">
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
                  <Button type="button" variant="outline" onClick={() => { setModelName(selected.title); setSaveModelOpen(true); }} disabled={!workspaceId || librarySaving} className="w-full rounded-xl sm:w-auto">
                    <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />Salvar como modelo
                  </Button>
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
                  <Button type="button" variant="outline" onClick={() => { setModelName(selected.title); setSaveModelOpen(true); }} disabled={!workspaceId || librarySaving} className="w-full rounded-xl sm:w-auto">
                    <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />Salvar como modelo
                  </Button>
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
                                        <ExerciseAutocomplete id={`${fieldId}-name`} disabled={selected.status !== "draft"} value={exercise.name} items={exerciseCatalog}
                                          onChange={(value) => updateExercise(sessionIndex, exerciseIndex, { name: value })}
                                          onSelect={(item) => updateExercise(sessionIndex, exerciseIndex, {
                                            name: item.name,
                                            instructions: exercise.instructions || item.instructions || "",
                                            demo_url: exercise.demo_url || item.demo_url || "",
                                          })} />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label htmlFor={`${fieldId}-sets`}>Séries</Label>
                                        <Input id={`${fieldId}-sets`} disabled={selected.status !== "draft"} value={exercise.sets} placeholder="Ex.: 3" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { sets: event.target.value })} className="rounded-xl" />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label htmlFor={`${fieldId}-reps`}>Repetições</Label>
                                        <Input id={`${fieldId}-reps`} disabled={selected.status !== "draft"} value={exercise.repetitions} placeholder="Ex.: 10–12" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { repetitions: event.target.value })} className="rounded-xl" />
                                        {selected.status === "draft" ? (
                                          <div className="space-y-1.5 pt-1">
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Atalhos</p>
                                            <div className="flex flex-wrap gap-1.5">
                                              {([["3", "10"], ["3", "12"], ["4", "10"], ["4", "12"]] as const).map(([sets, repetitions]) => (
                                                <Button key={`${sets}x${repetitions}`} type="button" variant="outline" size="sm"
                                                  onClick={() => applySetRepShortcut(sessionIndex, exerciseIndex, sets, repetitions)}
                                                  className="h-8 rounded-lg px-2.5 text-xs tabular-nums">
                                                  {sets}×{repetitions}
                                                </Button>
                                              ))}
                                            </div>
                                          </div>
                                        ) : null}
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
                                      {selected.status === "draft" ? <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4">
                                        <Button type="button" variant="outline" size="sm" disabled={!workspaceId} onClick={() => openSaveExercisePreset(sessionIndex, exerciseIndex)} className="min-h-10 rounded-xl">
                                          <Star className="mr-2 h-4 w-4" aria-hidden="true" />Salvar prescrição favorita
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" disabled={!workspaceId || exercisePresets.length === 0} onClick={() => { setExercisePresetTarget({ sessionIndex, exerciseIndex }); setExercisePresetSearch(""); setShowExercisePresetPicker(true); }} className="min-h-10 rounded-xl">
                                          Usar prescrição favorita
                                        </Button>
                                      </div> : null}
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
      <Dialog open={showCreateFlow} onOpenChange={setShowCreateFlow}>
        <DialogContent className="max-w-lg rounded-3xl p-5 sm:p-6">
          {showPresetPicker ? <>
            <DialogHeader>
              <DialogTitle>Escolher modelo</DialogTitle>
              <DialogDescription>Modelos publicados são copiados para uma nova ficha deste paciente.</DialogDescription>
            </DialogHeader>
            <Input value={presetSearch} onChange={(event) => setPresetSearch(event.target.value)} placeholder="Buscar modelo" aria-label="Buscar modelo de treino" className="rounded-xl" />
            <div className="max-h-80 space-y-2 overflow-y-auto py-1">
              {libraryLoading ? <p className="p-3 text-sm text-muted-foreground">Carregando modelos…</p> : null}
              {!libraryLoading && filteredWorkoutPresets.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Nenhum modelo publicado encontrado.</p> : null}
              {filteredWorkoutPresets.filter((preset) => preset.latest_published_version_id).map((preset) => (
                <div key={preset.id} className="flex items-center gap-2 rounded-2xl border border-border/60 p-3">
                  <button type="button" aria-label={favoriteWorkoutPresetIds.has(preset.id) ? `Remover ${preset.name} dos favoritos` : `Favoritar ${preset.name}`} onClick={() => void toggleWorkoutPresetFavorite(preset)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-muted">
                    <Star className={`h-4 w-4 ${favoriteWorkoutPresetIds.has(preset.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                  </button>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{preset.name}</p><p className="truncate text-xs text-muted-foreground">{preset.description || `Versão ${preset.latest_published_version ?? "publicada"}`}</p></div>
                  <Button type="button" size="sm" disabled={creating} onClick={() => void applyWorkoutPreset(preset)} className="min-h-10 rounded-xl">Usar</Button>
                </div>
              ))}
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setShowPresetPicker(false)} className="rounded-xl">Voltar</Button>
              <Button type="button" variant="ghost" disabled={creating} onClick={() => setShowCreateFlow(false)} className="rounded-xl">Cancelar</Button>
            </DialogFooter>
          </> : <>
          <DialogHeader>
            <DialogTitle>Como deseja começar?</DialogTitle>
            <DialogDescription>Escolha uma base para a nova ficha. Ela será criada como rascunho e poderá ser editada antes de publicar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button type="button" disabled={creating} onClick={() => void createBlank()}
              className="rounded-2xl border border-border/60 p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              <span className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plus size={18} aria-hidden="true" /></span>
                <span><span className="block font-semibold text-foreground">Começar vazia</span><span className="mt-1 block text-sm text-muted-foreground">Crie sessões e exercícios do início.</span></span>
              </span>
            </button>
            <button type="button" disabled={creating || plans.length === 0} onClick={() => void createFromLast()}
              className="rounded-2xl border border-border/60 p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              <span className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"><ClipboardPlus size={18} aria-hidden="true" /></span>
                <span><span className="block font-semibold text-foreground">Usar a última ficha</span><span className="mt-1 block text-sm text-muted-foreground">Crie uma nova versão baseada na ficha mais recente deste paciente.</span></span>
              </span>
            </button>
            <button type="button" disabled={creating || !workspaceId || libraryLoading || workoutPresets.every((preset) => !preset.latest_published_version_id)} onClick={() => { setPresetSearch(""); setShowPresetPicker(true); }}
              className="rounded-2xl border border-border/60 p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              <span className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen size={18} aria-hidden="true" /></span><span><span className="block font-semibold text-foreground">Escolher da biblioteca</span><span className="mt-1 block text-sm text-muted-foreground">Aplique um modelo publicado à ficha deste paciente.</span></span></span>
            </button>
          </div>
          {creating ? <p role="status" className="text-sm text-muted-foreground">Preparando nova ficha…</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={creating} onClick={() => setShowCreateFlow(false)} className="rounded-xl">Cancelar</Button>
          </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(saveExercisePresetTarget)} onOpenChange={(open) => { if (!open) setSaveExercisePresetTarget(null); }}>
        <DialogContent className="rounded-3xl p-5 sm:p-6">
          <DialogHeader><DialogTitle>Salvar prescrição favorita</DialogTitle><DialogDescription>Os dados ficam salvos como um modelo reutilizável e não alteram a ficha atual.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="exercise-preset-name">Nome da prescrição</Label><Input id="exercise-preset-name" value={exercisePresetName} onChange={(event) => setExercisePresetName(event.target.value)} maxLength={120} className="rounded-xl" /></div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setSaveExercisePresetTarget(null)} className="rounded-xl">Cancelar</Button><Button type="button" disabled={librarySaving || !exercisePresetName.trim()} onClick={() => void saveExercisePreset()} className="rounded-xl">{librarySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExercisePresetPicker} onOpenChange={setShowExercisePresetPicker}>
        <DialogContent className="max-w-lg rounded-3xl p-5 sm:p-6">
          <DialogHeader><DialogTitle>Prescrições favoritas</DialogTitle><DialogDescription>Aplicar uma prescrição substitui os campos deste exercício após confirmação.</DialogDescription></DialogHeader>
          <Input value={exercisePresetSearch} onChange={(event) => setExercisePresetSearch(event.target.value)} placeholder="Buscar prescrição" aria-label="Buscar prescrição favorita" className="rounded-xl" />
          <div className="max-h-80 space-y-2 overflow-y-auto">{filteredExercisePresets.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Nenhuma prescrição favorita encontrada.</p> : filteredExercisePresets.map((preset) => <div key={preset.id} className="flex items-center gap-2 rounded-2xl border border-border/60 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{preset.name}</p><p className="text-xs text-muted-foreground">{[preset.sets && `${preset.sets} séries`, preset.repetitions && `${preset.repetitions} rep.`, preset.reference_load, preset.rest].filter(Boolean).join(" · ")}</p></div><Button type="button" size="sm" onClick={() => applyExercisePreset(preset)} className="min-h-10 rounded-xl">Usar</Button><Button type="button" size="sm" variant="ghost" onClick={() => void archiveExercisePreset(preset)} aria-label={`Arquivar ${preset.name}`} className="min-h-10 rounded-xl text-muted-foreground hover:text-destructive"><Archive className="h-4 w-4" aria-hidden="true" /></Button></div>)}</div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setShowExercisePresetPicker(false)} className="rounded-xl">Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveModelOpen} onOpenChange={setSaveModelOpen}>
        <DialogContent className="rounded-3xl p-5 sm:p-6">
          <DialogHeader><DialogTitle>Salvar como modelo</DialogTitle><DialogDescription>Será criada uma versão publicada na biblioteca do workspace, sem alterar a ficha do paciente.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="workout-model-name">Nome do modelo</Label><Input id="workout-model-name" value={modelName} onChange={(event) => setModelName(event.target.value)} maxLength={120} className="rounded-xl" /></div>
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setSaveModelOpen(false)} className="rounded-xl">Cancelar</Button><Button type="button" disabled={librarySaving || !modelName.trim()} onClick={() => void saveSelectedAsWorkoutPreset()} className="rounded-xl">{librarySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar modelo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ClipboardPlus,
  Copy,
  Dumbbell,
  FileText,
  Loader2,
  Plus,
  Save,
  Search,
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
import { getTrainingReviewWarnings, moveTrainingExercise } from "@/components/admin/patient/training/trainingEditorUtils";
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
  draft: "border-border bg-secondary text-secondary-foreground",
  published: "border-primary/20 bg-primary/10 text-primary",
  archived: "border-border bg-muted/50 text-muted-foreground",
};

function StatusBadge({ status }: { status: TrainingPlan["status"] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {statusLabel[status]}
    </span>
  );
}

function ExerciseMetric({ label, value }: { label: string; value?: string | null }) {
  return (
    <span className="inline-flex min-w-0 items-baseline gap-1.5 text-xs text-muted-foreground">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      <span className="truncate font-semibold text-foreground">{value?.trim() || "—"}</span>
    </span>
  );
}

function formatTrainingDate(value?: string | null): string {
  if (!value) return "Não definida";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Não definida";
}

export function PatientTrainingTab({ patientId }: { patientId: number }) {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [selected, setSelected] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [exerciseCatalog, setExerciseCatalog] = useState<WorkoutExerciseCatalogItem[]>([]);
  const [exercisePresets, setExercisePresets] = useState<WorkoutExercisePreset[]>([]);
  const [workoutPresets, setWorkoutPresets] = useState<WorkoutPresetSummary[]>([]);
  const [favoriteWorkoutPresetIds, setFavoriteWorkoutPresetIds] = useState<Set<number>>(new Set());
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [presetSearch, setPresetSearch] = useState("");
  const [creationChoice, setCreationChoice] = useState<"last" | "model" | "blank">("blank");
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [showExercisePresetPicker, setShowExercisePresetPicker] = useState(false);
  const [exercisePresetSearch, setExercisePresetSearch] = useState("");
  const [exercisePresetTarget, setExercisePresetTarget] = useState<{ sessionIndex: number; exerciseIndex: number } | null>(null);
  const [saveExercisePresetTarget, setSaveExercisePresetTarget] = useState<{ sessionIndex: number; exerciseIndex: number } | null>(null);
  const [exercisePresetName, setExercisePresetName] = useState("");
  const [saveModelOpen, setSaveModelOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [librarySaving, setLibrarySaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorStep, setEditorStep] = useState<"library" | "start" | "details" | "sessions" | "review">("library");
  const [isDirty, setIsDirty] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryStatus, setLibraryStatus] = useState<TrainingPlan["status"] | "all">("all");
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [catalogSearch, setCatalogSearch] = useState("");
  const [exercisePickerSessionIndex, setExercisePickerSessionIndex] = useState<number | null>(null);

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
      setIsDirty(false);
      setError(null);
    } catch {
      setError("Não foi possível carregar as fichas. Verifique a conexão e as permissões do banco.");
    } finally {
      setLoading(false);
    }
  }, [patientId, selected?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const update = (patch: Partial<TrainingPlan>) => {
    setIsDirty(true);
    setSelected((current) => current ? { ...current, ...patch } : current);
  };
  const updateSession = (index: number, patch: Partial<TrainingSession>) => {
    setIsDirty(true);
    setSelected((current) => current ? {
      ...current,
      sessions: (current.sessions ?? []).map((session, i) => i === index ? { ...session, ...patch } : session),
    } : current);
  };

  const updateExercise = (
    sessionIndex: number,
    exerciseIndex: number,
    patch: Partial<TrainingSession["exercises"][number]>,
  ) => {
    setIsDirty(true);
    setSelected((current) => {
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
  };

  const moveExercise = (sessionIndex: number, exerciseIndex: number, direction: -1 | 1) => {
    const session = selected?.sessions?.[sessionIndex];
    if (!session) return;
    const targetIndex = exerciseIndex + direction;
    if (targetIndex < 0 || targetIndex >= session.exercises.length) return;
    updateSession(sessionIndex, { exercises: moveTrainingExercise(session.exercises, exerciseIndex, direction) });
    setExpandedExercises((current) => {
      const next = new Set(current);
      next.delete(`${sessionIndex}-${exerciseIndex}`);
      next.add(`${sessionIndex}-${targetIndex}`);
      return next;
    });
  };

  const createBlank = async () => {
    setCreating(true);
    try {
      const plan = await createTrainingPlan(patientId);
      setSelected(plan);
      setEditorStep("details");
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
      setEditorStep("details");
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

  const filteredPlans = useMemo(() => searchNormalizedRecords(plans.map((plan) => ({
    ...plan,
    name: plan.title,
    search_text: [plan.goal, plan.frequency, plan.general_notes].filter(Boolean).join(" "),
  })), librarySearch).filter((plan) => libraryStatus === "all" || plan.status === libraryStatus), [librarySearch, libraryStatus, plans]);

  const latestPlan = useMemo(() => [...plans].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null, [plans]);

  const reviewWarnings = useMemo(() => selected ? getTrainingReviewWarnings(selected) : [], [selected]);
  const selectedExerciseCount = useMemo(() => (selected?.sessions ?? []).reduce((total, session) => total + session.exercises.length, 0), [selected]);
  const selectedSeriesCount = useMemo(() => (selected?.sessions ?? []).reduce((total, session) => total + session.exercises.reduce((sessionTotal, exercise) => sessionTotal + (Number.parseInt(exercise.sets, 10) || 0), 0), 0), [selected]);

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
      setEditorStep("details");
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
      setIsDirty(false);
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
      setIsDirty(false);
      await refresh(saved.id);
      toast.success("Ficha publicada no portal.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Não foi possível publicar.");
    } finally {
      setSaving(false);
    }
  };

  const beginCreation = () => {
    if (isDirty && !window.confirm("Há alterações não salvas. Deseja sair mesmo assim?")) return;
    setSelected(null);
    setCreationChoice(latestPlan ? "last" : "blank");
    setSelectedPresetId(null);
    setPresetSearch("");
    setEditorStep("start");
    setIsDirty(false);
  };

  const returnToLibrary = () => {
    if (isDirty && !window.confirm("Há alterações não salvas. Deseja voltar à biblioteca?")) return;
    setEditorStep("library");
    setIsDirty(false);
  };

  const continueCreation = async () => {
    if (creationChoice === "last") {
      await createFromLast();
      return;
    }
    if (creationChoice === "model") {
      const preset = workoutPresets.find((item) => item.id === selectedPresetId);
      if (!preset) {
        toast.error("Escolha um modelo para continuar.");
        return;
      }
      await applyWorkoutPreset(preset);
      return;
    }
    await createBlank();
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
    <div className="training-sans space-y-4">
      <header className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Acompanhamento</p>
          <h2 className="training-display text-2xl font-semibold tracking-tight text-foreground">Treinos</h2>
        </div>
        <Button onClick={beginCreation} className="w-full shrink-0 rounded-lg sm:w-auto">
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

      {plans.length > 0 && editorStep === "library" ? (
        <section aria-labelledby="training-plan-list-heading" className="space-y-4 rounded-2xl bg-muted/20 p-3 sm:p-4">
          {plans.find((plan) => plan.status === "published") ? (() => {
            const publishedPlan = plans.find((plan) => plan.status === "published");
            if (!publishedPlan) return null;
            return (
              <article className="grid gap-3 rounded-xl border border-primary/20 border-l-[3px] border-l-primary bg-primary/[0.035] p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><StatusBadge status="published" /><span className="text-xs text-muted-foreground">Visível no portal do paciente</span></div>
                  <p className="mt-1 truncate font-display text-xl font-bold tracking-tight text-foreground">{publishedPlan.title}</p>
                  <p className="text-xs text-muted-foreground">v{publishedPlan.version} · {publishedPlan.frequency || "Frequência não definida"} · {(publishedPlan.sessions ?? []).length} {(publishedPlan.sessions ?? []).length === 1 ? "sessão" : "sessões"} · {(publishedPlan.sessions ?? []).reduce((total, session) => total + session.exercises.length, 0)} exercícios</p>
                </div>
                <Button type="button" variant="outline" onClick={() => { setActiveSessionIndex(0); void refresh(publishedPlan.id); setEditorStep("review"); }} className="min-h-10 rounded-xl sm:w-auto">Ver ficha publicada</Button>
              </article>
            );
          })() : null}

          <h3 id="training-plan-list-heading" className="sr-only">Fichas cadastradas</h3>
          <span className="sr-only">{filteredPlans.length} de {plans.length} fichas</span>

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm lg:grid-cols-4 lg:divide-x lg:divide-border/60">
            <div className="border-b border-r border-border/60 p-3 lg:border-b-0"><p className="text-xs text-muted-foreground">Total de fichas</p><p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{plans.length}</p></div>
            <div className="border-b border-border/60 p-3 lg:border-b-0"><p className="text-xs text-muted-foreground">Publicadas</p><p className="mt-1 text-xl font-semibold tabular-nums text-primary">{plans.filter((plan) => plan.status === "published").length}</p></div>
            <div className="border-r border-border/60 p-3"><p className="text-xs text-muted-foreground">Rascunhos</p><p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{plans.filter((plan) => plan.status === "draft").length}</p></div>
            <div className="p-3"><p className="text-xs text-muted-foreground">Modelos disponíveis</p><p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{workoutPresets.filter((preset) => preset.latest_published_version_id).length}</p></div>
          </div>

          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filtrar fichas por status">
              {(["all", "published", "draft", "archived"] as const).map((status) => {
                const label = status === "all" ? "Todas" : statusLabel[status];
                const count = status === "all" ? plans.length : plans.filter((plan) => plan.status === status).length;
                return <button key={status} type="button" role="tab" aria-selected={libraryStatus === status} onClick={() => setLibraryStatus(status)} className={`min-h-9 shrink-0 rounded-lg px-3 text-sm transition-colors ${libraryStatus === status ? "bg-foreground font-semibold text-background" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}>{label} <span className="ml-1 tabular-nums opacity-70">{count}</span></button>;
              })}
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Buscar ficha" aria-label="Buscar ficha de treino" className="h-10 rounded-xl pl-9" />
            </label>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
            <div className="hidden grid-cols-[minmax(0,2fr)_112px_68px_1fr_105px_20px] gap-3 border-b border-border/70 bg-muted/50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground md:grid">
              <span>Ficha</span><span>Status</span><span>Versão</span><span>Estrutura</span><span>Criada</span><span />
            </div>
            <div className="divide-y divide-border/60" role="group" aria-label="Selecionar ficha de treino">
            {filteredPlans.map((plan) => {
              const active = selected?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setActiveSessionIndex(0); void refresh(plan.id); setEditorStep("details"); }}
                  className={`group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[minmax(0,2fr)_112px_68px_1fr_105px_20px] md:gap-3 ${active ? "bg-primary/[0.07]" : "hover:bg-muted/45"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">{plan.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{plan.goal || "Objetivo não definido"} · {plan.frequency || "Frequência não definida"}</span>
                  </span>
                  <span className="md:hidden"><StatusBadge status={plan.status} /></span>
                  <span className="hidden md:block"><StatusBadge status={plan.status} /></span>
                  <span className="hidden text-sm tabular-nums text-muted-foreground md:block">v{plan.version}</span>
                  <span className="col-span-2 text-xs text-muted-foreground md:col-span-1">{(plan.sessions ?? []).length} {(plan.sessions ?? []).length === 1 ? "sessão" : "sessões"} · {(plan.sessions ?? []).reduce((total, session) => total + session.exercises.length, 0)} ex.</span>
                  <span className="hidden text-xs text-muted-foreground md:block">{new Date(plan.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <ChevronRight className={`hidden h-4 w-4 justify-self-end transition-transform md:block ${active ? "translate-x-0.5 text-primary" : "group-hover:translate-x-0.5"}`} aria-hidden="true" />
                </button>
              );
            })}
            {filteredPlans.length === 0 ? <p className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhuma ficha encontrada com estes filtros.</p> : null}
            </div>
          </div>
        </section>
      ) : plans.length === 0 && editorStep === "library" ? (
        <section className="rounded-3xl border border-dashed border-border/70 bg-muted/10 px-5 py-10 text-center sm:py-14" aria-labelledby="training-empty-heading">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 id="training-empty-heading" className="mt-4 font-display text-lg font-semibold text-foreground">Nenhuma ficha por aqui</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Crie uma ficha para organizar os exercícios e acompanhar a rotina deste paciente.
          </p>
          <Button type="button" onClick={beginCreation} className="mt-5 rounded-xl">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Criar primeira ficha
          </Button>
        </section>
      ) : null}

      {editorStep === "start" ? (
        <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm" aria-labelledby="training-start-heading">
          <nav aria-label="Etapas do construtor" className="grid grid-cols-4 border-b border-border/60 bg-background px-2 py-2 sm:px-5">
            {(["Início", "Informações", "Montagem", "Revisão"] as const).map((label, index) => (
              <span key={label} aria-current={index === 0 ? "step" : undefined} className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-1 text-xs font-medium sm:text-sm ${index === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${index === 0 ? "bg-primary text-primary-foreground" : "border border-border"}`}>{index + 1}</span>
                <span className={index > 1 ? "hidden sm:inline" : "inline"}>{label}</span>
              </span>
            ))}
          </nav>
          <div className="mx-auto max-w-5xl p-4 pb-24 sm:p-7 sm:pb-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Etapa 1 · Início</p>
            <h3 id="training-start-heading" className="training-display mt-1 text-2xl font-semibold tracking-tight text-foreground">Como deseja começar?</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Escolha uma base. A ficha só será criada quando você continuar.</p>

            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              <button type="button" aria-pressed={creationChoice === "last"} disabled={!latestPlan} onClick={() => setCreationChoice("last")} className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${creationChoice === "last" ? "border-primary bg-primary/[0.06]" : "border-border/70 hover:border-primary/40 hover:bg-muted/30"}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ClipboardPlus className="h-5 w-5" aria-hidden="true" /></span>
                <span className="mt-4 block font-semibold text-foreground">Usar a última ficha</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">{latestPlan ? `${latestPlan.title} · v${latestPlan.version} · ${(latestPlan.sessions ?? []).length} sessões` : "Este paciente ainda não possui ficha anterior."}</span>
              </button>
              <button type="button" aria-pressed={creationChoice === "model"} disabled={!workspaceId || filteredWorkoutPresets.every((preset) => !preset.latest_published_version_id)} onClick={() => setCreationChoice("model")} className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${creationChoice === "model" ? "border-primary bg-primary/[0.06]" : "border-border/70 hover:border-primary/40 hover:bg-muted/30"}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><BookOpen className="h-5 w-5" aria-hidden="true" /></span>
                <span className="mt-4 block font-semibold text-foreground">Utilizar um modelo</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">Copie sessões e exercícios de um modelo publicado da biblioteca.</span>
              </button>
              <button type="button" aria-pressed={creationChoice === "blank"} onClick={() => setCreationChoice("blank")} className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${creationChoice === "blank" ? "border-primary bg-primary/[0.06]" : "border-border/70 hover:border-primary/40 hover:bg-muted/30"}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground"><Plus className="h-5 w-5" aria-hidden="true" /></span>
                <span className="mt-4 block font-semibold text-foreground">Começar do zero</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">Crie uma ficha vazia e monte cada sessão manualmente.</span>
              </button>
            </div>

            {creationChoice === "model" ? (
              <div className="mt-5 rounded-xl border border-border/70 bg-muted/15 p-3 sm:p-4">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input value={presetSearch} onChange={(event) => setPresetSearch(event.target.value)} placeholder="Buscar modelo" aria-label="Buscar modelo de treino" className="h-10 rounded-lg bg-background pl-9" />
                </label>
                <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                  {filteredWorkoutPresets.filter((preset) => preset.latest_published_version_id).map((preset) => (
                    <div key={preset.id} className={`flex min-h-16 items-center rounded-lg border ${selectedPresetId === preset.id ? "border-primary bg-primary/[0.07]" : "border-border/60 bg-background hover:border-primary/35"}`}>
                      <button type="button" aria-pressed={selectedPresetId === preset.id} onClick={() => setSelectedPresetId(preset.id)} className="min-w-0 flex-1 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                        <span className="block truncate text-sm font-semibold">{preset.name}</span><span className="block truncate text-xs text-muted-foreground">{preset.description || `Versão ${preset.latest_published_version ?? "publicada"}`}</span>
                      </button>
                      <button type="button" aria-label={favoriteWorkoutPresetIds.has(preset.id) ? `Remover ${preset.name} dos favoritos` : `Favoritar ${preset.name}`} onClick={() => void toggleWorkoutPresetFavorite(preset)} className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Star className={`h-4 w-4 ${favoriteWorkoutPresetIds.has(preset.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  {!libraryLoading && filteredWorkoutPresets.filter((preset) => preset.latest_published_version_id).length === 0 ? <p className="p-3 text-sm text-muted-foreground">Nenhum modelo publicado encontrado.</p> : null}
                </div>
              </div>
            ) : null}
          </div>
          <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border/70 bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
            <Button type="button" variant="ghost" onClick={returnToLibrary}>Voltar</Button>
            <Button type="button" disabled={creating || (creationChoice === "last" && !latestPlan) || (creationChoice === "model" && !selectedPresetId)} onClick={() => void continueCreation()}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}Continuar<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      ) : null}

      {selected && editorStep !== "library" ? (
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20 shadow-sm" aria-labelledby="training-editor-heading">
          <div className="sticky top-2 z-20 flex flex-col gap-3 border-b border-border/70 bg-card/95 p-3 backdrop-blur-xl sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="training-editor-heading" className="training-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {selected.title || "Nova ficha de treino"}
                </h3>
                <StatusBadge status={selected.status} />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Versão {selected.version}</span>
                <span aria-hidden="true">·</span>
                <span>{(selected.sessions ?? []).length} {(selected.sessions ?? []).length === 1 ? "sessão" : "sessões"}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button type="button" variant="ghost" onClick={returnToLibrary} className="col-span-2 min-h-10 justify-start rounded-xl sm:col-span-1 sm:justify-center">← Biblioteca</Button>
              {selected.status === "draft" ? (
                <Button type="button" variant="outline" onClick={() => { setModelName(selected.title); setSaveModelOpen(true); }} disabled={!workspaceId || librarySaving} className="col-span-2 w-full rounded-xl sm:col-span-1 sm:w-auto">
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />Salvar como modelo
                </Button>
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

          <nav aria-label="Etapas do construtor" className="grid grid-cols-4 gap-1 border-b border-border/60 bg-card px-3 py-2 sm:gap-2 sm:px-5">
            <span className="flex min-h-10 items-center justify-center gap-2 rounded-lg px-1 text-xs font-medium text-muted-foreground sm:text-sm"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">✓</span><span className="hidden sm:inline">Início</span></span>
            {([["details", "2", "Informações"], ["sessions", "3", "Montagem"], ["review", "4", "Revisão"]] as const).map(([step, number, label]) => (
              <button key={step} type="button" aria-current={editorStep === step ? "step" : undefined} onClick={() => setEditorStep(step)}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-1 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2 sm:text-sm ${editorStep === step ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${editorStep === step ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{number}</span><span className={step === "review" ? "hidden sm:inline" : "inline"}>{label}</span>
              </button>
            ))}
          </nav>

          <div className="p-3 sm:p-5">
            {editorStep === "details" ? <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_320px] xl:items-start">
              <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm" aria-labelledby="training-details-heading">
              <div className="border-b border-border/60 bg-primary/[0.035] px-4 py-3 sm:px-5">
                <p className="text-xs font-medium text-primary">ETAPA 2 · INFORMAÇÕES</p>
                <h4 id="training-details-heading" className="mt-1 text-lg font-semibold text-foreground">Contexto da ficha</h4>
                <p className="mt-1 text-sm text-muted-foreground">Defina o que o paciente verá antes de iniciar os treinos.</p>
              </div>
              <fieldset disabled={selected.status !== "draft"} className="divide-y divide-border/60">
                <div className="grid gap-2 p-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center sm:px-5">
                  <div><Label htmlFor={`training-title-${selected.id}`}>Título da ficha</Label><p className="mt-1 text-xs text-muted-foreground">Nome exibido no portal.</p></div>
                  <Input id={`training-title-${selected.id}`} value={selected.title} onChange={(event) => update({ title: event.target.value })} className="h-11 rounded-lg bg-background" />
                </div>
                <div className="grid gap-2 p-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center sm:px-5">
                  <div><Label htmlFor={`training-goal-${selected.id}`}>Objetivo</Label><p className="mt-1 text-xs text-muted-foreground">Contexto geral da prescrição.</p></div>
                  <Input id={`training-goal-${selected.id}`} value={selected.goal} onChange={(event) => update({ goal: event.target.value })} className="rounded-lg bg-background" />
                </div>
                <div className="grid gap-2 p-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center sm:px-5">
                  <div><Label htmlFor={`training-frequency-${selected.id}`}>Frequência</Label><p className="mt-1 text-xs text-muted-foreground">Rotina semanal orientada.</p></div>
                  <Input id={`training-frequency-${selected.id}`} value={selected.frequency} onChange={(event) => update({ frequency: event.target.value })} placeholder="Ex.: 3 vezes por semana" className="rounded-lg bg-background" />
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start sm:px-5">
                  <div><Label>Vigência</Label><p className="mt-1 text-xs text-muted-foreground">Período opcional da ficha.</p></div>
                  <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor={`training-start-${selected.id}`} className="text-xs text-muted-foreground">Data de início</Label><Input id={`training-start-${selected.id}`} type="date" value={selected.valid_from ?? ""} onChange={(event) => update({ valid_from: event.target.value || null })} className="rounded-lg bg-background" /></div><div className="space-y-1.5"><Label htmlFor={`training-end-${selected.id}`} className="text-xs text-muted-foreground">Data de término</Label><Input id={`training-end-${selected.id}`} type="date" value={selected.valid_until ?? ""} onChange={(event) => update({ valid_until: event.target.value || null })} className="rounded-lg bg-background" /></div></div>
                </div>
                <div className="grid gap-2 p-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start sm:px-5">
                  <div><Label htmlFor={`training-notes-${selected.id}`}>Orientações gerais</Label><p className="mt-1 text-xs text-muted-foreground">Informações visíveis ao paciente.</p></div>
                  <Textarea id={`training-notes-${selected.id}`} value={selected.general_notes} onChange={(event) => update({ general_notes: event.target.value })} placeholder="Observações para a ficha completa" className="min-h-28 resize-y rounded-lg bg-background" />
                </div>
              </fieldset>
              </section>

              <aside className="space-y-3 xl:sticky xl:top-28" aria-label="Prévia e resumo da ficha">
                <article className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
                  <div className="border-b border-primary/15 bg-primary/[0.06] px-4 py-3">
                    <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">Prévia no portal</p><StatusBadge status={selected.status} /></div>
                    <h4 className="mt-3 break-words text-lg font-semibold text-foreground">{selected.title.trim() || "Nova ficha de treino"}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{selected.goal.trim() || "Objetivo não definido"}</p>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted/55 p-2.5"><p className="text-[11px] text-muted-foreground">Frequência</p><p className="mt-1 text-sm font-medium text-foreground">{selected.frequency.trim() || "Não definida"}</p></div>
                      <div className="rounded-lg bg-muted/55 p-2.5"><p className="text-[11px] text-muted-foreground">Versão</p><p className="mt-1 text-sm font-medium text-foreground">v{selected.version}</p></div>
                    </div>
                    <div className="border-l-2 border-primary/40 pl-3"><p className="text-xs text-muted-foreground">Vigência</p><p className="mt-1 text-sm text-foreground">{formatTrainingDate(selected.valid_from)} – {formatTrainingDate(selected.valid_until)}</p></div>
                    {selected.general_notes.trim() ? <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{selected.general_notes}</p> : <p className="text-sm text-muted-foreground">As orientações gerais aparecerão aqui.</p>}
                  </div>
                </article>

                <article className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-foreground">Resumo da ficha</h4><span className={`text-xs font-medium ${isDirty ? "text-amber-700" : "text-primary"}`}>{isDirty ? "Alterações não salvas" : "Tudo salvo"}</span></div>
                  <dl className="mt-3 grid grid-cols-3 divide-x divide-border/60 rounded-lg bg-muted/45 py-3 text-center">
                    <div><dt className="text-[11px] text-muted-foreground">Sessões</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{selected.sessions?.length ?? 0}</dd></div>
                    <div><dt className="text-[11px] text-muted-foreground">Exercícios</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{selectedExerciseCount}</dd></div>
                    <div><dt className="text-[11px] text-muted-foreground">Séries</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{selectedSeriesCount}</dd></div>
                  </dl>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">A ficha só ficará visível no Portal do Paciente após a publicação.</p>
                </article>
              </aside>
            </div> : null}

            {editorStep === "sessions" ? <div className="space-y-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-primary">ETAPA 3 · MONTAGEM</p>
                  <h4 className="training-display text-2xl font-semibold tracking-tight text-foreground">Sessões e exercícios</h4>
                  <p className="text-xs text-muted-foreground">Edite os valores na ficha. Abra um exercício para orientações.</p>
                </div>
                {selected.status === "draft" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { const next = selected.sessions?.length ?? 0; update({ sessions: [...(selected.sessions ?? []), { title: `Treino ${String.fromCharCode(65 + next)}`, notes: "", sort_order: next, exercises: [] }] }); setActiveSessionIndex(next); setExercisePickerSessionIndex(null); setCatalogSearch(""); }}
                    className="w-full rounded-xl sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Adicionar sessão
                  </Button>
                ) : null}
              </div>

              {(selected.sessions ?? []).length > 0 ? (
                <div className="grid min-w-0 gap-3 rounded-xl border border-border/60 bg-muted/35 p-2 sm:p-3 lg:grid-cols-[210px_minmax(0,1fr)]">
                  <aside aria-label="Selecionar sessão" className="h-fit rounded-lg border border-border/60 bg-card p-2 shadow-sm lg:sticky lg:top-28">
                    <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sessões · {(selected.sessions ?? []).length}</p>
                    <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">{(selected.sessions ?? []).map((session, sessionIndex) => <button key={session.id ?? sessionIndex} type="button" aria-pressed={activeSessionIndex === sessionIndex} onClick={() => { setActiveSessionIndex(sessionIndex); setExercisePickerSessionIndex(null); setCatalogSearch(""); }} className={`flex min-h-12 min-w-40 items-center gap-2 rounded-lg px-2.5 text-left transition-colors lg:w-full ${activeSessionIndex === sessionIndex ? "border border-primary bg-primary/10 text-primary" : "border border-transparent text-foreground hover:bg-muted/70"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${activeSessionIndex === sessionIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{String.fromCharCode(65 + sessionIndex)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{session.title || `Sessão ${sessionIndex + 1}`}</span><span className="block truncate text-xs text-muted-foreground">{session.exercises.length} {session.exercises.length === 1 ? "exercício" : "exercícios"}</span></span></button>)}</div>
                    {(selected.sessions ?? []).length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">Adicione uma sessão para começar.</p> : null}
                  </aside>
                  {(selected.sessions ?? []).map((session, sessionIndex) => sessionIndex === activeSessionIndex ? (
                    <article key={session.id ?? sessionIndex} className="min-w-0 overflow-visible rounded-xl border border-border/70 bg-card shadow-sm ring-1 ring-black/[0.015]">
                      <div className="flex flex-col gap-2 border-b border-border/60 bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
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
                            <p className="text-xs text-muted-foreground">{session.exercises.length} exercícios · {session.exercises.reduce((total, exercise) => total + (Number.parseInt(exercise.sets, 10) || 0), 0)} séries</p>
                          </div>
                        </div>
                        {selected.status === "draft" ? (
                          <div className="flex self-end sm:self-auto">
                            <Button type="button" size="icon" variant="ghost" aria-label={`Duplicar sessão ${session.title || sessionIndex + 1}`} onClick={() => {
                              const copyIndex = (selected.sessions?.length ?? 0);
                              update({ sessions: [...(selected.sessions ?? []), { ...session, id: undefined, title: `${session.title || `Sessão ${sessionIndex + 1}`} (cópia)`, sort_order: copyIndex, exercises: session.exercises.map((exercise, exerciseIndex) => ({ ...exercise, id: undefined, sort_order: exerciseIndex })) }] });
                              setActiveSessionIndex(copyIndex);
                              setExercisePickerSessionIndex(null);
                              setCatalogSearch("");
                            }} className="rounded-lg text-muted-foreground"><Copy className="h-4 w-4" aria-hidden="true" /></Button>
                            <Button type="button" size="icon" variant="ghost" aria-label={`Remover sessão ${session.title || sessionIndex + 1}`} onClick={() => {
                              if (!window.confirm(`Remover a sessão “${session.title || `Sessão ${sessionIndex + 1}`}” e seus exercícios?`)) return;
                              const nextSessions = (selected.sessions ?? []).filter((_, index) => index !== sessionIndex);
                              update({ sessions: nextSessions });
                              setActiveSessionIndex((current) => current > sessionIndex ? current - 1 : Math.min(current, Math.max(0, nextSessions.length - 1)));
                              setExercisePickerSessionIndex(null);
                              setCatalogSearch("");
                            }} className="rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3 p-0">
                        <div className="space-y-2 px-3 pt-3">
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

                        <div className="space-y-0">
                          <div className="flex items-center justify-between gap-3 px-3 pb-2">
                            <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Dumbbell className="h-4 w-4 text-primary" aria-hidden="true" />Exercícios
                            </h5>
                            <span className="text-xs text-muted-foreground">
                              {session.exercises.length} {session.exercises.length === 1 ? "item" : "itens"}
                            </span>
                          </div>

                          {session.exercises.length > 0 ? (
                            <ol className="border-y border-border/60">
                              <li className="hidden grid-cols-[minmax(0,1fr)_74px_74px_90px_84px_28px] gap-3 bg-muted/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground md:grid"><span>Exercício</span><span>Séries</span><span>Reps</span><span>Carga</span><span>Interv.</span><span /></li>
                              {session.exercises.map((exercise, exerciseIndex) => {
                                const fieldId = `training-exercise-${selected.id}-${sessionIndex}-${exerciseIndex}`;
                                return (
                                  <li key={exercise.id ?? exerciseIndex} className="overflow-hidden border-b border-border/60 bg-background last:border-b-0">
                                    <div>
                                      <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_36px] items-center gap-3 px-3 py-2 hover:bg-muted/35 sm:px-4 md:grid-cols-[minmax(0,1fr)_74px_74px_90px_84px_36px]">
                                        <button type="button" aria-expanded={expandedExercises.has(`${sessionIndex}-${exerciseIndex}`) || !exercise.name.trim()} onClick={() => setExpandedExercises((current) => {
                                          const next = new Set(current);
                                          const key = `${sessionIndex}-${exerciseIndex}`;
                                          if (next.has(key)) next.delete(key);
                                          else next.add(key);
                                          return next;
                                        })} className="min-w-0 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                          <span className="block truncate text-sm font-semibold text-foreground"><span className="mr-2 hidden text-xs font-normal text-muted-foreground md:inline">{String(exerciseIndex + 1).padStart(2, "0")}</span>{exercise.name || "Novo exercício"}</span>
                                          <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 md:hidden">
                                            <ExerciseMetric label="Séries" value={exercise.sets} />
                                            <ExerciseMetric label="Repetições" value={exercise.repetitions} />
                                            <ExerciseMetric label="Carga" value={exercise.reference_load} />
                                            <ExerciseMetric label="Intervalo" value={exercise.rest} />
                                          </span>
                                        </button>
                                        <Input aria-label={`Séries de ${exercise.name || `exercício ${exerciseIndex + 1}`}`} disabled={selected.status !== "draft"} value={exercise.sets} placeholder="—" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { sets: event.target.value })} className="hidden h-8 rounded-md border-transparent bg-muted/60 px-2 text-sm tabular-nums shadow-none hover:border-input focus-visible:border-primary md:block" />
                                        <Input aria-label={`Repetições de ${exercise.name || `exercício ${exerciseIndex + 1}`}`} disabled={selected.status !== "draft"} value={exercise.repetitions} placeholder="—" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { repetitions: event.target.value })} className="hidden h-8 rounded-md border-transparent bg-muted/60 px-2 text-sm tabular-nums shadow-none hover:border-input focus-visible:border-primary md:block" />
                                        <Input aria-label={`Carga de ${exercise.name || `exercício ${exerciseIndex + 1}`}`} disabled={selected.status !== "draft"} value={exercise.reference_load} placeholder="—" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { reference_load: event.target.value })} className="hidden h-8 rounded-md border-transparent bg-muted/60 px-2 text-sm shadow-none hover:border-input focus-visible:border-primary md:block" />
                                        <Input aria-label={`Intervalo de ${exercise.name || `exercício ${exerciseIndex + 1}`}`} disabled={selected.status !== "draft"} value={exercise.rest} placeholder="—" onChange={(event) => updateExercise(sessionIndex, exerciseIndex, { rest: event.target.value })} className="hidden h-8 rounded-md border-transparent bg-muted/60 px-2 text-sm shadow-none hover:border-input focus-visible:border-primary md:block" />
                                        <button type="button" aria-label={`${expandedExercises.has(`${sessionIndex}-${exerciseIndex}`) ? "Recolher" : "Expandir"} ${exercise.name || `exercício ${exerciseIndex + 1}`}`} onClick={() => setExpandedExercises((current) => {
                                          const next = new Set(current);
                                          const key = `${sessionIndex}-${exerciseIndex}`;
                                          if (next.has(key)) next.delete(key);
                                          else next.add(key);
                                          return next;
                                        })} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                          <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expandedExercises.has(`${sessionIndex}-${exerciseIndex}`) || !exercise.name.trim() ? "rotate-180" : ""}`} aria-hidden="true" />
                                        </button>
                                      </div>
                                      {expandedExercises.has(`${sessionIndex}-${exerciseIndex}`) || !exercise.name.trim() ? <div className="grid gap-3 border-t border-border/60 bg-muted/10 p-3 sm:grid-cols-2 sm:p-4">
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
                                        <Button type="button" variant="outline" size="sm" disabled={exerciseIndex === 0} onClick={() => moveExercise(sessionIndex, exerciseIndex, -1)} className="min-h-10 rounded-xl">
                                          <ArrowUp className="mr-2 h-4 w-4" aria-hidden="true" />Subir
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" disabled={exerciseIndex === session.exercises.length - 1} onClick={() => moveExercise(sessionIndex, exerciseIndex, 1)} className="min-h-10 rounded-xl">
                                          <ArrowDown className="mr-2 h-4 w-4" aria-hidden="true" />Descer
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" disabled={!workspaceId} onClick={() => openSaveExercisePreset(sessionIndex, exerciseIndex)} className="min-h-10 rounded-xl">
                                          <Star className="mr-2 h-4 w-4" aria-hidden="true" />Salvar prescrição favorita
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" disabled={!workspaceId || exercisePresets.length === 0} onClick={() => { setExercisePresetTarget({ sessionIndex, exerciseIndex }); setExercisePresetSearch(""); setShowExercisePresetPicker(true); }} className="min-h-10 rounded-xl">
                                          Usar prescrição favorita
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => updateSession(sessionIndex, { exercises: session.exercises.filter((_, index) => index !== exerciseIndex) })} className="min-h-10 rounded-xl text-destructive hover:text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Remover exercício
                                        </Button>
                                      </div> : null}
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
                            <div className="p-3 sm:p-4">
                              <Button type="button" variant="outline" aria-expanded={exercisePickerSessionIndex === sessionIndex} aria-controls={`exercise-picker-${selected.id}-${sessionIndex}`} onClick={() => { setExercisePickerSessionIndex((current) => current === sessionIndex ? null : sessionIndex); setCatalogSearch(""); }} className="w-full rounded-lg sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Adicionar exercício
                              </Button>
                              {exercisePickerSessionIndex === sessionIndex ? (
                                <div id={`exercise-picker-${selected.id}-${sessionIndex}`} className="relative z-20 mt-3 rounded-lg border border-primary/20 bg-primary/[0.025] p-3 shadow-sm">
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <div><p className="text-sm font-semibold text-foreground">Adicionar à {session.title || `sessão ${sessionIndex + 1}`}</p><p className="text-xs text-muted-foreground">Busque no catálogo ou reutilize uma prescrição salva.</p></div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                                      const exerciseIndex = session.exercises.length;
                                      updateSession(sessionIndex, { exercises: [...session.exercises, { name: "", sets: "", repetitions: "", reference_load: "", rest: "", instructions: "", demo_url: "", sort_order: exerciseIndex }] });
                                      setExpandedExercises((current) => new Set(current).add(`${sessionIndex}-${exerciseIndex}`));
                                      setExercisePickerSessionIndex(null);
                                    }} className="self-start rounded-lg">Inserir manualmente</Button>
                                  </div>
                                  <div className="mt-3">
                                    <ExerciseAutocomplete id={`training-library-${selected.id}-${sessionIndex}`} value={catalogSearch} items={exerciseCatalog} onChange={setCatalogSearch} onSelect={(item) => {
                                      const exerciseIndex = session.exercises.length;
                                      updateSession(sessionIndex, { exercises: [...session.exercises, { name: item.name, sets: "", repetitions: "", reference_load: "", rest: "", instructions: item.instructions || "", demo_url: item.demo_url || "", sort_order: exerciseIndex }] });
                                      setExpandedExercises((current) => new Set(current).add(`${sessionIndex}-${exerciseIndex}`));
                                      setCatalogSearch("");
                                    }} />
                                  </div>
                                  {workspaceId && exercisePresets.length > 0 ? <div className="mt-3 border-t border-border/60 pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Prescrições salvas</p><div className="grid gap-2 sm:grid-cols-2">{exercisePresets.slice(0, 4).map((preset) => <button key={preset.id} type="button" onClick={() => {
                                    const exerciseIndex = session.exercises.length;
                                    updateSession(sessionIndex, { exercises: [...session.exercises, { name: preset.name, sets: preset.sets, repetitions: preset.repetitions, reference_load: preset.reference_load, rest: preset.rest, instructions: preset.instructions, demo_url: preset.demo_url, sort_order: exerciseIndex }] });
                                    setExpandedExercises((current) => new Set(current).add(`${sessionIndex}-${exerciseIndex}`));
                                  }} className="min-w-0 rounded-lg border border-border/60 bg-background px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="block truncate text-sm font-medium">{preset.name}</span><span className="block truncate text-xs text-muted-foreground">{[preset.sets && `${preset.sets} séries`, preset.repetitions && `${preset.repetitions} rep.`, preset.reference_load].filter(Boolean).join(" · ")}</span></button>)}</div></div> : null}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ) : null)}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/[0.08] px-4 py-8 text-center">
                  <CalendarDays className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-foreground">Nenhuma sessão adicionada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Separe a ficha em sessões para organizar os exercícios.</p>
                </div>
              )}
            </div> : null}

            {editorStep === "review" ? <section aria-labelledby="training-review-heading" className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-start">
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/15 bg-primary/[0.045] p-4 shadow-sm">
                  <p className="text-xs font-medium text-primary">ETAPA 4 · REVISÃO</p>
                  <h4 id="training-review-heading" className="training-display text-2xl font-semibold tracking-tight">{selected.title || "Nova ficha de treino"}</h4>
                  <p className="text-sm text-muted-foreground">{selected.goal || "Objetivo não definido"} · {selected.frequency || "Frequência não definida"}</p>
                  <p className="mt-3 border-l-2 border-primary pl-3 text-xs font-medium text-foreground">{(selected.sessions ?? []).length} sessões · {selectedExerciseCount} exercícios · {selectedSeriesCount} séries · versão {selected.version}</p>
                </div>
                <article className="rounded-xl border border-border/70 bg-card p-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="text-xs text-muted-foreground">Ficha · versão {selected.version}</p><p className="mt-1 text-sm text-muted-foreground">{formatTrainingDate(selected.valid_from)} – {formatTrainingDate(selected.valid_until)}</p></div>
                    <div className="flex items-center gap-2"><StatusBadge status={selected.status} /><Button type="button" variant="outline" onClick={() => setEditorStep("details")} className="min-h-10 rounded-lg">Editar ficha</Button></div>
                  </div>
                  {selected.general_notes ? <p className="mt-3 whitespace-pre-wrap border-t border-border/60 pt-3 text-sm text-muted-foreground">{selected.general_notes}</p> : null}
                </article>
                <div className="space-y-3">
                  {(selected.sessions ?? []).map((session, sessionIndex) => <article key={session.id ?? sessionIndex} className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                      <div><h5 className="font-semibold">{session.title || `Sessão ${sessionIndex + 1}`}</h5><p className="mt-0.5 text-xs text-muted-foreground">{session.notes || `${session.exercises.length} ${session.exercises.length === 1 ? "exercício" : "exercícios"}`}</p></div>
                      <Button type="button" variant="ghost" onClick={() => { setActiveSessionIndex(sessionIndex); setEditorStep("sessions"); }} className="min-h-10 rounded-lg text-primary">Editar</Button>
                    </div>
                    <div className="hidden grid-cols-[minmax(0,1fr)_110px_90px_80px] gap-3 bg-muted/50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground md:grid"><span>Exercício</span><span>Séries × reps</span><span>Carga</span><span>Intervalo</span></div>
                    <ol className="divide-y divide-border/60">
                      {session.exercises.map((exercise, exerciseIndex) => <li key={exercise.id ?? exerciseIndex} className="grid gap-x-3 gap-y-1 px-4 py-2.5 md:grid-cols-[minmax(0,1fr)_110px_90px_80px] md:items-center">
                        <span className="min-w-0"><span className="mr-2 text-xs text-muted-foreground">{exerciseIndex + 1}</span><span className="text-sm font-medium">{exercise.name || "Exercício sem nome"}</span>{exercise.instructions ? <span className="mt-1 block truncate text-xs text-muted-foreground">{exercise.instructions}</span> : null}</span>
                        <span className="text-sm text-foreground"><span className="mr-1 text-xs text-muted-foreground md:hidden">Séries × reps:</span>{[exercise.sets, exercise.repetitions].filter(Boolean).join(" × ") || "—"}</span><span className="text-sm text-foreground"><span className="mr-1 text-xs text-muted-foreground md:hidden">Carga:</span>{exercise.reference_load || "—"}</span><span className="text-sm text-foreground"><span className="mr-1 text-xs text-muted-foreground md:hidden">Intervalo:</span>{exercise.rest || "—"}</span>
                      </li>)}
                      {session.exercises.length === 0 ? <li className="px-4 py-5 text-sm text-muted-foreground">Nenhum exercício nesta sessão.</li> : null}
                    </ol>
                  </article>)}
                </div>
                {(selected.sessions ?? []).length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Ainda não há sessões para revisar.</div> : null}
              </div>
              <aside className="space-y-3 lg:sticky lg:top-28">
                <article className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"><h5 className="text-sm font-bold">Antes de publicar</h5>{reviewWarnings.length > 0 ? <ul className="mt-3 space-y-2">{reviewWarnings.map((warning) => <li key={warning} className="flex gap-2 text-sm leading-5 text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" /><span>{warning}</span></li>)}</ul> : <p className="mt-2 flex items-center gap-2 text-sm leading-5 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />Ficha pronta para publicação.</p>}</article>
                <article className="rounded-xl border border-primary/20 bg-primary/[0.035] p-4"><h5 className="text-sm font-bold text-primary">Ao publicar</h5><p className="mt-2 text-sm leading-5 text-muted-foreground">A ficha ficará disponível no Portal do Paciente. As versões anteriores permanecem preservadas.</p></article>
              </aside>
            </section> : null}
          </div>
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-card/95 px-3 py-3 backdrop-blur sm:px-5">
            <Button type="button" variant="ghost" onClick={() => editorStep === "details" ? returnToLibrary() : setEditorStep(editorStep === "review" ? "sessions" : "details")}>
              {editorStep === "details" ? "Biblioteca" : "Voltar"}
            </Button>
            <div className="ml-auto flex flex-wrap justify-end gap-2">
              {selected.status === "draft" ? <Button type="button" variant="outline" onClick={() => void save()} disabled={saving || !isDirty}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}Salvar rascunho
              </Button> : null}
              {editorStep === "details" ? <Button type="button" onClick={() => setEditorStep("sessions")}>Continuar<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button> : null}
              {editorStep === "sessions" ? <Button type="button" onClick={() => setEditorStep("review")}>Revisar ficha<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button> : null}
              {editorStep === "review" && selected.status === "draft" ? <Button type="button" onClick={() => void publish()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}Publicar no portal
              </Button> : null}
            </div>
          </div>
        </section>
      ) : null}
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

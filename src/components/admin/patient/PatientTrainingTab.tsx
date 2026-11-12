import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ClipboardPlus,
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

function ExerciseMetric({ label, value }: { label: string; value?: string | null }) {
  return (
    <span className="inline-flex min-w-0 items-baseline gap-1.5 text-xs text-muted-foreground">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      <span className="truncate font-semibold text-foreground">{value?.trim() || "—"}</span>
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
  const [editorStep, setEditorStep] = useState<"library" | "details" | "sessions" | "review">("library");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryStatus, setLibraryStatus] = useState<TrainingPlan["status"] | "all">("all");
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [catalogSearch, setCatalogSearch] = useState("");

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
      setShowCreateFlow(false);
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

  const publishedPlanCount = plans.filter((plan) => plan.status === "published").length;
  const draftPlanCount = plans.filter((plan) => plan.status === "draft").length;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <span className="absolute inset-y-0 left-0 w-1 bg-primary/80" aria-hidden="true" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
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
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 sm:max-w-xl sm:grid-cols-3">
          {[
            ["Fichas", plans.length],
            ["Publicadas", publishedPlanCount],
            ["Rascunhos", draftPlanCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border/60 bg-muted/25 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </div>
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
        <section aria-labelledby="training-plan-list-heading" className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-5">
          {plans.find((plan) => plan.status === "published") ? (() => {
            const publishedPlan = plans.find((plan) => plan.status === "published");
            if (!publishedPlan) return null;
            return (
              <article className="grid gap-4 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><StatusBadge status="published" /><span className="text-xs text-muted-foreground">Visível no portal do paciente</span></div>
                  <p className="mt-2 truncate text-base font-semibold text-foreground">{publishedPlan.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Versão {publishedPlan.version} · {publishedPlan.frequency || "Frequência não definida"} · {(publishedPlan.sessions ?? []).length} {(publishedPlan.sessions ?? []).length === 1 ? "sessão" : "sessões"}</p>
                </div>
                <Button type="button" variant="outline" onClick={() => { setActiveSessionIndex(0); void refresh(publishedPlan.id); setEditorStep("review"); }} className="min-h-10 rounded-xl sm:w-auto">Ver ficha publicada</Button>
              </article>
            );
          })() : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Biblioteca do paciente</p>
              <h3 id="training-plan-list-heading" className="mt-1 text-base font-semibold text-foreground">Fichas cadastradas</h3>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {filteredPlans.length} de {plans.length} {plans.length === 1 ? "ficha" : "fichas"}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filtrar fichas por status">
              {(["all", "published", "draft", "archived"] as const).map((status) => {
                const label = status === "all" ? "Todas" : statusLabel[status];
                const count = status === "all" ? plans.length : plans.filter((plan) => plan.status === status).length;
                return <button key={status} type="button" role="tab" aria-selected={libraryStatus === status} onClick={() => setLibraryStatus(status)} className={`min-h-9 shrink-0 rounded-lg px-3 text-sm transition-colors ${libraryStatus === status ? "bg-foreground font-semibold text-background" : "text-muted-foreground hover:bg-muted"}`}>{label} <span className="ml-1 tabular-nums opacity-70">{count}</span></button>;
              })}
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Buscar ficha" aria-label="Buscar ficha de treino" className="h-10 rounded-xl pl-9" />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
            <div className="hidden grid-cols-[minmax(0,2fr)_120px_76px_1fr_40px] gap-4 border-b border-border/60 bg-muted/25 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>Ficha</span><span>Status</span><span>Versão</span><span>Estrutura</span><span />
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
                  className={`group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[minmax(0,2fr)_120px_76px_1fr_40px] md:gap-4 ${active ? "bg-primary/[0.055]" : "hover:bg-muted/35"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">{plan.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{plan.goal || "Objetivo não definido"} · {plan.frequency || "Frequência não definida"}</span>
                  </span>
                  <span className="md:hidden"><StatusBadge status={plan.status} /></span>
                  <span className="hidden md:block"><StatusBadge status={plan.status} /></span>
                  <span className="hidden text-sm tabular-nums text-muted-foreground md:block">v{plan.version}</span>
                  <span className="col-span-2 text-xs text-muted-foreground md:col-span-1 md:text-sm">{(plan.sessions ?? []).length} {(plan.sessions ?? []).length === 1 ? "sessão" : "sessões"}</span>
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
          <Button type="button" onClick={() => setShowCreateFlow(true)} className="mt-5 rounded-xl">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Criar primeira ficha
          </Button>
        </section>
      ) : null}

      {selected && editorStep !== "library" ? (
        <section className="rounded-3xl border border-primary/15 bg-card shadow-sm" aria-labelledby="training-editor-heading">
          <div className="sticky top-2 z-20 flex flex-col gap-4 rounded-t-3xl border-b border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-start sm:justify-between sm:p-5">
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
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setEditorStep("library")} className="col-span-2 min-h-10 justify-start rounded-xl sm:col-span-1 sm:justify-center">← Biblioteca</Button>
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

          <nav aria-label="Etapas do construtor" className="grid grid-cols-3 gap-1 border-b border-border/60 bg-muted/15 p-2 sm:gap-2 sm:p-3">
            {([["details", "1", "Ficha"], ["sessions", "2", "Montagem"], ["review", "3", "Revisão"]] as const).map(([step, number, label]) => (
              <button key={step} type="button" aria-current={editorStep === step ? "step" : undefined} onClick={() => setEditorStep(step)}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-medium transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${editorStep === step ? "border border-primary/15 bg-card text-primary shadow-sm" : "border border-transparent text-muted-foreground hover:bg-card/70 hover:text-foreground"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${editorStep === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{number}</span>{label}
              </button>
            ))}
          </nav>

          <div className="p-4 sm:p-5">
            {editorStep === "details" ? <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/70 bg-muted/15">
              <div className="border-b border-border/60 px-4 py-3 sm:px-5">
                <p className="text-xs font-medium text-primary">ETAPA 1 · INFORMAÇÕES</p>
                <p className="mt-1 text-lg font-semibold text-foreground">Contexto da ficha</p>
                <p className="mt-1 text-sm text-muted-foreground">Defina o que o paciente verá antes de iniciar os treinos.</p>
              </div>
              <fieldset disabled={selected.status !== "draft"} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`training-title-${selected.id}`}>Título da ficha</Label>
                  <Input id={`training-title-${selected.id}`} value={selected.title} onChange={(event) => update({ title: event.target.value })} className="h-11 rounded-xl bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`training-goal-${selected.id}`}>Objetivo</Label>
                  <Input id={`training-goal-${selected.id}`} value={selected.goal} onChange={(event) => update({ goal: event.target.value })} className="rounded-xl bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`training-frequency-${selected.id}`}>Frequência</Label>
                  <Input id={`training-frequency-${selected.id}`} value={selected.frequency} onChange={(event) => update({ frequency: event.target.value })} placeholder="Ex.: 3 vezes por semana" className="rounded-xl bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`training-start-${selected.id}`}>Data de início</Label>
                  <Input id={`training-start-${selected.id}`} type="date" value={selected.valid_from ?? ""} onChange={(event) => update({ valid_from: event.target.value || null })} className="rounded-xl bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`training-end-${selected.id}`}>Data de término</Label>
                  <Input id={`training-end-${selected.id}`} type="date" value={selected.valid_until ?? ""} onChange={(event) => update({ valid_until: event.target.value || null })} className="rounded-xl bg-background" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`training-notes-${selected.id}`}>Orientações gerais</Label>
                  <Textarea id={`training-notes-${selected.id}`} value={selected.general_notes} onChange={(event) => update({ general_notes: event.target.value })} placeholder="Observações para a ficha completa" className="min-h-24 resize-y rounded-xl bg-background" />
                </div>
              </fieldset>
            </div> : null}

            {editorStep === "sessions" ? <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/[0.04] p-3 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-primary">ETAPA 2 · MONTAGEM</p>
                  <h4 className="mt-1 text-lg font-semibold text-foreground">Construtor de sessões</h4>
                </div>
                {selected.status === "draft" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { const next = selected.sessions?.length ?? 0; update({ sessions: [...(selected.sessions ?? []), { title: `Treino ${String.fromCharCode(65 + next)}`, notes: "", sort_order: next, exercises: [] }] }); setActiveSessionIndex(next); }}
                    className="w-full rounded-xl sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />Adicionar sessão
                  </Button>
                ) : null}
              </div>

              {(selected.sessions ?? []).length > 0 ? (
                <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(170px,0.65fr)_minmax(0,1.8fr)] 2xl:grid-cols-[minmax(180px,0.62fr)_minmax(420px,1.8fr)_minmax(250px,0.9fr)]">
                  <aside aria-label="Selecionar sessão" className="h-fit rounded-2xl border border-border/70 bg-muted/20 p-2.5 lg:sticky lg:top-28">
                    <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sessões · {(selected.sessions ?? []).length}</p>
                    <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">{(selected.sessions ?? []).map((session, sessionIndex) => <button key={session.id ?? sessionIndex} type="button" aria-pressed={activeSessionIndex === sessionIndex} onClick={() => setActiveSessionIndex(sessionIndex)} className={`flex min-h-12 min-w-36 items-center gap-2 rounded-xl px-2.5 text-left transition-colors lg:w-full ${activeSessionIndex === sessionIndex ? "border border-primary/20 bg-primary/10 text-primary" : "border border-transparent text-foreground hover:bg-background"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-semibold">{sessionIndex + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{session.title || `Sessão ${sessionIndex + 1}`}</span><span className="text-xs text-muted-foreground">{session.exercises.length}</span></button>)}</div>
                    {(selected.sessions ?? []).length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">Adicione uma sessão para começar.</p> : null}
                  </aside>
                  {(selected.sessions ?? []).filter((_, index) => index === activeSessionIndex).map((session, sessionIndex) => (
                    <article key={session.id ?? sessionIndex} className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                            onClick={() => {
                              const nextSessions = (selected.sessions ?? []).filter((_, index) => index !== sessionIndex);
                              update({ sessions: nextSessions });
                              setActiveSessionIndex((current) => current > sessionIndex
                                ? current - 1
                                : Math.min(current, Math.max(0, nextSessions.length - 1)));
                            }}
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
                                  <li key={exercise.id ?? exerciseIndex} className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-shadow motion-reduce:transition-none hover:shadow-md">
                                    <details className="group" open={expandedExercises.has(`${sessionIndex}-${exerciseIndex}`) || !exercise.name.trim()} onToggle={(event) => {
                                      const isOpen = event.currentTarget.open;
                                      setExpandedExercises((current) => {
                                        const next = new Set(current);
                                        if (isOpen) next.add(`${sessionIndex}-${exerciseIndex}`);
                                        else next.delete(`${sessionIndex}-${exerciseIndex}`);
                                        return next;
                                      });
                                    }}>
                                      <summary className="grid min-h-16 cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{String(exerciseIndex + 1).padStart(2, "0")}</span>
                                        <span className="min-w-0">
                                          <span className="block truncate text-sm font-semibold text-foreground">{exercise.name || "Novo exercício"}</span>
                                          <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                                            <ExerciseMetric label="Séries" value={exercise.sets} />
                                            <ExerciseMetric label="Repetições" value={exercise.repetitions} />
                                            <ExerciseMetric label="Carga" value={exercise.reference_load} />
                                            <ExerciseMetric label="Intervalo" value={exercise.rest} />
                                          </span>
                                        </span>
                                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                                      </summary>
                                      <div className="grid gap-3 border-t border-border/60 bg-muted/10 p-3 sm:grid-cols-2 sm:p-4">
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
                                        <Button type="button" variant="ghost" size="sm" onClick={() => updateSession(sessionIndex, { exercises: session.exercises.filter((_, index) => index !== exerciseIndex) })} className="min-h-10 rounded-xl text-destructive hover:text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Remover exercício
                                        </Button>
                                      </div> : null}
                                      </div>
                                    </details>
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
                  <aside aria-label="Biblioteca contextual de exercícios" className="min-w-0 space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-3 sm:p-4 2xl:sticky 2xl:top-28 2xl:h-fit">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Biblioteca contextual</p><h5 className="mt-1 font-semibold">Exercícios</h5><p className="mt-1 text-xs text-muted-foreground">{selected.sessions?.[activeSessionIndex]?.title || "Selecione uma sessão"}</p></div>
                    {selected.status === "draft" ? <>
                      <div className="space-y-2"><Label htmlFor={`training-library-${selected.id}`}>Buscar no catálogo</Label><ExerciseAutocomplete id={`training-library-${selected.id}`} value={catalogSearch} items={exerciseCatalog} onChange={setCatalogSearch} onSelect={(item) => {
                        const session = selected.sessions?.[activeSessionIndex];
                        if (!session) return;
                        const exerciseIndex = session.exercises.length;
                        updateSession(activeSessionIndex, { exercises: [...session.exercises, { name: item.name, sets: "", repetitions: "", reference_load: "", rest: "", instructions: item.instructions || "", demo_url: item.demo_url || "", sort_order: exerciseIndex }] });
                        setExpandedExercises((current) => new Set(current).add(`${activeSessionIndex}-${exerciseIndex}`));
                        setCatalogSearch("");
                      }} /></div>
                      {workspaceId ? <div className="space-y-1 border-t border-border/60 pt-3"><p className="pb-1 text-sm font-semibold">Prescrições salvas</p>{exercisePresets.slice(0, 5).map((preset) => <button key={preset.id} type="button" disabled={!selected.sessions?.[activeSessionIndex]} onClick={() => {
                        const session = selected.sessions?.[activeSessionIndex];
                        if (!session) return;
                        const exerciseIndex = session.exercises.length;
                        updateSession(activeSessionIndex, { exercises: [...session.exercises, { name: preset.name, sets: preset.sets, repetitions: preset.repetitions, reference_load: preset.reference_load, rest: preset.rest, instructions: preset.instructions, demo_url: preset.demo_url, sort_order: exerciseIndex }] });
                        setExpandedExercises((current) => new Set(current).add(`${activeSessionIndex}-${exerciseIndex}`));
                      }} className="block min-h-11 w-full rounded-xl px-2 py-2 text-left hover:bg-background disabled:opacity-50"><span className="block truncate text-sm font-medium">{preset.name}</span><span className="block truncate text-xs text-muted-foreground">{[preset.sets && `${preset.sets} séries`, preset.repetitions && `${preset.repetitions} rep.`, preset.reference_load].filter(Boolean).join(" · ")}</span></button>)}{exercisePresets.length === 0 ? <p className="text-xs text-muted-foreground">Suas prescrições favoritas aparecerão aqui.</p> : null}</div> : null}
                    </> : <p className="text-sm text-muted-foreground">Versão somente para consulta.</p>}
                  </aside>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/[0.08] px-4 py-8 text-center">
                  <CalendarDays className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-foreground">Nenhuma sessão adicionada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Separe a ficha em sessões para organizar os exercícios.</p>
                </div>
              )}
            </div> : null}

            {editorStep === "review" ? <section aria-labelledby="training-review-heading" className="mx-auto max-w-4xl space-y-4">
              <div><p className="text-xs font-medium text-primary">ETAPA 3 · REVISÃO</p><h4 id="training-review-heading" className="mt-1 text-lg font-semibold">Resumo antes de compartilhar</h4><p className="mt-1 text-sm text-muted-foreground">Revise as informações e volte diretamente à etapa que precisa de ajuste.</p></div>
              <article className="rounded-2xl border border-border/70 bg-muted/15 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-muted-foreground">Ficha · versão {selected.version}</p><h5 className="mt-1 text-lg font-semibold">{selected.title || "Nova ficha de treino"}</h5></div><StatusBadge status={selected.status}/></div><p className="mt-3 text-sm text-muted-foreground">{selected.goal || "Objetivo não definido"} · {selected.frequency || "Frequência não definida"}</p><p className="mt-1 text-sm text-muted-foreground">{selected.valid_from || "Sem início"} – {selected.valid_until || "Sem término"}</p>{selected.general_notes ? <p className="mt-3 whitespace-pre-wrap rounded-xl bg-background p-3 text-sm">{selected.general_notes}</p> : null}<Button type="button" variant="outline" onClick={() => setEditorStep("details")} className="mt-3 min-h-10 rounded-xl">Editar informações</Button></article>
              <div className="space-y-2">{(selected.sessions ?? []).map((session, sessionIndex) => <article key={session.id ?? sessionIndex} className="rounded-2xl border border-border/70 bg-background p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h5 className="font-semibold">{session.title || `Sessão ${sessionIndex + 1}`}</h5><p className="text-xs text-muted-foreground">{session.exercises.length} {session.exercises.length === 1 ? "exercício" : "exercícios"}</p></div><Button type="button" variant="outline" onClick={() => { setActiveSessionIndex(sessionIndex); setEditorStep("sessions"); }} className="min-h-10 rounded-xl">Editar sessão</Button></div>{session.notes ? <p className="mt-3 text-sm text-muted-foreground">{session.notes}</p> : null}<ul className="mt-3 grid gap-2 sm:grid-cols-2">{session.exercises.map((exercise, exerciseIndex) => <li key={exercise.id ?? exerciseIndex} className="rounded-xl bg-muted/40 px-3 py-2"><p className="truncate text-sm font-medium">{exercise.name || "Exercício sem nome"}</p><p className="text-xs text-muted-foreground">{[exercise.sets && `${exercise.sets} séries`, exercise.repetitions && `${exercise.repetitions} rep.`, exercise.reference_load, exercise.rest].filter(Boolean).join(" · ") || "Parâmetros não definidos"}</p></li>)}</ul></article>)}</div>
              {(selected.sessions ?? []).length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Ainda não há sessões para revisar.</div> : null}
            </section> : null}
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

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle, ArrowLeft, Brain, CalendarDays, CheckCircle2, ChevronRight,
  Dumbbell, Edit2, Info, Loader2, PauseCircle, Plus, Sparkles, Trash2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createWorkspaceTrainingExercise,
  createWorkspaceTrainingPlan,
  deleteWorkspaceTrainingExercise,
  deleteWorkspaceTrainingPlan,
  fetchWorkspaceTrainingExercises,
  fetchWorkspaceTrainingPlans,
  updateWorkspaceTrainingExercise,
  updateWorkspaceTrainingPlan,
  type TrainingGoal,
  type TrainingStatus,
  type WorkspaceTrainingExercise,
  type WorkspaceTrainingExerciseInput,
  type WorkspaceTrainingPlan,
  type WorkspaceTrainingPlanInput,
} from "@/lib/workspaceTraining";
import {
  analyzeTrainingProfile,
  GOAL_COLORS,
  GOAL_LABELS,
  TRAINING_TEMPLATES,
  type TrainingWarning,
} from "@/lib/workspaceTrainingIntelligence";
import type { WorkspacePatient } from "@/lib/workspacePatients";

// ── Prop types ────────────────────────────────────────────────────────────────

interface Props {
  workspaceId: string;
  patient: WorkspacePatient;
  anamnesis?: {
    medical_history?: string | null;
    goals?: string | null;
    physical_activity?: string | null;
  } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GOAL_OPTIONS: { value: TrainingGoal | ""; label: string }[] = [
  { value: "", label: "Selecione um objetivo" },
  { value: "hipertrofia",    label: "Hipertrofia" },
  { value: "emagrecimento",  label: "Emagrecimento" },
  { value: "condicionamento", label: "Condicionamento" },
  { value: "forca",          label: "Força" },
  { value: "saude",          label: "Saúde" },
  { value: "reabilitacao",   label: "Reabilitação" },
  { value: "outro",          label: "Outro" },
];

const STATUS_OPTIONS: { value: TrainingStatus; label: string }[] = [
  { value: "active",    label: "Ativo" },
  { value: "paused",    label: "Pausado" },
  { value: "completed", label: "Concluído" },
];

const STATUS_ICON: Record<TrainingStatus, React.ReactNode> = {
  active:    <CheckCircle2 size={12} className="text-green-600" />,
  paused:    <PauseCircle  size={12} className="text-amber-500" />,
  completed: <CheckCircle2 size={12} className="text-blue-500" />,
};

const emptyPlanInput: WorkspaceTrainingPlanInput = {
  name: "", goal: "", frequency_per_week: null, duration_weeks: null, notes: "", status: "active",
};

const emptyExerciseInput: WorkspaceTrainingExerciseInput = {
  day_label: "A", exercise_name: "", sets: "", reps: "", load_kg: "", rest_seconds: "", notes: "",
};

function WarningBadge({ w }: { w: TrainingWarning }) {
  const cls = w.level === "danger"
    ? "border-red-200 bg-red-50 text-red-700"
    : w.level === "warning"
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-blue-200 bg-blue-50 text-blue-700";
  const icon = w.level === "danger"
    ? <AlertTriangle size={13} className="shrink-0" />
    : w.level === "warning"
    ? <AlertTriangle size={13} className="shrink-0" />
    : <Info size={13} className="shrink-0" />;
  return (
    <div className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-xs", cls)}>
      {icon}<span>{w.message}</span>
    </div>
  );
}

// ── Plan form ─────────────────────────────────────────────────────────────────

function PlanForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: WorkspaceTrainingPlanInput;
  onSave: (input: WorkspaceTrainingPlanInput) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof WorkspaceTrainingPlanInput, v: WorkspaceTrainingPlanInput[typeof k]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="space-y-4 rounded-lg border bg-background p-5"
      onSubmit={(e: FormEvent) => { e.preventDefault(); onSave(form); }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="tp-name">Nome do plano *</Label>
        <Input id="tp-name" value={form.name} onChange={(e) => set("name", e.target.value)}
          placeholder="Ex: Hipertrofia — 3×/semana" required maxLength={120} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tp-goal">Objetivo</Label>
          <select id="tp-goal" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.goal} onChange={(e) => set("goal", e.target.value as TrainingGoal | "")}>
            {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tp-status">Status</Label>
          <select id="tp-status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.status} onChange={(e) => set("status", e.target.value as TrainingStatus)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tp-freq">Frequência semanal (dias)</Label>
          <Input id="tp-freq" type="number" min={1} max={7}
            value={form.frequency_per_week ?? ""}
            onChange={(e) => set("frequency_per_week", e.target.value ? Number(e.target.value) : null)}
            placeholder="Ex: 3" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tp-dur">Duração (semanas)</Label>
          <Input id="tp-dur" type="number" min={1}
            value={form.duration_weeks ?? ""}
            onChange={(e) => set("duration_weeks", e.target.value ? Number(e.target.value) : null)}
            placeholder="Ex: 12" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tp-notes">Observações</Label>
        <textarea id="tp-notes" rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          value={form.notes} onChange={(e) => set("notes", e.target.value)}
          placeholder="Notas gerais sobre o plano..." maxLength={1000} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="bg-[#166b50] hover:bg-[#145e45] text-white" disabled={saving}>
          {saving ? <><Loader2 size={13} className="animate-spin" />Salvando…</> : "Salvar plano"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

// ── Exercise form ─────────────────────────────────────────────────────────────

function ExerciseForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: WorkspaceTrainingExerciseInput;
  onSave: (input: WorkspaceTrainingExerciseInput) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof WorkspaceTrainingExerciseInput, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="rounded-lg border border-dashed bg-muted/20 p-4 space-y-3"
      onSubmit={(e: FormEvent) => { e.preventDefault(); onSave(form); }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ex-name" className="text-xs">Exercício *</Label>
          <Input id="ex-name" value={form.exercise_name} required
            onChange={(e) => set("exercise_name", e.target.value)}
            placeholder="Ex: Supino reto" maxLength={120} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ex-day" className="text-xs">Dia / Divisão</Label>
          <Input id="ex-day" value={form.day_label}
            onChange={(e) => set("day_label", e.target.value)}
            placeholder="A, B ou Segunda..." maxLength={30} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="ex-sets" className="text-xs">Séries</Label>
          <Input id="ex-sets" value={form.sets} onChange={(e) => set("sets", e.target.value)} placeholder="4" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ex-reps" className="text-xs">Reps / Duração</Label>
          <Input id="ex-reps" value={form.reps} onChange={(e) => set("reps", e.target.value)} placeholder="8-12" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ex-load" className="text-xs">Carga (kg)</Label>
          <Input id="ex-load" value={form.load_kg} onChange={(e) => set("load_kg", e.target.value)} placeholder="60" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ex-rest" className="text-xs">Descanso (s)</Label>
          <Input id="ex-rest" value={form.rest_seconds} onChange={(e) => set("rest_seconds", e.target.value)} placeholder="90" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ex-notes" className="text-xs">Observações</Label>
        <Input id="ex-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)}
          placeholder="Técnica, substituição..." maxLength={300} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="bg-[#166b50] hover:bg-[#145e45] text-white h-8 text-xs" disabled={saving}>
          {saving ? <><Loader2 size={11} className="animate-spin" />…</> : "Salvar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

// ── Intelligence panel ────────────────────────────────────────────────────────

function IntelligencePanel({
  plan,
  exercises,
  patient,
  anamnesis,
}: {
  plan: WorkspaceTrainingPlan | null;
  exercises: WorkspaceTrainingExercise[];
  patient: WorkspacePatient;
  anamnesis: Props["anamnesis"];
}) {
  const result = useMemo(
    () => analyzeTrainingProfile(patient, plan, exercises, anamnesis),
    [patient, plan, exercises, anamnesis],
  );

  const hasContent = result.warnings.length > 0
    || result.suggestedGoal
    || result.caloricLoadKcalPerWeek > 0
    || result.staleExercises.length > 0;

  if (!hasContent) return null;

  return (
    <div className="rounded-lg border border-[#166b50]/20 bg-[#166b50]/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Brain size={15} className="text-[#166b50]" />
        <span className="text-sm font-semibold text-[#153f34]">Análise inteligente</span>
      </div>

      {result.warnings.map((w, i) => <WarningBadge key={i} w={w} />)}

      {result.suggestedGoal && !plan?.goal && (
        <div className="flex items-start gap-2 rounded-md border border-[#166b50]/30 bg-white/70 px-3 py-2 text-xs text-[#153f34]">
          <Sparkles size={13} className="text-[#166b50] shrink-0 mt-0.5" />
          <span><strong>Sugestão:</strong> {result.suggestedGoalReason} Considere o objetivo <strong>{GOAL_LABELS[result.suggestedGoal]}</strong>.</span>
        </div>
      )}

      {result.caloricLoadKcalPerWeek > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Zap size={13} className="shrink-0" />
          <span>
            Gasto estimado: <strong>~{result.caloricLoadKcalPerWeek.toLocaleString("pt-BR")} kcal/semana</strong> ({result.caloricLoadLabel}).
            {result.caloricLoadKcalPerWeek >= 1200 && " Certifique-se que o plano alimentar cobre este volume."}
          </span>
        </div>
      )}

      {result.staleExercises.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>
            <strong>{result.staleExercises.length} exercício{result.staleExercises.length > 1 ? "s" : ""}</strong> com carga não atualizada há +28 dias. Considere ajustar a progressão.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Plan detail view ──────────────────────────────────────────────────────────

function PlanDetail({
  workspaceId,
  patient,
  plan,
  anamnesis,
  onBack,
  onPlanUpdated,
}: {
  workspaceId: string;
  patient: WorkspacePatient;
  plan: WorkspaceTrainingPlan;
  anamnesis: Props["anamnesis"];
  onBack: () => void;
  onPlanUpdated: (p: WorkspaceTrainingPlan) => void;
}) {
  const [exercises, setExercises] = useState<WorkspaceTrainingExercise[]>([]);
  const [loadingEx, setLoadingEx] = useState(true);
  const [exError, setExError] = useState("");

  const [editingPlan, setEditingPlan] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState("");

  const [addingEx, setAddingEx] = useState(false);
  const [editingExId, setEditingExId] = useState<number | null>(null);
  const [exFormSaving, setExFormSaving] = useState(false);
  const [exFormError, setExFormError] = useState("");

  const [deletingPlan, setDeletingPlan] = useState(false);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(false);
  const [deletingExId, setDeletingExId] = useState<number | null>(null);

  const loadExercises = useCallback(async () => {
    setLoadingEx(true); setExError("");
    try { setExercises(await fetchWorkspaceTrainingExercises(workspaceId, plan.id)); }
    catch (e) { setExError(e instanceof Error ? e.message : "Erro ao carregar exercícios."); }
    finally { setLoadingEx(false); }
  }, [workspaceId, plan.id]);

  useEffect(() => { void loadExercises(); }, [loadExercises]);

  const handlePlanSave = async (input: WorkspaceTrainingPlanInput) => {
    setPlanSaving(true); setPlanError("");
    try {
      const updated = await updateWorkspaceTrainingPlan(workspaceId, plan.id, input);
      onPlanUpdated(updated);
      setEditingPlan(false);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally { setPlanSaving(false); }
  };

  const handleDeletePlan = async () => {
    setDeletingPlan(true);
    try {
      await deleteWorkspaceTrainingPlan(workspaceId, plan.id);
      onBack();
    } catch { setDeletingPlan(false); }
  };

  const handleAddExercise = async (input: WorkspaceTrainingExerciseInput) => {
    setExFormSaving(true); setExFormError("");
    try {
      await createWorkspaceTrainingExercise(workspaceId, plan.id, input, exercises.length);
      await loadExercises();
      setAddingEx(false);
    } catch (e) {
      setExFormError(e instanceof Error ? e.message : "Erro ao salvar exercício.");
    } finally { setExFormSaving(false); }
  };

  const handleUpdateExercise = async (exId: number, input: WorkspaceTrainingExerciseInput) => {
    setExFormSaving(true); setExFormError("");
    try {
      await updateWorkspaceTrainingExercise(workspaceId, exId, input);
      await loadExercises();
      setEditingExId(null);
    } catch (e) {
      setExFormError(e instanceof Error ? e.message : "Erro ao salvar exercício.");
    } finally { setExFormSaving(false); }
  };

  const handleDeleteExercise = async (exId: number) => {
    setDeletingExId(exId);
    try {
      await deleteWorkspaceTrainingExercise(workspaceId, exId);
      setExercises((prev) => prev.filter((e) => e.id !== exId));
    } catch {}
    finally { setDeletingExId(null); }
  };

  // Group exercises by day
  const exercisesByDay = useMemo(() => {
    const map = new Map<string, WorkspaceTrainingExercise[]>();
    for (const ex of exercises) {
      const arr = map.get(ex.day_label) ?? [];
      arr.push(ex);
      map.set(ex.day_label, arr);
    }
    return map;
  }, [exercises]);

  const planInput: WorkspaceTrainingPlanInput = {
    name: plan.name,
    goal: plan.goal ?? "",
    frequency_per_week: plan.frequency_per_week,
    duration_weeks: plan.duration_weeks,
    notes: plan.notes ?? "",
    status: plan.status,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} />Planos
        </button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm font-medium truncate">{plan.name}</span>
      </div>

      {/* Plan summary or edit form */}
      {editingPlan ? (
        <PlanForm initial={planInput} onSave={handlePlanSave} onCancel={() => setEditingPlan(false)}
          saving={planSaving} error={planError} />
      ) : (
        <div className="rounded-lg border bg-background p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {plan.goal && (
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", GOAL_COLORS[plan.goal])}>
                    {GOAL_LABELS[plan.goal]}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {STATUS_ICON[plan.status]}
                  {STATUS_OPTIONS.find((s) => s.value === plan.status)?.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.frequency_per_week ? `${plan.frequency_per_week}×/semana` : ""}
                {plan.frequency_per_week && plan.duration_weeks ? " · " : ""}
                {plan.duration_weeks ? `${plan.duration_weeks} semanas` : ""}
              </p>
              {plan.notes && <p className="text-xs text-muted-foreground">{plan.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditingPlan(true)}
                className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
                <Edit2 size={12} />Editar
              </button>
              {!confirmDeletePlan ? (
                <button type="button" onClick={() => setConfirmDeletePlan(true)}
                  className="flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5">
                  <Trash2 size={12} />Excluir
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Excluir plano?</span>
                  <button type="button" onClick={() => void handleDeletePlan()} disabled={deletingPlan}
                    className="rounded-md bg-destructive px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                    {deletingPlan ? "…" : "Sim"}
                  </button>
                  <button type="button" onClick={() => setConfirmDeletePlan(false)}
                    className="text-xs text-muted-foreground hover:text-foreground">Não</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Intelligence panel */}
      <IntelligencePanel plan={plan} exercises={exercises} patient={patient} anamnesis={anamnesis} />

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Exercícios ({exercises.length})</h3>
          {!addingEx && (
            <Button size="sm" onClick={() => setAddingEx(true)}
              className="h-8 text-xs bg-[#166b50] hover:bg-[#145e45] text-white">
              <Plus size={13} />Adicionar exercício
            </Button>
          )}
        </div>

        {loadingEx && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />Carregando exercícios…
          </p>
        )}
        {exError && <p className="text-sm text-destructive">{exError}</p>}

        {addingEx && (
          <ExerciseForm initial={emptyExerciseInput} onSave={handleAddExercise}
            onCancel={() => { setAddingEx(false); setExFormError(""); }}
            saving={exFormSaving} error={exFormError} />
        )}

        {!loadingEx && exercises.length === 0 && !addingEx && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Dumbbell className="mx-auto mb-3 text-muted-foreground" size={24} />
            <p className="text-sm font-medium">Nenhum exercício cadastrado</p>
            <p className="mt-1 text-xs text-muted-foreground">Adicione os exercícios deste plano.</p>
            <Button size="sm" className="mt-3 bg-[#166b50] hover:bg-[#145e45] text-white"
              onClick={() => setAddingEx(true)}>
              <Plus size={13} />Primeiro exercício
            </Button>
          </div>
        )}

        {!loadingEx && Array.from(exercisesByDay.entries()).map(([day, exs]) => (
          <div key={day} className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Treino {day}
              </span>
            </div>
            <div className="space-y-1">
              {exs.map((ex) => {
                const isStale = analyzeTrainingProfile(patient, plan, exercises, anamnesis).staleExercises.includes(ex.id);
                if (editingExId === ex.id) {
                  const exInput: WorkspaceTrainingExerciseInput = {
                    day_label: ex.day_label,
                    exercise_name: ex.exercise_name,
                    sets: ex.sets != null ? String(ex.sets) : "",
                    reps: ex.reps ?? "",
                    load_kg: ex.load_kg != null ? String(ex.load_kg) : "",
                    rest_seconds: ex.rest_seconds != null ? String(ex.rest_seconds) : "",
                    notes: ex.notes ?? "",
                  };
                  return (
                    <ExerciseForm key={ex.id} initial={exInput}
                      onSave={(input) => void handleUpdateExercise(ex.id, input)}
                      onCancel={() => { setEditingExId(null); setExFormError(""); }}
                      saving={exFormSaving} error={exFormError} />
                  );
                }
                return (
                  <div key={ex.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm",
                      isStale && "border-amber-200 bg-amber-50/40",
                    )}>
                    <Dumbbell size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{ex.exercise_name}</span>
                        {isStale && (
                          <span className="text-[10px] rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-amber-700">
                            Atualizar carga
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ex.sets ? `${ex.sets} séries` : ""}
                        {ex.sets && ex.reps ? " × " : ""}
                        {ex.reps ?? ""}
                        {ex.load_kg ? ` · ${ex.load_kg} kg` : ""}
                        {ex.rest_seconds ? ` · ${ex.rest_seconds}s descanso` : ""}
                        {ex.notes ? ` · ${ex.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => setEditingExId(ex.id)}
                        className="rounded p-1 hover:bg-muted" title="Editar">
                        <Edit2 size={12} className="text-muted-foreground" />
                      </button>
                      <button type="button" disabled={deletingExId === ex.id}
                        onClick={() => void handleDeleteExercise(ex.id)}
                        className="rounded p-1 hover:bg-muted disabled:opacity-50" title="Excluir">
                        {deletingExId === ex.id
                          ? <Loader2 size={12} className="animate-spin text-muted-foreground" />
                          : <Trash2 size={12} className="text-muted-foreground hover:text-destructive" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Plan list view ────────────────────────────────────────────────────────────

function PlanList({
  workspaceId,
  patient,
  anamnesis,
  plans,
  loadingPlans,
  plansError,
  onSelectPlan,
  onCreatePlan,
  onTemplateApplied,
}: {
  workspaceId: string;
  patient: WorkspacePatient;
  anamnesis: Props["anamnesis"];
  plans: WorkspaceTrainingPlan[];
  loadingPlans: boolean;
  plansError: string;
  onSelectPlan: (p: WorkspaceTrainingPlan) => void;
  onCreatePlan: () => void;
  onTemplateApplied: () => void;
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  // Smart goal suggestion (global — no plan selected yet)
  const suggestion = useMemo(
    () => analyzeTrainingProfile(patient, null, [], anamnesis),
    [patient, anamnesis],
  );

  const handleApplyTemplate = async (tpl: (typeof TRAINING_TEMPLATES)[number]) => {
    setApplyingTemplate(tpl.goal);
    try {
      const plan = await createWorkspaceTrainingPlan(workspaceId, patient.id, {
        name: tpl.label,
        goal: tpl.goal,
        frequency_per_week: tpl.exercises
          .map((e) => e.day_label)
          .filter((v, i, arr) => arr.indexOf(v) === i).length,
        duration_weeks: 12,
        notes: tpl.description,
        status: "active",
      });
      let pos = 0;
      for (const ex of tpl.exercises) {
        await createWorkspaceTrainingExercise(workspaceId, plan.id, ex, pos++);
      }
      onTemplateApplied();
    } catch {}
    finally { setApplyingTemplate(null); setShowTemplates(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Planos de treino</h2>
          <p className="text-sm text-muted-foreground">Prescrições de exercício deste paciente.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowTemplates((v) => !v)}>
            <Sparkles size={14} />Templates
          </Button>
          <Button size="sm" className="bg-[#166b50] hover:bg-[#145e45] text-white" onClick={onCreatePlan}>
            <Plus size={14} />Novo plano
          </Button>
        </div>
      </div>

      {/* Smart suggestion (when no plans yet) */}
      {plans.length === 0 && suggestion.suggestedGoal && (
        <div className="flex items-start gap-2 rounded-lg border border-[#166b50]/30 bg-[#166b50]/5 px-4 py-3 text-sm text-[#153f34]">
          <Brain size={16} className="text-[#166b50] shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Sugestão baseada na anamnese: </span>
            {suggestion.suggestedGoalReason}{" "}
            <button type="button"
              className="font-semibold underline underline-offset-2 hover:no-underline"
              onClick={() => setShowTemplates(true)}>
              Ver template de {GOAL_LABELS[suggestion.suggestedGoal!]}
            </button>
          </div>
        </div>
      )}

      {/* Template picker */}
      {showTemplates && (
        <div className="rounded-lg border bg-background p-4 space-y-3">
          <p className="text-sm font-semibold">Escolha um template para começar</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TRAINING_TEMPLATES.map((tpl) => (
              <button
                key={tpl.goal}
                type="button"
                disabled={applyingTemplate === tpl.goal}
                onClick={() => void handleApplyTemplate(tpl)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50",
                  suggestion.suggestedGoal === tpl.goal && "border-[#166b50]/40 bg-[#166b50]/5",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs rounded-full border px-2 py-0.5 font-medium", GOAL_COLORS[tpl.goal])}>
                    {GOAL_LABELS[tpl.goal]}
                  </span>
                  {suggestion.suggestedGoal === tpl.goal && (
                    <Sparkles size={11} className="text-[#166b50]" />
                  )}
                </div>
                <p className="text-xs font-medium">{tpl.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{tpl.exercises.length} exercícios</p>
                {applyingTemplate === tpl.goal && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-[#166b50]">
                    <Loader2 size={11} className="animate-spin" />Aplicando…
                  </div>
                )}
              </button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowTemplates(false)}>Fechar</Button>
        </div>
      )}

      {/* Loading / error */}
      {loadingPlans && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />Carregando planos…
        </p>
      )}
      {plansError && <p className="text-sm text-destructive">{plansError}</p>}

      {/* Empty state */}
      {!loadingPlans && plans.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Dumbbell className="mx-auto mb-3 text-muted-foreground" size={28} />
          <p className="text-sm font-medium">Nenhum plano de treino</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie um plano do zero ou aplique um template.</p>
          <div className="flex justify-center gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => setShowTemplates(true)}>
              <Sparkles size={14} />Templates
            </Button>
            <Button size="sm" className="bg-[#166b50] hover:bg-[#145e45] text-white" onClick={onCreatePlan}>
              <Plus size={14} />Novo plano
            </Button>
          </div>
        </div>
      )}

      {/* Plan cards */}
      {!loadingPlans && plans.length > 0 && (
        <div className="space-y-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan)}
              className="w-full rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/50 flex items-center gap-3"
            >
              <Dumbbell size={18} className="text-[#166b50] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{plan.name}</span>
                  {plan.goal && (
                    <span className={cn("text-xs rounded-full border px-2 py-0.5 font-medium", GOAL_COLORS[plan.goal])}>
                      {GOAL_LABELS[plan.goal]}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {STATUS_ICON[plan.status]}
                    {STATUS_OPTIONS.find((s) => s.value === plan.status)?.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {plan.frequency_per_week ? `${plan.frequency_per_week}×/semana` : ""}
                  {plan.frequency_per_week && plan.duration_weeks ? " · " : ""}
                  {plan.duration_weeks ? `${plan.duration_weeks} semanas` : ""}
                  {!plan.frequency_per_week && !plan.duration_weeks ? "Sem periodicidade definida" : ""}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WorkspaceTrainingTab({ workspaceId, patient, anamnesis }: Props) {
  const [plans, setPlans] = useState<WorkspaceTrainingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<WorkspaceTrainingPlan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true); setPlansError("");
    try {
      const data = await fetchWorkspaceTrainingPlans(workspaceId, patient.id);
      if (mountedRef.current) setPlans(data);
    } catch (e) {
      if (mountedRef.current) setPlansError(e instanceof Error ? e.message : "Erro ao carregar planos.");
    } finally {
      if (mountedRef.current) setLoadingPlans(false);
    }
  }, [workspaceId, patient.id]);

  useEffect(() => { void loadPlans(); }, [loadPlans]);

  const handleCreatePlan = async (input: WorkspaceTrainingPlanInput) => {
    setCreateSaving(true); setCreateError("");
    try {
      const created = await createWorkspaceTrainingPlan(workspaceId, patient.id, input);
      setPlans((prev) => [created, ...prev]);
      setSelectedPlan(created);
      setCreatingPlan(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Erro ao criar plano.");
    } finally { setCreateSaving(false); }
  };

  if (creatingPlan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setCreatingPlan(false)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} />Voltar
          </button>
          <span className="text-sm font-medium">Novo plano de treino</span>
        </div>
        <PlanForm initial={emptyPlanInput} onSave={handleCreatePlan}
          onCancel={() => setCreatingPlan(false)} saving={createSaving} error={createError} />
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <PlanDetail
        workspaceId={workspaceId}
        patient={patient}
        plan={selectedPlan}
        anamnesis={anamnesis}
        onBack={() => { setSelectedPlan(null); void loadPlans(); }}
        onPlanUpdated={(updated) => {
          setSelectedPlan(updated);
          setPlans((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        }}
      />
    );
  }

  return (
    <PlanList
      workspaceId={workspaceId}
      patient={patient}
      anamnesis={anamnesis}
      plans={plans}
      loadingPlans={loadingPlans}
      plansError={plansError}
      onSelectPlan={setSelectedPlan}
      onCreatePlan={() => setCreatingPlan(true)}
      onTemplateApplied={() => void loadPlans()}
    />
  );
}

import { workspaceSupabase } from "@/lib/workspaceSupabase";

// ── Types ────────────────────────────────────────────────────────────────────

export type TrainingGoal =
  | "hipertrofia"
  | "emagrecimento"
  | "condicionamento"
  | "saude"
  | "forca"
  | "reabilitacao"
  | "outro";

export type TrainingStatus = "active" | "paused" | "completed";

export interface WorkspaceTrainingPlan {
  id: number;
  workspace_id: string;
  patient_id: number;
  name: string;
  goal: TrainingGoal | null;
  frequency_per_week: number | null;
  duration_weeks: number | null;
  notes: string | null;
  status: TrainingStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceTrainingPlanInput {
  name: string;
  goal: TrainingGoal | "";
  frequency_per_week: number | null;
  duration_weeks: number | null;
  notes: string;
  status: TrainingStatus;
}

export interface WorkspaceTrainingExercise {
  id: number;
  workspace_id: string;
  plan_id: number;
  day_label: string;
  exercise_name: string;
  sets: number | null;
  reps: string | null;
  load_kg: number | null;
  rest_seconds: number | null;
  notes: string | null;
  position: number;
  updated_at: string;
}

export interface WorkspaceTrainingExerciseInput {
  day_label: string;
  exercise_name: string;
  sets: string;
  reps: string;
  load_kg: string;
  rest_seconds: string;
  notes: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function assertScope(workspaceId: string, patientId: number): void {
  if (!workspaceId || !Number.isSafeInteger(patientId) || patientId <= 0) {
    throw new Error("Workspace e paciente são obrigatórios.");
  }
}

function parseNum(val: string): number | null {
  const n = parseFloat(val.replace(",", "."));
  return val.trim() === "" || Number.isNaN(n) ? null : n;
}

// ── Duplicate helpers (puros) ─────────────────────────────────────────────────

/** "X" -> "X (cópia)"; se já existir, "X (cópia 2)", "X (cópia 3)"... */
export function duplicatePlanName(name: string, existingNames: string[]): string {
  const base = name.trim();
  const taken = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  const first = `${base} (cópia)`;
  if (!taken.has(first.toLowerCase())) return first;
  for (let i = 2; ; i++) {
    const candidate = `${base} (cópia ${i})`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

/**
 * Rótulo para cópia de um dia: se `day` for uma letra A–Z e existir uma letra
 * livre após ela em `existing`, usa a próxima livre; senão "${day} (cópia)".
 */
export function nextDuplicateDayLabel(day: string, existing: string[]): string {
  const taken = new Set(existing.map((d) => d.trim().toUpperCase()));
  const label = day.trim();
  if (/^[A-Za-z]$/.test(label)) {
    for (let code = label.toUpperCase().charCodeAt(0) + 1; code <= "Z".charCodeAt(0); code++) {
      const letter = String.fromCharCode(code);
      if (!taken.has(letter)) return letter;
    }
  }
  return `${day} (cópia)`;
}

// ── Training Plans ────────────────────────────────────────────────────────────

export async function fetchWorkspaceTrainingPlans(
  workspaceId: string,
  patientId: number,
): Promise<WorkspaceTrainingPlan[]> {
  assertScope(workspaceId, patientId);
  const { data, error } = await workspaceSupabase
    .from("workspace_training_plans")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceTrainingPlan[];
}

export async function createWorkspaceTrainingPlan(
  workspaceId: string,
  patientId: number,
  input: WorkspaceTrainingPlanInput,
): Promise<WorkspaceTrainingPlan> {
  assertScope(workspaceId, patientId);
  const { data, error } = await workspaceSupabase
    .from("workspace_training_plans")
    .insert({
      workspace_id: workspaceId,
      patient_id: patientId,
      name: input.name.trim(),
      goal: input.goal || null,
      frequency_per_week: input.frequency_per_week,
      duration_weeks: input.duration_weeks,
      notes: input.notes.trim() || null,
      status: input.status,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTrainingPlan;
}

export async function updateWorkspaceTrainingPlan(
  workspaceId: string,
  planId: number,
  input: WorkspaceTrainingPlanInput,
): Promise<WorkspaceTrainingPlan> {
  const { data, error } = await workspaceSupabase
    .from("workspace_training_plans")
    .update({
      name: input.name.trim(),
      goal: input.goal || null,
      frequency_per_week: input.frequency_per_week,
      duration_weeks: input.duration_weeks,
      notes: input.notes.trim() || null,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", planId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTrainingPlan;
}

export async function deleteWorkspaceTrainingPlan(
  workspaceId: string,
  planId: number,
): Promise<void> {
  const { error } = await workspaceSupabase
    .from("workspace_training_plans")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", planId);
  if (error) throw new Error(error.message);
}

// ── Training Exercises ────────────────────────────────────────────────────────

export async function fetchWorkspaceTrainingExercises(
  workspaceId: string,
  planId: number,
): Promise<WorkspaceTrainingExercise[]> {
  const { data, error } = await workspaceSupabase
    .from("workspace_training_exercises")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("plan_id", planId)
    .order("day_label", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceTrainingExercise[];
}

export async function fetchWorkspaceExerciseNames(workspaceId: string): Promise<string[]> {
  const { data, error } = await workspaceSupabase
    .from("workspace_training_exercises")
    .select("exercise_name")
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { exercise_name: string | null }[];
  const byKey = new Map<string, string>();
  for (const row of rows) {
    const name = (row.exercise_name ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, name);
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function createWorkspaceTrainingExercise(
  workspaceId: string,
  planId: number,
  input: WorkspaceTrainingExerciseInput,
  position: number,
): Promise<WorkspaceTrainingExercise> {
  const { data, error } = await workspaceSupabase
    .from("workspace_training_exercises")
    .insert({
      workspace_id: workspaceId,
      plan_id: planId,
      day_label: input.day_label.trim() || "A",
      exercise_name: input.exercise_name.trim(),
      sets: parseNum(input.sets),
      reps: input.reps.trim() || null,
      load_kg: parseNum(input.load_kg),
      rest_seconds: parseNum(input.rest_seconds),
      notes: input.notes.trim() || null,
      position,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTrainingExercise;
}

export async function updateWorkspaceTrainingExercise(
  workspaceId: string,
  exerciseId: number,
  input: WorkspaceTrainingExerciseInput,
): Promise<WorkspaceTrainingExercise> {
  const { data, error } = await workspaceSupabase
    .from("workspace_training_exercises")
    .update({
      day_label: input.day_label.trim() || "A",
      exercise_name: input.exercise_name.trim(),
      sets: parseNum(input.sets),
      reps: input.reps.trim() || null,
      load_kg: parseNum(input.load_kg),
      rest_seconds: parseNum(input.rest_seconds),
      notes: input.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", exerciseId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTrainingExercise;
}

export async function updateWorkspaceTrainingExercisePosition(
  workspaceId: string, exerciseId: number, position: number,
): Promise<void> {
  const { error } = await workspaceSupabase
    .from("workspace_training_exercises")
    .update({ position, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);
}

export async function deleteWorkspaceTrainingExercise(
  workspaceId: string,
  exerciseId: number,
): Promise<void> {
  const { error } = await workspaceSupabase
    .from("workspace_training_exercises")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);
}

// ── Duplicate (exercício, dia, plano) ─────────────────────────────────────────

function buildExerciseCopyRow(
  workspaceId: string,
  planId: number,
  source: WorkspaceTrainingExercise,
  dayLabel: string,
  position: number,
) {
  return {
    workspace_id: workspaceId,
    plan_id: planId,
    day_label: dayLabel,
    exercise_name: source.exercise_name,
    sets: source.sets,
    reps: source.reps,
    load_kg: source.load_kg,
    rest_seconds: source.rest_seconds,
    notes: source.notes,
    position,
  };
}

export async function duplicateWorkspaceTrainingExercise(
  workspaceId: string,
  source: WorkspaceTrainingExercise,
  position: number,
): Promise<WorkspaceTrainingExercise> {
  const { data, error } = await workspaceSupabase
    .from("workspace_training_exercises")
    .insert(buildExerciseCopyRow(workspaceId, source.plan_id, source, source.day_label, position))
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTrainingExercise;
}

export async function duplicateWorkspaceTrainingDay(
  workspaceId: string,
  planId: number,
  sourceExercises: WorkspaceTrainingExercise[],
  newDayLabel: string,
  startPosition: number,
): Promise<WorkspaceTrainingExercise[]> {
  if (sourceExercises.length === 0) return [];
  const rows = sourceExercises.map((source, i) =>
    buildExerciseCopyRow(workspaceId, planId, source, newDayLabel, startPosition + i),
  );
  const { data, error } = await workspaceSupabase
    .from("workspace_training_exercises")
    .insert(rows)
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceTrainingExercise[];
}

export async function duplicateWorkspaceTrainingPlan(
  workspaceId: string,
  sourcePlanId: number,
  targetPatientId: number,
  newName: string,
): Promise<WorkspaceTrainingPlan> {
  assertScope(workspaceId, targetPatientId);

  const { data: sourceData, error: sourceError } = await workspaceSupabase
    .from("workspace_training_plans")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", sourcePlanId)
    .single();
  if (sourceError) throw new Error(sourceError.message);
  const source = sourceData as WorkspaceTrainingPlan;

  const sourceExercises = await fetchWorkspaceTrainingExercises(workspaceId, sourcePlanId);

  const { data: newPlanData, error: newPlanError } = await workspaceSupabase
    .from("workspace_training_plans")
    .insert({
      workspace_id: workspaceId,
      patient_id: targetPatientId,
      name: newName.trim(),
      goal: source.goal,
      frequency_per_week: source.frequency_per_week,
      duration_weeks: source.duration_weeks,
      notes: source.notes,
      status: source.status,
    })
    .select("*")
    .single();
  if (newPlanError) throw new Error(newPlanError.message);
  const newPlan = newPlanData as WorkspaceTrainingPlan;

  if (sourceExercises.length > 0) {
    const rows = sourceExercises.map((ex) =>
      buildExerciseCopyRow(workspaceId, newPlan.id, ex, ex.day_label, ex.position),
    );
    const { error: exercisesError } = await workspaceSupabase
      .from("workspace_training_exercises")
      .insert(rows);
    if (exercisesError) {
      // Evita deixar um plano vazio órfão quando a cópia dos exercícios falha.
      await deleteWorkspaceTrainingPlan(workspaceId, newPlan.id).catch(() => undefined);
      throw new Error(exercisesError.message);
    }
  }

  return newPlan;
}

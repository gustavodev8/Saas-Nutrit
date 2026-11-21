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

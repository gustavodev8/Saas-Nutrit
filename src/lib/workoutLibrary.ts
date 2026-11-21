import { supabaseAdmin } from "@/lib/supabase";
import { auditTrainingPlan, fetchFullTrainingPlan, type TrainingPlan } from "@/lib/trainingPlans";
import {
  normalizeWorkoutAliases,
  searchWorkoutRecords,
  selectLatestPublishedWorkoutVersions,
} from "@/lib/workoutLibraryUtils";

export interface WorkoutExerciseCatalogItem {
  id: number;
  workspace_id: string | null;
  name: string;
  search_aliases: string[];
  category: string | null;
  equipment: string;
  instructions: string;
  demo_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkoutExerciseCatalogInput = Pick<
  WorkoutExerciseCatalogItem,
  "name" | "search_aliases" | "category" | "equipment" | "instructions" | "demo_url"
>;

export interface WorkoutExercisePreset {
  id: number;
  workspace_id: string;
  catalog_exercise_id: number | null;
  name: string;
  search_aliases: string[];
  sets: string;
  repetitions: string;
  reference_load: string;
  rest: string;
  instructions: string;
  demo_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export type WorkoutExercisePresetInput = Pick<
  WorkoutExercisePreset,
  "catalog_exercise_id" | "name" | "search_aliases" | "sets" | "repetitions" |
  "reference_load" | "rest" | "instructions" | "demo_url"
>;

export interface WorkoutPreset {
  id: number;
  workspace_id: string;
  name: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface WorkoutPresetSummary extends WorkoutPreset {
  latest_published_version_id: number | null;
  latest_published_version: number | null;
}

export type WorkoutPresetStatus = "draft" | "published" | "archived";

export interface WorkoutPresetVersion {
  id: number;
  preset_id: number;
  workspace_id: string;
  version: number;
  parent_version_id: number | null;
  source_plan_version_id: number | null;
  title: string;
  goal: string;
  frequency: string;
  valid_from: string | null;
  valid_until: string | null;
  general_notes: string;
  status: WorkoutPresetStatus;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
}

export interface WorkoutPresetExercise {
  id: number;
  workspace_id: string;
  session_id: number;
  catalog_exercise_id: number | null;
  name: string;
  sets: string;
  repetitions: string;
  reference_load: string;
  rest: string;
  instructions: string;
  demo_url: string;
  sort_order: number;
}

export interface WorkoutPresetSession {
  id: number;
  workspace_id: string;
  version_id: number;
  title: string;
  notes: string;
  sort_order: number;
  exercises: WorkoutPresetExercise[];
}

export interface WorkoutPresetFullVersion extends WorkoutPresetVersion {
  sessions: WorkoutPresetSession[];
}

export interface WorkoutPresetDraftInput {
  id: number;
  title: string;
  goal: string;
  frequency: string;
  valid_from: string | null;
  valid_until: string | null;
  general_notes: string;
  sessions: Array<{
    title: string;
    notes: string;
    sort_order?: number;
    exercises: Array<{
      catalog_exercise_id?: number | null;
      name: string;
      sets: string;
      repetitions: string;
      reference_load: string;
      rest: string;
      instructions: string;
      demo_url: string;
      sort_order?: number;
    }>;
  }>;
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.getUser();
  if (error || !data.user) throw new Error("Sessão autenticada necessária.");
  return data.user.id;
}

export async function fetchWorkoutExerciseCatalog(
  workspaceId: string | null,
  query = "",
): Promise<WorkoutExerciseCatalogItem[]> {
  const globalQuery = supabaseAdmin.from("workout_exercise_catalog").select("*").is("workspace_id", null).order("name");
  const workspaceQuery = workspaceId
    ? supabaseAdmin.from("workout_exercise_catalog").select("*").eq("workspace_id", workspaceId).order("name")
    : null;
  const [globalResult, workspaceResult] = await Promise.all([
    globalQuery,
    workspaceQuery ?? Promise.resolve({ data: [], error: null }),
  ]);
  if (globalResult.error) throw globalResult.error;
  if (workspaceResult.error) throw workspaceResult.error;

  const catalog = [...(workspaceResult.data ?? []), ...(globalResult.data ?? [])] as WorkoutExerciseCatalogItem[];
  return searchWorkoutRecords(catalog, query);
}

export async function upsertWorkoutExerciseCatalogItem(
  workspaceId: string,
  item: WorkoutExerciseCatalogInput & { id?: number },
): Promise<WorkoutExerciseCatalogItem> {
  const name = item.name.trim();
  if (!name) throw new Error("Informe o nome do exercício.");
  const payload = {
    name,
    search_aliases: normalizeWorkoutAliases(item.search_aliases),
    category: item.category?.trim() || null,
    equipment: item.equipment.trim(),
    instructions: item.instructions.trim(),
    demo_url: item.demo_url.trim(),
    updated_at: new Date().toISOString(),
  };

  if (item.id) {
    const { data, error } = await supabaseAdmin.from("workout_exercise_catalog")
      .update(payload).eq("id", item.id).eq("workspace_id", workspaceId).select("*").single();
    if (error) throw error;
    return data as WorkoutExerciseCatalogItem;
  }

  const { data, error } = await supabaseAdmin.from("workout_exercise_catalog")
    .insert({ ...payload, workspace_id: workspaceId, created_by: await currentUserId() }).select("*").single();
  if (error) throw error;
  return data as WorkoutExerciseCatalogItem;
}

export async function fetchFavoriteWorkoutExerciseIds(workspaceId: string): Promise<number[]> {
  const userId = await currentUserId();
  const { data, error } = await supabaseAdmin.from("workout_exercise_favorites")
    .select("exercise_id").eq("workspace_id", workspaceId).eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.exercise_id as number);
}

export async function setWorkoutExerciseFavorite(
  workspaceId: string,
  exerciseId: number,
  isFavorite: boolean,
): Promise<void> {
  const userId = await currentUserId();
  if (isFavorite) {
    const { error } = await supabaseAdmin.from("workout_exercise_favorites")
      .upsert({ workspace_id: workspaceId, user_id: userId, exercise_id: exerciseId }, { onConflict: "workspace_id,user_id,exercise_id" });
    if (error) throw error;
    return;
  }
  const { error } = await supabaseAdmin.from("workout_exercise_favorites")
    .delete().eq("workspace_id", workspaceId).eq("user_id", userId).eq("exercise_id", exerciseId);
  if (error) throw error;
}

export async function fetchWorkoutExercisePresets(
  workspaceId: string,
  query = "",
): Promise<WorkoutExercisePreset[]> {
  const { data, error } = await supabaseAdmin.from("workout_exercise_presets").select("*")
    .eq("workspace_id", workspaceId).is("archived_at", null).order("name");
  if (error) throw error;
  return searchWorkoutRecords((data ?? []) as WorkoutExercisePreset[], query);
}

export async function upsertWorkoutExercisePreset(
  workspaceId: string,
  input: WorkoutExercisePresetInput & { id?: number },
): Promise<WorkoutExercisePreset> {
  const name = input.name.trim();
  if (!name) throw new Error("Informe o nome da prescrição favorita.");
  const payload = {
    catalog_exercise_id: input.catalog_exercise_id,
    name,
    search_aliases: normalizeWorkoutAliases(input.search_aliases),
    sets: input.sets.trim(),
    repetitions: input.repetitions.trim(),
    reference_load: input.reference_load.trim(),
    rest: input.rest.trim(),
    instructions: input.instructions.trim(),
    demo_url: input.demo_url.trim(),
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { data, error } = await supabaseAdmin.from("workout_exercise_presets").update(payload)
      .eq("id", input.id).eq("workspace_id", workspaceId).select("*").single();
    if (error) throw error;
    return data as WorkoutExercisePreset;
  }
  const { data, error } = await supabaseAdmin.from("workout_exercise_presets")
    .insert({ ...payload, workspace_id: workspaceId, created_by: await currentUserId() }).select("*").single();
  if (error) throw error;
  return data as WorkoutExercisePreset;
}

export async function archiveWorkoutExercisePreset(id: number, workspaceId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("workout_exercise_presets")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id).eq("workspace_id", workspaceId).is("archived_at", null);
  if (error) throw error;
}

export async function fetchWorkoutPresets(workspaceId: string): Promise<WorkoutPresetSummary[]> {
  const { data: presets, error } = await supabaseAdmin.from("workout_presets").select("*")
    .eq("workspace_id", workspaceId).is("archived_at", null).order("name");
  if (error) throw error;
  if (!presets?.length) return [];

  const { data: versions, error: versionError } = await supabaseAdmin.from("workout_preset_versions")
    .select("id,preset_id,version").eq("workspace_id", workspaceId)
    .eq("status", "published").in("preset_id", presets.map((preset) => preset.id))
    .order("version", { ascending: false });
  if (versionError) throw versionError;

  const latestByPreset = selectLatestPublishedWorkoutVersions((versions ?? []) as Array<{ id: number; preset_id: number; version: number }>);

  return (presets as WorkoutPreset[]).map((preset) => {
    const latest = latestByPreset.get(preset.id);
    return {
      ...preset,
      latest_published_version_id: latest?.id ?? null,
      latest_published_version: latest?.version ?? null,
    };
  });
}

export async function fetchWorkoutPresetVersion(versionId: number): Promise<WorkoutPresetFullVersion | null> {
  const { data, error } = await supabaseAdmin.from("workout_preset_versions")
    .select("*, sessions:workout_preset_sessions(*, exercises:workout_preset_exercises(*))")
    .eq("id", versionId).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const version = data as WorkoutPresetVersion & { sessions?: Array<WorkoutPresetSession & { exercises?: WorkoutPresetExercise[] | null }> | null };
  return {
    ...version,
    sessions: (version.sessions ?? []).map((session) => ({
      ...session,
      exercises: [...(session.exercises ?? [])].sort((left, right) => left.sort_order - right.sort_order),
    })).sort((left, right) => left.sort_order - right.sort_order),
  };
}

async function fetchPresetDraftVersion(presetId: number): Promise<WorkoutPresetFullVersion> {
  const { data, error } = await supabaseAdmin.from("workout_preset_versions").select("id")
    .eq("preset_id", presetId).eq("status", "draft").order("version", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("O rascunho do modelo não foi encontrado.");
  const version = await fetchWorkoutPresetVersion(data.id as number);
  if (!version) throw new Error("O rascunho do modelo não está disponível.");
  return version;
}

export async function createWorkoutPreset(
  workspaceId: string,
  name: string,
  description = "",
): Promise<WorkoutPresetFullVersion> {
  const { data, error } = await supabaseAdmin.rpc("create_workout_preset", {
    p_workspace_id: workspaceId,
    p_name: name.trim(),
    p_description: description.trim(),
  });
  if (error) throw error;
  return fetchPresetDraftVersion(data as number);
}

export async function createWorkoutPresetFromPlanVersion(
  sourceVersionId: number,
  name?: string,
): Promise<WorkoutPresetFullVersion> {
  const { data, error } = await supabaseAdmin.rpc("create_workout_preset_from_plan_version", {
    p_source_plan_version_id: sourceVersionId,
    p_name: name?.trim() || null,
  });
  if (error) throw error;
  const version = await fetchWorkoutPresetVersion(data as number);
  if (!version) throw new Error("O modelo criado não está disponível.");
  return version;
}

export async function createWorkoutPresetVersion(presetId: number): Promise<WorkoutPresetFullVersion> {
  const { data, error } = await supabaseAdmin.rpc("create_workout_preset_version", { p_preset_id: presetId });
  if (error) throw error;
  const version = await fetchWorkoutPresetVersion(data as number);
  if (!version) throw new Error("A nova versão do modelo não está disponível.");
  return version;
}

export async function saveWorkoutPresetDraft(input: WorkoutPresetDraftInput): Promise<WorkoutPresetFullVersion> {
  const { error } = await supabaseAdmin.rpc("save_workout_preset_draft", {
    p_preset_version_id: input.id,
    p_title: input.title,
    p_goal: input.goal,
    p_frequency: input.frequency,
    p_valid_from: input.valid_from,
    p_valid_until: input.valid_until,
    p_general_notes: input.general_notes,
    p_sessions: input.sessions,
  });
  if (error) throw error;
  const version = await fetchWorkoutPresetVersion(input.id);
  if (!version) throw new Error("O rascunho salvo não está disponível.");
  return version;
}

export async function publishWorkoutPresetVersion(versionId: number): Promise<void> {
  const { error } = await supabaseAdmin.rpc("publish_workout_preset_version", { p_version_id: versionId });
  if (error) throw error;
}

export async function createWorkoutPlanFromPreset(
  patientId: number,
  presetVersionId: number,
): Promise<TrainingPlan> {
  const { data, error } = await supabaseAdmin.rpc("create_workout_plan_from_preset", {
    p_patient_id: patientId,
    p_preset_version_id: presetVersionId,
  });
  if (error) throw error;
  const plan = await fetchFullTrainingPlan(data as number);
  if (!plan) throw new Error("A ficha criada a partir do modelo não está disponível.");
  await auditTrainingPlan(patientId, plan.id, plan.title, "create", `Ficha de treino criada a partir do modelo "${plan.title}".`);
  return plan;
}

export async function fetchFavoriteWorkoutPresetIds(workspaceId: string): Promise<number[]> {
  const userId = await currentUserId();
  const { data, error } = await supabaseAdmin.from("workout_preset_favorites")
    .select("preset_id").eq("workspace_id", workspaceId).eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.preset_id as number);
}

export async function setWorkoutPresetFavorite(
  workspaceId: string,
  presetId: number,
  isFavorite: boolean,
): Promise<void> {
  const userId = await currentUserId();
  if (isFavorite) {
    const { error } = await supabaseAdmin.from("workout_preset_favorites")
      .upsert({ workspace_id: workspaceId, user_id: userId, preset_id: presetId }, { onConflict: "workspace_id,user_id,preset_id" });
    if (error) throw error;
    return;
  }
  const { error } = await supabaseAdmin.from("workout_preset_favorites")
    .delete().eq("workspace_id", workspaceId).eq("user_id", userId).eq("preset_id", presetId);
  if (error) throw error;
}

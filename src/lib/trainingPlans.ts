import { supabaseAdmin } from "@/lib/supabase";

export type TrainingStatus = "draft" | "published" | "archived";
export interface TrainingExercise {
  id?: number; session_id?: number; name: string; sets: string; repetitions: string;
  reference_load: string; rest: string; instructions: string; demo_url: string; sort_order: number;
}
export interface TrainingSession {
  id?: number; version_id?: number; title: string; notes: string; sort_order: number; exercises: TrainingExercise[];
}
export interface TrainingPlan {
  id: number; workout_plan_id: number; patient_id: number; workspace_id: string | null;
  title: string; goal: string; frequency: string; valid_from: string | null; valid_until: string | null;
  general_notes: string; status: TrainingStatus; version: number; created_at: string;
  published_at: string | null; sessions?: TrainingSession[];
}
export interface TrainingLog {
  id: number; version_id: number; workout_session_id: number; patient_id: number;
  auth_user_id: string; performed_at: string; perceived_difficulty: number | null;
  notes: string; created_at: string;
}
export interface TrainingLogExercise {
  exercise_id: number; exercise_name: string; load_used: string; notes: string;
}
const blankSession = (title = "Treino A"): TrainingSession => ({ title, notes: "", sort_order: 0, exercises: [] });

export async function fetchTrainingPlans(patientId: number): Promise<TrainingPlan[]> {
  const { data: roots, error } = await supabaseAdmin.from("workout_plans").select("id,patient_id,workspace_id,created_at").eq("patient_id", patientId).order("created_at", { ascending: false });
  if (error) throw error;
  if (!roots?.length) return [];
  const { data: versions, error: versionsError } = await supabaseAdmin.from("workout_plan_versions").select("*").in("workout_plan_id", roots.map((root) => root.id)).order("version", { ascending: false });
  if (versionsError) throw versionsError;
  return (versions ?? []).map((version) => ({ ...version, workout_plan_id: version.workout_plan_id,
    patient_id: roots.find((root) => root.id === version.workout_plan_id)?.patient_id ?? patientId,
    workspace_id: version.workspace_id })) as TrainingPlan[];
}

export async function fetchFullTrainingPlan(versionId: number): Promise<TrainingPlan | null> {
  const { data: version, error } = await supabaseAdmin.from("workout_plan_versions").select("*").eq("id", versionId).maybeSingle();
  if (error) throw error;
  if (!version) return null;
  const { data: root, error: rootError } = await supabaseAdmin.from("workout_plans").select("patient_id").eq("id", version.workout_plan_id).single();
  if (rootError) throw rootError;
  const { data: sessions, error: sessionsError } = await supabaseAdmin.from("workout_sessions").select("*").eq("version_id", versionId).order("sort_order");
  if (sessionsError) throw sessionsError;
  const sessionIds = (sessions ?? []).map((session) => session.id as number);
  const { data: exercises, error: exerciseError } = sessionIds.length
    ? await supabaseAdmin.from("workout_plan_exercises").select("*").in("session_id", sessionIds).order("sort_order")
    : { data: [], error: null };
  if (exerciseError) throw exerciseError;
  return { ...version, patient_id: root.patient_id, sessions: (sessions ?? []).map((session) => ({ ...session,
    exercises: (exercises ?? []).filter((exercise) => exercise.session_id === session.id) })) } as TrainingPlan;
}

export async function createTrainingPlan(patientId: number, title = "Novo treino"): Promise<TrainingPlan> {
  const { data: root, error } = await supabaseAdmin.from("workout_plans").insert({ patient_id: patientId }).select("*").single();
  if (error) throw error;
  const { data: version, error: versionError } = await supabaseAdmin.from("workout_plan_versions").insert({ workout_plan_id: root.id, title, version: 1 }).select("*").single();
  if (versionError) throw versionError;
  await auditPlan(patientId, version.id, title, "create", `Ficha de treino "${title}" criada.`);
  return { ...version, workout_plan_id: root.id, patient_id: patientId, sessions: [blankSession()] } as TrainingPlan;
}

export async function saveTrainingPlan(plan: TrainingPlan): Promise<TrainingPlan> {
  if (plan.status !== "draft") throw new Error("A ficha publicada é imutável. Crie uma nova versão para editar.");
  const title = plan.title.trim();
  if (!title) throw new Error("Informe o título da ficha.");
  const { data: updated, error } = await supabaseAdmin.from("workout_plan_versions").update({
    title, goal: plan.goal, frequency: plan.frequency, valid_from: plan.valid_from || null,
    valid_until: plan.valid_until || null, general_notes: plan.general_notes,
  }).eq("id", plan.id).eq("status", "draft").select("*").single();
  if (error) throw error;
  const { error: deleteError } = await supabaseAdmin.from("workout_sessions").delete().eq("version_id", plan.id);
  if (deleteError) throw deleteError;
  for (const [sessionOrder, session] of (plan.sessions ?? []).entries()) {
    const { data: savedSession, error: sessionError } = await supabaseAdmin.from("workout_sessions")
      .insert({ version_id: plan.id, title: session.title.trim(), notes: session.notes, sort_order: sessionOrder }).select("id").single();
    if (sessionError) throw sessionError;
    const rows = session.exercises.filter((item) => item.name.trim()).map((item, index) => ({
      session_id: savedSession.id, name: item.name.trim(), sets: item.sets, repetitions: item.repetitions,
      reference_load: item.reference_load, rest: item.rest, instructions: item.instructions,
      demo_url: item.demo_url, sort_order: index,
    }));
    if (rows.length) {
      const { error: insertError } = await supabaseAdmin.from("workout_plan_exercises").insert(rows);
      if (insertError) throw insertError;
    }
  }
  await auditPlan(plan.patient_id, plan.id, title, "update", `Ficha de treino "${title}" atualizada.`);
  return (await fetchFullTrainingPlan(plan.id)) ?? { ...updated, patient_id: plan.patient_id } as TrainingPlan;
}

export async function publishTrainingPlan(plan: TrainingPlan): Promise<void> {
  if (!(plan.sessions ?? []).length || !plan.sessions?.some((session) => session.exercises.length)) throw new Error("Adicione ao menos uma sessão e um exercício para publicar.");
  const { data, error } = await supabaseAdmin.from("workout_plan_versions").update({ status: "published", published_at: new Date().toISOString() }).eq("id", plan.id).eq("status", "draft").select("id,title").single();
  if (error) throw error;
  await auditPlan(plan.patient_id, data.id, data.title, "update", `Ficha de treino "${data.title}" publicada.`);
}

export async function archiveTrainingPlan(plan: TrainingPlan): Promise<void> {
  const { data, error } = await supabaseAdmin.from("workout_plan_versions").update({ status: "archived" }).eq("id", plan.id).eq("status", "published").select("id,title").single();
  if (error) throw error;
  await auditPlan(plan.patient_id, data.id, data.title, "update", `Ficha de treino "${data.title}" arquivada.`);
}

export async function createTrainingPlanVersion(plan: TrainingPlan): Promise<TrainingPlan> {
  const { data, error } = await supabaseAdmin.from("workout_plan_versions").insert({
    workout_plan_id: plan.workout_plan_id, title: plan.title, goal: plan.goal, frequency: plan.frequency,
    valid_from: plan.valid_from, valid_until: plan.valid_until, general_notes: plan.general_notes,
    version: plan.version + 1,
  }).select("*").single();
  if (error) throw error;
  const previous = await fetchFullTrainingPlan(plan.id);
  const draft: TrainingPlan = { ...data, workout_plan_id: plan.workout_plan_id, patient_id: plan.patient_id,
    sessions: previous?.sessions ?? [] } as TrainingPlan;
  const saved = await saveTrainingPlan(draft);
  await auditPlan(plan.patient_id, data.id, data.title, "create", `Versão ${data.version} da ficha criada.`);
  return saved;
}

export async function fetchPortalTrainingPlans(patientId: number): Promise<TrainingPlan[]> {
  const versions = await fetchTrainingPlans(patientId);
  return versions.filter((version) => version.status === "published");
}
export async function fetchTrainingLogs(versionId: number): Promise<TrainingLog[]> {
  const { data, error } = await supabaseAdmin.from("workout_session_logs").select("*").eq("version_id", versionId).order("performed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainingLog[];
}
export async function fetchTrainingExerciseLogs(logIds: number[]): Promise<TrainingLogExercise[]> {
  if (!logIds.length) return [];
  const { data, error } = await supabaseAdmin.from("workout_exercise_logs").select("*").in("session_log_id", logIds);
  if (error) throw error;
  return (data ?? []).map((row) => ({ exercise_id: row.exercise_id, exercise_name: row.exercise_name, load_used: row.load_used, notes: row.notes })) as TrainingLogExercise[];
}
export async function createTrainingLog(input: { planId: number; sessionId: number; patientId: number; performedAt: string; difficulty: number | null; notes: string; exercises: TrainingLogExercise[] }): Promise<void> {
  const { error } = await supabaseAdmin.rpc("create_workout_session_log", {
    p_workout_session_id: input.sessionId, p_performed_at: input.performedAt,
    p_difficulty: input.difficulty, p_notes: input.notes,
    p_exercises: input.exercises.map(({ exercise_id, load_used, notes }) => ({ exercise_id, load_used, notes })),
  });
  if (error) throw error;
}

async function auditPlan(patientId: number, entityId: number, title: string, action: "create" | "update", summary: string): Promise<void> {
  const [{ data: patient }, { data: userData }] = await Promise.all([
    supabaseAdmin.from("patients").select("name").eq("id", patientId).maybeSingle(),
    supabaseAdmin.auth.getUser(),
  ]);
  const { error } = await supabaseAdmin.from("patient_audit_logs").insert({
    patient_id: patientId, patient_name: patient?.name ?? "Paciente", section_key: "treino",
    section_label: "Ficha de treino", action, entity_type: "workout_plan_version", entity_id: entityId,
    summary, actor_email: userData.user?.email ?? null, changed_fields: [], metadata: { title },
  });
  if (error) console.error("[Training] audit:", error.message);
}

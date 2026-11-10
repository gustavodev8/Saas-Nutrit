export type PortalTrainingPlanStatus = "draft" | "published" | "archived";

export interface PortalTrainingExercise {
  id: number;
  session_id: number;
  name: string;
  sets: string | null;
  repetitions: string | null;
  reference_load: string | null;
  rest: string | null;
  instructions: string | null;
  demo_url: string | null;
  sort_order: number;
}

export interface PortalTrainingSession {
  id: number;
  version_id: number;
  title: string;
  notes: string | null;
  sort_order: number;
  exercises: PortalTrainingExercise[];
}

export interface PortalTrainingPlan {
  id: number;
  workout_plan_id: number;
  title: string;
  goal: string | null;
  frequency: string | null;
  valid_from: string | null;
  valid_until: string | null;
  general_notes: string | null;
  status: PortalTrainingPlanStatus;
  version: number;
  published_at: string | null;
  created_at: string;
  sessions: PortalTrainingSession[];
}

export interface PortalTrainingLog {
  id: number;
  version_id: number;
  workout_session_id: number;
  patient_id: number;
  performed_at: string;
  perceived_difficulty: number | null;
  notes: string | null;
  created_at: string;
  exercises: PortalTrainingLogExercise[];
}

export interface PortalTrainingLogExercise {
  id?: number;
  session_log_id: number;
  exercise_id: number;
  exercise_name: string;
  load_used: string | null;
  notes: string | null;
}

export interface PortalTrainingLogInput {
  versionId: number;
  sessionId: number;
  patientId: number;
  performedAt: string;
  difficulty: "easy" | "moderate" | "hard";
  notes: string;
  loads: Array<{ exerciseId: number; exerciseName: string; loadUsed: string; notes?: string }>;
}

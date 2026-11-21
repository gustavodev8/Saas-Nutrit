import type { TrainingExercise, TrainingPlan, TrainingSession } from "@/lib/trainingPlans";

let clientKeySequence = 0;

export function createTrainingClientKey(prefix: "session" | "exercise"): string {
  clientKeySequence += 1;
  return `${prefix}-${Date.now()}-${clientKeySequence}`;
}

export function getTrainingSessionKey(session: TrainingSession): string {
  return session.client_key ?? (session.id ? `session-${session.id}` : createTrainingClientKey("session"));
}

export function getTrainingExerciseKey(exercise: TrainingExercise): string {
  return exercise.client_key ?? (exercise.id ? `exercise-${exercise.id}` : createTrainingClientKey("exercise"));
}

export function getTrainingExerciseStateKey(session: TrainingSession, exercise: TrainingExercise): string {
  return `${getTrainingSessionKey(session)}:${getTrainingExerciseKey(exercise)}`;
}

export function withTrainingClientKeys(plan: TrainingPlan): TrainingPlan {
  return {
    ...plan,
    sessions: (plan.sessions ?? []).map((session) => ({
      ...session,
      client_key: getTrainingSessionKey(session),
      exercises: session.exercises.map((exercise) => ({
        ...exercise,
        client_key: getTrainingExerciseKey(exercise),
      })),
    })),
  };
}

export function getTrainingReviewWarnings(plan: TrainingPlan): string[] {
  const warnings: string[] = [];
  if (!plan.title.trim()) warnings.push("Informe o título da ficha.");

  (plan.sessions ?? []).forEach((session, sessionIndex) => {
    const sessionName = session.title.trim() || `Sessão ${sessionIndex + 1}`;
    if (session.exercises.length === 0) warnings.push(`${sessionName} está sem exercícios.`);
    if (session.exercises.some((exercise) => !exercise.name.trim())) {
      warnings.push(`${sessionName} possui exercício sem nome.`);
    }
  });

  return warnings;
}

export function moveTrainingExercise(
  exercises: TrainingExercise[],
  exerciseIndex: number,
  direction: -1 | 1,
): TrainingExercise[] {
  const targetIndex = exerciseIndex + direction;
  if (exerciseIndex < 0 || targetIndex < 0 || targetIndex >= exercises.length) return exercises;

  const next = [...exercises];
  [next[exerciseIndex], next[targetIndex]] = [next[targetIndex], next[exerciseIndex]];
  return next.map((exercise, index) => ({ ...exercise, sort_order: index }));
}

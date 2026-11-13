import type { TrainingExercise, TrainingPlan } from "@/lib/trainingPlans";

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

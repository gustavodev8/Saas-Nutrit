export interface ExerciseSuggestion {
  name: string;
  aliases: string[];
}

export const COMMON_EXERCISES: ExerciseSuggestion[] = [
  { name: "Agachamento livre", aliases: ["agachamento com barra", "back squat"] },
  { name: "Agachamento frontal", aliases: ["front squat", "agachamento front squat"] },
  { name: "Agachamento goblet", aliases: ["goblet squat", "agachamento com halter"] },
  { name: "Agachamento sumô", aliases: ["sumo squat", "agachamento sumo"] },
  { name: "Supino reto", aliases: ["bench press", "supino horizontal"] },
  { name: "Supino inclinado", aliases: ["incline bench press", "supino inclinado com barra"] },
  { name: "Supino declinado", aliases: ["decline bench press"] },
  { name: "Supino com halteres", aliases: ["dumbbell bench press", "supino reto com halteres"] },
  { name: "Remada curvada", aliases: ["barbell row", "remada inclinada"] },
  { name: "Remada unilateral", aliases: ["one arm row", "remada serrote"] },
  { name: "Remada baixa", aliases: ["seated cable row", "remada sentada"] },
  { name: "Remada cavalinho", aliases: ["t-bar row", "remada t-bar"] },
  { name: "Puxada frontal", aliases: ["lat pulldown", "puxada alta"] },
  { name: "Puxada neutra", aliases: ["neutral grip pulldown", "puxada pegada neutra"] },
  { name: "Puxada supinada", aliases: ["underhand lat pulldown", "puxada pegada supinada"] },
  { name: "Levantamento terra", aliases: ["deadlift", "terra convencional"] },
  { name: "Levantamento terra romeno", aliases: ["romanian deadlift", "stiff romeno"] },
  { name: "Levantamento terra sumô", aliases: ["sumo deadlift", "terra sumô"] },
  { name: "Leg press", aliases: ["leg press 45", "prensa de pernas"] },
  { name: "Desenvolvimento de ombros", aliases: ["shoulder press", "desenvolvimento militar"] },
  { name: "Elevação lateral", aliases: ["lateral raise", "abdução de ombros"] },
  { name: "Flexora", aliases: ["leg curl", "flexão de joelhos"] },
  { name: "Extensora", aliases: ["leg extension", "extensão de joelhos"] },
  { name: "Leg press unilateral", aliases: ["single leg press", "leg press uma perna"] },
];

function normalizeExerciseText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Filtra sugestões de exercícios para o autocomplete do editor de treino.
 * Histórico do workspace vem primeiro; depois os exercícios comuns.
 * Nomes são devolvidos distintos (case/acento-insensível), até `limit`.
 */
export function filterExerciseSuggestions(
  query: string,
  history: string[],
  limit = 8,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const push = (name: string): boolean => {
    const key = normalizeExerciseText(name.trim());
    if (!key || seen.has(key)) return false;
    seen.add(key);
    result.push(name.trim());
    return result.length >= limit;
  };

  const q = normalizeExerciseText(query).trim();

  if (q === "") {
    for (const name of history) {
      if (push(name)) return result;
    }
    for (const exercise of COMMON_EXERCISES) {
      if (push(exercise.name)) return result;
    }
    return result;
  }

  for (const name of history) {
    if (normalizeExerciseText(name).includes(q)) {
      if (push(name)) return result;
    }
  }

  for (const exercise of COMMON_EXERCISES) {
    const matches =
      normalizeExerciseText(exercise.name).includes(q) ||
      exercise.aliases.some((alias) => normalizeExerciseText(alias).includes(q));
    if (matches && push(exercise.name)) return result;
  }

  return result;
}

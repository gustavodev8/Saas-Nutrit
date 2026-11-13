import { describe, expect, it } from "vitest";
import type { TrainingExercise, TrainingPlan } from "@/lib/trainingPlans";
import { getTrainingReviewWarnings, moveTrainingExercise } from "./trainingEditorUtils";

const exercise = (name: string, sortOrder: number): TrainingExercise => ({
  name,
  sets: "3",
  repetitions: "12",
  reference_load: "",
  rest: "60 s",
  instructions: "",
  demo_url: "",
  sort_order: sortOrder,
});

const plan = (overrides: Partial<TrainingPlan> = {}): TrainingPlan => ({
  id: 1,
  patient_id: 1,
  title: "Ficha A",
  goal: "",
  frequency: "",
  general_notes: "",
  valid_from: null,
  valid_until: null,
  status: "draft",
  version: 1,
  previous_version_id: null,
  published_at: null,
  created_at: "2026-11-13T00:00:00.000Z",
  updated_at: "2026-11-13T00:00:00.000Z",
  sessions: [{ title: "Treino A", notes: "", sort_order: 0, exercises: [exercise("Agachamento", 0)] }],
  ...overrides,
});

describe("trainingEditorUtils", () => {
  it("gera somente avisos reais de título, sessão vazia e exercício sem nome", () => {
    const warnings = getTrainingReviewWarnings(plan({
      title: " ",
      sessions: [
        { title: "Treino A", notes: "", sort_order: 0, exercises: [] },
        { title: "", notes: "", sort_order: 1, exercises: [exercise(" ", 0)] },
      ],
    }));

    expect(warnings).toEqual([
      "Informe o título da ficha.",
      "Treino A está sem exercícios.",
      "Sessão 2 possui exercício sem nome.",
    ]);
  });

  it("não exige carga ou observações para revisar", () => {
    expect(getTrainingReviewWarnings(plan())).toEqual([]);
  });

  it("reordena sem alterar a lista original", () => {
    const original = [exercise("A", 0), exercise("B", 1), exercise("C", 2)];
    const moved = moveTrainingExercise(original, 1, -1);
    expect(moved.map((item) => item.name)).toEqual(["B", "A", "C"]);
    expect(moved.map((item) => item.sort_order)).toEqual([0, 1, 2]);
    expect(original.map((item) => item.name)).toEqual(["A", "B", "C"]);
  });
});

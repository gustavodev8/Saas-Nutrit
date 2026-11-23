import { describe, expect, it } from "vitest";
import { COMMON_EXERCISES, filterExerciseSuggestions } from "./workoutExerciseSuggestions";

const normalize = (value: string): string =>
  value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

describe("filterExerciseSuggestions", () => {
  it("exposes the 24 common exercises", () => {
    expect(COMMON_EXERCISES).toHaveLength(24);
  });

  it("finds exercises by name substring", () => {
    const result = filterExerciseSuggestions("supino", [], 20);
    expect(result).toContain("Supino reto");
    expect(result).toContain("Supino inclinado");
    expect(result.every((name) => normalize(name).includes("supino"))).toBe(true);
  });

  it("matches by alias", () => {
    const bench = filterExerciseSuggestions("bench", [], 20);
    expect(bench).toContain("Supino reto");
    expect(bench).toContain("Supino com halteres");

    const deadlift = filterExerciseSuggestions("deadlift", [], 20);
    expect(deadlift).toContain("Levantamento terra");
  });

  it("ignores accents and case", () => {
    expect(filterExerciseSuggestions("agachamento sumo", [], 8)).toContain("Agachamento sumô");
    expect(filterExerciseSuggestions("SUMÔ", [], 8)).toContain("Agachamento sumô");
  });

  it("puts history first and does not duplicate common names", () => {
    const result = filterExerciseSuggestions("supino", ["Supino reto", "Meu supino especial"], 20);
    expect(result[0]).toBe("Supino reto");
    expect(result[1]).toBe("Meu supino especial");
    const supinoRetoCount = result.filter((name) => normalize(name) === "supino reto").length;
    expect(supinoRetoCount).toBe(1);
  });

  it("deduplicates history entries case-insensitively", () => {
    const result = filterExerciseSuggestions("", ["Treino A", "treino a", "Treino B"], 5);
    expect(result.slice(0, 2)).toEqual(["Treino A", "Treino B"]);
  });

  it("respects limit", () => {
    expect(filterExerciseSuggestions("", [], 3)).toHaveLength(3);
    expect(filterExerciseSuggestions("a", [], 2)).toHaveLength(2);
    expect(filterExerciseSuggestions("supino", ["Supino X", "Supino Y", "Supino Z"], 2)).toEqual([
      "Supino X",
      "Supino Y",
    ]);
  });

  it("returns history followed by common names for an empty query", () => {
    const result = filterExerciseSuggestions("   ", ["Meu A", "Treino B"], 4);
    expect(result).toEqual(["Meu A", "Treino B", COMMON_EXERCISES[0].name, COMMON_EXERCISES[1].name]);
  });

  it("returns no duplicates across the whole result", () => {
    const result = filterExerciseSuggestions("", ["Supino reto", "supino reto"], 30);
    const keys = result.map(normalize);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

import { describe, expect, it } from "vitest";
import { calcStatus, findExam, searchExams } from "@/lib/examsDictionary";

describe("examsDictionary", () => {
  it("finds exams case-insensitively and searches by category", () => {
    expect(findExam("glicemia de jejum")?.unit).toBe("mg/dL");
    expect(searchExams("tireoide").some((exam) => exam.name === "TSH")).toBe(true);
  });

  it("classifies normal, altered and critical exam values", () => {
    const glicemia = findExam("Glicemia de Jejum");
    expect(glicemia).toBeDefined();
    if (!glicemia) return;

    expect(calcStatus(90, glicemia)).toBe("normal");
    expect(calcStatus(110, glicemia)).toBe("alto");
    expect(calcStatus(45, glicemia)).toBe("critico_baixo");
    expect(calcStatus(500, glicemia)).toBe("critico_alto");
  });
});

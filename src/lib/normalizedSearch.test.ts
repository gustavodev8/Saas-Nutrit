import { describe, expect, it } from "vitest";
import { matchesNormalizedSearch, matchesNumericSearchRange, normalizeSearchText, parseNormalizedSearchQuery, searchNormalizedRecords } from "./normalizedSearch";

describe("normalized catalog search", () => {
  const records = [
    { name: "Hemoglobina Glicada", search_aliases: ["HbA1c", "A1C"], search_ranges: { kcal: 120, protein: 10 } },
    { name: "Glicemia de Jejum", search_aliases: ["glicose basal"], search_ranges: { kcal: 80, protein: 5 } },
  ];

  it("normalizes accents, case, punctuation and whitespace", () => {
    expect(normalizeSearchText("  GLICÊMIA-de   Jejum! ")).toBe("glicemia de jejum");
  });

  it("requires every query token and matches aliases", () => {
    expect(searchNormalizedRecords(records, "jejum glicose")).toEqual([records[1]]);
    expect(searchNormalizedRecords(records, "a1c hemoglobina")).toEqual([records[0]]);
    expect(searchNormalizedRecords(records, "hemoglobina inexistente")).toEqual([]);
  });

  it("splits punctuation into AND tokens in any order", () => {
    const item = { name: "Iogurte natural sem açúcar", search_aliases: ["iogurte integral"] };
    expect(searchNormalizedRecords([item], "açúcar, natural! sem")).toEqual([item]);
    expect(searchNormalizedRecords([item], "natural/açúcar inexistente")).toEqual([]);
  });

  it("finds punctuated food titles from each required search form", () => {
    const rice = { name: "Arroz tipo 1, parboilizado" };
    for (const query of ["arroz", "arroz parboilizado", "arroz, parboilizado", "arroz-parboilizado", "PARBOILIZADO ARROZ", "arroz tipo 1"]) {
      expect(searchNormalizedRecords([rice], query)).toEqual([rice]);
    }
  });

  it("applies inclusive numeric ranges alongside text tokens", () => {
    expect(searchNormalizedRecords(records, "glicemia kcal:75-100")).toEqual([records[1]]);
    expect(matchesNormalizedSearch(records[0], "hemoglobina protein:11..12")).toBe(false);
    expect(matchesNormalizedSearch(records[0], "hemoglobina protein:9..11")).toBe(true);
    expect(matchesNumericSearchRange(100, { min: 100, max: 100 })).toBe(true);
    expect(matchesNumericSearchRange(undefined, { min: 0 })).toBe(false);
  });

  it("extracts numeric ranges before punctuation tokenization", () => {
    expect(parseNormalizedSearchQuery("glicemia, kcal:75-100; protein:9,5..11")).toEqual({
      tokens: ["glicemia"],
      ranges: [
        { field: "kcal", min: 75, max: 100 },
        { field: "protein", min: 9.5, max: 11 },
      ],
    });
    expect(searchNormalizedRecords(records, "kcal:100–140, protein:9.5-11")).toEqual([records[0]]);
    expect(searchNormalizedRecords(records, "kcal:140-100 protein:9-11")).toEqual([records[0]]);
  });

  it("returns a copy unchanged for an empty query", () => {
    const result = searchNormalizedRecords(records, "  ");
    expect(result).toEqual(records);
    expect(result).not.toBe(records);
  });
});

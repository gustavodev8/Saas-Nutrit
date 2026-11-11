import { describe, expect, it } from "vitest";
import { matchesNormalizedSearch, matchesNumericSearchRange, normalizeSearchText, searchNormalizedRecords } from "./normalizedSearch";

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

  it("applies inclusive numeric ranges alongside text tokens", () => {
    expect(searchNormalizedRecords(records, "glicemia kcal:75-100")).toEqual([records[1]]);
    expect(matchesNormalizedSearch(records[0], "hemoglobina protein:11..12")).toBe(false);
    expect(matchesNormalizedSearch(records[0], "hemoglobina protein:9..11")).toBe(true);
    expect(matchesNumericSearchRange(100, { min: 100, max: 100 })).toBe(true);
    expect(matchesNumericSearchRange(undefined, { min: 0 })).toBe(false);
  });

  it("returns a copy unchanged for an empty query", () => {
    const result = searchNormalizedRecords(records, "  ");
    expect(result).toEqual(records);
    expect(result).not.toBe(records);
  });
});

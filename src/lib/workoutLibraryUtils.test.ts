import { describe, expect, it } from "vitest";
import {
  normalizeWorkoutAliases,
  searchWorkoutRecords,
  selectLatestPublishedWorkoutVersions,
} from "@/lib/workoutLibraryUtils";

describe("workout library helpers", () => {
  it("trims, removes blanks, and deduplicates aliases without changing order", () => {
    expect(normalizeWorkoutAliases(["  supino  ", "supino", "", "peitoral"])).toEqual(["supino", "peitoral"]);
  });

  it("searches aliases with normalized AND tokens", () => {
    const records = [
      { name: "Crucifixo inclinado", search_aliases: ["fly inclinado com halteres"] },
      { name: "Supino reto", search_aliases: ["halteres"] },
    ];
    expect(searchWorkoutRecords(records, "FLY halteres")).toEqual([records[0]]);
  });

  it("selects the greatest published version for each preset", () => {
    const latest = selectLatestPublishedWorkoutVersions([
      { id: 10, preset_id: 1, version: 1 },
      { id: 22, preset_id: 1, version: 3 },
      { id: 30, preset_id: 2, version: 2 },
    ]);
    expect(latest.get(1)).toEqual({ id: 22, preset_id: 1, version: 3 });
    expect(latest.get(2)).toEqual({ id: 30, preset_id: 2, version: 2 });
  });
});


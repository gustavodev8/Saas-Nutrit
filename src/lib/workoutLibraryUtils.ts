import { searchNormalizedRecords, type NormalizedSearchRecord } from "@/lib/normalizedSearch";

export interface PublishedWorkoutPresetVersionRow {
  id: number;
  preset_id: number;
  version: number;
}

export function normalizeWorkoutAliases(aliases: readonly string[]): string[] {
  return [...new Set(aliases.map((alias) => alias.trim()).filter(Boolean))];
}

export function selectLatestPublishedWorkoutVersions(
  rows: readonly PublishedWorkoutPresetVersionRow[],
): Map<number, PublishedWorkoutPresetVersionRow> {
  const latest = new Map<number, PublishedWorkoutPresetVersionRow>();
  for (const row of [...rows].sort((left, right) => right.version - left.version)) {
    if (!latest.has(row.preset_id)) latest.set(row.preset_id, row);
  }
  return latest;
}

export function searchWorkoutRecords<T extends NormalizedSearchRecord>(records: readonly T[], query: string): T[] {
  return searchNormalizedRecords(records, query);
}

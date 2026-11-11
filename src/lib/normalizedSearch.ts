export interface NumericSearchRange {
  min?: number;
  max?: number;
}

export interface NormalizedSearchRecord {
  name?: string | null;
  search_aliases?: readonly string[] | null;
  search_text?: string | null;
  search_ranges?: Readonly<Record<string, number | null | undefined>>;
}

interface ParsedRange {
  field: string;
  min?: number;
  max?: number;
}

const RANGE_TOKEN = /^([\p{L}_][\p{L}\p{N}_-]*):(-?\d+(?:[.,]\d+)?)(?:\.\.|-)(-?\d+(?:[.,]\d+)?)$/u;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseNumber(value: string): number {
  return Number(value.replace(",", "."));
}

function parseQuery(query: string): { tokens: string[]; ranges: ParsedRange[] } {
  const tokens: string[] = [];
  const ranges: ParsedRange[] = [];

  for (const part of query.trim().split(/\s+/).filter(Boolean)) {
    const match = RANGE_TOKEN.exec(part);
    if (match) {
      const first = parseNumber(match[2]);
      const second = parseNumber(match[3]);
      ranges.push({ field: normalizeSearchText(match[1]).replace(/\s/g, "_"), min: Math.min(first, second), max: Math.max(first, second) });
    } else {
      const token = normalizeSearchText(part);
      if (token) tokens.push(token);
    }
  }
  return { tokens, ranges };
}

/** All text tokens must match; text may come from the name, aliases, or extra search text. */
export function matchesNormalizedSearch(record: NormalizedSearchRecord, query: string): boolean {
  const { tokens, ranges } = parseQuery(query);
  const haystack = normalizeSearchText([
    record.name ?? "",
    record.search_text ?? "",
    ...(record.search_aliases ?? []),
  ].join(" "));

  if (!tokens.every((token) => haystack.includes(token))) return false;
  return ranges.every(({ field, min, max }) => {
    const value = record.search_ranges?.[field];
    return typeof value === "number" && Number.isFinite(value)
      && value >= (min ?? Number.NEGATIVE_INFINITY)
      && value <= (max ?? Number.POSITIVE_INFINITY);
  });
}

export function searchNormalizedRecords<T extends NormalizedSearchRecord>(records: readonly T[], query: string): T[] {
  if (!query.trim()) return [...records];
  return records.filter((record) => matchesNormalizedSearch(record, query));
}

export function matchesNumericSearchRange(value: number | null | undefined, range: NumericSearchRange): boolean {
  return typeof value === "number" && Number.isFinite(value)
    && value >= (range.min ?? Number.NEGATIVE_INFINITY)
    && value <= (range.max ?? Number.POSITIVE_INFINITY);
}

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

export interface ParsedSearchRange {
  field: string;
  min: number;
  max: number;
}

export interface ParsedNormalizedSearchQuery {
  tokens: string[];
  ranges: ParsedSearchRange[];
}

const RANGE_TOKEN = /([\p{L}_][\p{L}\p{N}_-]*)\s*:\s*(-?\d+(?:[.,]\d+)?)\s*(?:\.{2,}|[–—-])\s*(-?\d+(?:[.,]\d+)?)/gu;

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

export function parseNormalizedSearchQuery(query: string): ParsedNormalizedSearchQuery {
  const ranges: ParsedSearchRange[] = [];
  // Extract numeric ranges before punctuation normalization, which otherwise turns
  // "protein:12.5..20" into unrelated text tokens.
  const remainingText = query.replace(RANGE_TOKEN, (_whole, field: string, firstRaw: string, secondRaw: string) => {
    const first = parseNumber(firstRaw);
    const second = parseNumber(secondRaw);
    ranges.push({ field: normalizeSearchText(field).replace(/\s/g, "_"), min: Math.min(first, second), max: Math.max(first, second) });
    return " ";
  });
  const tokens = normalizeSearchText(remainingText).split(" ").filter(Boolean);
  return { tokens: [...new Set(tokens)], ranges };
}

/** All text tokens must match; text may come from the name, aliases, or extra search text. */
export function matchesNormalizedSearch(record: NormalizedSearchRecord, query: string): boolean {
  const { tokens, ranges } = parseNormalizedSearchQuery(query);
  const haystack = normalizeSearchText([
    record.name ?? "",
    record.search_text ?? "",
    ...(record.search_aliases ?? []),
  ].join(" "));

  if (!tokens.every((token) => haystack.includes(token))) return false;
  return ranges.every(({ field, min, max }) => {
    const value = record.search_ranges?.[field];
    return typeof value === "number" && Number.isFinite(value)
      && value >= min
      && value <= max;
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

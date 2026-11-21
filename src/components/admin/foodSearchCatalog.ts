import { fetchFoodsFromSupabase } from "@/lib/supabase";
import type { FoodItem } from "@/lib/foodDatabase";

const CATALOG_CACHE_TTL_MS = 60_000;
const catalogRequests = new Map<string, { promise: Promise<FoodItem[]>; expiresAt: number }>();

function normalizeSearchKey(query: string): string {
  return query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

/** Fetches and memoizes only matching catalog rows; never loads the full table. */
export function fetchFoodSearchCatalog(query: string): Promise<FoodItem[]> {
  const trimmedQuery = query.trim().replace(/\s+/g, " ");
  if (trimmedQuery.length < 2) return Promise.resolve([]);

  const key = normalizeSearchKey(trimmedQuery);
  const cached = catalogRequests.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  if (cached) catalogRequests.delete(key);

  const request = Promise.resolve()
    .then(() => fetchFoodsFromSupabase(trimmedQuery))
    .catch(() => {
      if (catalogRequests.get(key)?.promise === request) catalogRequests.delete(key);
      return [];
    });
  catalogRequests.set(key, { promise: request, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS });
  return request;
}

/** Call after catalog writes so subsequent searches observe the saved catalog. */
export function invalidateFoodSearchCatalog(): void {
  catalogRequests.clear();
}

export interface FoodSearchAnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

export interface FoodSearchDropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function getFoodSearchDropdownPosition(
  rect: FoodSearchAnchorRect,
  viewportWidth: number,
  viewportHeight: number,
  preferredHeight = 448,
): FoodSearchDropdownPosition {
  const edge = 8;
  const gap = 4;
  const width = Math.min(Math.max(rect.width, 380), Math.max(0, viewportWidth - edge * 2));
  const left = Math.min(Math.max(rect.left, edge), Math.max(edge, viewportWidth - width - edge));
  const below = Math.max(0, viewportHeight - rect.bottom - gap - edge);
  const above = Math.max(0, rect.top - gap - edge);
  const openAbove = below < Math.min(preferredHeight, 220) && above > below;
  const maxHeight = Math.min(preferredHeight, openAbove ? above : below);
  const top = openAbove
    ? Math.max(edge, rect.top - gap - maxHeight)
    : Math.min(rect.bottom + gap, Math.max(edge, viewportHeight - maxHeight - edge));

  return { top, left, width, maxHeight };
}

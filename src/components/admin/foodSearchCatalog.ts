import { fetchFoodsFromSupabase } from "@/lib/supabase";
import type { FoodItem } from "@/lib/foodDatabase";

let catalogPromise: Promise<FoodItem[]> | null = null;

export function fetchFoodSearchCatalog(): Promise<FoodItem[]> {
  if (!catalogPromise) {
    catalogPromise = fetchFoodsFromSupabase().catch(() => {
      catalogPromise = null;
      return [];
    });
  }
  return catalogPromise;
}

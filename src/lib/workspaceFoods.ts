import { supabase, repairMojibake } from "./supabase";

export interface WorkspaceFood {
  id: string;
  name: string;
  category: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number | null;
  source?: string | null;
}

const PAGE_SIZE = 50;

export async function fetchWorkspaceFoods(
  query: string,
  category: string,
  page: number
): Promise<{ foods: WorkspaceFood[]; total: number }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supabase
    .from("master_foods")
    .select("id, name, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source", { count: "exact" });

  if (query.trim()) {
    q = q.ilike("name", `%${query.trim()}%`);
  }
  if (category && category !== "Todos") {
    q = q.eq("category", category);
  }

  const { data, error, count } = await q.order("name").range(from, to);

  if (error) {
    console.error("[workspace] fetchWorkspaceFoods:", error.message);
    throw error;
  }

  const foods = (data ?? []).map((row) => ({
    ...row,
    name: repairMojibake(row.name as string),
    category: repairMojibake(row.category as string),
  })) as WorkspaceFood[];

  return { foods, total: count ?? 0 };
}

export async function fetchWorkspaceFoodCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("master_foods")
    .select("category")
    .order("category");

  if (error) {
    console.error("[workspace] fetchWorkspaceFoodCategories:", error.message);
    throw error;
  }

  const unique = Array.from(new Set((data ?? []).map((r) => repairMojibake(r.category as string)))).sort();
  return unique;
}

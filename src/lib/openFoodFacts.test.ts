import { afterEach, describe, expect, it, vi } from "vitest";
import { searchOpenFoodFacts } from "./openFoodFacts";

describe("searchOpenFoodFacts nutrition completeness", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps complete macros including explicit zeros and filters missing macro fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [
        {
          product_name: "Produto completo",
          nutriments: { "energy-kcal_100g": 120, proteins_100g: 0, carbohydrates_100g: 20.04, fat_100g: 1.26 },
        },
        {
          product_name: "Sem proteína",
          nutriments: { "energy-kcal_100g": 120, carbohydrates_100g: 20, fat_100g: 1 },
        },
        {
          product_name: "Sem carboidrato",
          nutriments: { "energy-kcal_100g": 120, proteins_100g: 2, fat_100g: 1 },
        },
        {
          product_name: "Sem gordura",
          nutriments: { "energy-kcal_100g": 120, proteins_100g: 2, carbohydrates_100g: 20 },
        },
      ] }),
    }));

    const results = await searchOpenFoodFacts("produto");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ name: "Produto completo", kcal: 120, protein: 0, carbs: 20, fat: 1.3 });
  });

  it("rejects invalid nutrition values instead of converting them to zero", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [
        {
          product_name: "Macro negativo",
          nutriments: { "energy-kcal_100g": 120, proteins_100g: 2, carbohydrates_100g: -1, fat_100g: 1 },
        },
        {
          product_name: "Energia ausente",
          nutriments: { proteins_100g: 2, carbohydrates_100g: 20, fat_100g: 1 },
        },
      ] }),
    }));

    expect(await searchOpenFoodFacts("produto")).toEqual([]);
  });
});

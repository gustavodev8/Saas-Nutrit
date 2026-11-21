import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetchFoodsFromSupabase: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ fetchFoodsFromSupabase: mocks.fetchFoodsFromSupabase }));

import { fetchFoodSearchCatalog, getFoodSearchDropdownPosition, invalidateFoodSearchCatalog } from "./foodSearchCatalog";

beforeEach(() => {
  invalidateFoodSearchCatalog();
  mocks.fetchFoodsFromSupabase.mockReset();
});

describe("food search catalog cache", () => {
  it("does not request the full catalog for an empty or one-character query", async () => {
    await expect(fetchFoodSearchCatalog("")).resolves.toEqual([]);
    await expect(fetchFoodSearchCatalog(" a ")).resolves.toEqual([]);
    expect(mocks.fetchFoodsFromSupabase).not.toHaveBeenCalled();
  });

  it("queries only matching rows and shares normalized in-flight/cache entries", async () => {
    invalidateFoodSearchCatalog();
    mocks.fetchFoodsFromSupabase.mockResolvedValue([{ id: 1, name: "Maçã" }]);

    const first = fetchFoodSearchCatalog(" maçã ");
    const second = fetchFoodSearchCatalog("MAÇÃ");
    await Promise.resolve();
    expect(mocks.fetchFoodsFromSupabase).toHaveBeenCalledTimes(1);
    expect(mocks.fetchFoodsFromSupabase).toHaveBeenCalledWith("maçã");
    await expect(Promise.all([first, second])).resolves.toEqual([
      [{ id: 1, name: "Maçã" }],
      [{ id: 1, name: "Maçã" }],
    ]);
  });

  it("refetches after a catalog write invalidates cached results", async () => {
    invalidateFoodSearchCatalog();
    mocks.fetchFoodsFromSupabase.mockResolvedValueOnce([{ id: 1, name: "Aveia" }]).mockResolvedValueOnce([]);
    await fetchFoodSearchCatalog("aveia");
    invalidateFoodSearchCatalog();
    await fetchFoodSearchCatalog("aveia");
    expect(mocks.fetchFoodsFromSupabase).toHaveBeenCalledTimes(2);
  });

  it("does not erase a newer cache entry when an invalidated request rejects", async () => {
    invalidateFoodSearchCatalog();
    let rejectOld!: (reason: Error) => void;
    mocks.fetchFoodsFromSupabase.mockReturnValueOnce(new Promise((_, reject) => { rejectOld = reject; }));
    const oldRequest = fetchFoodSearchCatalog("arroz");
    invalidateFoodSearchCatalog();
    mocks.fetchFoodsFromSupabase.mockResolvedValueOnce([{ id: 2, name: "Arroz" }]);
    const currentRequest = fetchFoodSearchCatalog("arroz");
    rejectOld(new Error("offline"));
    await expect(oldRequest).resolves.toEqual([]);
    await expect(currentRequest).resolves.toEqual([{ id: 2, name: "Arroz" }]);
    expect(await fetchFoodSearchCatalog("arroz")).toEqual([{ id: 2, name: "Arroz" }]);
    expect(mocks.fetchFoodsFromSupabase).toHaveBeenCalledTimes(2);
  });
});

describe("food search dropdown positioning", () => {
  it("keeps the mobile dropdown within horizontal viewport bounds", () => {
    expect(getFoodSearchDropdownPosition(
      { top: 220, bottom: 260, left: 16, width: 342 },
      390,
      844,
    )).toEqual({ top: 264, left: 8, width: 374, maxHeight: 448 });
  });

  it("opens above the input when the lower viewport space is insufficient", () => {
    expect(getFoodSearchDropdownPosition(
      { top: 740, bottom: 780, left: 400, width: 420 },
      900,
      800,
    )).toEqual({ top: 288, left: 400, width: 420, maxHeight: 448 });
  });
});

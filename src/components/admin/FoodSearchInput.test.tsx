import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchFoodSearchCatalog: vi.fn(),
  fetchCustomFoods: vi.fn(),
  getFoodSearchDropdownPosition: vi.fn(() => ({ top: 40, left: 8, width: 374, maxHeight: 300 })),
  searchOpenFoodFacts: vi.fn(),
}));

vi.mock("@/components/admin/foodSearchCatalog", () => ({
  fetchFoodSearchCatalog: mocks.fetchFoodSearchCatalog,
  getFoodSearchDropdownPosition: mocks.getFoodSearchDropdownPosition,
}));
vi.mock("@/components/admin/customFoods", () => ({
  fetchCustomFoods: mocks.fetchCustomFoods,
  saveCustomFood: vi.fn(),
}));
vi.mock("@/lib/openFoodFacts", () => ({ searchOpenFoodFacts: mocks.searchOpenFoodFacts }));

import { FoodSearchInput } from "./FoodSearchInput";

describe("FoodSearchInput search requests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.fetchFoodSearchCatalog.mockReset().mockResolvedValue([]);
    mocks.fetchCustomFoods.mockReset().mockResolvedValue([]);
    mocks.getFoodSearchDropdownPosition.mockClear();
    mocks.searchOpenFoodFacts.mockReset().mockResolvedValue([]);
  });

  afterEach(() => vi.useRealTimers());

  it("does not load the full catalog and debounces a filtered query until two characters", async () => {
    render(<FoodSearchInput value="" onSelect={vi.fn()} onCustomName={vi.fn()} />);
    const input = screen.getByPlaceholderText("Buscar alimento...");

    fireEvent.change(input, { target: { value: "a" } });
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(mocks.fetchFoodSearchCatalog).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "ar" } });
    await act(async () => { vi.advanceTimersByTime(179); });
    expect(mocks.fetchFoodSearchCatalog).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(mocks.fetchFoodSearchCatalog).toHaveBeenCalledTimes(1);
    expect(mocks.fetchFoodSearchCatalog).toHaveBeenCalledWith("ar");
    expect(mocks.fetchCustomFoods).toHaveBeenCalledTimes(1);
  });
});

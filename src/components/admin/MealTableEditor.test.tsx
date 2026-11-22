import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FoodItem } from "@/lib/foodDatabase";
import type { MealFood } from "@/lib/supabase";
import { FoodRow } from "./MealTableEditor";

const supabaseMocks = vi.hoisted(() => ({ searchFoods: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  fetchSmartSubstitutions: vi.fn().mockResolvedValue([]),
  searchFoodsInSupabase: supabaseMocks.searchFoods,
}));

const selectedFood: FoodItem = {
  id: "catalog-rice",
  name: "Arroz do catálogo",
  category: "Cereais e derivados",
  kcal: 210,
  protein: 4,
  carbs: 42,
  fat: 2,
};

const persistedFood: MealFood = {
  id: 11,
  meal_id: 12,
  food_name: "Arroz anterior",
  quantity: 100,
  unit: "g",
  calories: 180,
  protein: 3,
  carbs: 36,
  fat: 1,
  kcal_per_100g: 180,
  protein_per_100g: 3,
  carbs_per_100g: 36,
  fat_per_100g: 1,
  household_measure: "xícara",
  measure_amount: 0.5,
  food_group: "Carboidrato",
};

function renderFoodRow(food: MealFood, onChange = vi.fn()) {
  render(<table><tbody><FoodRow food={food} idx={0} onChange={onChange} onRemove={vi.fn()} /></tbody></table>);
  return onChange;
}

function StatefulFoodRow({ initialFood }: { initialFood: MealFood }) {
  const [food, setFood] = useState(initialFood);
  return <><output data-testid="food-state">{JSON.stringify(food)}</output><table><tbody><FoodRow food={food} idx={0} onChange={setFood} onRemove={vi.fn()} /></tbody></table></>;
}

describe("MealTableEditor food nutrition invalidation", () => {
  beforeEach(() => {
    localStorage.clear();
    supabaseMocks.searchFoods.mockResolvedValue([selectedFood]);
  });

  it("clears selected-food macros and metadata when its name is edited", async () => {
    const onChange = renderFoodRow({ ...persistedFood, food_name: "Nome qualquer" });
    const input = screen.getByPlaceholderText("Buscar alimento...");
    fireEvent.change(input, { target: { value: "Arroz do catálogo" } });

    const result = await screen.findByText("Arroz do catálogo");
    const resultButton = result.closest("button");
    if (!resultButton) throw new Error("Resultado do catálogo sem botão de seleção.");
    fireEvent.mouseDown(resultButton);
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      food_name: "Arroz do catálogo",
      calories: 210,
      kcal_per_100g: 210,
      household_measure: undefined,
      measure_amount: undefined,
      food_group: undefined,
    })));

    fireEvent.change(input, { target: { value: "Arroz editado manualmente" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      food_name: "Arroz editado manualmente",
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      kcal_per_100g: undefined,
      protein_per_100g: undefined,
      carbs_per_100g: undefined,
      fat_per_100g: undefined,
      household_measure: undefined,
      measure_amount: undefined,
      food_group: undefined,
    }));
  });

  it("does not keep persisted nutrition when free text becomes an unmeasured custom food", () => {
    const onChange = renderFoodRow(persistedFood);
    fireEvent.change(screen.getByPlaceholderText("Buscar alimento..."), { target: { value: "Farinha artesanal" } });

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      food_name: "Farinha artesanal",
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      kcal_per_100g: undefined,
      protein_per_100g: undefined,
      carbs_per_100g: undefined,
      fat_per_100g: undefined,
    }));
  });

  it("does not restore old totals after clearing quantity and selecting another food", async () => {
    render(<StatefulFoodRow initialFood={persistedFood} />);
    fireEvent.change(screen.getByPlaceholderText("—"), { target: { value: "" } });
    await waitFor(() => expect(JSON.parse(screen.getByTestId("food-state").textContent ?? "{}").calories).toBeUndefined());

    fireEvent.change(screen.getByPlaceholderText("Buscar alimento..."), { target: { value: "Arroz do catálogo" } });
    const resultButton = (await screen.findByText("Arroz do catálogo")).closest("button");
    if (!resultButton) throw new Error("Resultado do catálogo sem botão de seleção.");
    fireEvent.mouseDown(resultButton);

    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId("food-state").textContent ?? "{}") as MealFood;
      expect(state).toMatchObject({ food_name: "Arroz do catálogo", kcal_per_100g: 210 });
      expect(state.quantity).toBeUndefined();
      expect([state.calories, state.protein, state.carbs, state.fat]).toEqual([undefined, undefined, undefined, undefined]);
      expect([state.household_measure, state.measure_amount, state.food_group]).toEqual([undefined, undefined, undefined]);
    });
  });

  it("clears old household metadata and totals when applying a smart substitution", async () => {
    render(<StatefulFoodRow initialFood={{ ...persistedFood, food_name: "Arroz branco cozido", quantity: undefined }} />);
    fireEvent.click(screen.getByTitle("Medida caseira / grupo"));
    fireEvent.click(screen.getByRole("button", { name: "Substituição inteligente" }));
    fireEvent.change(screen.getByPlaceholderText("Filtrar por nome…"), { target: { value: "Aveia em flocos" } });
    fireEvent.click(await screen.findByRole("button", { name: /Aveia em flocos/ }));
    fireEvent.click(screen.getByRole("button", { name: "Substituir alimento" }));

    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId("food-state").textContent ?? "{}") as MealFood;
      expect(state).toMatchObject({ food_name: "Aveia em flocos", kcal_per_100g: 394 });
      expect(state.quantity).toBeUndefined();
      expect([state.calories, state.protein, state.carbs, state.fat]).toEqual([undefined, undefined, undefined, undefined]);
      expect([state.household_measure, state.measure_amount, state.food_group]).toEqual([undefined, undefined, undefined]);
    });
  });
});

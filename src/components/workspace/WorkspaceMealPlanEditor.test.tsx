import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceMealPlanEditor } from "./WorkspaceMealPlanEditor";
import type { WorkspaceMealPlanInput } from "@/lib/workspaceMealPlans";

const customFoodMocks = vi.hoisted(() => ({ fetch: vi.fn().mockResolvedValue([]), save: vi.fn(), search: vi.fn().mockResolvedValue([]) }));

vi.mock("@/lib/supabase", () => ({
  fetchSmartSubstitutions: vi.fn(() => new Promise(() => undefined)),
  searchFoodsInSupabase: customFoodMocks.search,
}));

vi.mock("@/components/admin/customFoods", () => ({
  fetchCustomFoods: customFoodMocks.fetch,
  saveCustomFood: customFoodMocks.save,
}));

const initialPlan: WorkspaceMealPlanInput = {
  id: 10,
  patient_id: 41,
  title: "Plano A",
  daily_calories: 1800,
  meals: [{
    id: 20,
    workspace_id: "workspace-a",
    plan_id: 10,
    meal_name: "Almoço",
    time_suggestion: "12:00",
    notes: "Orientação da refeição",
    sort_order: 0,
    foods: [{
      id: 30,
      meal_id: 20,
      workspace_id: "workspace-a",
      food_name: "Arroz",
      quantity: 100,
      unit: "g",
      calories: 130,
      protein: 2.5,
      carbs: 28,
      fat: 0.3,
      notes: "Bem cozido",
      sort_order: 0,
      kcal_per_100g: 130,
      protein_per_100g: 2.5,
      carbs_per_100g: 28,
      fat_per_100g: 0.3,
      household_measure: "xícara",
      measure_amount: 0.5,
      food_group: "Carboidrato",
    }],
    substitution_items: [{
      food_name: "Batata",
      quantity: 100,
      unit: "g",
      notes: "cozida",
      replaces_food: "Arroz",
    }],
    alternative_meals: [{
      meal_name: "Opção 2",
      time_suggestion: "12:30",
      notes: "Alternativa completa",
      foods: [{
        id: 31,
        meal_id: 20,
        workspace_id: "workspace-a",
        food_name: "Macarrão",
        quantity: 100,
        unit: "g",
        calories: 900,
        protein: 20,
        carbs: 50,
        fat: 10,
        sort_order: 0,
      }],
    }],
  }],
};

describe("WorkspaceMealPlanEditor", () => {
  beforeEach(() => {
    localStorage.clear();
    customFoodMocks.fetch.mockClear();
    customFoodMocks.search.mockReset().mockResolvedValue([]);
  });

  it("reuses the shared meal section and preserves workspace ids and clinical metadata on save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<WorkspaceMealPlanEditor workspaceId="workspace-a" scopeKey="workspace-a:41:10" initialPlan={initialPlan} onSave={onSave} />);

    fireEvent.click(screen.getByTitle("Próxima opção"));
    fireEvent.change(screen.getByPlaceholderText("Nome da refeição"), { target: { value: "Opção 2 revisada" } });
    fireEvent.click(screen.getByTitle("Opção anterior"));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar manualmente" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar plano alimentar" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0][0] as WorkspaceMealPlanInput;
    expect(saved.meals[0]).toMatchObject({ id: 20, workspace_id: "workspace-a", plan_id: 10, notes: "Orientação da refeição" });
    expect(saved.meals[0].foods[0]).toMatchObject({
      id: 30,
      meal_id: 20,
      workspace_id: "workspace-a",
      food_name: "Arroz",
      calories: 130,
      protein: 2.5,
      carbs: 28,
      fat: 0.3,
      kcal_per_100g: 130,
      protein_per_100g: 2.5,
      carbs_per_100g: 28,
      fat_per_100g: 0.3,
      household_measure: "xícara",
      measure_amount: 0.5,
      food_group: "Carboidrato",
      notes: "Bem cozido",
    });
    expect(saved.meals[0].alternative_meals?.[0]).toMatchObject({
      meal_name: "Opção 2 revisada",
      time_suggestion: "12:30",
      notes: "Alternativa completa",
      foods: [{ id: 31, workspace_id: "workspace-a", food_name: "Macarrão", calories: 900 }],
    });
    expect(saved.meals[0].substitution_items?.[0]).toMatchObject({
      food_name: "Batata",
      quantity: 100,
      notes: "cozida",
      replaces_food: "Arroz",
    });
    expect(saved.meals[0].substitution_items).toHaveLength(2);
  });

  it("clears macros and totals after selecting a catalog food then editing its name without selecting another", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    customFoodMocks.search.mockResolvedValue([{
      id: "catalog-oats",
      name: "Aveia selecionada",
      category: "Cereais e derivados",
      kcal: 390,
      protein: 14,
      carbs: 67,
      fat: 8,
    }]);
    render(<WorkspaceMealPlanEditor workspaceId="workspace-a" scopeKey="workspace-a:41:10" initialPlan={initialPlan} onSave={onSave} />);

    const foodSearch = screen.getByPlaceholderText("Buscar alimento...");
    fireEvent.change(foodSearch, { target: { value: "Aveia selecionada" } });
    await waitFor(() => expect(customFoodMocks.fetch).toHaveBeenCalledWith("workspace-a"));
    const catalogResult = (await screen.findAllByText("Aveia selecionada")).find((node) => node.tagName === "P");
    const resultButton = catalogResult?.closest("button");
    if (!resultButton) throw new Error("Resultado do catálogo sem botão de seleção.");
    fireEvent.mouseDown(resultButton);
    await waitFor(() => expect(within(screen.getByRole("heading", { name: "Totais das refeições principais" }).closest("section") as HTMLElement).getByText("390")).toBeInTheDocument());

    fireEvent.change(foodSearch, { target: { value: "Aveia digitada sem seleção" } });
    const summary = screen.getByRole("heading", { name: "Totais das refeições principais" }).closest("section") as HTMLElement;
    expect(within(summary).getByText("Energia").parentElement).toHaveTextContent("0 kcal");
    fireEvent.click(screen.getByRole("button", { name: "Salvar plano alimentar" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const saved = onSave.mock.calls[0][0] as WorkspaceMealPlanInput;
    expect(saved.meals[0].foods[0]).toMatchObject({
      food_name: "Aveia digitada sem seleção",
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      kcal_per_100g: undefined,
      protein_per_100g: undefined,
      carbs_per_100g: undefined,
      fat_per_100g: undefined,
    });
  });

  it("counts only main-option foods in totals and displays the shared per-meal calorie target", () => {
    render(<WorkspaceMealPlanEditor workspaceId="workspace-a" scopeKey="workspace-a:41:10" initialPlan={initialPlan} onSave={vi.fn()} />);

    const summary = screen.getByRole("heading", { name: "Totais das refeições principais" }).closest("section");
    expect(summary).not.toBeNull();
    expect(within(summary).getByText("130")).toBeInTheDocument();
    expect(within(summary).queryByText("1.030")).not.toBeInTheDocument();
    expect(screen.getByText("Totais das refeições principais")).toBeInTheDocument();
    expect(screen.getByText(/Abaixo da meta/)).toHaveTextContent("1800 kcal");
  });

  it("adds a meal without changing the existing workspace graph", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<WorkspaceMealPlanEditor workspaceId="workspace-a" scopeKey="workspace-a:41:10" initialPlan={initialPlan} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Nova refeição" }));
    expect(screen.getByDisplayValue("Refeição 2")).toBeInTheDocument();
    expect(screen.getAllByTitle("Próxima opção")).toHaveLength(1);
  });

  it("resets the draft and shared option state when the patient/workspace scope changes", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const view = render(<WorkspaceMealPlanEditor workspaceId="workspace-a" scopeKey="workspace-a:41:10" initialPlan={initialPlan} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Título do plano"), { target: { value: "Rascunho alterado" } });

    const nextPlan: WorkspaceMealPlanInput = {
      ...initialPlan,
      patient_id: 52,
      title: "Plano do outro workspace",
      meals: [{
        workspace_id: "workspace-b",
        plan_id: 15,
        meal_name: "Café da manhã",
        foods: [],
        alternative_meals: [],
        substitution_items: [],
      }],
    };
    view.rerender(<WorkspaceMealPlanEditor workspaceId="workspace-b" scopeKey="workspace-b:52:15" initialPlan={nextPlan} onSave={onSave} />);

    await waitFor(() => expect(screen.getByLabelText("Título do plano")).toHaveValue("Plano do outro workspace"));
    expect(screen.queryByDisplayValue("Rascunho alterado")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Opção 2")).not.toBeInTheDocument();
  });
});

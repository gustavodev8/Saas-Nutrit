import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceAlimentosPage } from "./WorkspaceAlimentosPage";
import { WorkspaceModelosPage } from "./WorkspaceModelosPage";

const mocks = vi.hoisted(() => ({
  templates: vi.fn(),
  foods: vi.fn(),
  categories: vi.fn(),
}));

vi.mock("@/components/workspace/LeafLoader", () => ({ LeafLoader: () => <span>Carregando</span> }));
vi.mock("@/contexts/WorkspaceAuthContext", () => ({
  useWorkspaceAuth: () => ({ membership: { workspaceId: "ws-a" } }),
}));
vi.mock("@/lib/workspaceTemplates", () => ({ fetchWorkspaceTemplates: mocks.templates }));
vi.mock("@/lib/workspaceFoods", () => ({
  fetchWorkspaceFoods: mocks.foods,
  fetchWorkspaceFoodCategories: mocks.categories,
}));

describe("workspace catalog load states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.categories.mockResolvedValue([]);
  });

  it("shows a template error and retries instead of treating it as empty", async () => {
    mocks.templates.mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([{ id: 1, name: "Plano base", strategy: "maintenance" }]);
    render(<MemoryRouter><WorkspaceModelosPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Não foi possível carregar os modelos" })).toBeInTheDocument();
    expect(screen.queryByText("Nenhum modelo disponível")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("link", { name: /Plano base/ })).toBeInTheDocument();
    expect(mocks.templates).toHaveBeenCalledTimes(2);
  });

  it("keeps a successful empty template list distinct from errors", async () => {
    mocks.templates.mockResolvedValue([]);
    render(<MemoryRouter><WorkspaceModelosPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Nenhum modelo disponível" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("separa meus modelos dos modelos do sistema em abas", async () => {
    mocks.templates.mockResolvedValue([
      { id: 1, name: "Meu plano", strategy: "low_carb", workspace_id: "ws-a" },
      { id: 2, name: "Plano do sistema", strategy: "maintenance", workspace_id: null },
    ]);
    render(<MemoryRouter><WorkspaceModelosPage /></MemoryRouter>);
    // Com modelo próprio, a aba inicial é "Meus modelos".
    expect(await screen.findByRole("link", { name: /Meu plano/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Plano do sistema/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Meus modelos \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Do sistema \(1\)/ })).toBeInTheDocument();
    // Troca para a aba do sistema.
    fireEvent.click(screen.getByRole("button", { name: /Do sistema \(1\)/ }));
    expect(await screen.findByRole("link", { name: /Plano do sistema/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Meu plano/ })).not.toBeInTheDocument();
  });

  it("orienta a criar o primeiro modelo quando não há modelos próprios", async () => {
    mocks.templates.mockResolvedValue([
      { id: 2, name: "Plano do sistema", strategy: "maintenance", workspace_id: null },
    ]);
    render(<MemoryRouter><WorkspaceModelosPage /></MemoryRouter>);
    // Sem modelo próprio, abre na aba do sistema, mas a aba "Meus modelos (0)" existe.
    expect(await screen.findByRole("button", { name: /Meus modelos \(0\)/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Meus modelos \(0\)/ }));
    expect(await screen.findByRole("heading", { name: "Você ainda não tem modelos próprios" })).toBeInTheDocument();
  });

  it("shows a food error and retries the list", async () => {
    mocks.foods.mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ foods: [{
        id: "1", name: "Banana", category: "Frutas", kcal_per_100g: 89,
        protein_per_100g: 1, carbs_per_100g: 23, fat_per_100g: 0.3,
      }], total: 1 });
    render(<MemoryRouter><WorkspaceAlimentosPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Não foi possível carregar os alimentos" })).toBeInTheDocument();
    expect(screen.queryByText("Nenhum alimento disponível")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Banana")).toBeInTheDocument();
    expect(mocks.foods).toHaveBeenCalledTimes(2);
  });

  it("retries a failed category request without misreporting an empty catalog", async () => {
    mocks.categories.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(["Frutas"]);
    mocks.foods.mockResolvedValue({ foods: [], total: 0 });
    render(<MemoryRouter><WorkspaceAlimentosPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Não foi possível carregar os alimentos" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Nenhum alimento disponível" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Frutas" })).toBeInTheDocument();
  });
});

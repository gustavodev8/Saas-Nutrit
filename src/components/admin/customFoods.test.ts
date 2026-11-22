import { beforeEach, describe, expect, it } from "vitest";
import { fetchCustomFoods, saveCustomFood } from "./customFoods";

const foodInput = {
  name: "Farinha workspace",
  category: "Personalizado",
  kcal_per_100g: 100,
  protein_per_100g: 2,
  carbs_per_100g: 20,
  fat_per_100g: 1,
};

describe("custom foods storage scope", () => {
  beforeEach(() => localStorage.clear());

  it("reuses custom foods within one workspace, isolates other workspaces, and keeps the legacy key unchanged", async () => {
    const legacy = await saveCustomFood({ ...foodInput, name: "Alimento legado" });
    const workspaceA = await saveCustomFood(foodInput, "workspace-a");
    const workspaceB = await saveCustomFood({ ...foodInput, name: "Farinha B" }, "workspace-b");

    expect(await fetchCustomFoods()).toEqual([legacy]);
    expect(await fetchCustomFoods("workspace-a")).toEqual([workspaceA]);
    expect(await fetchCustomFoods("workspace-a")).toEqual([workspaceA]);
    expect(await fetchCustomFoods("workspace-b")).toEqual([workspaceB]);
    expect(localStorage.getItem("custom_foods")).not.toContain("Farinha workspace");
    expect(localStorage.getItem("custom_foods:workspace-a")).toContain("Farinha workspace");
  });

  it("reads an empty list for a workspace that has no custom foods", async () => {
    await saveCustomFood(foodInput, "workspace-a");

    expect(await fetchCustomFoods("workspace-b")).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { buildShoppingList, shoppingListToText } from "@/lib/shoppingList";

describe("buildShoppingList", () => {
  it("soma o mesmo alimento em refeições diferentes", () => {
    const result = buildShoppingList([
      { foods: [{ food_name: "Arroz", quantity: 100, unit: "g", food_group: "Cereais" }] },
      { foods: [{ food_name: " arroz ", quantity: 50.5, unit: "G" }] },
    ]);

    expect(result).toEqual([
      { food_name: "Arroz", unit: "g", quantity: 150.5, food_group: "Cereais" },
    ]);
  });

  it("separa itens com unidades diferentes", () => {
    const result = buildShoppingList([
      { foods: [{ food_name: "Arroz", quantity: 100, unit: "g" }] },
      { foods: [{ food_name: "Arroz", quantity: 2, unit: "colher" }] },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.unit)).toEqual(["g", "colher"]);
  });

  it("ignora alimentos com nome vazio ou só com espaços", () => {
    const result = buildShoppingList([
      { foods: [{ food_name: "", quantity: 10, unit: "g" }, { food_name: "   ", quantity: 5, unit: "g" }, { food_name: "Ovo", quantity: 2, unit: "un" }] },
    ]);

    expect(result.map((item) => item.food_name)).toEqual(["Ovo"]);
  });

  it("ordena por food_group e depois por nome, com grupo vazio por último", () => {
    const result = buildShoppingList([
      { foods: [
        { food_name: "Banana", quantity: 1, unit: "un", food_group: "Frutas" },
        { food_name: "Sal", quantity: 1, unit: "g" },
        { food_name: "Maçã", quantity: 1, unit: "un", food_group: "Frutas" },
        { food_name: "Arroz", quantity: 100, unit: "g", food_group: "Cereais" },
      ] },
    ]);

    expect(result.map((item) => item.food_name)).toEqual(["Arroz", "Banana", "Maçã", "Sal"]);
  });
});

describe("shoppingListToText", () => {
  it("gera uma linha por item agrupada por food_group", () => {
    const text = shoppingListToText([
      { food_name: "Arroz", unit: "g", quantity: 150, food_group: "Cereais" },
      { food_name: "Banana", unit: "un", quantity: 2, food_group: "Frutas" },
      { food_name: "Sal", unit: "g", quantity: 5 },
    ]);

    expect(text).toBe("Cereais\n- Arroz: 150 g\n\nFrutas\n- Banana: 2 un\n\n- Sal: 5 g");
  });
});

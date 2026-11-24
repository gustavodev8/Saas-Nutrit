export interface ShoppingListItem {
  food_name: string;
  unit: string;
  quantity: number;
  food_group?: string;
}

interface MealLike {
  foods?: Array<{ food_name: string; quantity?: number; unit?: string; food_group?: string }>;
}

/**
 * Agrega os alimentos das refeições numa lista de compras.
 * - Chave de agregação: nome (trim/lowercase) + "|" + unidade (trim/lowercase, default "g").
 * - Soma as quantidades (default 0). Ignora alimentos com nome vazio.
 * - Mantém o nome exibido (primeiro visto, trim), a unidade (primeira vista ou "g") e o food_group (primeiro não vazio).
 * - Ordena por food_group (vazio/undefined por último) e, dentro, por food_name (pt-BR).
 * - Quantidade final arredondada a no máximo 2 casas.
 */
export function buildShoppingList(meals: MealLike[]): ShoppingListItem[] {
  const byKey = new Map<string, ShoppingListItem>();

  for (const meal of meals) {
    for (const food of meal.foods ?? []) {
      const name = food.food_name.trim();
      if (!name) continue;
      const unit = food.unit?.trim() || "g";
      const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
      const quantity = typeof food.quantity === "number" && Number.isFinite(food.quantity) ? food.quantity : 0;
      const group = food.food_group?.trim() || undefined;

      const existing = byKey.get(key);
      if (existing) {
        existing.quantity += quantity;
        if (!existing.food_group && group) existing.food_group = group;
      } else {
        byKey.set(key, { food_name: name, unit, quantity, food_group: group });
      }
    }
  }

  const items = Array.from(byKey.values()).map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * 100) / 100,
  }));

  return items.sort((a, b) => {
    const groupA = a.food_group ?? "";
    const groupB = b.food_group ?? "";
    if (groupA !== groupB) {
      if (!groupA) return 1;
      if (!groupB) return -1;
      return groupA.localeCompare(groupB, "pt-BR");
    }
    return a.food_name.localeCompare(b.food_name, "pt-BR");
  });
}

/** Texto simples para a área de transferência: agrupa por food_group, uma linha "- {nome}: {qtd} {unid}" por item. */
export function shoppingListToText(items: ShoppingListItem[]): string {
  const sections = new Map<string, ShoppingListItem[]>();
  for (const item of items) {
    const group = item.food_group ?? "";
    const list = sections.get(group) ?? [];
    list.push(item);
    sections.set(group, list);
  }

  const blocks: string[] = [];
  for (const [group, groupItems] of sections) {
    const lines = groupItems.map((item) => `- ${item.food_name}: ${item.quantity} ${item.unit}`);
    blocks.push(group ? [group, ...lines].join("\n") : lines.join("\n"));
  }
  return blocks.join("\n\n");
}

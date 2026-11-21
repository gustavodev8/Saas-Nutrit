import { type FoodItem } from "@/lib/foodDatabase";

const storageKey = (storageScope?: string) => storageScope ? `custom_foods:${storageScope}` : "custom_foods";

const getCustomFoods = (storageScope?: string): FoodItem[] => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(storageScope)) || "[]");
  } catch {
    return [];
  }
};

const saveCustomFoodLocal = (food: FoodItem, storageScope?: string): void => {
  const foods = getCustomFoods(storageScope);
  foods.push(food);
  localStorage.setItem(storageKey(storageScope), JSON.stringify(foods));
};

export async function fetchCustomFoods(storageScope?: string): Promise<FoodItem[]> {
  return getCustomFoods(storageScope);
}

export async function saveCustomFood(food: {
  name: string;
  category: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
}, storageScope?: string): Promise<FoodItem> {
  const newFood: FoodItem = {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: food.name,
    category: food.category || "Personalizado",
    kcal: food.kcal_per_100g,
    protein: food.protein_per_100g,
    carbs: food.carbs_per_100g,
    fat: food.fat_per_100g,
    fiber: food.fiber_per_100g,
  };

  saveCustomFoodLocal(newFood, storageScope);
  return newFood;
}

import fs from "node:fs";
import path from "node:path";

const OUTPUT_SQL = path.join(process.cwd(), "supabase", "seeds", "diet_templates_108_varied_seed.sql");
const GENERATED_PREFIX = "Biblioteca Dieta - ";
const TEMPLATE_COUNT = 108;

const GOALS = [
  { key: "emagrecimento", label: "Emagrecimento", count: 36, startKcal: 1300, step: 18 },
  { key: "hipertrofia", label: "Hipertrofia", count: 36, startKcal: 2200, step: 25 },
  { key: "ganho_peso", label: "Ganho de peso", count: 36, startKcal: 2600, step: 30 },
];

const MEAL_META = {
  breakfast: { name: "Café da manhã", time: "07:00 - 08:00" },
  snackAm: { name: "Lanche da manhã", time: "10:00 - 10:30" },
  lunch: { name: "Almoço", time: "12:00 - 13:00" },
  snackPm: { name: "Lanche da tarde", time: "15:30 - 16:30" },
  dinner: { name: "Jantar", time: "19:00 - 20:00" },
  supper: { name: "Ceia", time: "22:00 - 23:00" },
};

const ROLE_STEPS = {
  protein: 15,
  carb: 15,
  fat: 5,
  fruit: 25,
  legume: 20,
  veggie: 20,
  dairy: 20,
  drink: 30,
};

const GROUP_LABELS = {
  protein: "Proteina",
  carb: "Carboidrato",
  fat: "Gordura",
  fruit: "Fruta",
  legume: "Leguminosa",
  veggie: "Vegetal",
  dairy: "Laticinio",
  drink: "Bebida",
};

function parseEnv() {
  const envText = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
  const get = (name) => {
    const direct = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
    if (direct) return direct[1].trim();
    const plus = envText.match(new RegExp(`^${name}\\+(.*)$`, "m"));
    if (plus) return plus[1].trim();
    return "";
  };
  const url = get("VITE_SUPABASE_URL");
  const key = get("VITE_SUPABASE_SERVICE_KEY") || get("SUPABASE_SERVICE_ROLE_KEY") || get("VITE_SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Credenciais do Supabase não encontradas no .env");
  return { url, key };
}

function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "")
    .toLowerCase()
    .trim();
}

function escapeSql(text) {
  return String(text ?? "").replace(/'/g, "''");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rest(env, table, { method = "GET", query = "", body, prefer } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const res = await fetch(`${env.url}/rest/v1/${table}${query ? `?${query}` : ""}`, {
        method,
        headers: {
          apikey: env.key,
          Authorization: `Bearer ${env.key}`,
          "Content-Type": "application/json",
          ...(prefer ? { Prefer: prefer } : {}),
        },
        body: body == null ? undefined : JSON.stringify(body),
      });
      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      if (!res.ok) {
        if (res.status >= 500 && attempt < 5) {
          await wait(800 * attempt);
          continue;
        }
        throw new Error(`[${table}] ${res.status} ${typeof data === "string" ? data : JSON.stringify(data)}`);
      }
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 5) {
        await wait(1000 * attempt);
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchFoodsPaged(env) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const res = await fetch(`${env.url}/rest/v1/master_foods?select=id,name,category,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,source&order=id.asc`, {
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        Range: `${from}-${to}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`[master_foods] ${res.status} ${JSON.stringify(data)}`);
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

function dedupeFoods(rows) {
  const seen = new Set();
  return rows
    .filter((food) => Number(food.kcal_per_100g) > 0)
    .filter((food) => {
      const key = normalize(food.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildCatalog(foods) {
  const pick = (...patterns) => {
    const found = foods.find((food) => patterns.some((pattern) => pattern.test(normalize(food.name))));
    if (!found) {
      throw new Error(`Alimento não encontrado para padrões: ${patterns.map((pattern) => pattern.source).join(", ")}`);
    }
    return found;
  };

  return {
    proteins: {
      whey: pick(/^whey$/, /whey protein concentrado/, /whey protein \(zero lactose\)/),
      chicken: pick(/^peito de frango grelhado$/, /^frango peito grelhado$/, /^frango \(peito\)$/, /^file de frango grelhado$/, /^file de frango cozido$/),
      beef: pick(/^carne bovina patinho grelhado$/, /^patinho grelhado$/, /^carne bovina, patinho, sem gordura, grelhada$/, /^patinho grelhado sem gordura$/),
      tuna: pick(/^atum, fresco, cru$/, /^atum em lata oleo$/, /^atum em conserva \(oleo\)$/, /^atum, conserva em oleo$/),
      sardine: pick(/^sardinha, assada$/, /^sardinha, inteira, crua$/, /^sardinha, frita$/),
      egg: pick(/^ovo inteiro cozido$/, /^ovo de galinha cozido$/, /^ovo de galinha inteiro cozido$/),
      eggWhite: pick(/^clara de ovo cozida$/, /^clara de ovo$/),
      yogurtGreek: pick(/^iogurte grego$/, /^iogurte grego - integral$/, /^iogurte grego - desnatado$/),
      yogurtNatural: pick(/^iogurte integral natural$/, /^iogurte natural sem lactose$/),
      ricotta: pick(/^ricota$/, /^queijo, ricota$/, /^ricota - integral$/),
      tofu: pick(/^soja, queijo \(tofu\)$/, /^tofu firme$/, /^tofu firme - grelhado$/, /^tofu firme - assado$/),
      salmon: pick(/^salmao, sem pele, fresco, grelhado$/, /^salmao, sem pele, fresco, cru$/, /^salmao, file, com pele, fresco, grelhado$/),
      milk: pick(/^leite integral$/, /^leite, de vaca, integral, po$/, /^leite, de vaca, desnatado, po$/),
    },
    carbs: {
      bread: pick(/^pao de forma integral$/, /^pao, aveia, forma$/),
      tapioca: pick(/^goma de tapioca$/, /^tapioca$/),
      oats: pick(/^aveia em flocos$/, /^aveia, flocos, crua$/),
      couscous: pick(/^cuscuz milho cozido$/, /^cuscuz cozido$/, /^cuscuz$/),
      rice: pick(/^arroz, tipo 1, cozido$/, /^arroz branco cozido$/, /^arroz, tipo 2, cozido$/),
      brownRice: pick(/^arroz, integral, cozido$/),
      pasta: pick(/^macarrao integral cozido$/, /^macarrao cozido$/),
      sweetPotato: pick(/^batata doce cozida sem sal$/),
      mandioquinha: pick(/^mandioquinha cozida$/, /^mandioquinha$/, /^batata, baroa, cozida$/),
      yam: pick(/^inhame cozido$/),
      granola: pick(/^granola$/),
    },
    fruits: {
      banana: pick(/^banana prata$/, /^banana$/),
      papaya: pick(/^mamao$/, /^mamao, formosa, cru$/, /^mamao, papaia, cru$/),
      apple: pick(/^maca$/, /^maca fuji$/, /^maca vermelha$/, /^maca crua com casca$/),
      strawberry: pick(/^morango$/, /^morango, cru$/),
      mango: pick(/^manga, haden, crua$/, /^manga, palmer, crua$/, /^manga, tommy atkins, crua$/),
      melon: pick(/^melao$/, /^melao, cru$/),
      pineapple: pick(/^abacaxi$/, /^abacaxi, cru$/, /^abacaxi, cru - em cubos$/),
      pear: pick(/^pera$/, /^pera, park, crua$/, /^pera, williams, crua$/),
      watermelon: pick(/^melancia$/, /^melancia, crua$/),
      avocado: pick(/^abacate$/, /^abacate, cru$/),
    },
    fats: {
      oliveOil: pick(/^azeite de oliva$/, /^azeite, de oliva, extra virgem$/),
      chia: pick(/^chia em graos$/),
      nutsMix: pick(/^mix de castanhas$/, /^castanha do para sem sal$/, /^castanha de caju torrada sem sal$/),
      peanut: pick(/^amendoim torrado sem sal$/, /^amendoim torrado$/),
      brazilNut: pick(/^castanha do para sem sal$/, /^castanha-do-brasil, crua$/),
      cashew: pick(/^castanha de caju torrada sem sal$/, /^castanha-de-caju, torrada, salgada$/),
    },
    legumes: {
      beans: pick(/^feijao carioca$/, /^feijao carioca - cozido$/, /^feijao, carioca, cozido - cozido$/),
      lentils: pick(/^lentilha, cozida$/, /^lentilha$/, /^lentilha - cozido$/),
      peas: pick(/^ervilha congelada$/, /^ervilha, enlatada, drenada$/, /^ervilha, em vagem$/),
    },
    veggies: {
      lettuce: pick(/^alface crespa$/, /^alface, crespa, crua$/, /^alface$/),
      tomato: pick(/^tomate cru$/, /^tomate$/),
      cucumber: pick(/^pepino$/, /^pepino, cru$/),
      kale: pick(/^couve crua$/, /^couve, manteiga, crua$/, /^couve cozida$/),
      zucchini: pick(/^abobrinha assada$/, /^abobrinha, italiana, cozida$/, /^abobrinha, italiana, refogada$/),
      carrot: pick(/^cenoura, cozida$/, /^cenoura, crua$/),
      spinach: pick(/^espinafre, nova zelandia, cru$/, /^espinafre, nova zelandia, refogado$/),
      beet: pick(/^beterraba, cozida$/, /^beterraba, crua$/),
      cabbage: pick(/^repolho roxo$/, /^repolho, branco, cru$/),
      greenBeans: pick(/^vagem cozida$/),
    },
  };
}

function proteinQty(food) {
  const name = normalize(food.name);
  if (name.includes("whey")) return 35;
  if (name.includes("iogurte")) return 180;
  if (name.includes("ricota")) return 100;
  if (name.includes("clara")) return 120;
  if (name.includes("ovo")) return 110;
  if (name.includes("tofu")) return 140;
  return 140;
}

function foodPortion(food, quantity, role, unit = "g", notes = null) {
  return {
    food_name: food.name,
    quantity,
    unit,
    household_measure: null,
    measure_amount: null,
    kcal_per_100g: Number(food.kcal_per_100g) || 0,
    protein_per_100g: Number(food.protein_per_100g) || 0,
    carbs_per_100g: Number(food.carbs_per_100g) || 0,
    fat_per_100g: Number(food.fat_per_100g) || 0,
    food_group: GROUP_LABELS[role],
    role,
    notes,
  };
}

function meal(key, foods, notes = "") {
  return {
    meal_name: MEAL_META[key].name,
    time_suggestion: MEAL_META[key].time,
    foods,
    notes: notes || null,
  };
}

function computeTotals(meals) {
  return meals.reduce(
    (acc, currentMeal) => {
      for (const food of currentMeal.foods) {
        const factor = Number(food.quantity || 0) / 100;
        acc.kcal += factor * Number(food.kcal_per_100g || 0);
        acc.protein += factor * Number(food.protein_per_100g || 0);
        acc.carbs += factor * Number(food.carbs_per_100g || 0);
        acc.fat += factor * Number(food.fat_per_100g || 0);
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function cloneMeals(meals) {
  return meals.map((entry) => ({
    ...entry,
    foods: entry.foods.map((food) => ({ ...food })),
  }));
}

function adjustTemplate(meals, targetKcal, goalKey, indexSeed) {
  const plan = cloneMeals(meals);
  const increasePriority = {
    emagrecimento: ["protein", "carb", "fruit", "fat"],
    hipertrofia: ["carb", "protein", "fruit", "fat"],
    ganho_peso: ["carb", "fat", "protein", "fruit"],
  }[goalKey];
  const decreasePriority = {
    emagrecimento: ["fat", "carb", "fruit", "protein"],
    hipertrofia: ["fat", "carb", "fruit", "protein"],
    ganho_peso: ["fat", "carb", "fruit", "protein"],
  }[goalKey];

  let guard = 0;
  while (guard < 320) {
    guard += 1;
    const totals = computeTotals(plan);
    const diff = targetKcal - totals.kcal;
    if (Math.abs(diff) <= 35) break;
    const priorities = diff > 0 ? increasePriority : decreasePriority;
    const stepDirection = diff > 0 ? 1 : -1;
    let changed = false;

    for (const role of priorities) {
      const candidates = plan.flatMap((entry, mealIndex) =>
        entry.foods
          .map((food, foodIndex) => ({ food, mealIndex, foodIndex }))
          .filter(({ food }) => food.role === role),
      );
      if (candidates.length === 0) continue;
      const selected = candidates[(guard + indexSeed) % candidates.length];
      const minQty = role === "fat" ? 5 : role === "veggie" ? 40 : role === "drink" ? 100 : 20;
      const step = ROLE_STEPS[role] || 10;
      const nextQty = Math.max(minQty, Number(selected.food.quantity) + step * stepDirection);
      if (nextQty === selected.food.quantity) continue;
      plan[selected.mealIndex].foods[selected.foodIndex].quantity = nextQty;
      changed = true;
      break;
    }

    if (!changed) break;
  }

  return plan;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function templateDescription(goalLabel, targetKcal, totals) {
  return `${goalLabel} com distribuicao diaria proxima de ${targetKcal} kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: ${round1(totals.protein)}g de proteina, ${round1(totals.carbs)}g de carboidratos e ${round1(totals.fat)}g de gorduras.`;
}

function buildEmagrecimento(catalog, variant) {
  const breakfastCarbs = [catalog.carbs.oats, catalog.carbs.tapioca, catalog.carbs.bread, catalog.carbs.couscous];
  const breakfastProteins = [catalog.proteins.eggWhite, catalog.proteins.yogurtGreek, catalog.proteins.whey, catalog.proteins.ricotta];
  const fruits = [catalog.fruits.papaya, catalog.fruits.apple, catalog.fruits.strawberry, catalog.fruits.melon, catalog.fruits.pineapple, catalog.fruits.pear];
  const lunchCarbs = [catalog.carbs.brownRice, catalog.carbs.sweetPotato, catalog.carbs.mandioquinha, catalog.carbs.yam, catalog.carbs.rice];
  const lunchProteins = [catalog.proteins.chicken, catalog.proteins.tuna, catalog.proteins.beef, catalog.proteins.salmon, catalog.proteins.tofu];
  const legumes = [catalog.legumes.beans, catalog.legumes.lentils, catalog.legumes.peas];
  const veggiesA = [catalog.veggies.lettuce, catalog.veggies.kale, catalog.veggies.spinach, catalog.veggies.cabbage];
  const veggiesB = [catalog.veggies.tomato, catalog.veggies.cucumber, catalog.veggies.zucchini, catalog.veggies.carrot, catalog.veggies.beet, catalog.veggies.greenBeans];
  const snackProteins = [catalog.proteins.yogurtNatural, catalog.proteins.whey, catalog.proteins.ricotta];
  const dinnerProteins = [catalog.proteins.chicken, catalog.proteins.salmon, catalog.proteins.egg, catalog.proteins.tofu];

  const bc = breakfastCarbs[variant % breakfastCarbs.length];
  const bp = breakfastProteins[(variant + 1) % breakfastProteins.length];
  const fruitA = fruits[variant % fruits.length];
  const lc = lunchCarbs[(variant + 1) % lunchCarbs.length];
  const lp = lunchProteins[(variant + 2) % lunchProteins.length];
  const legume = legumes[variant % legumes.length];
  const veg1 = veggiesA[variant % veggiesA.length];
  const veg2 = veggiesB[(variant + 1) % veggiesB.length];
  const snackProtein = snackProteins[(variant + 2) % snackProteins.length];
  const snackFruit = fruits[(variant + 3) % fruits.length];
  const dp = dinnerProteins[(variant + 3) % dinnerProteins.length];
  const dc = lunchCarbs[(variant + 3) % lunchCarbs.length];
  const veg3 = veggiesA[(variant + 2) % veggiesA.length];
  const veg4 = veggiesB[(variant + 3) % veggiesB.length];

  return [
    meal("breakfast", [
      foodPortion(bc, [35, 55, 60, 80][variant % 4], "carb"),
      foodPortion(bp, proteinQty(bp), normalize(bp.name).includes("iogurte") ? "dairy" : "protein"),
      foodPortion(fruitA, [90, 100, 120, 130][variant % 4], "fruit"),
    ]),
    meal("snackAm", [
      foodPortion(snackProtein, normalize(snackProtein.name).includes("whey") ? 30 : proteinQty(snackProtein), normalize(snackProtein.name).includes("iogurte") ? "dairy" : "protein"),
      foodPortion(catalog.fats.chia, 10, "fat"),
      foodPortion(fruits[(variant + 4) % fruits.length], 80, "fruit"),
    ]),
    meal("lunch", [
      foodPortion(lc, [80, 90, 100, 110, 120][variant % 5], "carb"),
      foodPortion(lp, [100, 110, 120, 130][variant % 4], "protein"),
      foodPortion(legume, [50, 60, 70][variant % 3], "legume"),
      foodPortion(veg1, 60, "veggie"),
      foodPortion(veg2, 70, "veggie"),
      foodPortion(catalog.fats.oliveOil, 6, "fat"),
    ]),
    meal("snackPm", [
      foodPortion(snackFruit, [100, 120, 130][variant % 3], "fruit"),
      foodPortion(snackProtein, normalize(snackProtein.name).includes("whey") ? 25 : Math.max(90, proteinQty(snackProtein) - 20), normalize(snackProtein.name).includes("iogurte") ? "dairy" : "protein"),
      foodPortion(catalog.fats.nutsMix, 10, "fat"),
    ]),
    meal("dinner", [
      foodPortion(dp, [90, 100, 120, 130][variant % 4], "protein"),
      foodPortion(dc, [50, 60, 70, 80][variant % 4], "carb"),
      foodPortion(veg3, 70, "veggie"),
      foodPortion(veg4, 80, "veggie"),
      foodPortion(catalog.fats.oliveOil, 5, "fat"),
    ]),
  ];
}

function buildHipertrofia(catalog, variant) {
  const breakfastCarbs = [catalog.carbs.oats, catalog.carbs.tapioca, catalog.carbs.bread, catalog.carbs.couscous, catalog.carbs.granola];
  const breakfastProteins = [catalog.proteins.egg, catalog.proteins.whey, catalog.proteins.yogurtGreek, catalog.proteins.ricotta];
  const fruits = [catalog.fruits.banana, catalog.fruits.papaya, catalog.fruits.mango, catalog.fruits.pineapple, catalog.fruits.apple, catalog.fruits.watermelon];
  const lunchCarbs = [catalog.carbs.rice, catalog.carbs.brownRice, catalog.carbs.pasta, catalog.carbs.sweetPotato, catalog.carbs.yam, catalog.carbs.mandioquinha];
  const lunchProteins = [catalog.proteins.chicken, catalog.proteins.beef, catalog.proteins.salmon, catalog.proteins.tuna, catalog.proteins.sardine];
  const legumes = [catalog.legumes.beans, catalog.legumes.lentils, catalog.legumes.peas];
  const veggiesA = [catalog.veggies.lettuce, catalog.veggies.kale, catalog.veggies.spinach, catalog.veggies.cabbage];
  const veggiesB = [catalog.veggies.tomato, catalog.veggies.cucumber, catalog.veggies.zucchini, catalog.veggies.carrot, catalog.veggies.greenBeans, catalog.veggies.beet];
  const snackProteins = [catalog.proteins.whey, catalog.proteins.yogurtGreek, catalog.proteins.ricotta, catalog.proteins.egg];

  const bc = breakfastCarbs[variant % breakfastCarbs.length];
  const bp = breakfastProteins[(variant + 1) % breakfastProteins.length];
  const fruitA = fruits[variant % fruits.length];
  const lc = lunchCarbs[(variant + 2) % lunchCarbs.length];
  const lp = lunchProteins[(variant + 1) % lunchProteins.length];
  const legume = legumes[variant % legumes.length];
  const veg1 = veggiesA[variant % veggiesA.length];
  const veg2 = veggiesB[(variant + 2) % veggiesB.length];
  const snackProtein = snackProteins[(variant + 2) % snackProteins.length];
  const snackCarb = breakfastCarbs[(variant + 3) % breakfastCarbs.length];
  const dinnerCarb = lunchCarbs[(variant + 4) % lunchCarbs.length];
  const dinnerProtein = lunchProteins[(variant + 3) % lunchProteins.length];

  return [
    meal("breakfast", [
      foodPortion(bc, [60, 70, 80, 90, 65][variant % 5], "carb"),
      foodPortion(bp, normalize(bp.name).includes("whey") ? 35 : proteinQty(bp), normalize(bp.name).includes("iogurte") ? "dairy" : "protein"),
      foodPortion(fruitA, [110, 130, 140, 150][variant % 4], "fruit"),
      foodPortion(catalog.fats.chia, 10, "fat"),
    ]),
    meal("snackAm", [
      foodPortion(snackCarb, [50, 60, 70, 80][variant % 4], "carb"),
      foodPortion(snackProtein, normalize(snackProtein.name).includes("whey") ? 30 : Math.max(90, proteinQty(snackProtein) - 10), normalize(snackProtein.name).includes("iogurte") ? "dairy" : "protein"),
      foodPortion(fruits[(variant + 2) % fruits.length], 100, "fruit"),
    ]),
    meal("lunch", [
      foodPortion(lc, [120, 140, 160, 180, 200, 150][variant % 6], "carb"),
      foodPortion(lp, [130, 150, 160, 180][variant % 4], "protein"),
      foodPortion(legume, [70, 80, 90][variant % 3], "legume"),
      foodPortion(veg1, 70, "veggie"),
      foodPortion(veg2, 80, "veggie"),
      foodPortion(catalog.fats.oliveOil, 8, "fat"),
    ]),
    meal("snackPm", [
      foodPortion(catalog.fruits.banana, 130, "fruit"),
      foodPortion(catalog.proteins.whey, 35, "protein"),
      foodPortion(catalog.carbs.granola, 35, "carb"),
      foodPortion(catalog.fats.nutsMix, 15, "fat"),
    ]),
    meal("dinner", [
      foodPortion(dinnerCarb, [120, 140, 150, 170][variant % 4], "carb"),
      foodPortion(dinnerProtein, [130, 150, 170][variant % 3], "protein"),
      foodPortion(legumes[(variant + 1) % legumes.length], 60, "legume"),
      foodPortion(veggiesA[(variant + 1) % veggiesA.length], 70, "veggie"),
      foodPortion(veggiesB[(variant + 4) % veggiesB.length], 80, "veggie"),
      foodPortion(catalog.fats.oliveOil, 8, "fat"),
    ]),
    meal("supper", [
      foodPortion(catalog.proteins.yogurtGreek, 180, "dairy"),
      foodPortion(catalog.carbs.oats, 30, "carb"),
      foodPortion(catalog.fats.chia, 8, "fat"),
      foodPortion(fruits[(variant + 5) % fruits.length], 90, "fruit"),
    ]),
  ];
}

function buildGanhoPeso(catalog, variant) {
  const energyCarbs = [catalog.carbs.granola, catalog.carbs.oats, catalog.carbs.bread, catalog.carbs.tapioca, catalog.carbs.couscous, catalog.carbs.pasta];
  const breakfastProteins = [catalog.proteins.whey, catalog.proteins.egg, catalog.proteins.yogurtGreek, catalog.proteins.ricotta];
  const fruits = [catalog.fruits.banana, catalog.fruits.avocado, catalog.fruits.mango, catalog.fruits.papaya, catalog.fruits.melon, catalog.fruits.pineapple];
  const lunchCarbs = [catalog.carbs.rice, catalog.carbs.pasta, catalog.carbs.brownRice, catalog.carbs.sweetPotato, catalog.carbs.yam, catalog.carbs.mandioquinha];
  const lunchProteins = [catalog.proteins.beef, catalog.proteins.chicken, catalog.proteins.salmon, catalog.proteins.tuna, catalog.proteins.sardine];
  const legumes = [catalog.legumes.beans, catalog.legumes.lentils, catalog.legumes.peas];
  const veggiesA = [catalog.veggies.lettuce, catalog.veggies.kale, catalog.veggies.spinach, catalog.veggies.cabbage];
  const veggiesB = [catalog.veggies.tomato, catalog.veggies.zucchini, catalog.veggies.carrot, catalog.veggies.beet, catalog.veggies.greenBeans];
  const fats = [catalog.fats.oliveOil, catalog.fats.nutsMix, catalog.fats.peanut, catalog.fats.brazilNut, catalog.fats.cashew];

  const breakfastProtein = breakfastProteins[(variant + 1) % breakfastProteins.length];

  return [
    meal("breakfast", [
      foodPortion(energyCarbs[variant % energyCarbs.length], [70, 80, 90, 100, 110, 95][variant % 6], "carb"),
      foodPortion(breakfastProtein, normalize(breakfastProtein.name).includes("whey") ? 40 : proteinQty(breakfastProtein), normalize(breakfastProtein.name).includes("iogurte") ? "dairy" : "protein"),
      foodPortion(fruits[variant % fruits.length], [120, 140, 160][variant % 3], fruits[variant % fruits.length] === catalog.fruits.avocado ? "fat" : "fruit"),
      foodPortion(fats[(variant + 2) % fats.length], 15, "fat"),
    ]),
    meal("snackAm", [
      foodPortion(catalog.proteins.milk, 250, "dairy", "ml"),
      foodPortion(catalog.proteins.whey, 35, "protein"),
      foodPortion(catalog.fruits.banana, 130, "fruit"),
      foodPortion(catalog.carbs.granola, 45, "carb"),
    ]),
    meal("lunch", [
      foodPortion(lunchCarbs[(variant + 2) % lunchCarbs.length], [160, 180, 200, 220, 240, 190][variant % 6], "carb"),
      foodPortion(lunchProteins[(variant + 1) % lunchProteins.length], [150, 170, 190, 210][variant % 4], "protein"),
      foodPortion(legumes[variant % legumes.length], [90, 100, 110][variant % 3], "legume"),
      foodPortion(veggiesA[variant % veggiesA.length], 70, "veggie"),
      foodPortion(veggiesB[(variant + 3) % veggiesB.length], 80, "veggie"),
      foodPortion(catalog.fats.oliveOil, 10, "fat"),
    ]),
    meal("snackPm", [
      foodPortion(catalog.proteins.yogurtGreek, 180, "dairy"),
      foodPortion(catalog.fruits.mango, 120, "fruit"),
      foodPortion(catalog.fats.nutsMix, 20, "fat"),
      foodPortion(catalog.carbs.oats, 35, "carb"),
    ]),
    meal("dinner", [
      foodPortion(lunchCarbs[(variant + 4) % lunchCarbs.length], [140, 160, 180, 200][variant % 4], "carb"),
      foodPortion(lunchProteins[(variant + 3) % lunchProteins.length], [140, 160, 180][variant % 3], "protein"),
      foodPortion(legumes[(variant + 1) % legumes.length], 80, "legume"),
      foodPortion(veggiesA[(variant + 1) % veggiesA.length], 70, "veggie"),
      foodPortion(veggiesB[(variant + 1) % veggiesB.length], 80, "veggie"),
      foodPortion(catalog.fats.oliveOil, 10, "fat"),
    ]),
    meal("supper", [
      foodPortion(catalog.proteins.ricotta, 120, "protein"),
      foodPortion(catalog.carbs.bread, 60, "carb"),
      foodPortion(catalog.fats.peanut, 18, "fat"),
      foodPortion(catalog.fruits.pineapple, 100, "fruit"),
    ]),
  ];
}

function buildTemplates(catalog) {
  const templates = [];
  let globalIndex = 1;
  for (const goal of GOALS) {
    for (let i = 0; i < goal.count; i += 1) {
      const targetKcal = goal.startKcal + i * goal.step;
      const baseMeals =
        goal.key === "emagrecimento"
          ? buildEmagrecimento(catalog, i)
          : goal.key === "hipertrofia"
            ? buildHipertrofia(catalog, i)
            : buildGanhoPeso(catalog, i);
      const adjustedMeals = adjustTemplate(baseMeals, targetKcal, goal.key, i);
      const totals = computeTotals(adjustedMeals);
      templates.push({
        name: `${GENERATED_PREFIX}${goal.label} ${Math.round(totals.kcal)} kcal - M${String(globalIndex).padStart(3, "0")}`,
        description: templateDescription(goal.label, targetKcal, totals),
        strategy: goal.key,
        total_kcal: round1(totals.kcal),
        protein_g: round1(totals.protein),
        carbs_g: round1(totals.carbs),
        fat_g: round1(totals.fat),
        is_active: true,
        meals: adjustedMeals,
      });
      globalIndex += 1;
    }
  }
  return templates;
}

function toSql(templates) {
  const lines = [];
  lines.push("-- Seed gerado automaticamente para modelos variados de dieta.");
  lines.push("-- Baseado exclusivamente em alimentos presentes em master_foods.");
  lines.push(`-- Total de templates: ${templates.length}`);
  lines.push("");
  lines.push("BEGIN;");
  lines.push("");
  lines.push(`DELETE FROM diet_templates WHERE name LIKE '${escapeSql(GENERATED_PREFIX)}%';`);
  lines.push("");

  for (const template of templates) {
    lines.push("INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)");
    lines.push("VALUES (");
    lines.push(`  '${escapeSql(template.name)}',`);
    lines.push(`  '${escapeSql(template.description)}',`);
    lines.push(`  '${escapeSql(template.strategy)}',`);
    lines.push(`  ${template.total_kcal}, ${template.protein_g}, ${template.carbs_g}, ${template.fat_g}, TRUE`);
    lines.push(");");
    lines.push("");
    lines.push("WITH tmpl AS (");
    lines.push(`  SELECT id FROM diet_templates WHERE name = '${escapeSql(template.name)}' ORDER BY id DESC LIMIT 1`);
    lines.push(")");
    lines.push("INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)");
    lines.push("SELECT tmpl.id, meal_name, time_suggestion, order_index, notes");
    lines.push("FROM tmpl, (VALUES");
    lines.push(
      template.meals
        .map(
          (entry, index) =>
            `  ('${escapeSql(entry.meal_name)}', '${escapeSql(entry.time_suggestion)}', ${index}, ${entry.notes ? `'${escapeSql(entry.notes)}'` : "NULL"})`,
        )
        .join(",\n"),
    );
    lines.push(") AS m(meal_name, time_suggestion, order_index, notes);");
    lines.push("");

    template.meals.forEach((entry, mealIndex) => {
      lines.push("WITH meal_ref AS (");
      lines.push("  SELECT dtm.id");
      lines.push("  FROM diet_template_meals dtm");
      lines.push("  JOIN diet_templates dt ON dt.id = dtm.template_id");
      lines.push(`  WHERE dt.name = '${escapeSql(template.name)}' AND dtm.order_index = ${mealIndex}`);
      lines.push("  ORDER BY dtm.id DESC");
      lines.push("  LIMIT 1");
      lines.push(")");
      lines.push("INSERT INTO diet_template_foods (");
      lines.push("  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,");
      lines.push("  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index");
      lines.push(")");
      lines.push("VALUES");
      lines.push(
        entry.foods
          .map(
            (food, foodIndex) =>
              `  ((SELECT id FROM meal_ref), '${escapeSql(food.food_name)}', ${round1(food.quantity)}, '${escapeSql(food.unit)}', NULL, NULL, ${round1(food.kcal_per_100g)}, ${round1(food.protein_per_100g)}, ${round1(food.carbs_per_100g)}, ${round1(food.fat_per_100g)}, '${escapeSql(food.food_group)}', ${food.notes ? `'${escapeSql(food.notes)}'` : "NULL"}, ${foodIndex})`,
          )
          .join(",\n"),
      );
      lines.push(";");
      lines.push("");
    });
  }

  lines.push("COMMIT;");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function pushTemplates(env, templates) {
  const existingRows = await rest(env, "diet_templates", {
    method: "GET",
    query: `select=id,name&name=like.${encodeURIComponent(`${GENERATED_PREFIX}%`)}&order=id.asc`,
  });
  const existingNames = new Set((existingRows ?? []).map((row) => row.name));
  const pendingTemplates = templates.filter((template) => !existingNames.has(template.name));

  for (const template of pendingTemplates) {
    const createdRows = await rest(env, "diet_templates", {
      method: "POST",
      prefer: "return=representation",
      body: [{
        name: template.name,
        description: template.description,
        strategy: template.strategy,
        total_kcal: template.total_kcal,
        protein_g: template.protein_g,
        carbs_g: template.carbs_g,
        fat_g: template.fat_g,
        is_active: true,
      }],
    });
    const [created] = createdRows;

    const createdMeals = await rest(env, "diet_template_meals", {
      method: "POST",
      prefer: "return=representation",
      body: template.meals.map((entry, orderIndex) => ({
        template_id: created.id,
        meal_name: entry.meal_name,
        time_suggestion: entry.time_suggestion,
        order_index: orderIndex,
        notes: entry.notes,
      })),
    });

    const mealByOrder = new Map(createdMeals.map((mealRow) => [mealRow.order_index, mealRow.id]));
    for (let orderIndex = 0; orderIndex < template.meals.length; orderIndex += 1) {
      const entry = template.meals[orderIndex];
      const templateMealId = mealByOrder.get(orderIndex);
      if (!templateMealId) throw new Error(`Refeição não retornada no insert: ${template.name} / ${orderIndex}`);
      await rest(env, "diet_template_foods", {
        method: "POST",
        body: entry.foods.map((food, foodIndex) => ({
          template_meal_id: templateMealId,
          food_name: food.food_name,
          quantity: round1(food.quantity),
          unit: food.unit,
          household_measure: null,
          measure_amount: null,
          kcal_per_100g: round1(food.kcal_per_100g),
          protein_per_100g: round1(food.protein_per_100g),
          carbs_per_100g: round1(food.carbs_per_100g),
          fat_per_100g: round1(food.fat_per_100g),
          food_group: food.food_group,
          notes: food.notes,
          order_index: foodIndex,
        })),
      });
    }
  }

  return {
    existingCount: existingNames.size,
    insertedNow: pendingTemplates.length,
  };
}

async function main() {
  const env = parseEnv();
  const foods = dedupeFoods(await fetchFoodsPaged(env));
  const catalog = buildCatalog(foods);
  const templates = buildTemplates(catalog);
  if (templates.length !== TEMPLATE_COUNT) {
    throw new Error(`Quantidade inesperada de templates: ${templates.length}`);
  }

  fs.writeFileSync(OUTPUT_SQL, toSql(templates), "utf8");
  const pushSummary = await pushTemplates(env, templates);

  const inserted = await rest(env, "diet_templates", {
    method: "GET",
    query: `select=id,name,strategy,total_kcal&name=like.${encodeURIComponent(`${GENERATED_PREFIX}%`)}&order=id.asc`,
  });

  console.log(JSON.stringify({
    generatedSql: path.relative(process.cwd(), OUTPUT_SQL),
    totalTemplates: templates.length,
    existingBefore: pushSummary.existingCount,
    insertedNow: pushSummary.insertedNow,
    insertedTemplates: Array.isArray(inserted) ? inserted.length : 0,
    sample: Array.isArray(inserted) ? inserted.slice(0, 5) : [],
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

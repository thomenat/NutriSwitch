import type { Ingredient, Macros, Meal, PreserveMetric, Recipe } from "./types";

export function roundGrams(grams: number): number {
  if (!Number.isFinite(grams)) return 0;
  return Math.max(0, Math.round(grams));
}

export function scaleMacros(macrosPer100g: Macros, grams: number): Macros {
  const factor = grams / 100;
  return {
    calories: macrosPer100g.calories * factor,
    protein: macrosPer100g.protein * factor,
    carbs: macrosPer100g.carbs * factor,
    fat: macrosPer100g.fat * factor,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

export function zeroMacros(): Macros {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function mealTotals(meal: Meal, ingredientsById: Map<string, Ingredient>): Macros {
  return meal.recipes.reduce((mealAcc, recipe) => {
    const recipeTotals = recipeTotalsFor(recipe, ingredientsById);
    return addMacros(mealAcc, recipeTotals);
  }, zeroMacros());
}

export function recipeTotalsFor(
  recipe: Recipe,
  ingredientsById: Map<string, Ingredient>,
): Macros {
  return recipe.items.reduce((acc, item) => {
    const ingredient = ingredientsById.get(item.ingredientId);
    if (!ingredient) return acc;
    return addMacros(acc, scaleMacros(ingredient.macrosPer100g, item.grams));
  }, zeroMacros());
}

export function computeSwapGrams(input: {
  fromIngredient: Ingredient;
  fromGrams: number;
  toIngredient: Ingredient;
  preserve: PreserveMetric;
}): number {
  const { fromIngredient, fromGrams, toIngredient, preserve } = input;
  const fromPerGram = fromIngredient.macrosPer100g[preserve] / 100;
  const toPerGram = toIngredient.macrosPer100g[preserve] / 100;

  // Avoid NaN/Infinity and "preserve something that doesn't exist".
  if (!Number.isFinite(fromPerGram) || !Number.isFinite(toPerGram)) return 0;
  if (fromPerGram <= 0 || toPerGram <= 0) return 0;

  const targetAmount = fromGrams * fromPerGram;
  return targetAmount / toPerGram;
}

export function swapMealItem(input: {
  meal: Meal;
  recipeIndex: number;
  itemIndex: number;
  toIngredientId: string;
  preserve: PreserveMetric;
  ingredientsById: Map<string, Ingredient>;
}): Meal {
  const { meal, recipeIndex, itemIndex, toIngredientId, preserve, ingredientsById } =
    input;
  const recipe = meal.recipes[recipeIndex];
  const fromItem = recipe?.items[itemIndex];
  if (!fromItem) return meal;

  const fromIngredient = ingredientsById.get(fromItem.ingredientId);
  const toIngredient = ingredientsById.get(toIngredientId);
  if (!fromIngredient || !toIngredient) return meal;

  const newGrams = roundGrams(
    computeSwapGrams({
      fromIngredient,
      fromGrams: fromItem.grams,
      toIngredient,
      preserve,
    }),
  );

  const nextRecipes = meal.recipes.map((r, rIdx) => {
    if (rIdx !== recipeIndex) return r;
    const nextItems = r.items.map((it, idx) =>
      idx === itemIndex ? { ingredientId: toIngredientId, grams: newGrams } : it,
    );
    return { ...r, items: nextItems };
  });

  return { ...meal, recipes: nextRecipes };
}


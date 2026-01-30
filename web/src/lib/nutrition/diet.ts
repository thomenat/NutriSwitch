import type { DietaryRestriction, Ingredient, Recipe } from "./types";

export const DIETARY_RESTRICTIONS: Array<{
  id: DietaryRestriction;
  label: string;
}> = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "glutenFree", label: "Gluten-free" },
  { id: "dairyFree", label: "Dairy-free" },
];

export function ingredientSatisfiesAll(
  ingredient: Ingredient,
  restrictions: DietaryRestriction[],
): boolean {
  return restrictions.every((r) => Boolean(ingredient.diet?.[r]));
}

export function recipeSatisfiesAll(
  recipe: Recipe,
  ingredientsById: Map<string, Ingredient>,
  restrictions: DietaryRestriction[],
): boolean {
  if (restrictions.length === 0) return true;
  return recipe.items.every((item) => {
    const ing = ingredientsById.get(item.ingredientId);
    if (!ing) return false;
    return ingredientSatisfiesAll(ing, restrictions);
  });
}


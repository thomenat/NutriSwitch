export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type PreserveMetric = keyof Macros;

export type DietaryRestriction = "vegan" | "vegetarian" | "glutenFree" | "dairyFree";

export type DietFlags = Record<DietaryRestriction, boolean>;

export type Ingredient = {
  id: string;
  name: string;
  /**
   * All nutrition values are based on 100g servings.
   * Later, an API provider can populate these from a reliable database.
   */
  macrosPer100g: Macros;
  diet: DietFlags;
};

export type MealIngredient = {
  ingredientId: Ingredient["id"];
  grams: number;
};

export type Recipe = {
  id: string;
  name: string;
  imageSrc: string;
  imageAlt: string;
  servesText?: string;
  totalTimeMinutes?: number;
  items: MealIngredient[];
};

export type Meal = {
  id: string;
  name: string;
  recipes: Recipe[];
};

export type MealPlanDay = {
  id: string;
  label: string;
  meals: Meal[];
};

export type MealPlan = {
  id: string;
  name: string;
  days: MealPlanDay[];
};


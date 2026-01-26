import type { Ingredient } from "@/lib/nutrition/types";

export const INGREDIENTS: Ingredient[] = [
  {
    id: "chicken-breast-cooked",
    name: "Chicken breast (cooked)",
    macrosPer100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  },
  {
    id: "salmon-cooked",
    name: "Salmon (cooked)",
    macrosPer100g: { calories: 208, protein: 20, carbs: 0, fat: 13 },
  },
  {
    id: "tofu-firm",
    name: "Tofu (firm)",
    macrosPer100g: { calories: 144, protein: 17, carbs: 3, fat: 9 },
  },
  {
    id: "rice-white-cooked",
    name: "White rice (cooked)",
    macrosPer100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  },
  {
    id: "sweet-potato-baked",
    name: "Sweet potato (baked)",
    macrosPer100g: { calories: 90, protein: 2, carbs: 20.7, fat: 0.1 },
  },
  {
    id: "broccoli-steamed",
    name: "Broccoli (steamed)",
    macrosPer100g: { calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4 },
  },
  {
    id: "olive-oil",
    name: "Olive oil",
    macrosPer100g: { calories: 884, protein: 0, carbs: 0, fat: 100 },
  },
  {
    id: "greek-yogurt-0",
    name: "Greek yogurt (0%)",
    macrosPer100g: { calories: 59, protein: 10.3, carbs: 3.6, fat: 0.4 },
  },
  {
    id: "banana",
    name: "Banana",
    macrosPer100g: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  },
  {
    id: "oats",
    name: "Oats",
    macrosPer100g: { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  },
];

export const INGREDIENTS_BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));


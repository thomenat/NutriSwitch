import type { MealPlan } from "@/lib/nutrition/types";

export const DEMO_PLAN: MealPlan = {
  id: "demo-plan-1",
  name: "Demo plan",
  days: [
    {
      id: "day-1",
      label: "Day 1",
      meals: [
        {
          id: "breakfast",
          name: "Breakfast",
          recipes: [
            {
              id: "breakfast-recipe-1",
              name: "Overnight oats",
              items: [
                { ingredientId: "oats", grams: 60 },
                { ingredientId: "greek-yogurt-0", grams: 200 },
              ],
            },
            {
              id: "breakfast-recipe-2",
              name: "Banana bowl",
              items: [
                { ingredientId: "banana", grams: 120 },
                { ingredientId: "greek-yogurt-0", grams: 100 },
              ],
            },
            {
              id: "breakfast-recipe-3",
              name: "Simple carbs",
              items: [
                { ingredientId: "oats", grams: 30 },
                { ingredientId: "banana", grams: 80 },
              ],
            },
          ],
        },
        {
          id: "lunch",
          name: "Lunch",
          recipes: [
            {
              id: "lunch-recipe-1",
              name: "Protein plate",
              items: [{ ingredientId: "chicken-breast-cooked", grams: 160 }],
            },
            {
              id: "lunch-recipe-2",
              name: "Carb base",
              items: [{ ingredientId: "rice-white-cooked", grams: 220 }],
            },
            {
              id: "lunch-recipe-3",
              name: "Veg + fat",
              items: [
                { ingredientId: "broccoli-steamed", grams: 150 },
                { ingredientId: "olive-oil", grams: 10 },
              ],
            },
          ],
        },
        {
          id: "dinner",
          name: "Dinner",
          recipes: [
            {
              id: "dinner-recipe-1",
              name: "Salmon",
              items: [{ ingredientId: "salmon-cooked", grams: 160 }],
            },
            {
              id: "dinner-recipe-2",
              name: "Sweet potato",
              items: [{ ingredientId: "sweet-potato-baked", grams: 250 }],
            },
            {
              id: "dinner-recipe-3",
              name: "Greens",
              items: [{ ingredientId: "broccoli-steamed", grams: 150 }],
            },
          ],
        },
      ],
    },
  ],
};


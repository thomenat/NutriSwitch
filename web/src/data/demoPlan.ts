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
          items: [
            { ingredientId: "oats", grams: 60 },
            { ingredientId: "banana", grams: 120 },
            { ingredientId: "greek-yogurt-0", grams: 200 },
          ],
        },
        {
          id: "lunch",
          name: "Lunch",
          items: [
            { ingredientId: "chicken-breast-cooked", grams: 160 },
            { ingredientId: "rice-white-cooked", grams: 220 },
            { ingredientId: "broccoli-steamed", grams: 150 },
            { ingredientId: "olive-oil", grams: 10 },
          ],
        },
        {
          id: "dinner",
          name: "Dinner",
          items: [
            { ingredientId: "salmon-cooked", grams: 160 },
            { ingredientId: "sweet-potato-baked", grams: 250 },
            { ingredientId: "broccoli-steamed", grams: 150 },
          ],
        },
      ],
    },
  ],
};


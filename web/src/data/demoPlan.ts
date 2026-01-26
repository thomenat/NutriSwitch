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
              imageSrc: "/recipes/overnight-oats.svg",
              imageAlt: "Overnight oats bowl illustration",
              items: [
                { ingredientId: "oats", grams: 60 },
                { ingredientId: "greek-yogurt-0", grams: 200 },
              ],
            },
            {
              id: "breakfast-recipe-2",
              name: "Banana bowl",
              imageSrc: "/recipes/banana-bowl.svg",
              imageAlt: "Banana bowl illustration",
              items: [
                { ingredientId: "banana", grams: 120 },
                { ingredientId: "greek-yogurt-0", grams: 100 },
              ],
            },
            {
              id: "breakfast-recipe-3",
              name: "Simple carbs",
              imageSrc: "/recipes/simple-carbs.svg",
              imageAlt: "Simple carbs illustration",
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
              imageSrc: "/recipes/protein-plate.svg",
              imageAlt: "Protein plate illustration",
              items: [{ ingredientId: "chicken-breast-cooked", grams: 160 }],
            },
            {
              id: "lunch-recipe-2",
              name: "Carb base",
              imageSrc: "/recipes/carb-base.svg",
              imageAlt: "Carb base illustration",
              items: [{ ingredientId: "rice-white-cooked", grams: 220 }],
            },
            {
              id: "lunch-recipe-3",
              name: "Veg + fat",
              imageSrc: "/recipes/veg-fat.svg",
              imageAlt: "Vegetables and fat illustration",
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
              imageSrc: "/recipes/salmon.svg",
              imageAlt: "Salmon bowl illustration",
              items: [{ ingredientId: "salmon-cooked", grams: 160 }],
            },
            {
              id: "dinner-recipe-2",
              name: "Sweet potato",
              imageSrc: "/recipes/sweet-potato.svg",
              imageAlt: "Sweet potato illustration",
              items: [{ ingredientId: "sweet-potato-baked", grams: 250 }],
            },
            {
              id: "dinner-recipe-3",
              name: "Greens",
              imageSrc: "/recipes/greens.svg",
              imageAlt: "Greens illustration",
              items: [{ ingredientId: "broccoli-steamed", grams: 150 }],
            },
          ],
        },
      ],
    },
  ],
};


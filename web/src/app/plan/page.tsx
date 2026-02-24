import { DEMO_PLAN } from "@/data/demoPlan";
import { INGREDIENTS } from "@/data/ingredients";
import { resolveStockImage } from "@/lib/images/unsplash";
import type { Meal, Recipe } from "@/lib/nutrition/types";
import { loadIngredientsWithUsda } from "@/lib/nutrition/loadIngredients";
import { PlanClient } from "./PlanClient";

export const dynamic = "force-dynamic";

async function getMealsWithResolvedImages(meals: Meal[]): Promise<Meal[]> {
  return Promise.all(
    meals.map(async (meal) => ({
      ...meal,
      recipes: await Promise.all(
        meal.recipes.map(async (recipe): Promise<Recipe> => {
          const stock = await resolveStockImage(recipe.imageQuery ?? recipe.name);
          if (!stock) return recipe;
          return {
            ...recipe,
            imageSrc: stock.url,
            imageAlt: stock.alt,
            imageCredit: stock.credit,
            imageCreditUrl: stock.creditUrl,
          };
        }),
      ),
    })),
  );
}

export default async function PlanPage() {
  const day1 = DEMO_PLAN.days[0];
  const [mealsWithImages, { ingredients, apiKeyMode, apiUsedFor, status, errorDetail }] =
    await Promise.all([
      getMealsWithResolvedImages(day1.meals),
      loadIngredientsWithUsda(INGREDIENTS),
    ]);

  return (
    <main>
      <PlanClient
        ingredients={ingredients}
        initialMeals={mealsWithImages}
        nutritionMeta={{
          provider: "usdaFdc",
          apiKeyMode,
          apiUsedFor,
          status,
          totalIngredients: ingredients.length,
          errorDetail,
        }}
      />
    </main>
  );
}


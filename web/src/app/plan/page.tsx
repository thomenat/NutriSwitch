import { DEMO_PLAN } from "@/data/demoPlan";
import { INGREDIENTS } from "@/data/ingredients";
import { PlanClient } from "./PlanClient";
import { loadIngredientsWithUsda } from "@/lib/nutrition/loadIngredients";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const day1 = DEMO_PLAN.days[0];
  const { ingredients, apiKeyMode, apiUsedFor } = await loadIngredientsWithUsda(INGREDIENTS);

  return (
    <main>
      <PlanClient
        ingredients={ingredients}
        initialMeals={day1.meals}
        nutritionMeta={{
          provider: "usdaFdc",
          apiKeyMode,
          apiUsedFor,
          totalIngredients: ingredients.length,
        }}
      />
    </main>
  );
}


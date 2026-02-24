import { DEMO_PLAN } from "@/data/demoPlan";
import { INGREDIENTS } from "@/data/ingredients";
import { resolvePlanForDisplay } from "@/lib/images/unsplash";
import { loadIngredientsWithUsda } from "@/lib/nutrition/loadIngredients";
import { PlanClient } from "./PlanClient";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const [planWithImages, { ingredients, apiKeyMode, apiUsedFor, status, errorDetail }] =
    await Promise.all([
      resolvePlanForDisplay(DEMO_PLAN),
      loadIngredientsWithUsda(INGREDIENTS),
    ]);

  return (
    <main>
      <PlanClient
        ingredients={ingredients}
        initialMeals={planWithImages.days[0].meals}
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


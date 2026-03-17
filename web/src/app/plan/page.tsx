import { DEMO_PLAN } from "@/data/demoPlan";
import { INGREDIENTS } from "@/data/ingredients";
import { NATALIA_INGREDIENTS, NATALIA_PLAN } from "@/data/nataliaPlan";
import { resolvePlanForDisplay } from "@/lib/images/unsplash";
import { loadIngredientsWithUsda } from "@/lib/nutrition/loadIngredients";
import { PlanClient } from "./PlanClient";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const useNatalia = true;

  const basePlan = useNatalia ? NATALIA_PLAN : DEMO_PLAN;
  const baseIngredients = useNatalia ? NATALIA_INGREDIENTS : INGREDIENTS;

  const [planWithImages, { ingredients, apiKeyMode, apiUsedFor, status, errorDetail }] =
    await Promise.all([
      resolvePlanForDisplay(basePlan),
      loadIngredientsWithUsda(baseIngredients),
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


import Link from "next/link";
import { DEMO_PLAN } from "@/data/demoPlan";
import { INGREDIENTS } from "@/data/ingredients";
import { PlanClient } from "@/app/plan/PlanClient";
import { loadIngredientsWithUsda } from "@/lib/nutrition/loadIngredients";

export default async function SharePlanPage(props: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await props.params;

  // MVP: only a seeded demo plan. Later: load from DB by planId and enforce auth/roles.
  if (planId !== DEMO_PLAN.id) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Plan not found</h1>
        <p className="mt-2 text-zinc-700">
          This share link doesn’t match any plan in the demo.
        </p>
        <Link className="mt-6 inline-flex text-sm font-medium text-zinc-900 underline" href="/">
          Go home
        </Link>
      </main>
    );
  }

  const day1 = DEMO_PLAN.days[0];
  const { ingredients, apiKeyMode, apiUsedFor } = await loadIngredientsWithUsda(INGREDIENTS);

  return (
    <main>
      <div className="mx-auto max-w-4xl px-6 pt-8">
        <div className="ns-card p-4 text-sm text-zinc-700">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-pink)]" />
            <div className="font-semibold text-zinc-900">Patient view</div>
          </div>
          <div className="ns-muted mt-1">
            This plan was shared by your nutritionist. You can swap ingredients and preview
            updated quantities before confirming.
          </div>
        </div>
      </div>
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


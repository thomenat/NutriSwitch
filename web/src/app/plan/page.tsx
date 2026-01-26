import { DEMO_PLAN } from "@/data/demoPlan";
import { INGREDIENTS } from "@/data/ingredients";
import { PlanClient } from "./PlanClient";

export default function PlanPage() {
  const day1 = DEMO_PLAN.days[0];

  return (
    <main className="bg-zinc-100">
      <PlanClient ingredients={INGREDIENTS} initialMeals={day1.meals} />
    </main>
  );
}


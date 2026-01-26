"use client";

import { useMemo, useState } from "react";
import type { Ingredient, Meal, PreserveMetric } from "@/lib/nutrition/types";
import { mealTotals, scaleMacros, swapMealItem } from "@/lib/nutrition/calc";

function fmt1(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
}

function fmt0(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

type RowKey = `${string}:${number}`;

export function PlanClient(props: {
  ingredients: Ingredient[];
  initialMeals: Meal[];
}) {
  const ingredientsById = useMemo(
    () => new Map(props.ingredients.map((i) => [i.id, i] as const)),
    [props.ingredients],
  );

  const [meals, setMeals] = useState<Meal[]>(props.initialMeals);
  const [swapToByRow, setSwapToByRow] = useState<Record<RowKey, string>>({});
  const [preserveByRow, setPreserveByRow] = useState<Record<RowKey, PreserveMetric>>(
    {},
  );

  const preserveDefault: PreserveMetric = "calories";

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Demo plan</h1>
        <p className="text-sm text-zinc-600">
          Swap an ingredient and we’ll recalculate grams to preserve a chosen metric
          (default: calories).
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {meals.map((meal) => {
          const totals = mealTotals(meal, ingredientsById);
          return (
            <section
              key={meal.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{meal.name}</h2>
                  <p className="text-sm text-zinc-600">
                    Total: {fmt0(totals.calories)} kcal · P {fmt1(totals.protein)}g ·
                    C {fmt1(totals.carbs)}g · F {fmt1(totals.fat)}g
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
                  <thead className="text-left text-zinc-600">
                    <tr>
                      <th className="px-3">Ingredient</th>
                      <th className="px-3">Grams</th>
                      <th className="px-3">kcal</th>
                      <th className="px-3">P</th>
                      <th className="px-3">C</th>
                      <th className="px-3">F</th>
                      <th className="px-3">Swap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meal.items.map((item, idx) => {
                      const ingredient = ingredientsById.get(item.ingredientId);
                      if (!ingredient) return null;

                      const rowKey: RowKey = `${meal.id}:${idx}`;
                      const preserve = preserveByRow[rowKey] ?? preserveDefault;
                      const swapTo =
                        swapToByRow[rowKey] ??
                        props.ingredients.find((i) => i.id !== item.ingredientId)?.id ??
                        item.ingredientId;

                      const line = scaleMacros(ingredient.macrosPer100g, item.grams);

                      return (
                        <tr key={rowKey} className="rounded-lg bg-zinc-50">
                          <td className="px-3 py-3 font-medium text-zinc-900">
                            {ingredient.name}
                          </td>
                          <td className="px-3 py-3">{fmt0(item.grams)} g</td>
                          <td className="px-3 py-3">{fmt0(line.calories)}</td>
                          <td className="px-3 py-3">{fmt1(line.protein)}</td>
                          <td className="px-3 py-3">{fmt1(line.carbs)}</td>
                          <td className="px-3 py-3">{fmt1(line.fat)}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                className="h-9 rounded-md border border-zinc-200 bg-white px-2"
                                value={swapTo}
                                onChange={(e) =>
                                  setSwapToByRow((s) => ({
                                    ...s,
                                    [rowKey]: e.target.value,
                                  }))
                                }
                              >
                                {props.ingredients
                                  .filter((i) => i.id !== item.ingredientId)
                                  .map((i) => (
                                    <option key={i.id} value={i.id}>
                                      {i.name}
                                    </option>
                                  ))}
                              </select>

                              <select
                                className="h-9 rounded-md border border-zinc-200 bg-white px-2"
                                value={preserve}
                                onChange={(e) =>
                                  setPreserveByRow((s) => ({
                                    ...s,
                                    [rowKey]: e.target.value as PreserveMetric,
                                  }))
                                }
                              >
                                <option value="calories">Preserve calories</option>
                                <option value="protein">Preserve protein</option>
                                <option value="carbs">Preserve carbs</option>
                                <option value="fat">Preserve fat</option>
                              </select>

                              <button
                                className="h-9 rounded-md bg-zinc-900 px-3 font-medium text-white hover:bg-zinc-800"
                                onClick={() => {
                                  setMeals((prev) =>
                                    prev.map((m) =>
                                      m.id !== meal.id
                                        ? m
                                        : swapMealItem({
                                            meal: m,
                                            itemIndex: idx,
                                            toIngredientId: swapTo,
                                            preserve,
                                            ingredientsById,
                                          }),
                                    ),
                                  );
                                }}
                              >
                                Swap
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}


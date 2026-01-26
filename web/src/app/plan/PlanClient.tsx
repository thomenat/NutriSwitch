"use client";

import { useMemo, useState } from "react";
import type { Ingredient, Meal, PreserveMetric } from "@/lib/nutrition/types";
import { mealTotals, recipeTotalsFor, scaleMacros, swapMealItem } from "@/lib/nutrition/calc";

function fmt1(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
}

function fmt0(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SwapTarget = {
  mealId: string;
  recipeIndex: number;
  itemIndex: number;
};

type ExpandedRecipe = {
  mealId: string;
  recipeIndex: number;
};

export function PlanClient(props: {
  ingredients: Ingredient[];
  initialMeals: Meal[];
}) {
  const ingredientsById = useMemo(
    () => new Map(props.ingredients.map((i) => [i.id, i] as const)),
    [props.ingredients],
  );

  const [meals, setMeals] = useState<Meal[]>(props.initialMeals);
  const [expanded, setExpanded] = useState<ExpandedRecipe | null>(null);
  const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null);
  const [swapToIngredientId, setSwapToIngredientId] = useState<string>("");
  const [preserve, setPreserve] = useState<PreserveMetric>("calories");

  const activeMeal = swapTarget
    ? meals.find((m) => m.id === swapTarget.mealId) ?? null
    : null;
  const activeItem =
    swapTarget && activeMeal
      ? activeMeal.recipes[swapTarget.recipeIndex]?.items[swapTarget.itemIndex] ?? null
      : null;
  const activeRecipe =
    swapTarget && activeMeal ? activeMeal.recipes[swapTarget.recipeIndex] ?? null : null;
  const activeFromIngredient = activeItem
    ? ingredientsById.get(activeItem.ingredientId) ?? null
    : null;
  const activeToIngredient =
    swapToIngredientId ? ingredientsById.get(swapToIngredientId) ?? null : null;

  const activeMealBeforeTotals = activeMeal ? mealTotals(activeMeal, ingredientsById) : null;
  const activeMealAfter =
    swapTarget && activeMeal && swapToIngredientId
      ? swapMealItem({
          meal: activeMeal,
          recipeIndex: swapTarget.recipeIndex,
          itemIndex: swapTarget.itemIndex,
          toIngredientId: swapToIngredientId,
          preserve,
          ingredientsById,
        })
      : null;
  const activeMealAfterTotals = activeMealAfter
    ? mealTotals(activeMealAfter, ingredientsById)
    : null;
  const activeAfterItem =
    swapTarget && activeMealAfter
      ? activeMealAfter.recipes[swapTarget.recipeIndex]?.items[swapTarget.itemIndex] ?? null
      : null;

  const activeRecipeBeforeTotals =
    activeRecipe && activeMeal ? recipeTotalsFor(activeRecipe, ingredientsById) : null;
  const activeRecipeAfterTotals =
    swapTarget && activeMealAfter
      ? recipeTotalsFor(activeMealAfter.recipes[swapTarget.recipeIndex]!, ingredientsById)
      : null;

  function openSwapModal(target: SwapTarget) {
    const meal = meals.find((m) => m.id === target.mealId);
    const recipe = meal?.recipes[target.recipeIndex];
    const item = recipe?.items[target.itemIndex];
    if (!meal || !recipe || !item) return;

    const defaultTo =
      props.ingredients.find((i) => i.id !== item.ingredientId)?.id ?? "";
    setSwapTarget(target);
    setPreserve("calories");
    setSwapToIngredientId(defaultTo);
  }

  function closeSwapModal() {
    setSwapTarget(null);
  }

  function toggleRecipe(mealId: string, recipeIndex: number) {
    setExpanded((prev) => {
      if (prev && prev.mealId === mealId && prev.recipeIndex === recipeIndex) return null;
      return { mealId, recipeIndex };
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 ns-chip text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-mint)]" />
          Patient view (interactive)
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Demo plan</h1>
        <p className="ns-muted text-sm">
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
              className="ns-card ns-blob p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{meal.name}</h2>
                    <span className="ns-chip text-[11px] font-semibold">Meal</span>
                  </div>
                  <p className="ns-muted text-sm">
                    Total: {fmt0(totals.calories)} kcal · P {fmt1(totals.protein)}g ·
                    C {fmt1(totals.carbs)}g · F {fmt1(totals.fat)}g
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {meal.recipes.map((recipe, recipeIndex) => {
                    const isExpanded =
                      expanded?.mealId === meal.id && expanded.recipeIndex === recipeIndex;

                    return (
                      <div
                        key={recipe.id}
                        className={clsx(
                          "ns-blob overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]",
                          isExpanded && "col-span-2 sm:col-span-3",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleRecipe(meal.id, recipeIndex)}
                          className={clsx(
                            "group relative block w-full text-left",
                            isExpanded ? "h-56 sm:h-64" : "aspect-square",
                          )}
                          aria-expanded={isExpanded}
                        >
                          <img
                            src={recipe.imageSrc}
                            alt={recipe.imageAlt}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                          {/* subtle overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-70 transition-opacity group-hover:opacity-80" />

                          {/* accessible name (visually hidden to keep “image-only”) */}
                          <span className="sr-only">{recipe.name}</span>

                          {/* small affordance */}
                          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-900">
                            {isExpanded ? "Close" : "Open"}
                            <span aria-hidden="true">{isExpanded ? "▴" : "▾"}</span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-[color:var(--border)] p-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-base font-semibold text-zinc-900">
                                  {recipe.name}
                                </h3>
                                <span className="ns-chip bg-[var(--surface-2)] text-[11px] font-semibold">
                                  Tap ingredients to swap
                                </span>
                              </div>
                              <p className="ns-muted text-sm">
                                Missing something? Swap an ingredient and the app recalculates the
                                quantity.
                              </p>
                            </div>

                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
                                <thead className="text-left ns-muted">
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
                                  {recipe.items.map((item, itemIndex) => {
                                    const ingredient = ingredientsById.get(item.ingredientId);
                                    if (!ingredient) return null;
                                    const line = scaleMacros(
                                      ingredient.macrosPer100g,
                                      item.grams,
                                    );

                                    return (
                                      <tr
                                        key={`${meal.id}:${recipe.id}:${itemIndex}`}
                                        className="rounded-lg bg-[color:var(--surface-2)]"
                                      >
                                        <td className="px-3 py-3 font-medium text-zinc-900">
                                          {ingredient.name}
                                        </td>
                                        <td className="px-3 py-3">{fmt0(item.grams)} g</td>
                                        <td className="px-3 py-3">{fmt0(line.calories)}</td>
                                        <td className="px-3 py-3">{fmt1(line.protein)}</td>
                                        <td className="px-3 py-3">{fmt1(line.carbs)}</td>
                                        <td className="px-3 py-3">{fmt1(line.fat)}</td>
                                        <td className="px-3 py-3">
                                          <button
                                            className="ns-btn ns-btn-dark h-9 px-3 text-sm"
                                            onClick={() =>
                                              openSwapModal({
                                                mealId: meal.id,
                                                recipeIndex,
                                                itemIndex,
                                              })
                                            }
                                          >
                                            Swap…
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-3 rounded-[16px] border border-[color:var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm">
                              {(() => {
                                const recipeTotals = recipeTotalsFor(recipe, ingredientsById);
                                return (
                                  <div className="ns-muted">
                                    Recipe total: {fmt0(recipeTotals.calories)} kcal · P{" "}
                                    {fmt1(recipeTotals.protein)}g · C {fmt1(recipeTotals.carbs)}g ·
                                    F {fmt1(recipeTotals.fat)}g
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {swapTarget && activeMeal && activeRecipe && activeItem && activeFromIngredient && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeSwapModal();
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-[22px] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] p-5">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-[16px] border border-[color:var(--border)] bg-[var(--surface-2)]">
                  <img
                    src={activeRecipe.imageSrc}
                    alt={activeRecipe.imageAlt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-lg font-semibold">Swap ingredient</h3>
                <p className="ns-muted mt-1 text-sm">
                  Meal: <span className="font-medium text-zinc-900">{activeMeal.name}</span> · Recipe:{" "}
                  <span className="font-medium text-zinc-900">{activeRecipe.name}</span>
                  <br />
                  You’re swapping <span className="font-medium text-zinc-900">{activeFromIngredient.name}</span>{" "}
                  ({fmt0(activeItem.grams)}g)
                </p>
              </div>
              <button
                className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] p-2 text-zinc-700 hover:bg-[var(--surface-2)]"
                onClick={closeSwapModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-zinc-900">Substitute</span>
                  <select
                    className="h-10 rounded-[16px] border border-[color:var(--border)] bg-[var(--surface)] px-3"
                    value={swapToIngredientId}
                    onChange={(e) => setSwapToIngredientId(e.target.value)}
                  >
                    {props.ingredients
                      .filter((i) => i.id !== activeItem.ingredientId)
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-zinc-900">Preserve</span>
                  <select
                    className="h-10 rounded-[16px] border border-[color:var(--border)] bg-[var(--surface)] px-3"
                    value={preserve}
                    onChange={(e) => setPreserve(e.target.value as PreserveMetric)}
                  >
                    <option value="calories">Calories</option>
                    <option value="protein">Protein</option>
                    <option value="carbs">Carbs</option>
                    <option value="fat">Fat</option>
                  </select>
                </label>
              </div>

              <div className="rounded-[22px] border border-[color:var(--border)] bg-[var(--surface-2)] p-4">
                <h4 className="text-sm font-semibold text-zinc-900">Preview</h4>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-[var(--surface)] p-3">
                    <div className="text-xs font-semibold ns-muted">Before</div>
                    <div className="mt-1 text-sm text-zinc-900">
                      Line item: {fmt0(activeItem.grams)}g
                    </div>
                    {activeRecipeBeforeTotals && (
                      <div className="mt-2 text-xs text-zinc-700">
                        Recipe total: {fmt0(activeRecipeBeforeTotals.calories)} kcal · P{" "}
                        {fmt1(activeRecipeBeforeTotals.protein)}g · C{" "}
                        {fmt1(activeRecipeBeforeTotals.carbs)}g · F{" "}
                        {fmt1(activeRecipeBeforeTotals.fat)}g
                      </div>
                    )}
                    {activeMealBeforeTotals && (
                      <div className="mt-2 text-xs text-zinc-700">
                        Meal total: {fmt0(activeMealBeforeTotals.calories)} kcal · P{" "}
                        {fmt1(activeMealBeforeTotals.protein)}g · C{" "}
                        {fmt1(activeMealBeforeTotals.carbs)}g · F{" "}
                        {fmt1(activeMealBeforeTotals.fat)}g
                      </div>
                    )}
                  </div>

                  <div className="rounded-[16px] bg-[var(--surface)] p-3">
                    <div className="text-xs font-semibold ns-muted">After</div>
                    <div className="mt-1 text-sm text-zinc-900">
                      Line item:{" "}
                      {activeAfterItem ? `${fmt0(activeAfterItem.grams)}g` : "—"}
                    </div>
                    {activeRecipeAfterTotals && (
                      <div className="mt-2 text-xs text-zinc-700">
                        Recipe total: {fmt0(activeRecipeAfterTotals.calories)} kcal · P{" "}
                        {fmt1(activeRecipeAfterTotals.protein)}g · C{" "}
                        {fmt1(activeRecipeAfterTotals.carbs)}g · F{" "}
                        {fmt1(activeRecipeAfterTotals.fat)}g
                      </div>
                    )}
                    {activeMealAfterTotals && (
                      <div className="mt-2 text-xs text-zinc-700">
                        Meal total: {fmt0(activeMealAfterTotals.calories)} kcal · P{" "}
                        {fmt1(activeMealAfterTotals.protein)}g · C{" "}
                        {fmt1(activeMealAfterTotals.carbs)}g · F{" "}
                        {fmt1(activeMealAfterTotals.fat)}g
                      </div>
                    )}
                  </div>
                </div>

                {activeToIngredient && activeAfterItem?.grams === 0 && (
                  <p className="mt-3 text-sm text-amber-700">
                    Can’t preserve {preserve} for this swap (missing/zero values). Try a
                    different metric.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[color:var(--border)] p-5">
              <button
                className="ns-btn h-10 bg-[var(--surface)] px-4 text-sm text-[color:var(--foreground)] hover:bg-[var(--surface-2)]"
                onClick={closeSwapModal}
              >
                Cancel
              </button>
              <button
                className={clsx(
                  "ns-btn h-10 px-4 text-sm",
                  activeAfterItem?.grams === 0 ? "bg-zinc-300 text-zinc-700" : "ns-btn-primary",
                )}
                disabled={activeAfterItem?.grams === 0}
                onClick={() => {
                  const nextMeal = activeMealAfter;
                  if (!nextMeal) return;
                  setMeals((prev) => prev.map((m) => (m.id === nextMeal.id ? nextMeal : m)));
                  closeSwapModal();
                }}
              >
                Confirm swap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import type { Ingredient, Meal, PreserveMetric } from "@/lib/nutrition/types";
import { mealTotals, recipeTotalsFor, scaleMacros, swapMealItem } from "@/lib/nutrition/calc";
import { kitchenApprox } from "@/lib/nutrition/kitchen";

function fmt1(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
}

function fmt0(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function fmtOz(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function MacroPizza(props: {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}) {
  const proteinCals = Math.max(0, props.proteinGrams * 4);
  const carbsCals = Math.max(0, props.carbsGrams * 4);
  const fatCals = Math.max(0, props.fatGrams * 9);
  const total = proteinCals + carbsCals + fatCals;

  const parts =
    total > 0
      ? [
          { label: "carb", value: carbsCals, color: "var(--accent-sky)" },
          { label: "protein", value: proteinCals, color: "var(--accent-mint)" },
          { label: "fat", value: fatCals, color: "var(--accent-pink)" },
        ]
      : [
          { label: "carb", value: 1, color: "var(--accent-sky)" },
          { label: "protein", value: 1, color: "var(--accent-mint)" },
          { label: "fat", value: 1, color: "var(--accent-pink)" },
        ];

  const view = 120;
  const cx = 60;
  const cy = 60;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative h-[152px] w-[152px]">
      <svg
        viewBox={`0 0 ${view} ${view}`}
        className="h-full w-full -rotate-90"
        aria-label="Macro calorie split chart"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgba(15, 23, 42, 0.10)"
          strokeWidth="14"
          fill="none"
        />
        {parts.map((p) => {
          const frac = p.value / parts.reduce((a, b) => a + b.value, 0);
          const len = frac * circumference;
          const dasharray = `${len} ${Math.max(0, circumference - len)}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <circle
              key={p.label}
              cx={cx}
              cy={cy}
              r={r}
              stroke={p.color}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs font-semibold ns-muted">calories</div>
        <div className="mt-1 text-xl font-semibold text-zinc-900">
          {fmt0(props.calories)}
        </div>
      </div>
    </div>
  );
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

type UnitPreference = "metric" | "imperial" | "both";

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
  const [unitPref, setUnitPref] = useState<UnitPreference>("metric");

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

  function gramsToOz(grams: number): number {
    return grams / 28.349523125;
  }

  function formatAmount(grams: number): string {
    const g = `${fmt0(grams)} g`;
    const oz = `${fmtOz(gramsToOz(grams))} oz`;
    if (unitPref === "metric") return g;
    if (unitPref === "imperial") return oz;
    return `${g} (${oz})`;
  }

  function scrollToIngredients(mealId: string, recipeIndex: number) {
    const el = document.getElementById(`ingredients-${mealId}-${recipeIndex}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
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

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="ns-muted text-sm">Units:</span>
          <div className="inline-flex overflow-hidden rounded-full border border-[color:var(--border)] bg-[var(--surface)]">
            {([
              ["metric", "Metric"],
              ["imperial", "Imperial"],
              ["both", "Both"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={clsx(
                  "px-3 py-2 text-xs font-semibold",
                  unitPref === value
                    ? "bg-[var(--surface-2)] text-zinc-900"
                    : "text-zinc-700 hover:bg-[var(--surface-2)]",
                )}
                onClick={() => setUnitPref(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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
                {(() => {
                  const expandedIndex =
                    expanded?.mealId === meal.id ? expanded.recipeIndex : null;

                  const expandedRecipe =
                    expandedIndex !== null ? meal.recipes[expandedIndex] ?? null : null;

                  const otherRecipes =
                    expandedIndex === null
                      ? meal.recipes
                      : meal.recipes.filter((_, idx) => idx !== expandedIndex);

                  const renderRecipeTile = (recipe: (typeof meal.recipes)[number], recipeIndex: number) => {
                    const isExpanded = expandedIndex === recipeIndex;
                    return (
                      <div
                        key={recipe.id}
                        className="ns-blob overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleRecipe(meal.id, recipeIndex)}
                          className={clsx(
                            "group relative block w-full text-left",
                            isExpanded ? "h-64 sm:h-72" : "aspect-square",
                          )}
                          aria-expanded={isExpanded}
                        >
                          <img
                            src={recipe.imageSrc}
                            alt={recipe.imageAlt}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-70 transition-opacity group-hover:opacity-80" />
                          <span className="sr-only">{recipe.name}</span>
                          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-900">
                            {isExpanded ? "Close" : "Open"}
                            <span aria-hidden="true">{isExpanded ? "▴" : "▾"}</span>
                          </div>
                        </button>
                      </div>
                    );
                  };

                  return (
                    <div className="flex flex-col gap-4">
                      {/* Expanded recipe goes first, full width */}
                      {expandedRecipe && expandedIndex !== null && (
                        <div className="ns-blob overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
                          <button
                            type="button"
                            onClick={() => toggleRecipe(meal.id, expandedIndex)}
                            className="group relative block w-full text-left"
                            aria-expanded="true"
                          >
                            <div className="relative h-64 sm:h-72">
                              <img
                                src={expandedRecipe.imageSrc}
                                alt={expandedRecipe.imageAlt}
                                className="absolute inset-0 h-full w-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
                              <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-zinc-900">
                                Close <span aria-hidden="true">▴</span>
                              </div>
                            </div>
                          </button>

                            {/* Recipe summary (like screenshot) */}
                          <div className="border-t border-[color:var(--border)] p-4 sm:p-5">
                              {(() => {
                                const recipeTotals = recipeTotalsFor(expandedRecipe, ingredientsById);
                                return (
                                  <div className="ns-blob overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
                                    <div className="relative p-4 sm:p-5">
                                      {/* soft header wash */}
                                      <div className="pointer-events-none absolute inset-0 opacity-35">
                                        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-[var(--accent-lemon)]" />
                                        <div className="absolute -right-14 top-10 h-56 w-56 rounded-full bg-[var(--accent-sky)]" />
                                        <div className="absolute -bottom-16 left-24 h-52 w-52 rounded-full bg-[var(--accent-mint)]" />
                                      </div>

                                      <div className="relative">
                                        <div className="text-xs font-semibold tracking-wide ns-muted">
                                          {meal.name.toUpperCase()}
                                        </div>
                                        <div className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
                                          {expandedRecipe.name}
                                        </div>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                          <div className="rounded-[14px] border border-[color:var(--border)] bg-white/60 px-3 py-3">
                                            <div className="text-[11px] font-semibold ns-muted">
                                              SERVES
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-zinc-900">
                                              {expandedRecipe.servesText ?? "1 serving"}
                                            </div>
                                          </div>
                                          <div className="rounded-[14px] border border-[color:var(--border)] bg-white/60 px-3 py-3">
                                            <div className="text-[11px] font-semibold ns-muted">
                                              TOTAL TIME
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-zinc-900">
                                              {expandedRecipe.totalTimeMinutes
                                                ? `${expandedRecipe.totalTimeMinutes} minutes`
                                                : "—"}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-4 rounded-[16px] border border-[color:var(--border)] bg-white/60 px-3 py-3">
                                          <div className="text-[11px] font-semibold ns-muted">
                                            YOUR PORTION (MACROS)
                                          </div>
                                          <div className="mt-3 grid gap-4 md:grid-cols-[170px_1fr] md:items-center">
                                            <MacroPizza
                                              calories={recipeTotals.calories}
                                              proteinGrams={recipeTotals.protein}
                                              carbsGrams={recipeTotals.carbs}
                                              fatGrams={recipeTotals.fat}
                                            />

                                            <div className="flex flex-col gap-2">
                                              <div className="flex items-center justify-between rounded-[14px] border border-[color:var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-zinc-900">
                                                <div className="flex items-center gap-2">
                                                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-sky)]" />
                                                  carbs
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="ns-muted">{fmt1(recipeTotals.carbs)}g</span>
                                                </div>
                                              </div>

                                              <div className="flex items-center justify-between rounded-[14px] border border-[color:var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-zinc-900">
                                                <div className="flex items-center gap-2">
                                                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-mint)]" />
                                                  protein
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="ns-muted">{fmt1(recipeTotals.protein)}g</span>
                                                </div>
                                              </div>

                                              <div className="flex items-center justify-between rounded-[14px] border border-[color:var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-zinc-900">
                                                <div className="flex items-center gap-2">
                                                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-pink)]" />
                                                  fat
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="ns-muted">{fmt1(recipeTotals.fat)}g</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                          <button
                                            type="button"
                                            className="ns-btn h-11 bg-[var(--surface)] px-4 text-sm text-[color:var(--foreground)] hover:bg-[var(--surface-2)]"
                                            onClick={() =>
                                              scrollToIngredients(meal.id, expandedIndex)
                                            }
                                          >
                                            Substitute ingredients
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Ingredients list (PDF-like layout) */}
                              <div
                                id={`ingredients-${meal.id}-${expandedIndex}`}
                                className="mt-4 flex scroll-mt-24 flex-col gap-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-base font-semibold text-zinc-900">
                                      Ingredients
                                    </h3>
                                    <span className="ns-chip bg-[var(--surface-2)] text-[11px] font-semibold">
                                      Option
                                    </span>
                                  </div>
                                  <span className="ns-muted text-sm">
                                    Missing something? Swap an ingredient below.
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 rounded-[16px] border border-[color:var(--border)] bg-[var(--surface-2)] p-3 sm:p-4">
                              <div className="mt-2 divide-y divide-[color:var(--border)]">
                                {expandedRecipe.items.map((item, itemIndex) => {
                                  const ingredient = ingredientsById.get(item.ingredientId);
                                  if (!ingredient) return null;
                                  return (
                                    <div
                                      key={`${meal.id}:${expandedRecipe.id}:${itemIndex}`}
                                      className="flex items-center justify-between gap-3 py-3"
                                    >
                                      <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-zinc-900">
                                          {ingredient.name}
                                        </div>
                                        <div className="mt-1 flex items-center gap-2">
                                          <button
                                            className="ns-btn ns-btn-dark h-8 px-3 text-xs"
                                            onClick={() =>
                                              openSwapModal({
                                                mealId: meal.id,
                                                recipeIndex: expandedIndex,
                                                itemIndex,
                                              })
                                            }
                                          >
                                            Substitute…
                                          </button>
                                        </div>
                                      </div>

                                      <div className="shrink-0 text-right">
                                        <div className="text-sm font-semibold text-zinc-900">
                                          {formatAmount(item.grams)}
                                        </div>
                                        {(() => {
                                          const approx = kitchenApprox(item.ingredientId, item.grams);
                                          return approx ? (
                                            <div className="ns-muted mt-1 text-xs">
                                              ≈ {approx}
                                            </div>
                                          ) : null;
                                        })()}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* Other options move below the expanded ingredients */}
                      <div className={clsx("grid grid-cols-2 gap-3 sm:grid-cols-3", expandedRecipe && "sm:grid-cols-3")}>
                        {otherRecipes.map((recipe, idx) => {
                          const actualIndex =
                            expandedIndex === null
                              ? idx
                              : meal.recipes.findIndex((r) => r.id === recipe.id);
                          return renderRecipeTile(recipe, actualIndex);
                        })}
                      </div>
                    </div>
                  );
                })()}
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


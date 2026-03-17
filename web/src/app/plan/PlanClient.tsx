"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DietaryRestriction, Ingredient, Meal, PreserveMetric } from "@/lib/nutrition/types";
import { computeSwapGrams, mealTotals, recipeTotalsFor, roundGrams, swapMealItem } from "@/lib/nutrition/calc";
import { DIETARY_RESTRICTIONS, ingredientSatisfiesAll, recipeSatisfiesAll } from "@/lib/nutrition/diet";
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

type UnitPreference = "metric" | "imperial";

type ToastModel =
  | {
      id: string;
      title: string;
      message?: string;
      actionLabel?: string;
      onAction?: () => void;
    }
  | null;

export function PlanClient(props: {
  ingredients: Ingredient[];
  initialMeals: Meal[];
  nutritionMeta?: {
    provider: "usdaFdc";
    apiKeyMode: "configured" | "demo_key";
    apiUsedFor: number;
    status: "ok" | "missing_key" | "rate_limited" | "auth_error" | "error";
    totalIngredients: number;
    errorDetail?: string;
  };
}) {
  const ingredientsById = useMemo(
    () => new Map(props.ingredients.map((i) => [i.id, i] as const)),
    [props.ingredients],
  );

  const [meals, setMeals] = useState<Meal[]>(props.initialMeals);
  const [expanded, setExpanded] = useState<ExpandedRecipe | null>(null);
  const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null);
  const [swapToIngredientId, setSwapToIngredientId] = useState<string>("");
  const [swapQuery, setSwapQuery] = useState<string>("");
  const [swapListOpen, setSwapListOpen] = useState<boolean>(false);
  const [swapScope, setSwapScope] = useState<"item" | "plan">("item");
  const [swapPickedExplicitly, setSwapPickedExplicitly] = useState<boolean>(false);
  const preserve: PreserveMetric = "calories";
  const [unitPref, setUnitPref] = useState<UnitPreference>("metric");
  const [dietary, setDietary] = useState<DietaryRestriction[]>([]);
  const [showRecipeMacros, setShowRecipeMacros] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<ToastModel>(null);

  const swapSearchRef = useRef<HTMLInputElement | null>(null);

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

  function applySwap(input: {
    mealId: string;
    recipeIndex: number;
    itemIndex: number;
    toIngredientId: string;
    scope: "item" | "plan";
  }) {
    const { mealId, recipeIndex, itemIndex, toIngredientId, scope } = input;
    const prevMeals = meals;

    const doSwapOne = (meal: Meal) =>
      swapMealItem({ meal, recipeIndex, itemIndex, toIngredientId, preserve, ingredientsById });

    const doSwapPlan = () => {
      const fromId = prevMeals
        .find((m) => m.id === mealId)
        ?.recipes[recipeIndex]?.items[itemIndex]?.ingredientId;
      const fromIngredient = fromId ? ingredientsById.get(fromId) : null;
      const toIngredient = ingredientsById.get(toIngredientId) ?? null;
      if (!fromId || !fromIngredient || !toIngredient) return prevMeals;

      return prevMeals.map((m) => ({
        ...m,
        recipes: m.recipes.map((r) => ({
          ...r,
          items: r.items.map((it) => {
            if (it.ingredientId !== fromId) return it;
            const grams = roundGrams(
              computeSwapGrams({
                fromIngredient,
                fromGrams: it.grams,
                toIngredient,
                preserve,
              }),
            );
            return { ingredientId: toIngredientId, grams };
          }),
        })),
      }));
    };

    const nextMeals =
      scope === "plan"
        ? doSwapPlan()
        : prevMeals.map((m) => (m.id === mealId ? doSwapOne(m) : m));

    setMeals(nextMeals);

    const fromName =
      ingredientsById.get(
        prevMeals.find((m) => m.id === mealId)?.recipes[recipeIndex]?.items[itemIndex]
          ?.ingredientId ?? "",
      )?.name ?? "ingredient";
    const toName = ingredientsById.get(toIngredientId)?.name ?? "substitute";
    setToast({
      id: crypto.randomUUID(),
      title: "Swap applied",
      message: `${fromName} → ${toName}${scope === "plan" ? " (entire plan)" : ""}`,
      actionLabel: "Undo",
      onAction: () => {
        setMeals(prevMeals);
        setToast(null);
      },
    });
  }

  const swapOptions = (() => {
    const fromId = activeItem?.ingredientId ?? null;
    if (!fromId) return [];
    const q = swapQuery.trim().toLowerCase();
    return props.ingredients
      .filter((i) => i.id !== fromId)
      .filter((i) => ingredientSatisfiesAll(i, dietary))
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  function openSwapModal(target: SwapTarget) {
    const meal = meals.find((m) => m.id === target.mealId);
    const recipe = meal?.recipes[target.recipeIndex];
    const item = recipe?.items[target.itemIndex];
    if (!meal || !recipe || !item) return;

    const suggested =
      props.ingredients
        .filter((i) => i.id !== item.ingredientId)
        .filter((i) => ingredientSatisfiesAll(i, dietary))
        .sort((a, b) => a.name.localeCompare(b.name))[0]?.id ?? "";
    setSwapTarget(target);
    setSwapToIngredientId(suggested);
    setSwapQuery("");
    setSwapScope("item");
    setSwapPickedExplicitly(false);
  }

  function closeSwapModal() {
    setSwapTarget(null);
  }

  function toggleRecipe(mealId: string, recipeIndex: number) {
    setExpanded((prev) => {
      if (prev && prev.mealId === mealId && prev.recipeIndex === recipeIndex) {
        // When collapsing, keep context by scrolling back to the meal header.
        window.setTimeout(() => {
          document
            .getElementById(`meal-section-${mealId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
        return null;
      }
      return { mealId, recipeIndex };
    });
  }

  // When opening a recipe card, ensure it scrolls into view (helps on mobile).
  function openRecipe(mealId: string, recipeIndex: number) {
    toggleRecipe(mealId, recipeIndex);
    window.setTimeout(() => {
      const el = document.getElementById(`recipe-card-${mealId}-${recipeIndex}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function toggleDietary(id: DietaryRestriction) {
    setDietary((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const safeExpanded = useMemo<ExpandedRecipe | null>(() => {
    // If filters change and the currently expanded recipe no longer matches, collapse it.
    if (!expanded) return null;
    const meal = meals.find((m) => m.id === expanded.mealId);
    const recipe = meal?.recipes[expanded.recipeIndex];
    if (!meal || !recipe) return null;
    if (!recipeSatisfiesAll(recipe, ingredientsById, dietary)) return null;
    return expanded;
  }, [dietary, expanded, ingredientsById, meals]);

  function gramsToOz(grams: number): number {
    return grams / 28.349523125;
  }

  function formatAmount(grams: number): string {
    const g = `${fmt0(grams)} g`;
    const oz = `${fmtOz(gramsToOz(grams))} oz`;
    if (unitPref === "metric") return g;
    return oz;
  }

  useEffect(() => {
    if (!swapTarget) return;
    // Focus search when opening swap modal (pure DOM effect).
    const id = window.setTimeout(() => swapSearchRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [swapTarget]);

  useEffect(() => {
    if (!swapTarget) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSwapModal();
      }
      if (e.key === "Enter") {
        const el = document.activeElement as HTMLElement | null;
        const tag = (el?.tagName ?? "").toLowerCase();
        // Avoid hijacking Enter in selects/buttons.
        if (tag === "select" || tag === "button") return;
        if (activeAfterItem?.grams === 0) return;
        const nextMeal = activeMealAfter;
        if (!nextMeal || !activeMeal) return;

        const prevMeal = activeMeal;
        setMeals((prev) => prev.map((m) => (m.id === nextMeal.id ? nextMeal : m)));
        closeSwapModal();

        const fromName = activeFromIngredient?.name ?? "ingredient";
        const toName = activeToIngredient?.name ?? "substitute";
        const toastId = crypto.randomUUID();
        setToast({
          id: toastId,
          title: "Swap applied",
          message: `${fromName} → ${toName}`,
          actionLabel: "Undo",
          onAction: () => {
            setMeals((prev) => prev.map((m) => (m.id === prevMeal.id ? prevMeal : m)));
            setToast(null);
          },
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeAfterItem?.grams,
    activeFromIngredient?.name,
    activeMeal,
    activeMealAfter,
    activeToIngredient?.name,
    swapTarget,
  ]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 ns-chip text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-mint)]" />
          Patient view (interactive)
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Demo plan</h1>
        <p className="ns-muted text-sm">
          Swap an ingredient and we’ll recalculate grams to keep calories as similar as possible.
        </p>

        {props.nutritionMeta && (
          <p className="ns-muted text-sm">
            {props.nutritionMeta.status === "ok"
              ? "Nutrition data from USDA FoodData Central."
              : "Nutrition data from USDA where available; some values are estimates."}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="ns-muted text-sm">Diet:</span>
          <div className="flex flex-wrap gap-2">
            {DIETARY_RESTRICTIONS.map((r) => {
              const active = dietary.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  className={clsx(
                    "rounded-full border border-[color:var(--border)] px-3 py-2 text-xs font-semibold",
                    active
                      ? "bg-[var(--surface-2)] text-zinc-900"
                      : "bg-[var(--surface)] text-zinc-700 hover:bg-[var(--surface-2)]",
                  )}
                  onClick={() => toggleDietary(r.id)}
                  aria-pressed={active}
                >
                  {r.label}
                </button>
              );
            })}
            {dietary.length > 0 && (
              <button
                type="button"
                className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-[var(--surface-2)]"
                onClick={() => setDietary([])}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        {meals.map((meal) => {
          return (
            <section
              key={meal.id}
              id={`meal-section-${meal.id}`}
              className="ns-card ns-blob scroll-mt-24 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{meal.name}</h2>
                    <span className="ns-chip text-[11px] font-semibold">Meal</span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                {(() => {
                  const expandedIndex =
                    safeExpanded?.mealId === meal.id ? safeExpanded.recipeIndex : null;

                  const filteredRecipes = meal.recipes.filter((r) =>
                    recipeSatisfiesAll(r, ingredientsById, dietary),
                  );

                  const expandedRecipe =
                    expandedIndex !== null ? meal.recipes[expandedIndex] ?? null : null;
                  const expandedAllowed =
                    expandedRecipe && recipeSatisfiesAll(expandedRecipe, ingredientsById, dietary);

                  const otherRecipes =
                    expandedIndex === null
                      ? filteredRecipes
                      : filteredRecipes.filter((r) => r.id !== expandedRecipe?.id);

                  const renderRecipeTile = (recipe: (typeof meal.recipes)[number], recipeIndex: number) => {
                    const isExpanded = expandedIndex === recipeIndex;
                    return (
                      <div
                        key={recipe.id}
                        className="ns-blob overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
                      >
                        <button
                          type="button"
                          onClick={() => openRecipe(meal.id, recipeIndex)}
                          className={clsx(
                            "group relative block w-full text-left",
                            isExpanded ? "h-64 sm:h-72" : "aspect-square",
                          )}
                          aria-expanded={isExpanded}
                        >
                          <Image
                            src={recipe.imageSrc}
                            alt={recipe.imageAlt}
                            fill
                            sizes="(max-width: 640px) 100vw, 384px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-70 transition-opacity group-hover:opacity-80" />
                          <span className="sr-only">{recipe.name}</span>
                        </button>
                      </div>
                    );
                  };

                  return (
                    <div className="flex flex-col gap-4">
                      {/* Expanded recipe goes first, full width */}
                      {expandedRecipe && expandedIndex !== null && expandedAllowed && (
                        <div
                          id={`recipe-card-${meal.id}-${expandedIndex}`}
                          className="ns-blob scroll-mt-24 overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
                        >
                          <button
                            type="button"
                            onClick={() => toggleRecipe(meal.id, expandedIndex)}
                            className="group relative block w-full text-left"
                            aria-expanded="true"
                          >
                            <div className="relative h-64 sm:h-72">
                              <Image
                                src={expandedRecipe.imageSrc}
                                alt={expandedRecipe.imageAlt}
                                fill
                                sizes="(max-width: 640px) 100vw, 768px"
                                className="object-cover"
                                priority
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
                            </div>
                          </button>
                          {expandedRecipe.imageCredit && (
                            <p className="border-t border-[color:var(--border)] px-4 py-2 text-[10px] ns-muted">
                              Photo by{" "}
                              <a
                                href={expandedRecipe.imageCreditUrl ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-zinc-700"
                              >
                                {expandedRecipe.imageCredit}
                              </a>{" "}
                              on Unsplash
                            </p>
                          )}

                            {/* Recipe summary (like screenshot) */}
                          <div className="border-t border-[color:var(--border)] p-4 sm:p-5">
                              {(() => {
                                const recipeTotals = recipeTotalsFor(expandedRecipe, ingredientsById);
                                const recipeKey = `${meal.id}:${expandedRecipe.id}`;
                                const isRecipeMacrosVisible = Boolean(showRecipeMacros[recipeKey]);
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

                                        <div className="mt-4 flex items-center justify-between gap-3">
                                          {isRecipeMacrosVisible && (
                                            <div className="text-xs font-semibold tracking-wide ns-muted">
                                              MACROS
                                            </div>
                                          )}
                                          <button
                                            type="button"
                                            className={clsx(
                                              "rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-[var(--surface-2)]",
                                              !isRecipeMacrosVisible && "ml-auto",
                                            )}
                                            aria-expanded={isRecipeMacrosVisible}
                                            onClick={() =>
                                              setShowRecipeMacros((prev) => ({
                                                ...prev,
                                                [recipeKey]: !Boolean(prev[recipeKey]),
                                              }))
                                            }
                                          >
                                            {isRecipeMacrosVisible ? "Hide macros" : "Show macros"}
                                          </button>
                                        </div>

                                        {isRecipeMacrosVisible && (
                                          <div className="mt-3 rounded-[16px] border border-[color:var(--border)] bg-white/60 px-3 py-3">
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
                                        )}

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
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        className="flex items-center gap-2 text-xs font-semibold"
                                        onClick={() =>
                                          setUnitPref((prev) => (prev === "metric" ? "imperial" : "metric"))
                                        }
                                        aria-label="Toggle units between metric and imperial"
                                        aria-pressed={unitPref === "imperial"}
                                      >
                                        <span
                                          className={clsx(
                                            "text-[11px]",
                                            unitPref === "metric" ? "text-zinc-900" : "ns-muted",
                                          )}
                                        >
                                          Metric
                                        </span>
                                        <div
                                          className={clsx(
                                            "relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-colors cursor-pointer",
                                            unitPref === "metric"
                                              ? "border-[var(--accent-sky)] bg-[var(--accent-sky)]/20"
                                              : "border-[var(--accent-pink)] bg-[var(--accent-pink)]/25",
                                          )}
                                        >
                                          <span
                                            className={clsx(
                                              "absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
                                              unitPref === "metric" ? "translate-x-0.5" : "translate-x-5",
                                            )}
                                          />
                                        </div>
                                        <span
                                          className={clsx(
                                            "text-[11px]",
                                            unitPref === "imperial" ? "text-zinc-900" : "ns-muted",
                                          )}
                                        >
                                          Imperial
                                        </span>
                                      </button>
                                    </div>
                                    <p className="text-[10px] ns-muted">
                                      Affects how amounts are shown here, not the underlying calculations.
                                    </p>
                                  </div>
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
                                            className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-[var(--surface-2)]"
                                            onClick={() =>
                                              openSwapModal({
                                                mealId: meal.id,
                                                recipeIndex: expandedIndex,
                                                itemIndex,
                                              })
                                            }
                                          >
                                            <span aria-hidden="true">↔</span>
                                            <span>Swap</span>
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
                      {otherRecipes.length === 0 ? (
                        <div className="rounded-[16px] border border-[color:var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm ns-muted">
                          No recipes match your dietary filters for this meal.
                        </div>
                      ) : (
                        <div
                          className={clsx(
                            "grid grid-cols-2 gap-3 sm:grid-cols-3",
                            expandedRecipe && expandedAllowed && "sm:grid-cols-3",
                          )}
                        >
                        {otherRecipes.map((recipe, idx) => {
                          const actualIndex =
                            expandedIndex === null
                              ? idx
                              : meal.recipes.findIndex((r) => r.id === recipe.id);
                          return renderRecipeTile(recipe, actualIndex);
                        })}
                        </div>
                      )}
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
          <div className="flex w-full max-w-xl max-h-[min(640px,calc(100vh-2rem))] flex-col overflow-hidden rounded-[22px] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] p-5">
              <div className="flex flex-1 items-start gap-3">
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold text-zinc-900">Swap ingredient</h3>
                  <p className="text-xs font-semibold ns-muted">
                    {activeMeal.name} · {activeRecipe.name}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-zinc-900">
                    <span className="ns-muted">From</span>
                    <span>{activeFromIngredient.name}</span>
                    <span className="ns-muted">({fmt0(activeItem.grams)}g)</span>
                    {activeToIngredient && swapPickedExplicitly && (
                      <>
                        <span className="ns-muted">→</span>
                        <span>{activeToIngredient.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-12 w-12 overflow-hidden rounded-[16px] border border-[color:var(--border)] bg-[var(--surface-2)]">
                    <div className="relative h-full w-full">
                      <Image
                        src={activeRecipe.imageSrc}
                        alt={activeRecipe.imageAlt}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  {activeRecipe.imageCredit && (
                    <p className="text-[9px] ns-muted">
                      <a
                        href={activeRecipe.imageCreditUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {activeRecipe.imageCredit}
                      </a>{" "}
                      / Unsplash
                    </p>
                  )}
                </div>
              </div>
              <button
                className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] p-2 text-zinc-700 hover:bg-[var(--surface-2)]"
                onClick={closeSwapModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
              <div className="space-y-4">
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="mb-2 text-xs font-semibold tracking-wide ns-muted">
                    1. Choose a substitute
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-zinc-900">Ingredient</span>
                      <div className="relative">
                        <input
                          ref={swapSearchRef}
                          className="h-10 w-full rounded-[16px] border border-[color:var(--border)] bg-[var(--surface)] px-3 text-sm"
                          placeholder="Start typing to find an ingredient…"
                          value={swapQuery}
                          onChange={(e) => {
                            setSwapQuery(e.target.value);
                            setSwapListOpen(true);
                          }}
                          aria-label="Search and select substitute ingredient"
                        />
                        {swapListOpen && swapOptions.length > 0 && swapQuery.trim().length > 0 && (
                          <div
                            className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-[16px] border border-[color:var(--border)] bg-[var(--surface)] py-1 shadow-[var(--shadow-soft)]"
                            onMouseDown={(e) => {
                              // Prevent input blur before click handler runs.
                              e.preventDefault();
                            }}
                          >
                            {swapOptions.map((i) => {
                              const isSelected = i.id === swapToIngredientId;
                              return (
                                <button
                                  key={i.id}
                                  type="button"
                                  className={clsx(
                                    "flex w-full items-center justify-between px-3 py-2 text-left text-xs",
                                    isSelected
                                      ? "bg-[var(--accent-sky)]/10 text-zinc-900"
                                      : "text-zinc-700 hover:bg-[var(--surface-2)]",
                                  )}
                                  onClick={() => {
                                    setSwapToIngredientId(i.id);
                                    setSwapQuery(i.name);
                                    setSwapListOpen(false);
                                    setSwapPickedExplicitly(true);
                                  }}
                                >
                                  <span className="truncate font-semibold">{i.name}</span>
                                  {isSelected && (
                                    <span className="ml-2 shrink-0 text-[11px] ns-muted">
                                      Selected
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </label>
                    {swapOptions.length === 0 && (
                      <div className="text-xs ns-muted">
                        No substitutes match your diet filters or search.
                      </div>
                    )}
                  </div>
                  {activeToIngredient && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="ns-muted font-semibold">Per 100g</span>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-medium text-zinc-900">
                        {fmt0(activeToIngredient.macrosPer100g.calories)} kcal
                      </span>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-medium text-zinc-900">
                        Protein {fmt1(activeToIngredient.macrosPer100g.protein)}g
                      </span>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-medium text-zinc-900">
                        Carbs {fmt1(activeToIngredient.macrosPer100g.carbs)}g
                      </span>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-medium text-zinc-900">
                        Fat {fmt1(activeToIngredient.macrosPer100g.fat)}g
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="mb-2 text-xs font-semibold tracking-wide ns-muted">
                    2. Where to swap
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="sr-only">Where to swap</legend>
                    <label className="flex cursor-pointer items-start gap-2 rounded-[14px] border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2 text-xs">
                      <input
                        type="radio"
                        className="mt-0.5"
                        checked={swapScope === "item"}
                        onChange={() => setSwapScope("item")}
                      />
                      <span>
                        <span className="block font-semibold text-zinc-900">
                          This ingredient in this recipe only
                        </span>
                        <span className="ns-muted">
                          Swap just this line item in {activeRecipe.name}.
                        </span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-2 rounded-[14px] border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2 text-xs">
                      <input
                        type="radio"
                        className="mt-0.5"
                        checked={swapScope === "plan"}
                        onChange={() => setSwapScope("plan")}
                      />
                      <span>
                        <span className="block font-semibold text-zinc-900">
                          This ingredient everywhere today
                        </span>
                        <span className="ns-muted">
                          Replace all occurrences of {activeFromIngredient.name} across this plan.
                        </span>
                      </span>
                    </label>
                  </fieldset>
                </div>
              </div>

                <div className="rounded-[22px] border border-[color:var(--border)] bg-[var(--surface-2)] p-4">
                  <h4 className="text-sm font-semibold text-zinc-900">Preview of this meal</h4>

                  <div className="mt-3 rounded-[16px] bg-[var(--surface)] p-3">
                    {swapTarget && activeMealAfter ? (
                      (() => {
                        const previewRecipe =
                          activeMealAfter.recipes[swapTarget.recipeIndex] ?? null;
                        if (!previewRecipe) return null;
                        return (
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-semibold ns-muted">
                                Ingredients after swap
                              </div>
                              <div className="mt-2 space-y-1">
                                {previewRecipe.items.map((item, idx) => {
                                  const ingredient = ingredientsById.get(item.ingredientId);
                                  if (!ingredient) return null;
                                  return (
                                    <div
                                      key={`${previewRecipe.id}:${idx}`}
                                      className="flex items-center justify-between text-xs"
                                    >
                                      <span className="truncate text-zinc-900">
                                        {ingredient.name}
                                      </span>
                                      <span className="ns-muted">{formatAmount(item.grams)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {activeMealAfterTotals && (
                              <div className="pt-2 text-xs">
                                <span className="font-semibold text-zinc-900">
                                  Meal calories today:
                                </span>{" "}
                                {fmt0(activeMealAfterTotals.calories)} kcal
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs ns-muted">
                        Choose a substitute to see how this meal will look.
                      </p>
                    )}
                  </div>

                {activeToIngredient && activeAfterItem?.grams === 0 && (
                  <p className="mt-3 text-sm text-amber-700">
                    We don’t have enough data to keep calories similar for this swap.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-[color:var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs ns-muted">
                Press Enter to swap, or Esc to cancel.
              </p>
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
                  applySwap({
                    mealId: activeMeal.id,
                    recipeIndex: swapTarget.recipeIndex,
                    itemIndex: swapTarget.itemIndex,
                    toIngredientId: swapToIngredientId,
                    scope: swapScope,
                  });
                  closeSwapModal();
                }}
              >
                Swap ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))]">
          <div className="ns-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">{toast.title}</div>
                {toast.message && <div className="mt-1 text-sm ns-muted">{toast.message}</div>}
              </div>
              <button
                type="button"
                className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-[var(--surface-2)]"
                onClick={() => setToast(null)}
              >
                Dismiss
              </button>
            </div>
            {toast.onAction && toast.actionLabel && (
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="ns-btn h-9 bg-[var(--surface)] px-4 text-xs text-[color:var(--foreground)] hover:bg-[var(--surface-2)]"
                  onClick={() => toast.onAction?.()}
                >
                  {toast.actionLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


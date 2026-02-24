import "server-only";

import type { MealPlan, Meal, Recipe } from "@/lib/nutrition/types";

export type StockImageResult = {
  url: string;
  alt: string;
  credit: string;
  creditUrl: string;
};

type UnsplashSearchResult = {
  results?: Array<{
    urls?: { regular?: string };
    description?: string | null;
    alt_description?: string | null;
    user?: {
      name?: string | null;
      links?: { html?: string } | null;
    } | null;
  }>;
};

export async function resolveStockImage(query: string): Promise<StockImageResult | null> {
  const key = (process.env.UNSPLASH_ACCESS_KEY ?? "").trim();
  if (!key) return null;

  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(trimmed)}&per_page=1`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 86400 },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  let data: UnsplashSearchResult;
  try {
    data = (await res.json()) as UnsplashSearchResult;
  } catch {
    return null;
  }

  const first = data.results?.[0];
  if (!first?.urls?.regular) return null;

  const credit = first.user?.name?.trim() ?? "Unknown";
  const creditHtml = first.user?.links?.html ?? "https://unsplash.com";
  const creditUrl = creditHtml.includes("?")
    ? `${creditHtml}&utm_source=nutriswitch&utm_medium=referral`
    : `${creditHtml}?utm_source=nutriswitch&utm_medium=referral`;

  return {
    url: first.urls.regular,
    alt: (first.description ?? first.alt_description ?? trimmed).slice(0, 200) || trimmed,
    credit,
    creditUrl,
  };
}

/**
 * Resolves recipe images for every recipe in a plan (all days). Returns a new MealPlan
 * with imageSrc/imageAlt/imageCredit/imageCreditUrl set where Unsplash returns a result.
 * Use this for any plan source (demo, share link, or future DB/upload) before passing to the UI.
 */
export async function resolvePlanForDisplay(plan: MealPlan): Promise<MealPlan> {
  const days = await Promise.all(
    plan.days.map(async (day) => ({
      ...day,
      meals: await Promise.all(
        day.meals.map(async (meal): Promise<Meal> => ({
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
      ),
    })),
  );
  return { ...plan, days };
}

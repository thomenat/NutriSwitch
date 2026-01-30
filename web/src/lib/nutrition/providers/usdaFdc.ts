import "server-only";

import type { Macros } from "@/lib/nutrition/types";
import type { FoodDetails, FoodHit, NutritionProvider } from "@/lib/nutrition/provider";

const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

type FdcSearchResponse = {
  foods?: Array<{
    fdcId: number;
    description: string;
    dataType?: string;
  }>;
};

type FdcFoodResponse = {
  fdcId: number;
  description?: string;
  foodNutrients?: Array<{
    amount?: number;
    nutrient?: {
      name?: string;
      unitName?: string;
      number?: string;
    };
  }>;
};

const foodCache = new Map<number, Promise<FdcFoodResponse>>();
const searchCache = new Map<string, Promise<FdcSearchResponse>>();

function buildUrl(path: string, apiKey: string, params?: Record<string, string>) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return url.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    // Cache for a day (fine for demo; adjust later).
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`USDA FDC request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

function normalizeMacrosPer100g(food: FdcFoodResponse): Macros {
  const nutrients = food.foodNutrients ?? [];

  const byName = (name: string) =>
    nutrients.find((n) => (n.nutrient?.name ?? "").toLowerCase() === name.toLowerCase());

  // Energy exists as kcal or kJ depending on food; prefer KCAL if present.
  const energyKcal =
    nutrients.find(
      (n) =>
        (n.nutrient?.name ?? "").toLowerCase() === "energy" &&
        (n.nutrient?.unitName ?? "").toLowerCase() === "kcal",
    ) ??
    nutrients.find((n) => (n.nutrient?.name ?? "").toLowerCase() === "energy");

  const protein = byName("Protein");
  const carbs = byName("Carbohydrate, by difference");
  const fat = byName("Total lipid (fat)");

  const calories = Number(energyKcal?.amount ?? 0);

  return {
    calories: Number.isFinite(calories) ? calories : 0,
    protein: Number(protein?.amount ?? 0) || 0,
    carbs: Number(carbs?.amount ?? 0) || 0,
    fat: Number(fat?.amount ?? 0) || 0,
  };
}

export class UsdaFdcProvider implements NutritionProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    // Per USDA docs, DEMO_KEY is allowed for exploration with lower limits.
    this.apiKey = apiKey || process.env.FDC_API_KEY || "DEMO_KEY";
  }

  async search(query: string): Promise<FoodHit[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const key = trimmed.toLowerCase();
    const resp =
      searchCache.get(key) ??
      searchCache
        .set(
          key,
          fetchJson<FdcSearchResponse>(
            buildUrl("/foods/search", this.apiKey, {
              query: trimmed,
              pageSize: "10",
              dataType: "Foundation,SR Legacy",
            }),
          ),
        )
        .get(key)!;

    const json = await resp;
    return (json.foods ?? []).map((f) => ({
      externalId: String(f.fdcId),
      description: f.description,
      dataType: f.dataType,
    }));
  }

  async getFoodById(externalId: string): Promise<FoodDetails> {
    const fdcId = Number(externalId);
    if (!Number.isFinite(fdcId)) throw new Error(`Invalid fdcId: ${externalId}`);

    const cached =
      foodCache.get(fdcId) ??
      foodCache
        .set(fdcId, fetchJson<FdcFoodResponse>(buildUrl(`/food/${fdcId}`, this.apiKey)))
        .get(fdcId)!;

    const json = await cached;
    return { externalId: String(json.fdcId), description: json.description, raw: json };
  }

  async getMacrosPer100g(externalId: string): Promise<Macros> {
    const details = await this.getFoodById(externalId);
    return normalizeMacrosPer100g(details.raw as FdcFoodResponse);
  }
}


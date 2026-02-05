import "server-only";

import type { Ingredient } from "@/lib/nutrition/types";
import {
  UsdaFdcAuthError,
  UsdaFdcMissingApiKeyError,
  UsdaFdcProvider,
  UsdaFdcRateLimitedError,
} from "@/lib/nutrition/providers/usdaFdc";
import { FDC_MAP } from "@/data/fdcMap";

const resolvedIdCache = new Map<string, string>();

export async function loadIngredientsWithUsda(
  baseIngredients: Ingredient[],
): Promise<{
  ingredients: Ingredient[];
  apiUsedFor: number;
  apiKeyMode: "configured" | "demo_key";
  status: "ok" | "missing_key" | "rate_limited" | "auth_error" | "error";
}> {
  const apiKeyMode = process.env.FDC_API_KEY ? "configured" : "demo_key";
  let provider: UsdaFdcProvider;
  try {
    provider = new UsdaFdcProvider();
  } catch (err) {
    // In production we require an explicit key; in demo/preview, provider will fall back to DEMO_KEY.
    if (err instanceof UsdaFdcMissingApiKeyError) {
      return {
        ingredients: baseIngredients,
        apiUsedFor: 0,
        apiKeyMode,
        status: "missing_key",
      };
    }
    return { ingredients: baseIngredients, apiUsedFor: 0, apiKeyMode, status: "error" };
  }

  const byId = new Map(baseIngredients.map((i) => [i.id, i] as const));
  let apiUsedFor = 0;
  let hadRateLimit = false;
  let hadAuthError = false;
  let hadError = false;

  const nextIngredients: Ingredient[] = await Promise.all(
    baseIngredients.map(async (ing) => {
      const mapping = FDC_MAP.find((m) => m.ingredientId === ing.id);
      if (!mapping) return ing;

      try {
        const externalId =
          mapping.fdcId !== undefined
            ? String(mapping.fdcId)
            : resolvedIdCache.get(mapping.ingredientId) ??
              (await (async () => {
                const hits = await provider.search(mapping.query);
                const first = hits[0];
                if (!first) return null;
                resolvedIdCache.set(mapping.ingredientId, first.externalId);
                return first.externalId;
              })());

        if (!externalId) return ing;

        const macros = await provider.getMacrosPer100g(externalId);
        apiUsedFor += 1;
        return { ...ing, macrosPer100g: macros, source: "usdaFdc" };
      } catch (err) {
        if (err instanceof UsdaFdcRateLimitedError) hadRateLimit = true;
        else if (err instanceof UsdaFdcAuthError) hadAuthError = true;
        else hadError = true;
        // Fallback to local seed values.
        return ing;
      }
    }),
  );

  // Keep stable ordering and ensure any newly added ingredient IDs still exist.
  for (const i of nextIngredients) byId.set(i.id, i);

  const status: "ok" | "missing_key" | "rate_limited" | "auth_error" | "error" =
    hadRateLimit ? "rate_limited" : hadAuthError ? "auth_error" : hadError ? "error" : "ok";

  return { ingredients: nextIngredients, apiUsedFor, apiKeyMode, status };
}


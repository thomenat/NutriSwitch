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
  errorDetail?: string;
}> {
  const apiKeyMode = process.env.FDC_API_KEY ? "configured" : "demo_key";
  let provider: UsdaFdcProvider;
  try {
    provider = new UsdaFdcProvider();
  } catch (err) {
    if (err instanceof UsdaFdcMissingApiKeyError) {
      return {
        ingredients: baseIngredients,
        apiUsedFor: 0,
        apiKeyMode,
        status: "missing_key",
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[loadIngredientsWithUsda] provider init failed:", msg);
    return { ingredients: baseIngredients, apiUsedFor: 0, apiKeyMode, status: "error", errorDetail: msg };
  }

  const byId = new Map(baseIngredients.map((i) => [i.id, i] as const));
  let apiUsedFor = 0;
  let hadRateLimit = false;
  let hadAuthError = false;
  let hadError = false;
  let firstErrorDetail: string | undefined;

  function captureError(err: unknown, ingId: string): string {
    const msg =
      (err instanceof Error && err.message) || (typeof err === "string" && err) || String(err);
    const detail = (msg && msg.trim()) || "Network or server error (check server logs)";
    if (!firstErrorDetail) {
      firstErrorDetail = detail;
      console.error("[loadIngredientsWithUsda] USDA API error for", ingId, err);
    }
    return detail;
  }

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const THROTTLE_MS = 120; // Space out requests to avoid DEMO_KEY rate limit (30/hour)

  const nextIngredients: Ingredient[] = [];
  for (const ing of baseIngredients) {
    const mapping = FDC_MAP.find((m) => m.ingredientId === ing.id);
    if (!mapping) {
      nextIngredients.push(ing);
      continue;
    }
    await delay(THROTTLE_MS);
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

      if (!externalId) {
        nextIngredients.push(ing);
        continue;
      }

      const macros = await provider.getMacrosPer100g(externalId);
      apiUsedFor += 1;
      nextIngredients.push({ ...ing, macrosPer100g: macros, source: "usdaFdc" });
    } catch (err) {
      if (err instanceof UsdaFdcRateLimitedError) hadRateLimit = true;
      else if (err instanceof UsdaFdcAuthError) hadAuthError = true;
      else {
        hadError = true;
        captureError(err, ing.id);
      }
      nextIngredients.push(ing);
    }
  }

  for (const i of nextIngredients) byId.set(i.id, i);

  const status: "ok" | "missing_key" | "rate_limited" | "auth_error" | "error" =
    hadRateLimit ? "rate_limited" : hadAuthError ? "auth_error" : hadError ? "error" : "ok";

  return {
    ingredients: nextIngredients,
    apiUsedFor,
    apiKeyMode,
    status,
    ...(status === "error" && { errorDetail: firstErrorDetail ?? "Unknown error (check server logs)" }),
  };
}


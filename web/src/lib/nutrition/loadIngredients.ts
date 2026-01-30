import "server-only";

import type { Ingredient } from "@/lib/nutrition/types";
import { UsdaFdcProvider } from "@/lib/nutrition/providers/usdaFdc";
import { FDC_MAP } from "@/data/fdcMap";

const resolvedIdCache = new Map<string, string>();

export async function loadIngredientsWithUsda(
  baseIngredients: Ingredient[],
): Promise<{
  ingredients: Ingredient[];
  apiUsedFor: number;
  apiKeyMode: "configured" | "demo_key";
}> {
  const provider = new UsdaFdcProvider();
  const apiKeyMode = process.env.FDC_API_KEY ? "configured" : "demo_key";

  const byId = new Map(baseIngredients.map((i) => [i.id, i] as const));
  let apiUsedFor = 0;

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
      } catch {
        // Fallback to local seed values.
        return ing;
      }
    }),
  );

  // Keep stable ordering and ensure any newly added ingredient IDs still exist.
  for (const i of nextIngredients) byId.set(i.id, i);

  return { ingredients: nextIngredients, apiUsedFor, apiKeyMode };
}


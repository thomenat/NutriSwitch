import type { Macros } from "./types";

export type FoodHit = {
  externalId: string;
  description: string;
  dataType?: string;
};

export type FoodDetails = {
  externalId: string;
  description?: string;
  raw: unknown;
};

export interface NutritionProvider {
  search(query: string): Promise<FoodHit[]>;
  getFoodById(externalId: string): Promise<FoodDetails>;
  getMacrosPer100g(externalId: string): Promise<Macros>;
}


export type FdcMapEntry = {
  ingredientId: string;
  /**
   */
  fdcId?: number;
  query: string;
};

// Prefer fdcId when known to avoid search calls (saves 1 request per ingredient; DEMO_KEY is 30/hour).
export const FDC_MAP: FdcMapEntry[] = [
  { ingredientId: "banana", fdcId: 173944, query: "banana raw" },
  { ingredientId: "oats", fdcId: 173904, query: "oats rolled dry" },
  { ingredientId: "greek-yogurt-0", fdcId: 170903, query: "yogurt greek nonfat plain" },
  { ingredientId: "rice-white-cooked", fdcId: 169756, query: "rice white long-grain cooked" },
  { ingredientId: "broccoli-steamed", fdcId: 170379, query: "broccoli cooked steamed" },
  { ingredientId: "olive-oil", fdcId: 173924, query: "olive oil" },
  { ingredientId: "chicken-breast-cooked", fdcId: 171477, query: "chicken breast cooked roasted" },
  { ingredientId: "salmon-cooked", fdcId: 175168, query: "salmon cooked" },
  { ingredientId: "sweet-potato-baked", fdcId: 168482, query: "sweet potato baked" },
  { ingredientId: "tofu-firm", fdcId: 172475, query: "tofu firm raw" },
];


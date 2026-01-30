export type FdcMapEntry = {
  ingredientId: string;
  /**
   */
  fdcId?: number;
  query: string;
};

export const FDC_MAP: FdcMapEntry[] = [
  { ingredientId: "banana", query: "banana raw" },
  { ingredientId: "oats", query: "oats rolled dry" },
  { ingredientId: "greek-yogurt-0", query: "yogurt greek nonfat plain" },
  { ingredientId: "rice-white-cooked", query: "rice white long-grain cooked" },
  { ingredientId: "broccoli-steamed", query: "broccoli cooked steamed" },
  { ingredientId: "olive-oil", query: "olive oil" },
  { ingredientId: "chicken-breast-cooked", query: "chicken breast cooked roasted" },
  { ingredientId: "salmon-cooked", query: "salmon cooked" },
  { ingredientId: "sweet-potato-baked", query: "sweet potato baked" },
];


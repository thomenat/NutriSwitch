type KitchenUnit = {
  label: string; // e.g. "cup", "tbsp", "tsp", "medium"
  gramsPerUnit: number;
  /** preferred rounding step for display (e.g. 0.25 cups) */
  step?: number;
};

type KitchenMapping = Record<string, KitchenUnit[]>;

// NOTE: These are approximations meant for UX, not clinical precision.
// Later, you can source these from a reliable nutrition API + density database.
const KITCHEN_UNITS: KitchenMapping = {
  oats: [
    { label: "cup", gramsPerUnit: 80, step: 0.25 },
    { label: "tbsp", gramsPerUnit: 5, step: 0.5 },
  ],
  banana: [{ label: "medium", gramsPerUnit: 118, step: 0.5 }],
  "greek-yogurt-0": [
    { label: "cup", gramsPerUnit: 245, step: 0.25 },
    { label: "tbsp", gramsPerUnit: 15, step: 0.5 },
  ],
  "rice-white-cooked": [{ label: "cup", gramsPerUnit: 158, step: 0.25 }],
  "broccoli-steamed": [{ label: "cup", gramsPerUnit: 91, step: 0.25 }],
  "olive-oil": [
    { label: "tbsp", gramsPerUnit: 13.5, step: 0.5 },
    { label: "tsp", gramsPerUnit: 4.5, step: 0.5 },
  ],
  "chicken-breast-cooked": [{ label: "oz", gramsPerUnit: 28.35, step: 0.5 }],
  "salmon-cooked": [{ label: "oz", gramsPerUnit: 28.35, step: 0.5 }],
  "sweet-potato-baked": [{ label: "medium", gramsPerUnit: 130, step: 0.5 }],
};

function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(value)) return 0;
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

function formatQuarterFraction(value: number): string {
  // Assumes value is rounded to 0.25 steps.
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  const fracMap: Record<string, string> = {
    "0": "",
    "0.25": "1/4",
    "0.5": "1/2",
    "0.75": "3/4",
  };
  const key = frac.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  const fracStr = fracMap[key] ?? "";
  if (whole === 0) return fracStr || "0";
  if (!fracStr) return `${whole}`;
  return `${whole} ${fracStr}`;
}

function formatCount(value: number, step: number | undefined): string {
  if (!Number.isFinite(value)) return "0";
  if ((step ?? 0) === 0.25) return formatQuarterFraction(value);
  // Generic: 1 decimal if needed
  const fixed = Math.abs(value - Math.round(value)) < 1e-9 ? `${Math.round(value)}` : value.toFixed(1);
  return fixed.replace(/\.0$/, "");
}

function pluralize(label: string, count: number): string {
  // Minimal plural rules for demo.
  if (label === "oz") return "oz";
  if (label === "tsp") return "tsp";
  if (label === "tbsp") return "tbsp";
  if (label === "cup") return count === 1 ? "cup" : "cups";
  if (label === "medium") return count === 1 ? "medium" : "medium";
  return label;
}

export function kitchenApprox(ingredientId: string, grams: number): string | null {
  const units = KITCHEN_UNITS[ingredientId];
  if (!units || units.length === 0) return null;
  if (!Number.isFinite(grams) || grams <= 0) return null;

  // Choose a unit that yields a human-friendly number (roughly 0.5–6 units).
  const candidates = units
    .map((u) => {
      const raw = grams / u.gramsPerUnit;
      const step = u.step ?? 0.5;
      const rounded = roundToStep(raw, step);
      const penalty =
        (raw < 0.35 ? 10 : 0) +
        (raw > 8 ? 10 : 0) +
        Math.abs(raw - rounded) * 2;
      return { unit: u, raw, rounded, penalty };
    })
    .sort((a, b) => a.penalty - b.penalty);

  const best = candidates[0];
  if (!best) return null;
  if (best.rounded <= 0) return null;

  const countStr = formatCount(best.rounded, best.unit.step);
  const label = pluralize(best.unit.label, best.rounded);
  return `${countStr} ${label}`;
}


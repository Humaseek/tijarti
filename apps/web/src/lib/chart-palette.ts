/**
 * Semantic chart palette — everything income-related uses a distinct green hue,
 * everything expense/outflow-related uses a distinct red hue.
 *
 * Each palette entry is a visually distinct color that still reads as
 * "green" (income) or "red" (expense) — so adjacent slices/bars are
 * always easy to tell apart at a glance (not subtle tone variations).
 *
 * Use these constants (or the helper functions) everywhere charts or numbers
 * are colored so the brand meaning stays consistent.
 */

/**
 * Six distinct GREEN hues — forest, emerald, lime, teal, mint, olive.
 * All read as "green" but are visually distinguishable even for users
 * with limited color discrimination.
 */
export const INCOME_PALETTE = [
  "#0F6E56", // 0 — forest (brand primary green, muted dark)
  "#10B981", // 1 — emerald (bright saturated green)
  "#84CC16", // 2 — lime (yellow-green)
  "#0D9488", // 3 — teal (blue-green)
  "#A7F3D0", // 4 — mint (very light green)
  "#365314", // 5 — dark olive (very dark yellow-green)
] as const;

/**
 * Six distinct MUTED red hues — maroon, burgundy, wine, rose, crimson, dusty rose.
 * All stay in the red family (no bright/vivid reds, no orange) — just different
 * dark and muted tones so adjacent slices read as clearly different without
 * the eye-fatigue of saturated bright red.
 */
export const EXPENSE_PALETTE = [
  "#A32D2D", // 0 — brand maroon (muted dark red)
  "#7F1D1D", // 1 — deep burgundy (very dark red)
  "#881337", // 2 — wine (dark pinkish-red)
  "#6B2828", // 3 — brown-red (very dark, almost brown)
  "#9F1239", // 4 — crimson-wine (dark rose)
  "#B45454", // 5 — dusty rose (muted lighter red)
] as const;

/**
 * Ordering used when spreading N slices across the palette.
 * Each INDEX_ORDER[i] is the palette position to pick for the i-th slice,
 * arranged so adjacent slices always land on VERY different hues.
 *
 * Reading for a typical pie (biggest slice first):
 *   1st = forest green / brand red        (darkest, most "serious")
 *   2nd = emerald / bright red            (maximum contrast with 1st)
 *   3rd = lime / coral                    (warm tone shift)
 *   4th = teal / brick                    (blue-ish / orange-ish shift)
 *   5th = mint / rose                     (very light vs pink)
 *   6th = olive / pale                    (extreme edge of family)
 */
const CONTRAST_ORDER = [0, 1, 2, 3, 4, 5] as const;

/** Neutral fallback palette for non-financial categorical data. */
export const NEUTRAL_PALETTE = [
  "rgb(var(--tj-primary))",
  "#2563A6",
  "#BA7517",
  "#6B4B8F",
  "#00897B",
  "#C2185B",
  "#8B5CF6",
  "#A89F91",
] as const;

export type Polarity = "income" | "expense" | "neutral";

/** Pick a color from the income palette by index (wraps). */
export function incomeColor(i = 0) {
  return INCOME_PALETTE[i % INCOME_PALETTE.length];
}

/** Pick a color from the expense palette by index (wraps). */
export function expenseColor(i = 0) {
  return EXPENSE_PALETTE[i % EXPENSE_PALETTE.length];
}

/**
 * Produce a list of N distinct colors for an income or expense breakdown.
 * Colors are pulled in a contrast-maximizing order — so the 2nd slice is
 * never a slightly-lighter version of the 1st.
 *
 * If N > palette size, the palette wraps (which should be rare — breakdowns
 * with >6 slices are usually better shown as a table or chart).
 */
export function shadesFor(polarity: Polarity, n: number): string[] {
  if (polarity === "neutral") {
    return Array.from({ length: n }, (_, i) => NEUTRAL_PALETTE[i % NEUTRAL_PALETTE.length]);
  }
  const src = polarity === "income" ? INCOME_PALETTE : EXPENSE_PALETTE;
  return Array.from({ length: n }, (_, i) => {
    const orderIdx = CONTRAST_ORDER[i % CONTRAST_ORDER.length];
    return src[orderIdx % src.length];
  });
}

/**
 * Apply income/expense coloring to a list of {label, value} entries.
 * Items are assumed already ordered (typically largest first).
 */
export function paint<T extends { value: number }>(
  items: T[],
  polarity: Polarity
): (T & { color: string })[] {
  const colors = shadesFor(polarity, items.length);
  return items.map((it, i) => ({ ...it, color: colors[i] }));
}

/**
 * Semantic single-color accessors.
 * Use these when you need ONE green or ONE red (not a full palette).
 * `dark` = the primary brand tone; `base` = bright/saturated;
 * `medium` = lime/coral (warm shift); `light` = mint/pale.
 */
export const INCOME = {
  dark: INCOME_PALETTE[0],    // forest — for single "income" bars
  base: INCOME_PALETTE[1],    // emerald — high-contrast alternative
  medium: INCOME_PALETTE[2],  // lime
  teal: INCOME_PALETTE[3],    // teal
  light: INCOME_PALETTE[4],   // mint (pale)
  darkest: INCOME_PALETTE[5], // dark olive
} as const;

export const EXPENSE = {
  dark: EXPENSE_PALETTE[0],    // brand maroon
  base: EXPENSE_PALETTE[1],    // deep burgundy
  medium: EXPENSE_PALETTE[2],  // wine
  brick: EXPENSE_PALETTE[3],   // brown-red (very dark)
  rose: EXPENSE_PALETTE[4],    // crimson-wine
  light: EXPENSE_PALETTE[5],   // dusty rose (lighter)
  darkest: EXPENSE_PALETTE[3], // brown-red (darkest alt)
} as const;

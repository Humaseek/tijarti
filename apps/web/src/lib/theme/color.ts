/**
 * Primary color utilities — ported from prototype store.js.
 * Tijarti primary is user-customizable at runtime via ColorPicker.
 * CSS variable `--tj-primary` holds space-separated RGB values.
 */

export type Rgb = { r: number; g: number; b: number };

export const TIJARTI_PRIMARY_DEFAULT_HEX = "#5B9BD5"; // Teal Blue
export const PRIMARY_STORAGE_KEY = "tijarti_primary_color";

// ─── HSL ↔ RGB ───────────────────────────────────────────────────────────────
export function rgbToHsl({ r, g, b }: Rgb): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ─── HEX ─────────────────────────────────────────────────────────────────────
export function parseHex(hex: string): Rgb | null {
  const h = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const hx = (n: number) =>
    Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return "#" + hx(r) + hx(g) + hx(b);
}

/** Derive a slightly darker + more saturated variant for light-mode contrast. */
export function deriveLightVariant(dark: Rgb): Rgb {
  const [h, s, l] = rgbToHsl(dark);
  return hslToRgb(h, Math.min(1, s * 1.05), Math.max(0.22, l - 0.12));
}

/** Format RGB for CSS variable (space-separated, no parens, for Tailwind alpha). */
export function rgbToCssVar({ r, g, b }: Rgb): string {
  return `${r} ${g} ${b}`;
}

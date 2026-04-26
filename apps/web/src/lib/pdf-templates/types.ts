/**
 * Template parser interface for known invoice/receipt formats.
 *
 * Each template has:
 *   - id:     stable identifier
 *   - name:   human-readable label (Arabic)
 *   - detect: returns true if this template applies to the given text
 *   - parse:  extracts the invoice fields
 *
 * Templates are tried in order. The first one whose `detect()` returns
 * true is used. If none match, the generic heuristic parser kicks in.
 *
 * For each template added, accuracy on its specific format approaches
 * 100% — far better than what generic regex can achieve.
 */

import type { ExtractedInvoice } from "../pdf-extract";

export interface TemplateParser {
  id: string;
  name: string;
  /** Quick detection — should be cheap (substring checks). */
  detect: (text: string) => boolean;
  /** Full extraction. May still return partial data on edge cases. */
  parse: (text: string, filename?: string) => ExtractedInvoice;
}

/** Helper: scan for the first regex match and return the captured group. */
export function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  if (!m || !m[1]) return null;
  return m[1];
}

/** Parse a flexible-format number string (handles "1,234.56" and "1.234,56"). */
export function parseAmount(s: string | null | undefined): number {
  if (!s) return 0;
  let cleaned = s.replace(/[\u00a0\s₪]/g, "");
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  if (lastDot !== -1 && lastComma !== -1) {
    if (lastDot > lastComma) cleaned = cleaned.replace(/,/g, "");
    else cleaned = cleaned.replace(/\./g, "").replace(/,(\d{1,2})$/, ".$1");
  } else if (lastComma !== -1 && lastDot === -1) {
    const afterComma = cleaned.length - lastComma - 1;
    if (afterComma === 1 || afterComma === 2) {
      cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }
  const v = parseFloat(cleaned);
  return isFinite(v) ? Math.round(v * 100) / 100 : 0;
}

/** Convert "DD/MM/YYYY" → "YYYY-MM-DD". Returns "" on failure. */
export function isoDate(dd: string, mm: string, yyyy: string): string {
  const d = parseInt(dd, 10), m = parseInt(mm, 10), y = parseInt(yyyy, 10);
  if (!d || !m || !y || d > 31 || m > 12) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Generic Israeli e-invoice templates — for providers we don't have
 * dedicated templates for yet, but follow common patterns.
 *
 * Includes detection signatures for:
 *   - EZcount / EasyCount
 *   - Greeninvoice (separate from Morning, though they merged)
 *   - Cardcom
 *   - Bilfon
 *   - Invoice4u
 *   - Hashavshevet (חשבשבת)
 *   - YPay
 *
 * Each shares the standard Israeli invoice structure:
 *   - Header with "חשבונית מס", "קבלה", or "חשבונית מס קבלה"
 *   - Issuer details (top-right in Hebrew RTL)
 *   - Recipient ("לכבוד:")
 *   - Line items
 *   - Totals with "סה״כ" labels
 *   - Footer with provider attribution
 *
 * They use the same anchor-based extractor as the dedicated parsers,
 * since the Israeli invoice format is fairly standardized.
 */

import type { TemplateParser } from "./types";
import { parseAmount, isoDate } from "./types";
import type { ExtractedInvoice } from "../pdf-extract";
import type { ExpenseCategory } from "@/lib/store/types";
import { suggestCategory } from "@/lib/auto-category";

// ─── Provider detection signatures ─────────────────────────────────────────

interface ProviderSig {
  id: string;
  name: string;
  markers: RegExp[];
}

const PROVIDERS: ProviderSig[] = [
  {
    id: "ezcount",
    name: "EZcount / EasyCount",
    markers: [/EZcount/i, /EasyCount/i, /ezcount\.co\.il/i, /easycount\.co\.il/i],
  },
  {
    id: "greeninvoice",
    name: "Greeninvoice (חשבונית ירוקה)",
    markers: [/greeninvoice\.co\.il/i, /Green\s*Invoice/i],
  },
  {
    id: "cardcom",
    name: "Cardcom",
    markers: [/cardcom\.co\.il/i, /\bCardcom\b/i],
  },
  {
    id: "bilfon",
    name: "Bilfon",
    markers: [/bilfon\.co\.il/i, /\bBilfon\b/i],
  },
  {
    id: "invoice4u",
    name: "Invoice4u",
    markers: [/invoice4u\.co\.il/i, /\bInvoice4U\b/i],
  },
  {
    id: "hashavshevet",
    name: "חשבשבת / Hashavshevet",
    markers: [/חשבשבת/, /hashavshevet/i, /h-shevet/i],
  },
  {
    id: "ypay",
    name: "YPay",
    markers: [/ypay\.co\.il/i, /\bYPay\b/i],
  },
];

// ─── Generic Israeli invoice parser ────────────────────────────────────────
// All providers above use a common Hebrew invoice structure, so they share
// this anchor-based extractor.

function parseGenericIsraeliInvoice(providerName: string) {
  return function (text: string, filename = ""): ExtractedInvoice {
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

    // Total
    let amount = 0;
    for (const line of lines) {
      const m =
        line.match(/סה[״"]?כ\s+לתשלום\s*[:\-]?\s*[₪₪]?\s*([\d,.\u00a0]+)/) ||
        line.match(/סה[״"]?כ\s+כולל\s+מע[״"]?מ\s*[:\-]?\s*[₪₪]?\s*([\d,.\u00a0]+)/) ||
        line.match(/סה[״"]?כ\s*[:\-]?\s*[₪₪]?\s*([\d,.\u00a0]+)/) ||
        line.match(/total\s*[:\-]?\s*[₪₪]?\s*([\d,.\u00a0]+)/i);
      if (m) {
        const v = parseAmount(m[1]);
        if (v > 0) amount = Math.max(amount, v);
      }
    }
    if (amount === 0) {
      const cands: number[] = [];
      const re = /[₪₪]\s*([\d,.\u00a0]+)|([\d,.\u00a0]+)\s*[₪₪]/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        const raw = m[1] || m[2];
        if (raw && /[.,]\d{1,2}/.test(raw)) {
          const v = parseAmount(raw);
          if (v >= 1) cands.push(v);
        }
      }
      if (cands.length) amount = Math.max(...cands);
    }

    // Date
    let date = "";
    for (const line of lines) {
      const m = line.match(/תאריך\s*[:\-]?\s*(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
      if (m) {
        date = isoDate(m[1], m[2], m[3]);
        if (date) break;
      }
    }
    if (!date) {
      for (const line of lines) {
        if (/הופק|מופעל|פעם/i.test(line)) continue;
        const m = line.match(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
        if (m) {
          date = isoDate(m[1], m[2], m[3]);
          if (date) break;
        }
      }
    }
    if (!date) date = new Date().toISOString().slice(0, 10);

    // Vendor
    let vendor = "";
    let stopAtRecipient = false;
    for (const line of lines) {
      if (stopAtRecipient) break;
      if (/לכבוד/.test(line)) { stopAtRecipient = true; break; }
      if (/חשבונית|קבלה|מקור/.test(line)) continue;
      if (/^עוסק\s+(פטור|מורשה)/.test(line)) continue;
      if (/^טלפון|^phone|^tel\b/i.test(line)) continue;
      if (/@/.test(line)) continue;
      if (/^(רח'|שד'|רחוב|street|st\.)/i.test(line)) continue;
      if (/^\d/.test(line)) continue;
      if (/הופק|מופעל|powered\s+by/i.test(line)) continue;
      if (/^מספר|^תאריך|^שעה|^דף/i.test(line)) continue;
      if ((line.match(/[,،]/g) || []).length >= 2) continue;
      const letters = (line.match(/[A-Za-z\u0590-\u05ff\u0600-\u06ff]/g) || []).length;
      if (letters < 2) continue;
      if (line.length > 50) continue;
      if (line.split(/\s+/).length > 5) continue;
      vendor = line;
      break;
    }
    if (!vendor) vendor = filename.replace(/\.pdf$/i, "").slice(0, 60) || "—";

    // Category
    const cleanedForCategory = lines
      .filter((l) => !/^(טלפון|tel|phone)\s*[:\-]?\s*[\d\s+\-()]+$/i.test(l))
      .filter((l) => !/@/.test(l))
      .filter((l) => !new RegExp(providerName, "i").test(l))
      .join(" ");
    let category: ExpenseCategory = "أخرى";
    const sug = suggestCategory(cleanedForCategory.slice(0, 800));
    if (sug) category = sug as ExpenseCategory;

    return { amount, vendor, date, category, rawText: text };
  };
}

export const genericIsraeliTemplates: TemplateParser[] = PROVIDERS.map((p) => ({
  id: p.id,
  name: p.name,
  detect: (text: string) => p.markers.some((re) => re.test(text)),
  parse: parseGenericIsraeliInvoice(p.name),
}));

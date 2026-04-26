/**
 * Rivhit (תוכנת ריווחית) template parser.
 *
 * Rivhit is a popular Israeli accounting software. Invoices have these
 * distinctive markers:
 *   - Footer: "מסמך זה הופק ע"י תוכנת ריווחית - ניהול עסקי www.rivhit.co.il"
 *   - Tabular structure with explicit סה"כ rows
 *   - Header "חשבונית מס קבלה מספר: <number>"
 *
 * The PDF text comes out heavily reordered due to RTL + table cells, so
 * we rely on anchor-based extraction:
 *   - "סה"כ לתשלום: <amount>" — the explicit final total
 *   - "תאריך: <DD/MM/YYYY>" — the invoice date label
 *   - The vendor name is in the issuer block, distinguishable from the
 *     services description by being the FIRST short line.
 */

import type { TemplateParser } from "./types";
import { parseAmount, isoDate } from "./types";
import type { ExtractedInvoice } from "../pdf-extract";
import type { ExpenseCategory } from "@/lib/store/types";
import { suggestCategory } from "@/lib/auto-category";

const RIVHIT_MARKERS = [
  /\brivhit\.co\.il\b/i,
  /תוכנת\s+ריווחית/,
  /מסמך\s+זה\s+הופק\s+ע[״"]י\s+תוכנת\s+ריווחית/,
];

function detectRivhit(text: string): boolean {
  return RIVHIT_MARKERS.some((m) => m.test(text));
}

function parseRivhit(text: string, filename = ""): ExtractedInvoice {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  // ─── Total amount ────────────────────────────────────────────────────────
  // Rivhit explicitly labels the final total as "סה"כ לתשלום:" — extract
  // the number after it. Fall back to the largest decimal-shekel amount.
  let amount = 0;
  for (const line of lines) {
    const m = line.match(/סה[״"]?כ\s+לתשלום\s*[:\-]?\s*[₪₪]?\s*([\d,.\u00a0]+)/);
    if (m) {
      amount = parseAmount(m[1]);
      if (amount > 0) break;
    }
  }
  if (amount === 0) {
    // Fallback: largest decimal amount in the document
    const cands: number[] = [];
    const re = /(\d{1,3}(?:[,.\u00a0]\d{3})*[,.]\d{1,2})/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const v = parseAmount(m[1]);
      if (v >= 1) cands.push(v);
    }
    if (cands.length) amount = Math.max(...cands);
  }

  // ─── Date ────────────────────────────────────────────────────────────────
  // "תאריך: DD/MM/YYYY" is the invoice date.
  let date = "";
  for (const line of lines) {
    const m = line.match(/תאריך\s*[:\-]?\s*(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
    if (m) {
      date = isoDate(m[1], m[2], m[3]);
      if (date) break;
    }
  }
  // Fallback: any date in the doc that isn't a footer date
  if (!date) {
    for (const line of lines) {
      if (/דף\s+\d+\s+מתוך/.test(line)) continue;
      const m = line.match(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
      if (m) {
        date = isoDate(m[1], m[2], m[3]);
        if (date) break;
      }
    }
  }
  if (!date) date = new Date().toISOString().slice(0, 10);

  // ─── Vendor ──────────────────────────────────────────────────────────────
  // The issuer name appears at the top of the document. It's typically
  // a SHORT line (1-3 words) BEFORE the address/phone block.
  // Skip:
  //   - Header receipt-type lines (חשבונית מס קבלה...)
  //   - Recipient lines (לכבוד:, גבארה תאמר, customer-num)
  //   - Address (רח')
  //   - Phone, email, ID-num lines
  //   - Service descriptions with multiple commas
  //   - Page-num footer (דף N מתוך M)
  //   - Banking info (בנק ליאומי / מס׳ חשבון)
  let vendor = "";
  for (const line of lines) {
    if (/חשבונית|קבלה|מקור/.test(line)) continue;
    if (/^לכבוד/.test(line)) continue;
    if (/^גבארה/.test(line)) continue;        // (recipient name in this sample)
    if (/^(רח'|שד'|רחוב)/.test(line)) continue;
    if (/^טלפון/.test(line)) continue;
    if (/@/.test(line)) continue;
    if (/^עוסק\s+(פטור|מורשה)/.test(line)) continue;
    if (/^ע[\.\.]?מ|^ת[\.\.]?ז|^ח[\.\.]?פ/.test(line)) continue;
    if (/^מספר/.test(line)) continue;
    if (/^תאריך/.test(line)) continue;
    if (/^שעה/.test(line)) continue;
    if (/^דף\s+\d/.test(line)) continue;
    if (/^בנק|^מס'?\s+חשבון|^סניף/.test(line)) continue;
    if (/^מפיק\s+המסמך/.test(line)) continue;
    if (/^שם\s+המקבל/.test(line)) continue;
    if (/^חתימה/.test(line)) continue;
    if (/^מסמך\s+זה/.test(line)) continue;
    // Tax/total/payment labels — these often appear alone after PDF.js
    // table flattening. They are NEVER vendor names.
    if (/^\s*(מע[״"']?מ|VAT|סה[״"']?כ|הנחה|תאריך\s+פרעון|אסמכתא|פרטי\s+תשלום|פרוט\s+התשלום)/i.test(line)) continue;
    if (/^\s*שורה\s+פרטים/.test(line)) continue;             // payment-table header
    if (/^\s*#\s+מס'\s+פריט/.test(line)) continue;            // line-items table header
    if (/^\s*פרטי\s+חשבון/.test(line)) continue;              // bank-details label
    if (/[,،]\s*[א-ת\u0600-\u06ff]/.test(line) && (line.match(/[,،]/g) || []).length >= 2) continue; // service list
    if (/^\d/.test(line)) continue;
    const letters = (line.match(/[A-Za-z\u0590-\u05ff\u0600-\u06ff]/g) || []).length;
    if (letters < 2) continue;
    if (line.length > 50) continue;
    if (line.split(/\s+/).length > 5) continue;
    vendor = line;
    break;
  }
  if (!vendor) vendor = filename.replace(/\.pdf$/i, "").slice(0, 60) || "—";

  // ─── Category ────────────────────────────────────────────────────────────
  // CRITICAL: Categorize based on the LINE-ITEMS (what was actually
  // purchased), NOT on:
  //   - The vendor's services description (header)
  //   - The bank-account-info section (payment instructions)
  //   - Tax/total/discount labels
  //
  // Rivhit invoices have a clear table:
  //    "# מס' פריט תאור פריט כמות ש"ח כולל מע"מ"   ← header
  //    "1 0 שילוט ופנקסים 1.00 2,820.00 2,820.00"  ← actual item
  //    "סה"כ כולל מע"מ: ..."                        ← totals start

  // Sections we ALWAYS exclude regardless of where they appear
  const isExcludedLine = (l: string): boolean => {
    if (/^(טלפון|tel|phone)\s*[:\-]?\s*[\d\s+\-()]+$/i.test(l)) return true;
    if (/^עוסק\s+(פטור|מורשה)/.test(l)) return true;
    if (/^ע[\.\.]?מ|^ת[\.\.]?ז|^ח[\.\.]?פ/.test(l)) return true;
    if (/@/.test(l)) return true;
    // Bank-account-info lines (vendor's bank details for receiving payment)
    if (/^\s*פרטי\s+חשבון/.test(l)) return true;
    if (/^\s*בנק\s+(ליאומי|לאומי|הפועלים|דיסקונט|מזרחי|מרכנתיל|בינלאומי)/.test(l)) return true;
    if (/^\s*סניף\s+\d+/.test(l)) return true;
    if (/^\s*מס'?\s+חשבון\s+\d+/.test(l)) return true;
    // Tax/total/discount labels
    if (/^\s*(מע[״"']?מ|VAT|סה[״"']?כ|הנחה|לתשלום|ללא\s+מע[״"']?מ)/i.test(l)) return true;
    // Payment instructions
    if (/^\s*(אמצעי\s+תשלום|פרטי\s+תשלום|פרוט\s+התשלום|תאריך\s+פרעון|אסמכתא)/.test(l)) return true;
    // Bank transfer labels
    if (/^\s*(העברה\s+בנקאית|תשלום\s+במזומן|כרטיס\s+אשראי|שיק)/.test(l)) return true;
    // Footer
    if (/^\s*(מפיק\s+המסמך|שם\s+המקבל|חתימה|תאריך_|מסמך\s+זה\s+הופק)/.test(l)) return true;
    if (/^\s*דף\s+\d+\s+מתוך\s+\d+/.test(l)) return true;
    // Vendor service-description lines (3+ comma-separated items)
    if ((l.match(/[,،]/g) || []).length >= 2) return true;
    return false;
  };

  // Try to extract just the items section first
  let itemsText = "";
  let inItems = false;
  for (const line of lines) {
    if (/#\s+מס'?\s+פריט|תאור\s+פריט/.test(line)) { inItems = true; continue; }
    if (inItems) {
      if (/^\s*סה[״"']?כ\s+(כולל|לתשלום|ללא)/.test(line)) { inItems = false; break; }
      if (isExcludedLine(line)) continue;
      itemsText += line + "\n";
    }
  }

  // If items section empty, fall back to all lines minus excluded
  if (!itemsText.trim()) {
    itemsText = lines.filter((l) => !isExcludedLine(l)).join(" ");
  }

  // ─── AGGRESSIVE SCRUB ────────────────────────────────────────────────────
  // PDF.js often merges/reorders Hebrew text, so a "בנק ליאומי" can end up
  // mid-line where our line-level filters miss it.
  //
  // CRITICAL: JavaScript regex \b only works for ASCII chars. For Hebrew
  // (and Arabic) we must use Unicode-aware boundaries: (?<![\p{L}\p{N}])
  // and (?![\p{L}\p{N}]).
  //
  // Strip all bank/account/payment-method words from the text before
  // category detection.
  const wb = (s: string) => `(?<![\\p{L}\\p{N}])${s}(?![\\p{L}\\p{N}])`;

  itemsText = itemsText
    // Bank names + bank labels
    .replace(new RegExp(wb("בנק") + String.raw`\s+\S+`, "gu"), " ")
    .replace(new RegExp(wb("(ליאומי|לאומי|הפועלים|דיסקונט|מזרחי|מרכנתיל|בינלאומי|טפחות)"), "gu"), " ")
    .replace(/\b(Leumi|Hapoalim|Discount|Mizrahi|FIBI|Mercantile|Tefahot)\b/gi, " ")  // ASCII OK with \b
    .replace(new RegExp(wb("סניף") + String.raw`\s+\d+`, "gu"), " ")
    .replace(new RegExp(wb("מס'?\\s+חשבון") + String.raw`\s+\d+`, "gu"), " ")
    .replace(new RegExp(wb("פרטי\\s+חשבון"), "gu"), " ")
    // Payment-method words
    .replace(new RegExp(wb("העברה\\s+בנקאית"), "gu"), " ")
    .replace(new RegExp(wb("תשלום\\s+(במזומן|מזומן)"), "gu"), " ")
    .replace(new RegExp(wb("כרטיס\\s+אשראי"), "gu"), " ")
    .replace(new RegExp(wb("(במזומן|מזומן|שיק)"), "gu"), " ")
    // VAT / discount / total labels
    .replace(new RegExp(wb("מע[״\"']?מ"), "gu"), " ")
    .replace(new RegExp(wb("סה[״\"']?כ"), "gu"), " ")
    .replace(new RegExp(wb("(הנחה|לתשלום)"), "gu"), " ")
    // Vendor's own services description (the "דפוס,פרסום,עיצוב חזותי" pattern)
    .replace(/דפוס\s*[,،]\s*פרסום\s*[,،]\s*\S+/g, " ");

  let category: ExpenseCategory = "أخرى";
  const sug = suggestCategory(itemsText.slice(0, 800));
  if (sug) category = sug as ExpenseCategory;

  return { amount, vendor, date, category, rawText: text };
}

export const rivhitTemplate: TemplateParser = {
  id: "rivhit",
  name: "Rivhit / תוכנת ריווחית",
  detect: detectRivhit,
  parse: parseRivhit,
};

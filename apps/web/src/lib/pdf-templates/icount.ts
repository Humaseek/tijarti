/**
 * iCount template parser.
 *
 * iCount is Israel's leading SaaS accounting platform with 60,000+ users.
 * Their invoices include several distinctive markers in the footer/header:
 *   - "icount.co.il" or "icount.net" URL
 *   - "iCount" branding
 *   - "Powered by iCount" or "מופעל על ידי iCount"
 *   - Hebrew accounting layout standard
 *
 * Common iCount field labels:
 *   - חשבונית מס / קבלה / חשבונית מס קבלה / חשבונית מס זיכוי
 *   - מספר: <X>
 *   - תאריך: DD/MM/YYYY
 *   - סה"כ לתשלום:
 *   - לכבוד: <recipient>
 *   - מאת: <vendor> (sometimes)
 */

import type { TemplateParser } from "./types";
import { parseAmount, isoDate } from "./types";
import type { ExtractedInvoice } from "../pdf-extract";
import type { ExpenseCategory } from "@/lib/store/types";
import { suggestCategory } from "@/lib/auto-category";

const ICOUNT_MARKERS = [
  /icount\.co\.il/i,
  /icount\.net/i,
  /\biCount\b/,
  /מופעל\s+על\s+ידי\s+iCount/i,
  /הופק\s+על\s+ידי\s+iCount/i,
];

function detectICount(text: string): boolean {
  return ICOUNT_MARKERS.some((m) => m.test(text));
}

function parseICount(text: string, filename = ""): ExtractedInvoice {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  // ─── Total amount ────────────────────────────────────────────────────────
  let amount = 0;
  for (const line of lines) {
    const m =
      line.match(/סה[״"]?כ\s+לתשלום\s*[:\-]?\s*[₪₪]?\s*([\d,.\u00a0]+)/) ||
      line.match(/סה[״"]?כ\s+כולל\s+מע[״"]?מ\s*[:\-]?\s*[₪₪]?\s*([\d,.\u00a0]+)/) ||
      line.match(/total\s*[:\-]?\s*[₪₪]?\s*([\d,.\u00a0]+)/i);
    if (m) {
      const v = parseAmount(m[1]);
      if (v > 0) {
        amount = Math.max(amount, v);
      }
    }
  }
  // Fallback: largest decimal shekel-adjacent number
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

  // ─── Date ────────────────────────────────────────────────────────────────
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
      if (/הופק|מופעל/i.test(line)) continue;
      const m = line.match(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
      if (m) {
        date = isoDate(m[1], m[2], m[3]);
        if (date) break;
      }
    }
  }
  if (!date) date = new Date().toISOString().slice(0, 10);

  // ─── Vendor ──────────────────────────────────────────────────────────────
  // iCount invoices typically place the issuer in the top-right block.
  // After PDF.js text extraction, look for the first short line that:
  //   - isn't a header keyword
  //   - isn't a recipient marker line
  //   - isn't a phone/email/address
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
    if (/iCount|icount\.co\.il|icount\.net/i.test(line)) continue;
    if (/הופק|מופעל/i.test(line)) continue;
    if (/^מספר|^תאריך|^שעה|^דף/i.test(line)) continue;
    if ((line.match(/[,،]/g) || []).length >= 2) continue; // service list
    const letters = (line.match(/[A-Za-z\u0590-\u05ff\u0600-\u06ff]/g) || []).length;
    if (letters < 2) continue;
    if (line.length > 50) continue;
    if (line.split(/\s+/).length > 5) continue;
    vendor = line;
    break;
  }
  if (!vendor) vendor = filename.replace(/\.pdf$/i, "").slice(0, 60) || "—";

  // ─── Category ────────────────────────────────────────────────────────────
  const cleanedForCategory = lines
    .filter((l) => !/^(טלפון|tel|phone)\s*[:\-]?\s*[\d\s+\-()]+$/i.test(l))
    .filter((l) => !/^עוסק\s+(פטור|מורשה)/.test(l))
    .filter((l) => !/@/.test(l))
    .filter((l) => !/iCount|icount/i.test(l))
    .join(" ");
  let category: ExpenseCategory = "أخرى";
  const sug = suggestCategory(cleanedForCategory.slice(0, 800));
  if (sug) category = sug as ExpenseCategory;

  return { amount, vendor, date, category, rawText: text };
}

export const icountTemplate: TemplateParser = {
  id: "icount",
  name: "iCount",
  detect: detectICount,
  parse: parseICount,
};

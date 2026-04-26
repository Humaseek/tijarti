/**
 * Morning (חשבונית ירוקה) template parser.
 *
 * Morning is the most popular Israeli e-invoice platform. Invoices have
 * a very consistent structure:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ הופק ב <date> <time> | קבלה <num> | עמוד <p> מתוך <total> │  ← header
 *   │                                                         │
 *   │ <vendor name>                                           │  ← issuer block
 *   │ עוסק פטור/מורשה: <id>                                   │
 *   │ <address>                                               │
 *   │ טלפון <phone>                                           │
 *   │ <email>                                                 │
 *   │                                                         │
 *   │ לכבוד: <recipient>                                      │  ← recipient
 *   │ ח.פ/ת.ז <id>                                            │
 *   │ טלפון <phone>                                           │
 *   │                                                         │
 *   │ <DD/MM/YYYY>                                            │  ← invoice date
 *   │ קבלה <num>                                              │
 *   │ מקור                                                    │
 *   │                                                         │
 *   │ <service description>                                   │
 *   │ פרטי תשלומים                                            │
 *   │ ...                                                     │
 *   │ סה"כ ₪<amount>                                          │  ← total
 *   │                                                         │
 *   │ ... (footer with morning branding)                      │
 *   └─────────────────────────────────────────────────────────┘
 */

import type { TemplateParser } from "./types";
import { parseAmount, isoDate } from "./types";
import type { ExtractedInvoice } from "../pdf-extract";
import type { ExpenseCategory } from "@/lib/store/types";
import { suggestCategory } from "@/lib/auto-category";

const MORNING_MARKERS = [
  /\bmorning\b/i,
  /חשבונית\s+ירוקה/,
  /הופק\s+ב\s+\d{1,2}\/\d{1,2}\/\d{4}.*\|.*קבלה.*\|.*עמוד/,
];

function detectMorning(text: string): boolean {
  return MORNING_MARKERS.some((m) => m.test(text));
}

function parseMorning(text: string, filename = ""): ExtractedInvoice {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  // ─── Total amount ────────────────────────────────────────────────────────
  // The grand total appears as `סה"כ ₪<amount>` on its own line.
  // We pick the LARGEST shekel-adjacent amount with decimals — the total
  // appears at least twice (line item + grand total) and is the largest.
  const amounts: number[] = [];
  const shekelRe = /[₪₪]\s*([\d,.\u00a0]+)/g;
  let m;
  while ((m = shekelRe.exec(text)) !== null) {
    const v = parseAmount(m[1]);
    if (v >= 0.01 && /[.,]\d{1,2}/.test(m[1])) amounts.push(v);
  }
  const amount = amounts.length > 0 ? Math.max(...amounts) : 0;

  // ─── Date ────────────────────────────────────────────────────────────────
  // The "real" invoice date appears alone on a line (DD/MM/YYYY format).
  // The header date is "הופק ב <DD/MM/YYYY>" — generation date, NOT what
  // we want.
  // Strategy: collect all dates, exclude the one in the "הופק" line.
  let date = "";
  for (const line of lines) {
    if (/הופק/.test(line)) continue;
    const dm = line.match(/^\s*(\d{1,2})\/(\d{1,2})\/(20\d{2})\s*$/);
    if (dm) {
      date = isoDate(dm[1], dm[2], dm[3]);
      break;
    }
  }
  // Fallback: first date in the document not in הופק line
  if (!date) {
    for (const line of lines) {
      if (/הופק/.test(line)) continue;
      const dm = line.match(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
      if (dm) {
        date = isoDate(dm[1], dm[2], dm[3]);
        if (date) break;
      }
    }
  }
  if (!date) date = new Date().toISOString().slice(0, 10);

  // ─── Vendor ──────────────────────────────────────────────────────────────
  // The vendor name is the first non-header, non-meta line in the document.
  //
  // We strip BiDi formatting characters (RLM/LRM/etc.) before testing, since
  // PDF.js often surrounds Hebrew/digit fragments with U+200E/U+200F marks
  // that don't count as letters but break our `^\d` and "letters < 2" guards.
  // Strips invisible BiDi marks AND normalizes Arabic Presentation Forms
  // (U+FB50-FDFF and U+FE70-FEFF) — PDFs often embed Arabic as "isolated /
  // initial / medial / final" glyph forms which have DIFFERENT Unicode
  // codepoints than the canonical Arabic letters, so naive `===` or
  // `.includes()` comparisons silently fail. NFKC fixes this.
  const stripBidi = (s: string): string =>
    s
      .normalize("NFKC")
      .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\u2028\u2029]/g, "")
      .trim();

  // Comprehensive list of section headers / labels that appear in Israeli
  // invoices and should NEVER be picked as a vendor name.
  const SECTION_HEADERS = [
    // Hebrew section headers
    "פרטי תשלומים", "פרטי תשלום", "פרטי חשבון", "פרטי לקוח", "פרטי מוכר",
    "אמצעי תשלום", "אופן תשלום", "סוג תשלום", "תנאי תשלום",
    "סוג המוצר", "סוג השירות", "תאור פריט", "תאור", "תאור המוצר",
    "מקור", "העתק", "מסמך מקור",
    "פרוטוקול", "חתימה", "חתימת המקבל", "שם המקבל", "שם הלקוח",
    "מפיק המסמך", "מפיק", "אישור",
    "תאריך פרעון", "תאריך הפקה", "תאריך החשבונית",
    "מספר חשבונית", "מספר קבלה", "מספר עסקה",
    "סוג מסמך", "סוג חשבונית",
    "מזהה החשבון", "מזהה עסקה", "מזהה",
    "אסמכתא", "מספר אסמכתא",
    "סיכום", "תקציר", "הערות", "הערה", "ملاحظות",
    "הנחה", "מע\"מ", "מעמ", "סה\"כ", "סהכ", "לתשלום", "ללא מעמ",
    "כמות", "מחיר", "סכום",
    "כתובת", "טלפון",
    "ע\"מ", "עמ", "ח\"פ", "חפ", "ת\"ז", "תז",
    "עוסק פטור", "עוסק מורשה",
    // Arabic section headers
    "ملاحظات عامة", "ملاحظات", "التزامات",
    "شروط الدفع", "سياسة الدفع", "تنظيم المواعيد",
    "تفاصيل الدفع", "طريقة الدفع",
    "نوع المنتج", "وصف المنتج",
    "إجمالي", "المجموع", "ضريبة القيمة",
    "العميل", "البائع", "تاريخ الإصدار", "تاريخ الاستحقاق",
  ];

  const isReasonableVendor = (line: string): boolean => {
    const stripped = stripBidi(line);
    if (!stripped) return false;
    if (stripped.length < 2 || stripped.length > 50) return false;
    // Vendor names are short — 1-4 words max
    const words = stripped.split(/\s+/).filter(Boolean);
    if (words.length > 4) return false;
    // Reject bullet points / list items (terms & conditions)
    if (/^[-‐−–—•·*]/.test(stripped)) return false;
    // Reject lines that start with a digit
    if (/^\d/.test(stripped)) return false;
    // Reject lines that are mostly digits
    const digits = (stripped.match(/\d/g) || []).length;
    if (digits / stripped.length > 0.4) return false;
    // Need at least 2 LETTERS (any script)
    const letters = (stripped.match(/[\p{L}]/gu) || []).length;
    if (letters < 2) return false;
    // Reject lines that are receipt/invoice headers
    if (/^(קבלה|חשבונית|מקור|העתק)/.test(stripped)) return false;
    if (/(קבלה|חשבונית)\s+\d+/.test(stripped)) return false;
    // Reject ANY line starting with "פרטי " — it's always a section header
    // ("פרטי תשלומים", "פרטי לקוח", "פרטי חשבון", "פרטי מוכר", etc.)
    if (/^פרטי\s/.test(stripped)) return false;
    // Reject ANY line starting with Arabic "ملاحظ" / "تفاصيل" / "شروط" /
    // "بيانات" — these are ALWAYS section headers in Arabic invoices
    // ("ملاحظات عامة", "ملاحظة", "تفاصيل الدفع", "شروط الدفع", "بيانات العميل").
    if (/^(ملاحظ|تفاصيل|شروط|بيانات|معلومات)\s*[:：]?/.test(stripped)) return false;
    // Reject any line that is JUST one of the common single-word section headers
    if (/^(מקור|העתק|אישור|חתימה|תאריך|מספר|לתשלום|הנחה|מע"?מ|סה"?כ)$/.test(stripped)) return false;
    // Reject lines that are JUST a label ending with `:` (Arabic OR Hebrew)
    // — section headers nearly always end with a colon ("ملاحظات عامة:")
    if (/[:：]\s*$/.test(stripped) && words.length <= 4) return false;
    // Reject service-list lines
    if ((stripped.match(/[,،]/g) || []).length >= 2) return false;
    // Reject sentences (verbs / verb-like phrases)
    if (/(يعاد|يجب|عل[ىي]|في حال|بحال|מתחייב|רשאי|חייב|לא ייגבה|אינו|אין ל)/.test(stripped)) return false;
    if (/[\.。]\s*$/.test(stripped) && words.length >= 3) return false;
    // Reject section headers — these are labels, not vendors
    const lowered = stripped.toLowerCase();
    for (const header of SECTION_HEADERS) {
      // Match if the line IS the header (or starts with it followed by `:` or end)
      if (stripped === header) return false;
      if (lowered === header.toLowerCase()) return false;
      // Allow exact-match in middle/start with separator
      if (stripped.startsWith(header + ":")) return false;
      if (stripped.startsWith(header + " :")) return false;
      // Just contains as substring AND short → reject
      if (words.length <= 3 && stripped.includes(header)) return false;
    }
    return true;
  };

  let vendor = "";
  let stopAtRecipient = false;
  for (const rawLine of lines) {
    if (stopAtRecipient) break;
    const line = stripBidi(rawLine);
    // ─── PDF.js often concatenates the vendor name with "לכבוד: <recipient>"
    // on the SAME line because Hebrew RTL extraction merges adjacent columns.
    // Example seen in the wild: "חסן זיוד לכבוד: תאמר בארה"
    // Strategy: if "לכבוד" appears mid-line, take the text BEFORE it as
    // the vendor candidate, then stop — it IS the issuer.
    if (/לכבוד/.test(line)) {
      const before = line.split(/לכבוד/)[0].trim().replace(/[:\-،,]\s*$/, "").trim();
      if (before && isReasonableVendor(before)) {
        vendor = before;
      }
      stopAtRecipient = true;
      break;
    }
    if (/הופק\s+ב/.test(line)) continue;
    if (/^עוסק\s+(פטור|מורשה)/.test(line)) continue;
    if (/^טלפון/.test(line)) continue;
    if (/@/.test(line)) continue;
    if (/^(רח'|שד'|ואדי|רחוב|שכ')/.test(line)) continue;
    if (!isReasonableVendor(line)) continue;
    vendor = line;
    break;
  }

  // ─── Wider scan if main loop failed ─────────────────────────────────────
  // If the top section doesn't have a clean vendor (PDF.js mangled the order),
  // scan the WHOLE document for the best candidate. Prefer the SHORTEST
  // candidate with letters-only (real business names like "חסן זיוד" or
  // "Wide Business House") over longer service descriptions.
  if (!vendor) {
    const candidates: Array<{ line: string; score: number }> = [];
    for (const rawLine of lines) {
      const line = stripBidi(rawLine);
      if (/הופק|מורנינג|חשבונית\s+ירוקה|powered\s+by/i.test(line)) continue;
      if (/^עוסק\s+(פטור|מורשה)/.test(line)) continue;
      if (/^טלפון/.test(line)) continue;
      if (/@/.test(line)) continue;
      if (/^(רח'|שד'|ואדי|רחוב|שכ')/.test(line)) continue;
      if (!isReasonableVendor(line)) continue;
      // Prefer 1-3 word lines (real names), penalize longer ones
      const words = line.split(/\s+/).filter(Boolean).length;
      const score = words === 1 ? 8 : words === 2 ? 10 : words === 3 ? 7 : 4;
      candidates.push({ line, score });
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      vendor = candidates[0].line;
    }
  }

  // Final fallback: filename
  if (!vendor) {
    vendor = filename.replace(/\.pdf$/i, "").replace(/^pdf\./, "").slice(0, 60) || "—";
  }

  // Last-resort sanity check: if vendor is still mostly digits, use fallback
  const vLetters = (vendor.match(/[\p{L}]/gu) || []).length;
  const vDigits = (vendor.match(/\d/g) || []).length;
  if (vLetters < 2 || vDigits > vLetters) {
    vendor = "—";
  }

  // ─── Category ────────────────────────────────────────────────────────────
  // Look at the SERVICE description (after `מקור` keyword, before `פרטי תשלומים`)
  let serviceText = "";
  let inService = false;
  for (const line of lines) {
    if (/^מקור$/.test(line)) { inService = true; continue; }
    if (/פרטי\s+תשלומים/.test(line)) { inService = false; break; }
    if (inService) serviceText += line + "\n";
  }
  let category: ExpenseCategory = "أخرى";
  const sug = suggestCategory(serviceText || text.slice(0, 500));
  if (sug) category = sug as ExpenseCategory;

  return { amount, vendor, date, category, rawText: text };
}

export const morningTemplate: TemplateParser = {
  id: "morning",
  name: "Morning / חשבונית ירוקה",
  detect: detectMorning,
  parse: parseMorning,
};

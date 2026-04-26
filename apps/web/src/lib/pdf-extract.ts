"use client";

/**
 * PDF text extraction + heuristic invoice parser.
 *
 * Uses pdfjs-dist (Mozilla PDF.js) to read text from a PDF File client-side,
 * then runs robust heuristics over the extracted text to guess:
 *   - the total amount   (prefers numbers adjacent to ₪/NIS/ILS)
 *   - the issue date     (prefers dates near "תאריך/التاريخ/Date" keywords)
 *   - the vendor name    (skips receipt headers and ID lines, prefers
 *                         readable Hebrew/Arabic/English names near the top)
 *   - a category guess   (uses the existing keyword auto-categorize lib)
 *
 * Notes on RTL handling:
 *   PDF.js returns text in render order, which can scramble Hebrew/Arabic
 *   word order. We don't try to un-scramble; instead we rely on regex
 *   matches against tokens that survive scrambling (currency symbols,
 *   numeric date patterns, ID numbers).
 */

import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/store/types";
import { suggestCategory } from "@/lib/auto-category";
import { todayIso } from "@/lib/dates";
import { tryTemplates } from "@/lib/pdf-templates";
import { detectIsraeliMerchant, extractFuelDetails, extractRestaurantDetails } from "@/lib/pdf-templates/israeli-merchants";

export interface ExtractedInvoice {
  amount: number;
  vendor: string;
  date: string;       // ISO yyyy-mm-dd
  category: ExpenseCategory;
  rawText: string;    // for debugging / show-in-UI
  /** Name of the template that matched, if any. "heuristic" if generic parser ran. */
  source?: string;
  /** Type-specific extras (fuel liters, restaurant tip, etc.) */
  extras?: {
    fuel?: { liters?: number; pricePerLiter?: number; fuelType?: string };
    restaurant?: { tip?: number; diners?: number; serviceType?: string };
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function extractInvoiceFromPdf(file: File): Promise<ExtractedInvoice> {
  const text = await readPdfText(file);

  // 1) Try registered formal templates first (Morning, Rivhit, iCount, …)
  //    These give near-100% accuracy for known e-invoice providers.
  const tmplMatch = tryTemplates(text, file.name);
  if (tmplMatch) {
    return enrichWithMerchantDetails({ ...tmplMatch.result, source: tmplMatch.template.name }, text);
  }

  // 2) Detect Israeli everyday merchants (gas stations, supermarkets,
  //    restaurants, banks). These set the category but use the generic
  //    extractor for the basic fields.
  const merchant = detectIsraeliMerchant(text);
  const generic = parseInvoiceText(text, file.name);
  if (merchant) {
    return enrichWithMerchantDetails({
      ...generic,
      category: merchant.category,
      vendor: merchant.name,
      source: `${merchant.name} (مرَكَّب)`,
    }, text);
  }

  // 3) Fall back to the generic heuristic parser.
  return { ...generic, source: "heuristic" };
}

/** Add fuel/restaurant-specific extras based on detected merchant type. */
function enrichWithMerchantDetails(invoice: ExtractedInvoice, text: string): ExtractedInvoice {
  const merchant = detectIsraeliMerchant(text);
  if (!merchant) return invoice;

  const extras: ExtractedInvoice["extras"] = {};
  if (merchant.type === "fuel") {
    const fuel = extractFuelDetails(text);
    if (Object.keys(fuel).length > 0) extras.fuel = fuel;
  } else if (merchant.type === "restaurant") {
    const rest = extractRestaurantDetails(text);
    if (Object.keys(rest).length > 0) extras.restaurant = rest;
  }

  return Object.keys(extras).length > 0 ? { ...invoice, extras } : invoice;
}

/** Extract just the raw text from a PDF (all pages joined). */
export async function readPdfText(file: File): Promise<string> {
  // Dynamically import pdfjs so it only loads in the browser bundle.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Worker is served from /public so the version always matches the lib.
  // We assign workerSrc but ALSO pass an explicit Worker instance to handle
  // the module-worker case for Next.js dev (where automatic worker loading
  // is flaky for ESM).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();

  // Try with worker first; if that fails, fall back to running pdfjs in the
  // main thread (`disableWorker`).
  let loadingTask;
  try {
    loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      disableAutoFetch: true,
      disableStream: true,
    });
  } catch {
    loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      disableAutoFetch: true,
      disableStream: true,
      // @ts-expect-error — runtime option supported even when types omit it
      disableWorker: true,
    });
  }

  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch (err) {
    // Worker failed — retry without worker
    console.warn("pdfjs worker failed, retrying main-thread:", err);
    loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      disableAutoFetch: true,
      disableStream: true,
      // @ts-expect-error — runtime option
      disableWorker: true,
    });
    pdf = await loadingTask.promise;
  }

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Each item has `str` and `transform`. Group items by Y coordinate
    // (within a small tolerance) into lines.
    type Item = { str: string; transform: number[] };
    const items = content.items as Item[];
    const lineMap = new Map<number, Array<{ x: number; str: string }>>();
    for (const it of items) {
      const y = Math.round((it.transform?.[5] ?? 0) / 3) * 3; // bucket by 3px
      const x = it.transform?.[4] ?? 0;
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, str: it.str });
    }
    // Sort lines top→bottom (descending Y in PDF coords = top), then within
    // each line sort by X to get left→right order. We don't try to reverse
    // for RTL because the parser regexes don't depend on word order.
    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const pageLines: string[] = [];
    for (const y of sortedYs) {
      const entries = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const text = entries.map((e) => e.str).join(" ").replace(/\s+/g, " ").trim();
      if (text) pageLines.push(text);
    }
    pages.push(pageLines.join("\n"));
  }
  return pages.join("\n\n").trim();
}

// ─── Parsing heuristics ─────────────────────────────────────────────────────

export function parseInvoiceText(text: string, filename = ""): ExtractedInvoice {
  return {
    amount: extractAmount(text),
    vendor: extractVendor(text, filename),
    date: extractDate(text),
    category: extractCategory(text),
    rawText: text,
  };
}

// ─── Amount ────────────────────────────────────────────────────────────────
//
// Priority:
//   1) numbers IMMEDIATELY adjacent to currency symbols (₪, ₪, NIS, ILS, ש"ח)
//   2) numbers on lines containing total keywords (סה"כ, Total, الإجمالي…)
//   3) the largest reasonable number anywhere
//

const NUM = /(\d{1,3}(?:[.,\u00a0]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g;
const CURRENCY_BEFORE = /[₪₪]\s*(\d{1,3}(?:[.,\u00a0]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g;
const CURRENCY_AFTER = /(\d{1,3}(?:[.,\u00a0]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*[₪₪]/g;
const CURRENCY_NIS = /(\d{1,3}(?:[.,\u00a0]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:NIS|ILS|ש["״]?ח)/gi;

const TOTAL_KEYWORDS = [
  "סה״כ", 'סה"כ', "סהכ", "סך הכל", "סך-הכל",
  "לתשלום", "לחיוב", "סופי",
  "total", "grand total", "amount due", "balance due", "subtotal",
  "المجموع", "الإجمالي", "اجمالي", "للدفع", "المستحق", "إجمالي",
];

function extractAmount(text: string): number {
  // Strategy 1: currency-adjacent numbers.
  // We collect both the numeric value AND whether the original token had
  // decimal places — monetary amounts almost always have .XX (e.g. "9.00",
  // "5.70") whereas quantities/IDs/impressions don't.
  // PDF.js for RTL Hebrew sometimes places quantity numbers right after a
  // ₪ symbol due to visual reordering, so we prefer decimal candidates
  // when any are present.
  const allCandidates: Array<{ value: number; hasDecimal: boolean }> = [];
  for (const re of [CURRENCY_BEFORE, CURRENCY_AFTER, CURRENCY_NIS]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const raw = m[1];
      const v = parseFlexibleNumber(raw);
      if (!isFinite(v) || v < 0.01) continue;
      const hasDecimal = /[.,]\d{1,2}\s*$/.test(raw);
      allCandidates.push({ value: v, hasDecimal });
    }
  }
  if (allCandidates.length > 0) {
    // Prefer decimal candidates if any exist
    const decimalCands = allCandidates.filter((c) => c.hasDecimal);
    const pool = decimalCands.length > 0 ? decimalCands : allCandidates;
    const max = Math.max(...pool.map((c) => c.value));
    return Math.round(max * 100) / 100;
  }

  // Strategy 2: keyword-based (line containing a total keyword)
  const lines = text.split(/\n+/);
  const candidates: Array<{ value: number; score: number }> = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    const hasKeyword = TOTAL_KEYWORDS.some((k) => lower.includes(k.toLowerCase()) || line.includes(k));
    if (!hasKeyword) continue;
    NUM.lastIndex = 0;
    let m;
    while ((m = NUM.exec(line)) !== null) {
      const value = parseFlexibleNumber(m[1]);
      if (!isFinite(value) || value < 5) continue;
      if ([17, 18, 100, 0].includes(value)) continue; // VAT / common noise
      candidates.push({ value, score: 10 + (value > 100 ? 3 : 0) + (value > 1000 ? 2 : 0) });
    }
  }
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score || b.value - a.value);
    return Math.round(candidates[0].value * 100) / 100;
  }

  // Strategy 3: largest reasonable number anywhere
  NUM.lastIndex = 0;
  const all: number[] = [];
  let m;
  while ((m = NUM.exec(text)) !== null) {
    const v = parseFlexibleNumber(m[1]);
    if (!isFinite(v)) continue;
    if (v < 5 || v >= 1_000_000) continue; // exclude IDs, phones, postal codes
    if (v >= 1900 && v <= new Date().getFullYear() + 1) continue; // exclude years
    all.push(v);
  }
  if (all.length === 0) return 0;
  return Math.round(Math.max(...all) * 100) / 100;
}

function parseFlexibleNumber(s: string): number {
  let cleaned = s.replace(/[\u00a0\s]/g, "");
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  if (lastDot !== -1 && lastComma !== -1) {
    if (lastDot > lastComma) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(/\./g, "").replace(/,(\d{1,2})$/, ".$1");
    }
  } else if (lastComma !== -1 && lastDot === -1) {
    const afterComma = cleaned.length - lastComma - 1;
    if (afterComma === 1 || afterComma === 2) {
      cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }
  return parseFloat(cleaned);
}

// ─── Date ──────────────────────────────────────────────────────────────────
//
// Strategy:
//   - Find ALL date matches in the text
//   - Skip the page-generation date if it appears in a footer line
//     ("הופק ב", "Generated on", "Printed at")
//   - Prefer dates near "תאריך/التاريخ/Date" keywords
//   - Otherwise pick the most recent date
//

// Map Hebrew/Arabic/English month names → 1-12
const MONTH_NAMES: Record<string, number> = {
  // Hebrew (full + short with apostrophe)
  "ינואר": 1, "ינו'": 1, "ינו": 1,
  "פברואר": 2, "פבר'": 2, "פבר": 2,
  "מרץ": 3, "מרס": 3,
  "אפריל": 4, "אפר'": 4, "אפר": 4,
  "מאי": 5,
  "יוני": 6,
  "יולי": 7,
  "אוגוסט": 8, "אוג'": 8, "אוג": 8,
  "ספטמבר": 9, "ספט'": 9, "ספט": 9,
  "אוקטובר": 10, "אוק'": 10, "אוק": 10,
  "נובמבר": 11, "נוב'": 11, "נוב": 11,
  "דצמבר": 12, "דצמ'": 12, "דצמ": 12,
  // Arabic
  "يناير": 1, "كانون الثاني": 1,
  "فبراير": 2, "شباط": 2,
  "مارس": 3, "آذار": 3,
  "أبريل": 4, "نيسان": 4,
  "مايو": 5, "أيار": 5,
  "يونيو": 6, "حزيران": 6,
  "يوليو": 7, "تموز": 7,
  "أغسطس": 8, "آب": 8,
  "سبتمبر": 9, "أيلول": 9,
  "أكتوبر": 10, "تشرين الأول": 10,
  "نوفمبر": 11, "تشرين الثاني": 11,
  "ديسمبر": 12, "كانون الأول": 12,
  // English (short forms)
  "january": 1, "jan": 1,
  "february": 2, "feb": 2,
  "march": 3, "mar": 3,
  "april": 4, "apr": 4,
  "may": 5,
  "june": 6, "jun": 6,
  "july": 7, "jul": 7,
  "august": 8, "aug": 8,
  "september": 9, "sep": 9, "sept": 9,
  "october": 10, "oct": 10,
  "november": 11, "nov": 11,
  "december": 12, "dec": 12,
};

const DATE_PATTERNS: Array<{ re: RegExp; map: (m: string[]) => string | null }> = [
  // dd/mm/yyyy or dd.mm.yyyy or dd-mm-yyyy
  {
    re: /(0?[1-9]|[12]\d|3[01])\s*[./-]\s*(0?[1-9]|1[0-2])\s*[./-]\s*(20\d{2})/g,
    map: (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`,
  },
  // yyyy-mm-dd or yyyy/mm/dd
  {
    re: /(20\d{2})\s*[./-]\s*(0?[1-9]|1[0-2])\s*[./-]\s*(0?[1-9]|[12]\d|3[01])/g,
    map: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
  },
  // dd/mm/yy
  {
    re: /\b(0?[1-9]|[12]\d|3[01])\s*[./-]\s*(0?[1-9]|1[0-2])\s*[./-]\s*(\d{2})\b/g,
    map: (m) => {
      const yy = parseInt(m[3], 10);
      const yyyy = yy >= 50 ? 1900 + yy : 2000 + yy;
      return `${yyyy}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    },
  },
  // Hebrew: "1 בינו' ,2026"  or  "1 בינואר 2026"  → "ב<month> <year>"
  // The "ב" prefix means "in/on", and the year often has a leading comma.
  {
    re: /(\b\d{1,2})\s*ב([א-ת'\u0590-\u05ff]+)\s*,?\s*(20\d{2})/g,
    map: (m) => {
      const day = parseInt(m[1], 10);
      const monthName = m[2].trim();
      const month = MONTH_NAMES[monthName];
      if (!month || day < 1 || day > 31) return null;
      return `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    },
  },
  // English: "January 1, 2026" / "Jan 1, 2026" / "1 Jan 2026"
  {
    re: /([A-Za-z]+)\s+(\d{1,2})[,]?\s+(20\d{2})/g,
    map: (m) => {
      const month = MONTH_NAMES[m[1].toLowerCase()];
      const day = parseInt(m[2], 10);
      if (!month || day < 1 || day > 31) return null;
      return `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    },
  },
  {
    re: /(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})/g,
    map: (m) => {
      const month = MONTH_NAMES[m[2].toLowerCase()];
      const day = parseInt(m[1], 10);
      if (!month || day < 1 || day > 31) return null;
      return `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    },
  },
  // Arabic: "1 يناير 2026"
  {
    re: /(\d{1,2})\s+([\u0600-\u06ff]+(?:\s+[\u0600-\u06ff]+)?)\s+(20\d{2})/g,
    map: (m) => {
      const month = MONTH_NAMES[m[2].trim()];
      const day = parseInt(m[1], 10);
      if (!month || day < 1 || day > 31) return null;
      return `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    },
  },
];

const DATE_FOOTER_KEYWORDS = ["הופק ב", "הופק", "Generated", "Printed", "תאריך הדפסה"];
const DATE_PRIMARY_KEYWORDS = ["תאריך", "Date", "التاريخ", "تاريخ"];

function extractDate(text: string): string {
  const lines = text.split(/\n+/);
  type Hit = { iso: string; line: string; nearKeyword: boolean; isFooter: boolean };
  const hits: Hit[] = [];
  const today = new Date();

  for (const line of lines) {
    const isFooter = DATE_FOOTER_KEYWORDS.some((k) => line.includes(k));
    const nearKeyword = DATE_PRIMARY_KEYWORDS.some((k) => line.includes(k));

    for (const p of DATE_PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(line)) !== null) {
        const iso = p.map(m as unknown as string[]);
        if (!iso) continue;
        const year = parseInt(iso.slice(0, 4), 10);
        if (year < 2015 || year > today.getFullYear() + 1) continue;
        // Sanity: parseable date
        const d = new Date(iso);
        if (isNaN(d.getTime())) continue;
        if (d.getTime() > today.getTime() + 86400000 * 60) continue; // not >2mo future
        hits.push({ iso, line, nearKeyword, isFooter });
      }
    }
  }

  if (hits.length === 0) return todayIso();

  // Prefer dates not in footer + near a keyword + most recent
  const sorted = [...hits].sort((a, b) => {
    if (a.isFooter !== b.isFooter) return a.isFooter ? 1 : -1;
    if (a.nearKeyword !== b.nearKeyword) return a.nearKeyword ? -1 : 1;
    // Most recent first
    return b.iso.localeCompare(a.iso);
  });
  return sorted[0].iso;
}

// ─── Vendor ────────────────────────────────────────────────────────────────
//
// Strategy:
//   - Skip lines with: receipt numbers/headers, IDs, dates, phones, currency,
//     emails, generation-info, page-info
//   - Skip very short or all-digit lines
//   - Pick the first remaining line in the upper portion of the document
//   - Fallback: filename (without extension)
//

const VENDOR_SKIP_PATTERNS: RegExp[] = [
  // Receipt/invoice header keywords ANYWHERE in the line (not just at start)
  // — PDF.js RTL re-ordering can put "חשבונית מס קבלה מספר: 02/010530" out
  // as "מקור 02/010530: מספר חשבונית מס קבלה". The `^...` anchor would miss
  // that. Match anywhere instead.
  /(invoice|חשבונית|فاتورة|tax\s*invoice|receipt|קבלה|إيصال)/i,
  /(^|\s)מקור(\s|$)|(^|\s)original(\s|$)/i,
  /(^|\s)(date|תאריך|تاريخ)\s*[:\-]/i,
  // Match "מספר", "מספרך" (your-num sg), "מספרכם" (your-num pl formal),
  // "מספרנו" (our-num) — Hebrew possessive suffixes ך/כם/נו common on
  // invoice labels.
  /(^|\s)(number|מספר[ךםנו]{0,2}|رقم|no\.?)\s*[:\-]/i,
  /הופק|Generated|Printed/i,
  /עוסק\s*(פטור|מורשה)|ע[\.\.]מ|ח[\.\.]פ|ת[\.\.]ז|ע\.מ|ח\.פ|ת\.ז/,
  /טלפון|phone|هاتف|tel\b|mobile|נייד/i,
  /^\s*(לכבוד|to:?|إلى)/i,
  /[\w._-]+@[\w.-]+\.\w+/,                       // email
  /https?:\/\/|www\./i,                          // URLs
  /^\s*\d+\s*\/\s*\d+\s*\/\s*\d+\s*$/,           // dates only
  /עמוד\s*\d+\s*מתוך\s*\d+|page\s*\d+\s*of\s*\d+/i,
  /^[\d\s.,/\-:|]+$/,                            // digits + punctuation only
  /^\s*[₪$€£]/,                                  // starts with currency
  /^\s*(\.|-|—|–|·|•)\s*$/,                      // separator lines
  /^\s*מקור\s*$|^\s*original\s*$/i,              // "original" label
  /^\s*חתימה\s*[:\-]?|^\s*signature\s*[:\-]?/i,  // signature label
  /^\s*קבלה\s+\d+/,                              // "קבלה 80018"
  // ID / reference / account number lines
  /(^|\s)(מזהה|אסמכתא|מס[׳']?\s*אסמכתא|account|acct|ref|reference)\s*[#:\-]?/i,
  /^\s*(VAT|מע[״"]?מ)\s*(reg|no)?\.?\s*(no|number)?\.?/i,
  /^\s*קבלה\s+עבור/,                              // "קבלה עבור [recipient]"
  /סוג\s+המוצר|product\s+type/i,
  /אמצעי\s+תשלום|payment\s+method/i,
  // Generic "label: digits" pattern — any single word (any script) followed
  // by colon and ONLY digits is a label-value pair, never a vendor name.
  // Catches "מספרכם: 10363", "מזהה: 220248284846546", "Account: 12345"
  /^\s*[\p{L}]+\s*[:\-]\s*[\d.,/\-\s]+\s*$/u,
];

// Markers that strongly indicate a line IS a company name. When found,
// prefer this line over generic candidates.
const COMPANY_MARKERS: Array<RegExp | string> = [
  /\bLimited\b/i, /\bLtd\.?\b/i, /\bInc\.?\b/i, /\bL\.?L\.?C\.?\b/i,
  /\bGmbH\b/i, /\bS\.?A\.?\b/i, /\bCorp\.?\b/i,
  /\b(Meta|Google|Facebook|Microsoft|Apple|Amazon)\b/i,
  /בע["״]?מ/, /ש\.?מ\./,
  /شركة|مؤسسة|ذ\.?م\.?م/,
];

function hasCompanyMarker(line: string): boolean {
  return COMPANY_MARKERS.some((m) => typeof m === "string" ? line.includes(m) : m.test(line));
}

// Markers that separate the issuer (vendor — what we want) from the recipient
// (the customer — what we DON'T want). When a line contains one of these,
// we take only the part BEFORE the marker.
const RECIPIENT_MARKERS = [
  "לכבוד", "לכ׳", "לכ'",            // Hebrew "to"
  "إلى", "إلي",                    // Arabic "to"
  "to:", "to :", "bill to", "ship to", "attn:", "attention:",
];

function trimAtRecipientMarker(line: string): string {
  for (const m of RECIPIENT_MARKERS) {
    const lower = line.toLowerCase();
    const idx = lower.indexOf(m.toLowerCase());
    if (idx !== -1) {
      return line.slice(0, idx).trim();
    }
  }
  return line;
}

function extractVendor(text: string, filename = ""): string {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  // Lines that look like SERVICE DESCRIPTIONS (multiple comma-separated
  // services like "דפוס,פרסום,עיצוב חזותי" — not the company name)
  const isServiceList = (line: string): boolean => {
    const commas = (line.match(/[,،]/g) || []).length;
    return commas >= 2;
  };

  // Address lines with street + city + postal
  const isAddress = (line: string): boolean => {
    if (/^\s*(רח'?|שד'?|street|st\.?|ave|road|rd\.?|شارع)/i.test(line)) return true;
    if (/\b\d{4,7}\b/.test(line) && /[א-ת\u0600-\u06ff]/.test(line) && line.length < 80) {
      // Has 4-7 digit zip + Hebrew/Arabic city name
      const cityKeywords = ["טייבה", "תל-אביב", "תל אביב", "ירושלים", "חיפה", "באר שבע", "רמת גן", "פתח תקווה", "نצרת", "שפרעם", "حيفا", "الناصرة"];
      if (cityKeywords.some((c) => line.includes(c))) return true;
    }
    return false;
  };

  const isCandidate = (line: string): boolean => {
    if (line.length < 2 || line.length > 80) return false;
    for (const pat of VENDOR_SKIP_PATTERNS) {
      if (pat.test(line)) return false;
    }
    const letters = (line.match(/[A-Za-z\u0590-\u05ff\u0600-\u06ff]/g) || []).length;
    if (letters < 2) return false;
    if (line.split(/\s+/).length > 8) return false;
    if (isServiceList(line)) return false;
    if (isAddress(line)) return false;
    return true;
  };

  const cleanAndTake = (line: string): string | null => {
    const trimmed = trimAtRecipientMarker(line);
    const result = (trimmed.length >= 2 ? trimmed : line).replace(/\s+/g, " ").trim();
    if (!result || result.length < 2) return null;
    // After trimming, re-check: if it became a label:digits pattern, reject
    if (/^\s*[\p{L}]+\s*[:\-]\s*[\d.,/\-\s]+\s*$/u.test(result)) return null;
    // Or pure digits
    if (/^[\d\s.,/\-:|]+$/.test(result)) return null;
    return result.slice(0, 60);
  };

  const tryReturn = (line: string): string | null => {
    if (!isCandidate(line)) return null;
    return cleanAndTake(line);
  };

  // Strategy 1: prefer ANY line in the doc that has a company marker
  // (Limited/LTD/בע״מ/Inc/Meta/Google/...) — that's almost always the vendor.
  for (const line of lines) {
    if (isCandidate(line) && hasCompanyMarker(line)) {
      const r = cleanAndTake(line);
      if (r) return r;
    }
  }

  // Strategy 2: first decent candidate in the top 12 lines
  for (const line of lines.slice(0, 12)) {
    const r = tryReturn(line);
    if (r) return r;
  }

  // Strategy 3: any decent candidate anywhere
  for (const line of lines) {
    const r = tryReturn(line);
    if (r) return r;
  }

  // Fall back to filename (without ext)
  if (filename) {
    return filename.replace(/\.(pdf|jpg|jpeg|png|heic|webp)$/i, "").slice(0, 60);
  }

  return "—";
}

// ─── Category ──────────────────────────────────────────────────────────────

// Order matters — earlier entries take priority. Marketing first because
// "VAT Reg. No." in footer of Meta/Google ads receipts shouldn't beat the
// fact that the actual purchase is advertising.
const CATEGORY_HINTS: Array<{ category: ExpenseCategory; keywords: string[] }> = [
  { category: "إيجار", keywords: ["إيجار", "ايجار", "שכירות", "rent", "lease"] },
  { category: "كهرباء", keywords: ["كهرباء", "חשמל", "electric", "electricity"] },
  // Telecom — only SPECIFIC service brand/keywords, NOT generic "phone/טלפון"
  // (which is almost always a contact label, not a phone-service purchase).
  { category: "اتصالات", keywords: ["انترنت", "إنترنت", "internet", "wifi", "broadband", "fiber", "אינטרנט", "סלולר", "פלאפון", "סלקום", "פרטנר", "בזק", "יס", "הוט", "bezeq", "cellcom", "pelephone", "partner", "hot mobile", "yes", "Orange"] },
  { category: "مواصلات", keywords: ["شحن", "وقود", "بنزين", "fuel", "petrol", "דלק", "תחבורה", "delivery", "transport", "shipping"] },
  { category: "صيانة", keywords: ["صيانة", "תיקון", "maintenance", "repair", "תחזוקה"] },
  { category: "قروض وتقسيط", keywords: ["قرض", "تقسيط", "הלוואה", "מימון", "loan", "instalment", "installment"] },
  // Marketing — Facebook/Meta/Google ads receipts
  { category: "أخرى", keywords: ["פרסום", "מודעות", "Meta", "Facebook", "Instagram", "Google Ads", "AdWords", "ads", "advertising", "إعلان", "إعلانات", "تسويق", "promotion"] },
  // Tax/Fees — but require it to be a strong signal (specific keywords only,
  // not just "VAT" which appears in every receipt's footer)
  { category: "ضرائب ورسوم", keywords: ["ضريبة دخل", "رسوم بلدية", "אגרה", "מס הכנסה", "ביטוח לאומי", "income tax", "municipal", "license fee"] },
];

/**
 * Check whether a keyword appears in text as a WHOLE WORD (not as a
 * substring of another word). Works for Latin, Hebrew, and Arabic — JS
 * `\b` doesn't reliably handle non-ASCII.
 *
 * "מס" should NOT match inside "מסלול" but SHOULD match in "מס הכנסה".
 */
function containsWord(haystack: string, needle: string): boolean {
  const text = haystack;
  const kw = needle;
  if (!kw) return false;

  // Find all positions where the keyword appears
  let from = 0;
  while (true) {
    const idx = text.indexOf(kw, from);
    if (idx === -1) return false;
    const before = idx > 0 ? text[idx - 1] : "";
    const after = idx + kw.length < text.length ? text[idx + kw.length] : "";

    if (!isWordChar(before) && !isWordChar(after)) {
      return true;
    }
    from = idx + 1;
  }
}

function isWordChar(ch: string): boolean {
  if (!ch) return false;
  // Letters/digits in any script
  return /[\p{L}\p{N}]/u.test(ch);
}

/**
 * For category detection, we only want to consider lines that describe
 * the SERVICE/PRODUCT (not contact info, IDs, dates). This filter:
 *   1. Strips ENTIRE LINES that are clearly contact/ID lines
 *   2. Strips phone/email SEGMENTS from lines that mix content
 *      (e.g. "טלפון: 0584998772 שעה: 15:46" → "שעה: 15:46")
 *   3. Strips ID/reference segments from anywhere in any line
 */
function extractServiceText(text: string): string {
  const skipLine = (line: string): boolean => {
    // Phone-info lines (line is JUST a phone)
    if (/^\s*(טלפון|tel\.?|phone|هاتف|تلفون|נייד|mobile|fax|פקס|فاكس)\s*[:\-]?\s*[\d\s+\-()]+$/i.test(line)) return true;
    // Email-only lines
    if (/^\s*[\w._-]+@[\w.-]+\.\w+\s*$/.test(line)) return true;
    // ID-only lines
    if (/^\s*(עוסק\s*(פטור|מורשה)|ע[\.\.]?מ|ח[\.\.]?פ|ת[\.\.]?ז)\s*[:\-]?\s*\d+\s*$/i.test(line)) return true;
    // URL lines
    if (/^\s*(https?:\/\/|www\.)/i.test(line)) return true;
    return false;
  };

  // SEGMENT-level cleaners — applied to each surviving line.
  // Strip out fragments that look like "<label>: <digits>" so they don't
  // contaminate keyword matching.
  const stripSegments = (line: string): string => {
    return line
      // "טלפון: 097995449" / "phone: 12345" / "fax: ..."
      .replace(/(טלפון|tel|phone|هاتف|تلفون|נייד|mobile|fax|פקס|فاكس)\s*[:\-]?\s*[\d\s+\-()]{6,}/gi, " ")
      // "ע-מ/ת-ז: 21423381-9" / "ח.פ: ..." / "עוסק מורשה ..."
      .replace(/(עוסק\s*(פטור|מורשה)|ע[\.\.\-]?מ[\/\.\\\-]?ת[\.\.\-]?ז|ע[\.\.]?מ|ח[\.\.]?פ|ת[\.\.]?ז)\s*[:\-]?\s*[\d\-]+/gi, " ")
      // "מספר: 02/010530" / "מס׳ 12345" / "no. 1234"
      .replace(/(מספר|מס[׳']?|no\.?|number|אסמכתא|ref|reference)\s*[:\-]?\s*[\w\d\/\-]+/gi, " ")
      // "מזהה החשבון: ..." / "account id: ..."
      .replace(/(מזהה|account|acct)\s*[\w\u0590-\u05ff]*\s*[:\-]?\s*[\w\d]+/gi, " ")
      // VAT footer: "VAT Reg. No. F1234"
      .replace(/(VAT|מע[״"]?מ)\s*(reg|no)?\.?\s*(no|number)?\.?\s*[:\-]?\s*\w+/gi, " ")
      // Email anywhere
      .replace(/[\w._-]+@[\w.-]+\.\w+/g, " ")
      // Time: "שעה: 15:46" / "time: 14:30"
      .replace(/(שעה|time|الساعة)\s*[:\-]?\s*\d{1,2}:\d{2}/gi, " ")
      // Date labels: "תאריך: 23/02/2026"
      .replace(/(תאריך|date|تاريخ)\s*[:\-]?\s*\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/gi, " ")
      .trim();
  };

  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !skipLine(l))
    .map(stripSegments)
    .filter(Boolean)
    .join("\n");
}

function extractCategory(text: string): ExpenseCategory {
  // Filter out contact lines so phone numbers in headers don't trigger
  // "اتصالات" when the actual service is something else.
  const serviceText = extractServiceText(text).slice(0, 2000);
  const lower = serviceText.toLowerCase();

  for (const h of CATEGORY_HINTS) {
    for (const kw of h.keywords) {
      // Use word-boundary aware match — prevents "מס" from matching inside "מסלול"
      if (containsWord(lower, kw.toLowerCase()) || containsWord(serviceText, kw)) {
        return h.category;
      }
    }
  }
  // Try the existing auto-categorize lib (also on filtered text)
  const suggested = suggestCategory(serviceText.slice(0, 500));
  if (suggested && (EXPENSE_CATEGORIES as readonly string[]).includes(suggested)) {
    return suggested as ExpenseCategory;
  }
  return "أخرى";
}

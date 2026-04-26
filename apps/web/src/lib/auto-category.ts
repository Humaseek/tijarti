/**
 * Auto-categorize expenses from a description (Arabic + Hebrew + English keywords).
 *
 * Returns the best matching ExpenseCategory, or null if nothing matches confidently.
 * Uses word-boundary aware matching (Unicode-safe) — intentionally not ML
 * so it's fully offline, predictable, and explainable.
 */

import type { ExpenseCategory } from "@/lib/store/types";

type CategoryHint = {
  category: ExpenseCategory;
  /** Keywords in Arabic / Hebrew / English; matched as whole words. */
  keywords: string[];
};

// Order matters — earlier entries take priority. Specific categories
// before generic ones.
const HINTS: CategoryHint[] = [
  // ─── Fuel — gas stations + diesel ──────────────────────────────────────
  {
    category: "وقود",
    keywords: [
      "وقود", "بنزين", "بترول", "ديزل", "سولار",
      "fuel", "petrol", "diesel", "gasoline",
      "דלק", "סולר", "בנזין", "תדלוק",
      // Israeli gas station chains
      "סונול", "Sonol", "Yellow", "פז ", "Paz Oil",
      "דלק ישראל", "Delek Israel", "Menta", "מנטה",
      "דור אלון", "Dor Alon", "Alonit", "אלונית",
      "טן ", "Ten Plus", "טן פלוס",
      "סדש",
    ],
  },
  // ─── Telecom (specific brands only — no generic "phone") ────────────────
  {
    category: "اتصالات",
    keywords: [
      "انترنت", "إنترنت", "internet", "wifi", "broadband", "fiber",
      "אינטרנט", "סלולר", "פלאפון", "סלקום", "פרטנר", "בזק", "יס", "הוט",
      "bezeq", "cellcom", "pelephone", "partner", "hot mobile", "yes",
    ],
  },
  // ─── Electricity ───────────────────────────────────────────────────────
  {
    category: "كهرباء",
    keywords: [
      "كهرباء", "electric", "electricity", "חשמל", "חברת חשמל",
    ],
  },
  // ─── Rent ──────────────────────────────────────────────────────────────
  {
    category: "إيجار",
    keywords: [
      "إيجار", "ايجار", "اجار", "rent", "lease", "שכירות", "שכ\"ד",
    ],
  },
  // ─── Maintenance ───────────────────────────────────────────────────────
  {
    category: "صيانة",
    keywords: [
      "صيانة", "تصليح", "تنظيف", "نظافة",
      "maintenance", "repair", "cleaning",
      "תיקון", "תחזוקה", "ניקיון",
    ],
  },
  // ─── Transportation (non-fuel) ─────────────────────────────────────────
  {
    category: "مواصلات",
    keywords: [
      "نقل", "شحن", "توصيل", "تكسي", "تاكسي", "أوبر", "موبايل",
      "delivery", "shipping", "transport", "taxi", "uber", "Gett",
      "תחבורה", "משלוח", "מונית", "אוטובוס", "רכבת",
    ],
  },
  // ─── Food & restaurants ────────────────────────────────────────────────
  {
    category: "طعام ومطاعم",
    keywords: [
      "طعام", "اكل", "غداء", "عشاء", "إفطار", "مطعم", "كافيه", "قهوة",
      "food", "lunch", "dinner", "breakfast", "restaurant", "cafe", "coffee",
      "מסעדה", "אוכל", "קפה", "Wolt", "וולט", "10bis", "תן ביס", "Cibus", "סיבוס",
      "Aroma", "ארומה", "Cofix", "קופיקס", "Starbucks", "סטארבקס",
      "Tabit", "טאביט",
    ],
  },
  // ─── Groceries / supplies ──────────────────────────────────────────────
  {
    category: "بضاعة ومشتريات",
    keywords: [
      "بضاعة", "بضاعه", "مشتريات", "مخزون", "stock",
      "סחורה", "קניות", "מכולת",
      // Major Israeli supermarket chains
      "שופרסל", "Shufersal", "רמי לוי", "Rami Levy",
      "יוחננוף", "Yochananof", "ויקטורי", "Victory",
      "מגה ", "Mega in", "טיב טעם", "Tiv Taam",
      "AM:PM", "AMPM", "חצי חינם", "Hatzi Hinam",
      "קארפור", "Carrefour", "אושר עד", "Osher Ad",
    ],
  },
  // ─── Marketing & advertising ───────────────────────────────────────────
  {
    category: "تسويق وإعلان",
    keywords: [
      "اعلان", "إعلان", "تسويق", "فيسبوك", "انستقرام",
      "ads", "advertising", "marketing", "promotion",
      "פרסום", "מודעות", "Meta", "Facebook", "Instagram", "Google Ads",
      "AdWords", "TikTok",
    ],
  },
  // ─── Office supplies ───────────────────────────────────────────────────
  {
    category: "خدمات مكتبية",
    keywords: [
      "قرطاسية", "مكتب", "office", "stationery", "supplies",
      "אופיס דיפו", "Office Depot", "אופנינט", "Ofninet", "KSP",
    ],
  },
  // ─── Banks & financial ─────────────────────────────────────────────────
  {
    category: "بنوك ومدفوعات",
    keywords: [
      "بنك", "عمولة", "رسوم بنك",
      "bank", "fees", "commission",
      "בנק", "עמלה", "Leumi", "ליאומי", "Hapoalim", "הפועלים",
      "Discount", "דיסקונט", "Mizrahi", "מזרחי", "FIBI", "Mercantile", "מרכנתיל",
    ],
  },
  // ─── Taxes (specific only) ─────────────────────────────────────────────
  {
    category: "ضرائب ورسوم",
    keywords: [
      "ضريبة دخل", "رسوم بلدية", "ضريبة قيمة مضافة",
      "income tax", "municipal", "license fee", "VAT return",
      "מס הכנסה", "ביטוח לאומי", "אגרה עירונית", "ארנונה",
    ],
  },
  // ─── Loans / installments ──────────────────────────────────────────────
  {
    category: "قروض وتقسيط",
    keywords: [
      "قرض", "تقسيط",
      "loan", "instalment", "installment", "credit",
      "הלוואה", "מימון", "תשלומים",
    ],
  },
];

/** Word-boundary aware substring check for Unicode (Hebrew/Arabic/Latin). */
function containsWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const text = haystack;
  const kw = needle;
  let from = 0;
  while (true) {
    const idx = text.indexOf(kw, from);
    if (idx === -1) return false;
    const before = idx > 0 ? text[idx - 1] : "";
    const after = idx + kw.length < text.length ? text[idx + kw.length] : "";
    if (!isWordChar(before) && !isWordChar(after)) return true;
    from = idx + 1;
  }
}

function isWordChar(ch: string): boolean {
  if (!ch) return false;
  return /[\p{L}\p{N}]/u.test(ch);
}

/**
 * Returns the best-matching category for a description, or null.
 * Uses word-boundary aware matching (avoids "מס" matching inside "מסלול").
 */
export function suggestCategory(description: string): ExpenseCategory | null {
  if (!description) return null;
  const text = description.trim();
  if (text.length < 2) return null;
  const lower = text.toLowerCase();

  for (const h of HINTS) {
    for (const kw of h.keywords) {
      if (containsWord(lower, kw.toLowerCase()) || containsWord(text, kw)) {
        return h.category;
      }
    }
  }
  return null;
}

/**
 * Auto-categorize existing expenses that have a non-matching / default
 * category by re-checking their description. Returns the proposed patches.
 */
export function rebucketExpenses<T extends { id: string; description: string; category: string }>(
  expenses: T[]
): Array<{ id: string; from: string; to: ExpenseCategory }> {
  const out: Array<{ id: string; from: string; to: ExpenseCategory }> = [];
  for (const e of expenses) {
    const suggestion = suggestCategory(e.description);
    if (suggestion && suggestion !== e.category) {
      out.push({ id: e.id, from: e.category, to: suggestion });
    }
  }
  return out;
}

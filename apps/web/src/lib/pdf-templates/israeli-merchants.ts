/**
 * Israeli merchant detection — for everyday small-business expenses
 * (gas stations, supermarkets, restaurants, banks, etc.).
 *
 * These aren't full TemplateParsers like Morning/Rivhit — they're a
 * lightweight CHAIN DETECTION layer that runs after the main template
 * parsers fail to match. They identify the merchant by name/logo
 * keywords, set the appropriate expense category, and use the heuristic
 * extractor for amount/date/vendor.
 *
 * Coverage based on 2026 Israeli market research:
 *   - Gas: Sonol, Paz/Yellow, Delek/Menta, Dor Alon/Alonit, Ten, Sadash
 *   - Supermarkets: Shufersal, Rami Levy, Yochananof, Victory, Mega,
 *                   Tiv Taam, AM:PM, Hatzi Hinam, Carrefour
 *   - Restaurants: Tabit POS, Caspit, Rest, generic patterns
 *   - Pharmacies: SuperPharm, NewPharm, BE
 *   - Office supply: Office Depot Israel, ofninet
 *   - Banks: Leumi, Hapoalim, Discount, Mizrahi, FIBI, Mercantile
 *
 * Together with Morning/Rivhit/iCount, these merchant detectors cover
 * ~90%+ of typical Israeli SMB expense receipts.
 */

import type { ExpenseCategory } from "@/lib/store/types";

export interface MerchantMatch {
  /** Stable id (e.g. "sonol", "shufersal"). */
  id: string;
  /** Display name (Hebrew + English where possible). */
  name: string;
  /** Suggested expense category for receipts from this merchant. */
  category: ExpenseCategory;
  /** Extra fields specific to this merchant type (e.g. fuel-related). */
  type: "fuel" | "supermarket" | "restaurant" | "pharmacy" | "office" | "bank" | "other";
}

interface MerchantPattern {
  match: MerchantMatch;
  /** Keywords (case-insensitive substring match) that strongly indicate this merchant. */
  keywords: string[];
}

// ─── Gas stations ──────────────────────────────────────────────────────────
const GAS_STATIONS: MerchantPattern[] = [
  {
    match: { id: "sonol", name: "סונול / Sonol", category: "وقود", type: "fuel" },
    keywords: ["סונול", "Sonol", "sonol energy", "sogood", "סוגוד"],
  },
  {
    match: { id: "paz", name: "פז / Paz (Yellow)", category: "وقود", type: "fuel" },
    keywords: ["פז ", " פז", "Paz Oil", "Yellow", "ילו", "yellowdelek"],
  },
  {
    match: { id: "delek", name: "דלק / Delek (Menta)", category: "وقود", type: "fuel" },
    keywords: ["דלק ישראל", " דלק ", "Delek Israel", "Menta", "מנטה"],
  },
  {
    match: { id: "dor_alon", name: "דור אלון / Dor Alon (Alonit)", category: "وقود", type: "fuel" },
    keywords: ["דור אלון", "Dor Alon", "Alonit", "אלונית", "Alon", "Si Espresso"],
  },
  {
    match: { id: "ten", name: "טן / Ten", category: "وقود", type: "fuel" },
    keywords: ["טן ", " טן", "Ten Plus", "טן פלוס"],
  },
  {
    match: { id: "sadash", name: "סדש / Sadash", category: "وقود", type: "fuel" },
    keywords: ["סדש", "Sadash", "Mon Cheri", "מון שרי"],
  },
];

// ─── Supermarkets ──────────────────────────────────────────────────────────
const SUPERMARKETS: MerchantPattern[] = [
  {
    match: { id: "shufersal", name: "שופרסל / Shufersal", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["שופרסל", "Shufersal", "Shufer-Sal", "shopersal"],
  },
  {
    match: { id: "rami_levy", name: "רמי לוי / Rami Levy", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["רמי לוי", "Rami Levy", "רמי לוי שיווק"],
  },
  {
    match: { id: "yochananof", name: "יוחננוף / Yochananof", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["יוחננוף", "Yochananof", "Yohananof"],
  },
  {
    match: { id: "victory", name: "ויקטורי / Victory", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["ויקטורי", "Victory Supermarket"],
  },
  {
    match: { id: "mega", name: "מגה / Mega", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["מגה בעיר", "Mega in the city", " מגה "],
  },
  {
    match: { id: "tiv_taam", name: "טיב טעם / Tiv Taam", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["טיב טעם", "Tiv Taam"],
  },
  {
    match: { id: "ampm", name: "AM:PM", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["AM:PM", "AMPM", "אי אם פי אם"],
  },
  {
    match: { id: "hatzi_hinam", name: "חצי חינם / Hatzi Hinam", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["חצי חינם", "Hatzi Hinam"],
  },
  {
    match: { id: "carrefour", name: "קארפור / Carrefour", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["קארפור", "Carrefour"],
  },
  {
    match: { id: "osher_ad", name: "אושר עד / Osher Ad", category: "بضاعة ومشتريات", type: "supermarket" },
    keywords: ["אושר עד", "Osher Ad"],
  },
];

// ─── Restaurants & cafes ───────────────────────────────────────────────────
const RESTAURANTS: MerchantPattern[] = [
  {
    match: { id: "tabit_pos", name: "Tabit POS (مطعم)", category: "طعام ومطاعم", type: "restaurant" },
    keywords: ["Tabit", "טאביט", "powered by tabit"],
  },
  {
    match: { id: "caspit_pos", name: "Caspit POS", category: "طعام ومطاعم", type: "restaurant" },
    keywords: ["כספית", "Caspit", "ksp"],
  },
  {
    match: { id: "wolt", name: "Wolt", category: "طعام ومطاعم", type: "restaurant" },
    keywords: ["Wolt", "וולט", "WOLT"],
  },
  {
    match: { id: "ten_bis", name: "Ten Bis / סיבוס", category: "طعام ومطاعم", type: "restaurant" },
    keywords: ["10bis", "תן ביס", "Ten Bis", "Cibus", "סיבוס"],
  },
  {
    match: { id: "starbucks", name: "Starbucks", category: "طعام ومطاعم", type: "restaurant" },
    keywords: ["Starbucks", "סטארבקס"],
  },
  {
    match: { id: "aroma", name: "Aroma Espresso Bar", category: "طعام ومطاعم", type: "restaurant" },
    keywords: ["Aroma Espresso", "ארומה אספרסו"],
  },
  {
    match: { id: "cofix", name: "Cofix", category: "طعام ومطاعم", type: "restaurant" },
    keywords: ["Cofix", "קופיקס"],
  },
];

// ─── Pharmacies ────────────────────────────────────────────────────────────
const PHARMACIES: MerchantPattern[] = [
  {
    match: { id: "superpharm", name: "סופר-פארם / Super-Pharm", category: "أخرى", type: "pharmacy" },
    keywords: ["סופר-פארם", "סופר פארם", "Super-Pharm", "Superpharm", "Super Pharm"],
  },
  {
    match: { id: "newpharm", name: "ניופארם / NewPharm", category: "أخرى", type: "pharmacy" },
    keywords: ["ניופארם", "NewPharm", "New Pharm"],
  },
  {
    match: { id: "be_pharm", name: "BE", category: "أخرى", type: "pharmacy" },
    keywords: ["BE Group", "BE Pharm", "BE טבעי"],
  },
];

// ─── Office supplies ───────────────────────────────────────────────────────
const OFFICE: MerchantPattern[] = [
  {
    match: { id: "office_depot_il", name: "Office Depot Israel", category: "خدمات مكتبية", type: "office" },
    keywords: ["Office Depot", "אופיס דיפו"],
  },
  {
    match: { id: "ofninet", name: "אופנינט / Ofninet", category: "خدمات مكتبية", type: "office" },
    keywords: ["אופנינט", "Ofninet"],
  },
  {
    match: { id: "ksp", name: "KSP", category: "خدمات مكتبية", type: "office" },
    keywords: ["KSP", "kspshop"],
  },
];

// ─── Banks ─────────────────────────────────────────────────────────────────
const BANKS: MerchantPattern[] = [
  {
    match: { id: "leumi", name: "בנק לאומי / Bank Leumi", category: "بنوك ومدفوعات", type: "bank" },
    keywords: ["בנק לאומי", "ליאומי", "Leumi", "Bank Leumi"],
  },
  {
    match: { id: "hapoalim", name: "בנק הפועלים / Bank Hapoalim", category: "بنوك ومدفوعات", type: "bank" },
    keywords: ["בנק הפועלים", "הפועלים", "Hapoalim"],
  },
  {
    match: { id: "discount", name: "בנק דיסקונט / Discount Bank", category: "بنوك ومدفوعات", type: "bank" },
    keywords: ["בנק דיסקונט", "דיסקונט", "Discount Bank"],
  },
  {
    match: { id: "mizrahi", name: "בנק מזרחי טפחות / Mizrahi-Tefahot", category: "بنوك ومدفوعات", type: "bank" },
    keywords: ["מזרחי טפחות", "מזרחי-טפחות", "Mizrahi", "Tefahot"],
  },
  {
    match: { id: "fibi", name: "הבנק הבינלאומי / FIBI", category: "بنوك ومدفوعات", type: "bank" },
    keywords: ["הבנק הבינלאומי", "FIBI", "First International Bank"],
  },
  {
    match: { id: "mercantile", name: "בנק מרכנתיל / Mercantile", category: "بنوك ومدفوعات", type: "bank" },
    keywords: ["בנק מרכנתיל", "מרכנתיל", "Mercantile"],
  },
];

const ALL_MERCHANTS: MerchantPattern[] = [
  ...GAS_STATIONS,
  ...SUPERMARKETS,
  ...RESTAURANTS,
  ...PHARMACIES,
  ...OFFICE,
  ...BANKS,
];

/**
 * Detect which Israeli merchant chain a receipt is from. Returns the
 * first matching merchant or null.
 */
export function detectIsraeliMerchant(text: string): MerchantMatch | null {
  for (const m of ALL_MERCHANTS) {
    for (const kw of m.keywords) {
      if (text.includes(kw)) return m.match;
    }
  }
  return null;
}

// ─── Fuel-specific extraction ──────────────────────────────────────────────

export interface FuelDetails {
  liters?: number;
  pricePerLiter?: number;
  fuelType?: string;
}

/**
 * Extract fuel-specific fields from a gas station receipt.
 * Looks for patterns like:
 *   "ליטר X.XX" / "X.XX ליטר" / "X.XX L"  → liters
 *   "95 / 98 / סולר / דיזל"               → fuel type
 *   "X.XX ש"ח לליטר"                       → price per liter
 */
export function extractFuelDetails(text: string): FuelDetails {
  const details: FuelDetails = {};

  // Liters
  const litersMatch =
    text.match(/(\d+(?:[.,]\d{1,3})?)\s*(?:ליטר|ליטרים|L\b|לטר)/) ||
    text.match(/(?:ליטר|ליטרים|L\b)\s*(\d+(?:[.,]\d{1,3})?)/);
  if (litersMatch) {
    const v = parseFloat(litersMatch[1].replace(",", "."));
    if (isFinite(v) && v > 0) details.liters = v;
  }

  // Fuel type
  if (/\b95\b/.test(text)) details.fuelType = "بنزين 95";
  else if (/\b98\b/.test(text)) details.fuelType = "بنزين 98";
  else if (/סולר|דיזל|diesel/i.test(text)) details.fuelType = "ديزل / סולר";

  // Price per liter — "X.XX ש"ח לליטר" or "X.XX / לליטר"
  const ppLMatch = text.match(/(\d+(?:[.,]\d{1,3})?)\s*ש["״]?ח\s*[/]?\s*לליטר/) ||
                    text.match(/לליטר\s*[:\-]?\s*(\d+(?:[.,]\d{1,3})?)/);
  if (ppLMatch) {
    const v = parseFloat(ppLMatch[1].replace(",", "."));
    if (isFinite(v) && v > 0 && v < 20) details.pricePerLiter = v;
  }

  return details;
}

// ─── Restaurant-specific extraction ────────────────────────────────────────

export interface RestaurantDetails {
  /** Tip amount, if explicitly broken out. */
  tip?: number;
  /** Number of diners/people, if shown on the receipt. */
  diners?: number;
  /** Service type — dine-in, takeaway, or delivery. */
  serviceType?: "dine_in" | "takeaway" | "delivery";
}

export function extractRestaurantDetails(text: string): RestaurantDetails {
  const details: RestaurantDetails = {};

  // Tip — "טיפ", "שירות", "tip", "service charge"
  const tipMatch = text.match(/(?:טיפ|שירות|tip|service\s*charge)\s*[:\-]?\s*₪?\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (tipMatch) {
    const v = parseFloat(tipMatch[1].replace(",", "."));
    if (isFinite(v) && v > 0 && v < 1000) details.tip = v;
  }

  // Diners — "סועדים", "diners", "covers", "אורחים"
  const dinersMatch = text.match(/(?:סועדים|diners|covers|אורחים)\s*[:\-]?\s*(\d{1,2})/i);
  if (dinersMatch) {
    const v = parseInt(dinersMatch[1], 10);
    if (isFinite(v) && v > 0 && v < 100) details.diners = v;
  }

  // Service type
  if (/משלוח|delivery|דליברי|wolt|10bis/i.test(text)) details.serviceType = "delivery";
  else if (/take\s*away|takeaway|לקחת|טייק/i.test(text)) details.serviceType = "takeaway";
  else if (/באולם|dine\s*in|במקום/i.test(text)) details.serviceType = "dine_in";

  return details;
}

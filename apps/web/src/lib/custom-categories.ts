/**
 * Custom expense categories — user-defined categories on top of the
 * 3 ultra-generic built-ins below. Each business is different, so we
 * intentionally ship with only the broadest possible defaults and let
 * the user create their own (e.g. "تأمين السيارة", "ضيافة", "إيجار المحل").
 *
 * Each custom category gets:
 *   - A smart icon suggested from Arabic/Hebrew keywords in the name
 *   - A matching color (not gray!) — chosen from a curated palette
 *
 * Persistence: localStorage key `tj_custom_categories_v1`.
 */

import type { IconName } from "./icons";

// ─── Built-in dropdown categories ───────────────────────────────────────────
// Just three. Extremely general. Anything more specific = the user's job.
//   • مشتريات       — anything you BOUGHT (goods, materials, inventory)
//   • فواتير وخدمات  — bills + services you PAY for (rent, electricity,
//                      internet, salaries, subscriptions, maintenance...)
//   • أخرى          — fallback when nothing else fits
//
// These are the only options shown in the combobox by default. The
// ExpenseCategory union (in store/types.ts) still accepts any string at
// runtime, so existing seed data with specific categories like "كهرباء"
// keeps working — it just appears as a one-off entry in the dropdown.
export interface BuiltinCategory {
  name: string;
  icon: IconName;
  color: string;
}

export const BUILTIN_CATEGORIES: BuiltinCategory[] = [
  { name: "مشتريات",        icon: "box",   color: "#8B5CF6" },
  { name: "فواتير وخدمات",  icon: "card",  color: "#2563A6" },
  { name: "أخرى",           icon: "tag",   color: "#A89F91" },
];

export interface CustomCategory {
  id: string;
  name: string;
  icon: IconName;
  /** Hex color used for border + text + soft background tint. */
  color: string;
  created_at: string;
}

const STORAGE_KEY = "tj_custom_categories_v1";

// ─── Persistence ────────────────────────────────────────────────────────────
export function loadCustomCategories(): CustomCategory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomCategories(cats: CustomCategory[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
  } catch {
    /* localStorage full or blocked — silent fail */
  }
}

export function addCustomCategory(name: string): CustomCategory {
  const trimmed = name.trim();
  const list = loadCustomCategories();
  // De-dupe — return existing if name matches
  const existing = list.find((c) => c.name === trimmed);
  if (existing) return existing;
  const { icon, color } = suggestIconAndColor(trimmed);
  const cat: CustomCategory = {
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed,
    icon,
    color,
    created_at: new Date().toISOString(),
  };
  saveCustomCategories([...list, cat]);
  return cat;
}

export function deleteCustomCategory(id: string): void {
  const list = loadCustomCategories().filter((c) => c.id !== id);
  saveCustomCategories(list);
}

/**
 * Rename a custom category. The icon + color are re-derived from the new
 * name so the visual cue stays consistent with the new label.
 */
export function updateCustomCategory(id: string, newName: string): CustomCategory | null {
  const list = loadCustomCategories();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const trimmed = newName.trim();
  if (trimmed.length < 2) return null;
  const { icon, color } = suggestIconAndColor(trimmed);
  const updated: CustomCategory = {
    ...list[idx],
    name: trimmed,
    icon,
    color,
  };
  list[idx] = updated;
  saveCustomCategories(list);
  return updated;
}

// ─── Icon + color suggestions ───────────────────────────────────────────────
// Keyword → (icon, color) map. Order matters — first match wins.
// Colors are chosen from the Tijarti palette so they sit nicely with the
// existing built-in categories.

interface KeywordRule {
  keywords: string[];
  icon: IconName;
  color: string;
}

const RULES: KeywordRule[] = [
  // ─── Utilities ───────────────────────────────────────────────────────────
  { keywords: ["كهرباء", "كهربا", "طاقة", "كهرباء وطاقة", "electricity", "חשמל"],
    icon: "zap", color: "#BA7517" },
  { keywords: ["ماء", "مياه", "water", "מים"],
    icon: "globe", color: "#2563A6" },
  { keywords: ["غاز", "gas", "גז"],
    icon: "zap", color: "#A32D2D" },
  { keywords: ["انترنت", "إنترنت", "نت", "internet", "wifi", "אינטרנט"],
    icon: "globe", color: "#2563A6" },
  { keywords: ["اتصال", "هاتف", "تلفون", "جوال", "موبايل", "phone", "טלפון", "סלולר"],
    icon: "phone", color: "#2563A6" },

  // ─── Property ────────────────────────────────────────────────────────────
  { keywords: ["إيجار", "ايجار", "اجار", "rent", "lease", "שכירות"],
    icon: "store", color: "#0F6E56" },
  { keywords: ["بيت", "منزل", "سكن", "house", "home", "בית"],
    icon: "home", color: "#0F6E56" },

  // ─── Transport / fuel ────────────────────────────────────────────────────
  { keywords: ["وقود", "بنزين", "ديزل", "سولار", "fuel", "petrol", "diesel", "דלק"],
    icon: "truck", color: "#BA7517" },
  { keywords: ["نقل", "شحن", "توصيل", "تكسي", "تاكسي", "أوبر", "uber", "מונית", "תחבורה"],
    icon: "truck", color: "#BA7517" },
  { keywords: ["سيارة", "صيانة سيارة", "مرآب", "كراج", "car", "garage", "רכב"],
    icon: "truck", color: "#A32D2D" },

  // ─── Food / restaurants ──────────────────────────────────────────────────
  { keywords: ["طعام", "اكل", "غداء", "عشاء", "إفطار", "مطعم", "كافيه", "قهوة", "food", "restaurant", "מסעדה", "אוכל"],
    icon: "store", color: "#A32D2D" },

  // ─── Shopping / inventory ────────────────────────────────────────────────
  { keywords: ["بضاعة", "بضاعه", "مشتريات", "مخزون", "stock", "סחורה", "קניות"],
    icon: "box", color: "#8B5CF6" },

  // ─── Marketing & advertising ─────────────────────────────────────────────
  { keywords: ["اعلان", "إعلان", "تسويق", "فيسبوك", "انستقرام", "ads", "marketing", "פרסום"],
    icon: "share", color: "#C2185B" },

  // ─── Office / supplies ───────────────────────────────────────────────────
  { keywords: ["قرطاسية", "مكتب", "ورق", "office", "stationery"],
    icon: "edit", color: "#6B4B8F" },

  // ─── Maintenance / repairs ───────────────────────────────────────────────
  { keywords: ["صيانة", "تصليح", "تنظيف", "نظافة", "maintenance", "repair", "תיקון"],
    icon: "tool", color: "#A32D2D" },

  // ─── Salaries / staff ────────────────────────────────────────────────────
  { keywords: ["راتب", "رواتب", "موظف", "موظفين", "أجر", "salary", "wages", "משכורת"],
    icon: "users", color: "#0F6E56" },

  // ─── Banks / financial ───────────────────────────────────────────────────
  { keywords: ["بنك", "عمولة", "رسوم بنك", "bank", "fees", "בנק", "עמלה"],
    icon: "card", color: "#2563A6" },

  // ─── Taxes / fees ────────────────────────────────────────────────────────
  { keywords: ["ضريبة", "ضرائب", "tax", "ארנונה", "מס"],
    icon: "shield", color: "#A32D2D" },

  // ─── Loans / installments ────────────────────────────────────────────────
  { keywords: ["قرض", "قروض", "تقسيط", "loan", "credit", "הלוואה"],
    icon: "card", color: "#BA7517" },

  // ─── Insurance ───────────────────────────────────────────────────────────
  { keywords: ["تأمين", "ضمان", "insurance", "ביטוח"],
    icon: "shield", color: "#0F6E56" },

  // ─── Health / medical ────────────────────────────────────────────────────
  { keywords: ["صحة", "طب", "دواء", "صيدلية", "doctor", "medical", "רופא", "תרופה"],
    icon: "shield", color: "#A32D2D" },

  // ─── Education / training ────────────────────────────────────────────────
  { keywords: ["تعليم", "كتب", "دورة", "تدريب", "education", "training", "course"],
    icon: "lightbulb", color: "#6B4B8F" },

  // ─── Subscriptions ───────────────────────────────────────────────────────
  { keywords: ["اشتراك", "اشتراكات", "subscription", "מנוי"],
    icon: "calendar", color: "#8B5CF6" },

  // ─── Hospitality / gifts ─────────────────────────────────────────────────
  { keywords: ["ضيافة", "هدية", "هدايا", "كرم", "gift", "מתנה"],
    icon: "star", color: "#C2185B" },

  // ─── Cleaning / supplies ─────────────────────────────────────────────────
  { keywords: ["تنظيف", "صابون", "منظفات", "cleaning"],
    icon: "tool", color: "#2563A6" },
];

// Fallback palette — used when no keyword matches. The choice is
// deterministic per name (hash-based) so the same custom category
// always gets the same color across reloads.
const FALLBACK_PALETTE: string[] = [
  "#8B5CF6", // violet
  "#0F6E56", // success green
  "#BA7517", // warning orange
  "#2563A6", // info blue
  "#A32D2D", // danger red
  "#6B4B8F", // purple
  "#C2185B", // pink
  "#00897B", // teal
];

const FALLBACK_ICONS: IconName[] = ["tag", "star", "box", "card"];

/**
 * Hash a string to a stable integer (FNV-1a-ish, not cryptographic).
 * Used to pick a fallback color/icon deterministically per name.
 */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

/**
 * Suggests an icon + color for a category name. First tries a keyword match
 * across Arabic/Hebrew/English; falls back to a hash-based pick from the
 * curated palette so unknown names still get a unique non-gray color.
 */
export function suggestIconAndColor(name: string): { icon: IconName; color: string } {
  if (!name) return { icon: "tag", color: FALLBACK_PALETTE[0] };
  const lower = name.toLowerCase().trim();
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return { icon: rule.icon, color: rule.color };
      }
    }
  }
  const h = hashString(lower);
  return {
    icon: FALLBACK_ICONS[h % FALLBACK_ICONS.length],
    color: FALLBACK_PALETTE[h % FALLBACK_PALETTE.length],
  };
}

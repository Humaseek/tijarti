/**
 * Semantic search — parses natural-language Arabic queries and filters
 * customers, products, invoices, expenses locally (no API).
 */

import type { StoreState, Customer, Product, Invoice, Expense } from "@/lib/store/types";
import { todayIso, addDays } from "@/lib/dates";

export interface SearchResults {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  interpretation: string;
}

function normalize(q: string): string {
  return q.trim().replace(/[؟?!.,،]/g, " ").replace(/\s+/g, " ").toLowerCase();
}

export function semanticSearch(q: string, state: StoreState): SearchResults {
  const n = normalize(q);
  const result: SearchResults = {
    customers: [], products: [], invoices: [], expenses: [],
    interpretation: "",
  };
  if (!n) return result;

  let matched = false;

  // "زبائن VIP" / VIP customers
  if (/(زباين|زبائن|زبون).*(vip|ڤي|في آي|ذهبيات)/i.test(n) || /vip/.test(n)) {
    result.customers = state.customers.filter((c) => c.tag === "VIP");
    result.interpretation = "زبائن VIP";
    matched = true;
  }
  // "زبائن جدد"
  else if (/(زباين|زبائن|زبون).*(جديد|جدد)/.test(n)) {
    result.customers = state.customers.filter((c) => c.tag === "جديدة");
    result.interpretation = "زبائن جدد";
    matched = true;
  }
  // "زبائن عليهن دين"
  else if (/(زباين|زبائن|زبون).*(دين|مدين|عليه)/.test(n)) {
    result.customers = state.customers.filter((c) => c.debt > 0);
    result.interpretation = "زبائن عليهن ديون";
    matched = true;
  }
  // "فواتير أمس" / invoices yesterday
  if (/فوات.*(امس|أمس|الأمس)/.test(n)) {
    const yesterday = addDays(todayIso(), -1);
    result.invoices = state.invoices.filter((i) => i.date === yesterday);
    result.interpretation = "فواتير أمس";
    matched = true;
  } else if (/فوات.*(اليوم|هاليوم|يوم)/.test(n)) {
    result.invoices = state.invoices.filter((i) => i.date === todayIso());
    result.interpretation = "فواتير اليوم";
    matched = true;
  } else if (/فوات.*(اسبوع|أسبوع)/.test(n)) {
    const since = addDays(todayIso(), -7);
    result.invoices = state.invoices.filter((i) => i.date >= since);
    result.interpretation = "فواتير آخر أسبوع";
    matched = true;
  }
  // "منتجات مخزون منخفض"
  if (/(منتج|بضاع|سلع).*(مخزون|قلي)/.test(n) || /(مخزون|ستوك).*(قليل|منخفض|قريب)/.test(n)) {
    result.products = state.products.filter(
      (p) => p.stock <= (p.low_stock_threshold ?? state.storeSettings.low_stock_default)
    );
    result.interpretation = "منتجات مخزون منخفض";
    matched = true;
  }
  // "منتجات غالية" / expensive products
  if (/(منتج).*(غالي|سعر.*عالي)/.test(n)) {
    const threshold = 200;
    result.products = state.products.filter((p) => p.price >= threshold);
    result.interpretation = `منتجات السعر أعلى من ${threshold} ₪`;
    matched = true;
  }
  // "مصاريف أكبر من X"
  const expThresh = n.match(/مصاريف.*(اكبر|أكبر|اعلى|أعلى|فوق).*([\d,]+)/);
  if (expThresh) {
    const amt = parseFloat(expThresh[2].replace(/,/g, ""));
    result.expenses = state.expenses.filter((e) => e.amount > amt);
    result.interpretation = `مصاريف أكبر من ${amt.toLocaleString()} ₪`;
    matched = true;
  }
  // "مصاريف <فئة>"
  if (!result.expenses.length) {
    const cats = ["إيجار", "كهرباء", "اتصالات", "مواصلات", "صيانة", "رواتب"];
    for (const c of cats) {
      if (n.includes(c.toLowerCase())) {
        result.expenses = state.expenses.filter((e) => e.category === c);
        result.interpretation = `مصاريف ${c}`;
        matched = true;
        break;
      }
    }
  }

  if (!matched) {
    // fallback — substring search across everything
    result.customers = state.customers.filter((c) => c.name.toLowerCase().includes(n) || c.phone?.includes(n));
    result.products = state.products.filter((p) => p.name.toLowerCase().includes(n) || p.sku?.toLowerCase().includes(n));
    result.invoices = state.invoices.filter((i) => i.no.toLowerCase().includes(n));
    result.expenses = state.expenses.filter(
      (e) => e.description.toLowerCase().includes(n) || e.category.toLowerCase().includes(n)
    );
    result.interpretation = `بحث: "${q}"`;
  }

  return result;
}

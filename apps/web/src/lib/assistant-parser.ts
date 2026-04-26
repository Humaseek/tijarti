/**
 * assistant-parser — parses natural-language Arabic queries into answers.
 * Runs entirely locally (no API). Used by chat assistant and voice query.
 */

import type { StoreState } from "@/lib/store/types";
import { monthlyNarration } from "@/lib/narration";
import { periodRange, metricsFor } from "@/lib/analytics";
import { todayIso } from "@/lib/dates";

export interface AssistantAnswer {
  text: string;
  /** Optional page to offer as a deep link. */
  link?: { label: string; href: string };
  /** Optional data (stored as JSON string for display). */
  details?: string[];
}

function normalize(q: string): string {
  return q
    .trim()
    .replace(/[؟?!.,،]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function parseAssistantQuery(q: string, state: StoreState): AssistantAnswer {
  const n = normalize(q);

  // greetings
  if (/^(مرحبا|هاي|أهلا|صباح|مساء|hi|hello)/.test(n)) {
    return { text: "مرحبا! اسأليني عن مبيعاتك، زبائنك، أو شو رأيي بأرباحك." };
  }

  // "قدّيش بعت/بعتي الأسبوع" / week sales
  if (/(قديش|كم|شو).*(بعت|مبيع).*(اسبوع|أسبوع|الاسبوع)/.test(n) || /مبيعات.*(اسبوع|أسبوع)/.test(n)) {
    const range = periodRange("week");
    const m = metricsFor(state, range);
    return {
      text: `هذا الأسبوع بعتِ ${m.revenue.toLocaleString()} ₪ عبر ${m.invoiceCount} فاتورة، وصافي ربح ${m.profit.toLocaleString()} ₪.`,
      link: { label: "تفاصيل المبيعات", href: "/desktop/invoices" },
    };
  }

  // month
  if (/(قديش|كم|شو).*(بعت|مبيع).*(شهر|الشهر)/.test(n) || /مبيعات.*(شهر|الشهر)/.test(n)) {
    const range = periodRange("month");
    const m = metricsFor(state, range);
    return {
      text: `هذا الشهر بعتِ ${m.revenue.toLocaleString()} ₪ عبر ${m.invoiceCount} فاتورة، صافي ربح ${m.profit.toLocaleString()} ₪.`,
    };
  }

  // today
  if (/اليوم.*(بعت|مبيع)/.test(n) || /(بعت|مبيع).*اليوم/.test(n)) {
    const range = periodRange("today");
    const m = metricsFor(state, range);
    return {
      text: `اليوم بعتِ ${m.revenue.toLocaleString()} ₪ (${m.invoiceCount} فاتورة).`,
    };
  }

  // "أكبر زبائن هذا الشهر" / top customers
  if (/(أكبر|اكبر|أفضل|افضل).*(زبون|زباين|زبائن|زبونات)/.test(n)) {
    const totals = new Map<string, number>();
    for (const inv of state.invoices) {
      totals.set(inv.customerId, (totals.get(inv.customerId) ?? 0) + inv.total);
    }
    const top = Array.from(totals.entries())
      .map(([cid, amt]) => ({
        name: state.customers.find((c) => c.id === cid)?.name ?? "غير معروف",
        amt,
      }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 5);
    return {
      text: top.length
        ? `أكبر زبائنك:\n${top.map((t, i) => `${i + 1}. ${t.name} — ${t.amt.toLocaleString()} ₪`).join("\n")}`
        : "ما في زبائن مسجلين بعد.",
      link: { label: "كل الزبائن", href: "/desktop/customers" },
    };
  }

  // "شو رأيك بأرباحي" / narrative
  if (/(شو|رايك|رأيك|قيمي|قيّمي|اخبريني|قصيلي).*(ربح|أرباح|ارباح|حال|وضع|مصروف|مصاريف)/.test(n)
      || /كيف.*(شهر|أرباح|ارباح)/.test(n)) {
    const nr = monthlyNarration(state);
    return {
      text: nr.paragraphs.join(" "),
      details: nr.highlights.map((h) => `${h.emoji} ${h.text}`),
      link: { label: "تقارير مفصّلة", href: "/desktop/expenses/insights" },
    };
  }

  // "فاتورة جديدة ل<اسم> <مبلغ>" — extract
  const newInvoice = n.match(/فاتور.*ل\s*([\p{L}]+)\s*([\d,.]+)?/u);
  if (newInvoice) {
    const who = newInvoice[1];
    const amt = newInvoice[2] ? newInvoice[2].replace(/,/g, "") : "";
    const matched = state.customers.find((c) => c.name.toLowerCase().includes(who));
    return {
      text: matched
        ? `تمام، رح أفتح فاتورة جديدة للزبونة ${matched.name}${amt ? ` بمبلغ ${amt} ₪` : ""}.`
        : `ما لقيت زبونة اسمها "${who}". افتحي الصفحة يدوي.`,
      link: { label: "فاتورة جديدة", href: "/desktop/sales" },
    };
  }

  // low stock
  if (/(مخزون|منتج).*منخفض|قلي[لّ]ة.*مخزون/.test(n)) {
    const low = state.products.filter(
      (p) => p.stock <= (p.low_stock_threshold ?? state.storeSettings.low_stock_default)
    );
    return {
      text: low.length
        ? `${low.length} منتجات مخزونها منخفض:\n${low.slice(0, 5).map((p) => `• ${p.name} — ${p.stock} قطعة`).join("\n")}`
        : "المخزون كله بوضع جيد.",
      link: { label: "المخزون", href: "/desktop/products" },
    };
  }

  // debts
  if (/(ديون|دين|مدينين|عليهم)/.test(n)) {
    const total = state.customers.reduce((s, c) => s + c.debt, 0);
    const count = state.customers.filter((c) => c.debt > 0).length;
    return {
      text: count
        ? `${count} زبونات عليهن ديون بمجموع ${total.toLocaleString()} ₪.`
        : "ما في ديون مفتوحة.",
      link: { label: "الزبائن", href: "/desktop/customers" },
    };
  }

  // profit
  if (/(صافي|ربح|أرباح|ارباح|هامش)/.test(n)) {
    const m = metricsFor(state, periodRange("month"));
    return {
      text: `صافي ربح هذا الشهر: ${m.profit.toLocaleString()} ₪ على إيرادات ${m.revenue.toLocaleString()} ₪.`,
    };
  }

  // fallback — substring search across customers/products
  const foundCust = state.customers.filter((c) => c.name.toLowerCase().includes(n)).slice(0, 3);
  const foundProd = state.products.filter((p) => p.name.toLowerCase().includes(n)).slice(0, 3);
  if (foundCust.length || foundProd.length) {
    const parts: string[] = [];
    if (foundCust.length) parts.push(`زبائن: ${foundCust.map((c) => c.name).join("، ")}`);
    if (foundProd.length) parts.push(`منتجات: ${foundProd.map((p) => p.name).join("، ")}`);
    return { text: parts.join("\n") };
  }

  return {
    text: "ما فهمت السؤال. جربي: «قدّيش بعت الأسبوع» أو «أكبر زبائن هذا الشهر» أو «شو رأيك بأرباحي».",
  };
}

export const SUGGESTED_QUESTIONS = [
  "قدّيش بعت هذا الأسبوع؟",
  "أكبر زبائن هذا الشهر؟",
  "شو رأيك بأرباحي؟",
  "قدّيش بعت اليوم؟",
  "منتجات مخزون منخفض",
  "الديون المفتوحة",
];

export function todayDateLabel(): string {
  return todayIso();
}

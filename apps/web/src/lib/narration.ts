/**
 * Monthly narration — generate a natural-language paragraph summarizing
 * the store's month. Pulls from analytics.ts to get period metrics with
 * comparisons, then composes Arabic sentences with feel.
 */

import type { StoreState } from "@/lib/store/types";
import { periodRange, previousRange, metricsFor, pctChange } from "@/lib/analytics";

export interface Narration {
  title: string;
  paragraphs: string[];
  highlights: Array<{ emoji: string; text: string; tone: "positive" | "negative" | "neutral" }>;
}

export function monthlyNarration(state: StoreState): Narration {
  const range = periodRange("month");
  const prev = previousRange(range);
  const cur = metricsFor(state, range);
  const old = metricsFor(state, prev);

  const revChange = pctChange(cur.revenue, old.revenue);
  const expChange = pctChange(cur.expenses, old.expenses);
  const profitChange = pctChange(cur.profit, old.profit);

  const highlights: Narration["highlights"] = [];

  // Opening sentence — cash in context
  const p1 = [
    `هذا الشهر بعتِ ${cur.revenue.toLocaleString()} ₪`,
    cur.invoiceCount > 0 ? `من خلال ${cur.invoiceCount} فاتورة` : null,
    revChange !== null
      ? `${revChange >= 0 ? "ارتفع" : "انخفض"} ${Math.abs(revChange).toFixed(0)}% مقارنة مع ${old.revenue.toLocaleString()} ₪ الشهر الماضي`
      : null,
  ].filter(Boolean).join("، ") + ".";

  if (revChange !== null && revChange > 10) {
    highlights.push({ emoji: "📈", text: `نمو مبيعات ${revChange.toFixed(0)}%`, tone: "positive" });
  } else if (revChange !== null && revChange < -10) {
    highlights.push({ emoji: "📉", text: `تراجع مبيعات ${Math.abs(revChange).toFixed(0)}%`, tone: "negative" });
  }

  // Profit line
  const profitSign = cur.profit >= 0 ? "ربح" : "خسارة";
  const p2 = cur.profit >= 0
    ? `صافي ربحك ${cur.profit.toLocaleString()} ₪${profitChange !== null ? ` (${profitChange >= 0 ? "↑" : "↓"} ${Math.abs(profitChange).toFixed(0)}%)` : ""} — وضع ${profitChange !== null && profitChange >= 0 ? "متحسّن" : "يحتاج متابعة"}.`
    : `للأسف هذا الشهر انقلب لخسارة ${Math.abs(cur.profit).toLocaleString()} ₪. لازم تخفّفي المصاريف أو ترفعي المبيعات الشهر القادم.`;

  if (cur.profit < 0) {
    highlights.push({ emoji: "⚠️", text: `خسارة ${Math.abs(cur.profit).toLocaleString()} ₪`, tone: "negative" });
  } else if (cur.profit > 0 && cur.revenue > 0) {
    const margin = (cur.profit / cur.revenue) * 100;
    if (margin >= 25) highlights.push({ emoji: "💎", text: `هامش ممتاز ${margin.toFixed(0)}%`, tone: "positive" });
  }

  // Expenses
  let p3 = "";
  if (expChange !== null && Math.abs(expChange) > 15) {
    p3 = expChange > 0
      ? `مصاريفك زادت ${expChange.toFixed(0)}% — ركّزي على التصنيف الأكبر لتقليصه.`
      : `مصاريفك انخفضت ${Math.abs(expChange).toFixed(0)}% — شغل جيد على الترشيد!`;
    if (expChange > 20) highlights.push({ emoji: "💸", text: `زيادة مصاريف ${expChange.toFixed(0)}%`, tone: "negative" });
  }

  // Top expense category
  const byCat = new Map<string, number>();
  for (const e of state.expenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const sorted = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
  let p4 = "";
  if (sorted.length > 0 && cur.expenses > 0) {
    const [topCat, topAmt] = sorted[0];
    const share = (topAmt / cur.expenses) * 100;
    if (share >= 40) {
      p4 = `"${topCat}" لوحدها تستهلك ${share.toFixed(0)}% من مصاريفك (${topAmt.toLocaleString()} ₪). حاولي تفاوضي على هذا التصنيف.`;
    }
  }

  // Top customer
  const custRev = new Map<string, number>();
  for (const inv of state.invoices) custRev.set(inv.customerId, (custRev.get(inv.customerId) ?? 0) + inv.total);
  const topCust = Array.from(custRev.entries()).sort((a, b) => b[1] - a[1])[0];
  let p5 = "";
  if (topCust) {
    const cust = state.customers.find((c) => c.id === topCust[0]);
    if (cust && topCust[1] >= 500) {
      p5 = `أكبر زبونة: ${cust.name} بـ ${topCust[1].toLocaleString()} ₪. استمري بالحرص على رضاها.`;
      highlights.push({ emoji: "⭐", text: `${cust.name} أكبر زبونة`, tone: "positive" });
    }
  }

  // Overdue debts
  const outstanding = state.customers.filter((c) => c.debt > 0).reduce((s, c) => s + c.debt, 0);
  let p6 = "";
  if (outstanding > 0) {
    const count = state.customers.filter((c) => c.debt > 0).length;
    p6 = `عندك ${outstanding.toLocaleString()} ₪ ديون مش محصّلة من ${count} زبائن. حصّلي منهم قبل نهاية الشهر.`;
    if (outstanding > cur.revenue * 0.3) {
      highlights.push({ emoji: "🔔", text: `${count} زبائن عليهم ديون`, tone: "negative" });
    }
  }

  // New customers
  let p7 = "";
  if (cur.newCustomers > 0) {
    p7 = `${cur.newCustomers} زبائن نشطين هذا الشهر — ${cur.newCustomers >= 5 ? "نمو جميل" : "واصلي الجذب"}.`;
  }

  // Closing encouraging note
  const closing = cur.profit >= 0 && revChange !== null && revChange >= 0
    ? "بشكل عام، الشهر كان إيجابي. ركّزي على اللي شغّال ووسّعي فيه."
    : "شهر فيه تحدّيات، بس الشغل منهجي والتطبيق بيساعدك تشوفي الصورة الكاملة.";

  const paragraphs = [p1, p2, p3, p4, p5, p6, p7, closing].filter(Boolean);

  return {
    title: "ملخّص شهرك بالكلام",
    paragraphs,
    highlights,
  };
}

/**
 * Extra narratives — weekly, customer, inventory, cashflow.
 * Each returns a paragraph + highlights.
 */

import type { StoreState } from "@/lib/store/types";
import { periodRange, metricsFor } from "@/lib/analytics";
import { todayIso, addDays } from "@/lib/dates";

export interface Narrative {
  title: string;
  paragraphs: string[];
  highlights: Array<{ emoji: string; text: string }>;
}

export function weeklyNarrative(state: StoreState): Narrative {
  const range = periodRange("week");
  const m = metricsFor(state, range);
  const prev = metricsFor(state, {
    from: addDays(range.from, -7),
    to: addDays(range.from, -1),
    label: "الأسبوع الماضي",
  });
  const delta = prev.revenue > 0 ? Math.round(((m.revenue - prev.revenue) / prev.revenue) * 100) : 0;
  const p1 = `هذا الأسبوع بعتِ ${m.revenue.toLocaleString()} ₪ عبر ${m.invoiceCount} فاتورة.`;
  const p2 = delta === 0
    ? "مبيعاتك متوازية مع الأسبوع الماضي."
    : delta > 0
    ? `مبيعاتك ارتفعت ${delta}% عن الأسبوع الماضي — استمراري بهذا الزخم.`
    : `مبيعاتك انخفضت ${Math.abs(delta)}% عن الأسبوع الماضي — شوفي السبب ممكن يكون موسمية.`;
  return {
    title: "ملخص أسبوعي",
    paragraphs: [p1, p2],
    highlights: [
      { emoji: "📊", text: `صافي ربح ${m.profit.toLocaleString()} ₪` },
      { emoji: "📅", text: `${m.invoiceCount} فاتورة` },
    ],
  };
}

export function customerNarrative(state: StoreState): Narrative {
  const totals = new Map<string, number>();
  for (const inv of state.invoices) {
    totals.set(inv.customerId, (totals.get(inv.customerId) ?? 0) + inv.total);
  }
  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const topName = top ? state.customers.find((c) => c.id === top[0])?.name : null;
  const debtCount = state.customers.filter((c) => c.debt > 0).length;
  const totalDebt = state.customers.reduce((s, c) => s + c.debt, 0);
  const p1 = topName
    ? `أفضل زبونة لديك "${topName}" اشترت بـ ${top![1].toLocaleString()} ₪ حتى الآن.`
    : "لا بيانات زبائن بعد.";
  const p2 = debtCount === 0
    ? "لا ديون مفتوحة — تحصيل ممتاز!"
    : `لديك ${debtCount} زبونات عليهن دين بمجموع ${totalDebt.toLocaleString()} ₪ — يستحسن متابعتهن.`;
  return {
    title: "أداء الزبائن",
    paragraphs: [p1, p2],
    highlights: [
      { emoji: "👥", text: `${state.customers.length} زبون مسجّل` },
      { emoji: "⭐", text: `${state.customers.filter((c) => c.tag === "VIP").length} VIP` },
    ],
  };
}

export function inventoryNarrative(state: StoreState): Narrative {
  const total = state.products.length;
  const low = state.products.filter(
    (p) => p.stock <= (p.low_stock_threshold ?? state.storeSettings.low_stock_default)
  );
  const outOfStock = state.products.filter((p) => p.stock === 0);
  const totalValue = state.products.reduce((s, p) => s + p.stock * p.cost, 0);
  const p1 = `عندك ${total} منتج — بقيمة إجمالية ${totalValue.toLocaleString()} ₪ بسعر التكلفة.`;
  const p2 = outOfStock.length
    ? `${outOfStock.length} منتج نفد مخزونه — بيع ضائع محتمل.`
    : low.length
    ? `${low.length} منتج مخزونه منخفض — احسبي إذا بدك تعيدي طلبهم.`
    : "كل المخزون بوضع جيد.";
  return {
    title: "المخزون",
    paragraphs: [p1, p2],
    highlights: [
      { emoji: "📦", text: `${total} منتج` },
      { emoji: "⚠️", text: `${low.length} منخفض` },
    ],
  };
}

export function cashflowNarrative(state: StoreState): Narrative {
  const upcomingIn = state.checks
    .filter((c) => c.direction === "incoming" && c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);
  const upcomingOut = state.checks
    .filter((c) => c.direction === "outgoing" && c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);
  const net = upcomingIn - upcomingOut;
  const today = todayIso();
  const overdue = state.checks.filter(
    (c) => c.status === "pending" && c.due_date < today
  );
  const p1 = `على الباب: ${upcomingIn.toLocaleString()} ₪ واردة و ${upcomingOut.toLocaleString()} ₪ صادرة — صافي ${net >= 0 ? "+" : ""}${net.toLocaleString()} ₪.`;
  const p2 = overdue.length > 0
    ? `انتباه: ${overdue.length} شيك متأخرة — راجعيها فورًا.`
    : "كل الشيكات في وقتها.";
  return {
    title: "التدفق النقدي",
    paragraphs: [p1, p2],
    highlights: [
      { emoji: "📥", text: `${upcomingIn.toLocaleString()} ₪ واردة` },
      { emoji: "📤", text: `${upcomingOut.toLocaleString()} ₪ صادرة` },
    ],
  };
}

/**
 * Smart insights — derives human-readable observations from raw store data.
 *
 * The goal: surface the 3-5 things the shop owner should actually care about
 * RIGHT NOW, written as sentences not dashboards. "أبو علي تأخّر 15 يوم على
 * فاتورة 1200 ₪" beats "5 overdue invoices" because it tells her what to do.
 */

import type { IconName } from "@/lib/icons";
import { todayIso, daysUntil } from "@/lib/dates";
import type { StoreState } from "@/lib/store/types";
import { periodRange, previousRange, metricsFor, pctChange } from "@/lib/analytics";

export type InsightSeverity = "success" | "info" | "warn" | "danger";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  icon: IconName;
  title: string;
  message: string;
  /** Optional link for the user to drill into. */
  href?: string;
  /** Higher = shown first. */
  priority: number;
}

export function computeInsights(state: StoreState): Insight[] {
  const insights: Insight[] = [];
  const today = todayIso();

  // ─── Birthday reminders ──────────────────────────────────────────────────
  // Customers whose birthday is within the next 7 days get a celebration hint
  const todayD = new Date(today);
  const monthDay = (iso: string) => {
    const d = new Date(iso);
    return d.getMonth() * 31 + d.getDate();
  };
  const todayKey = todayD.getMonth() * 31 + todayD.getDate();
  const birthdaySoon = state.customers.filter((c) => {
    if (!c.birthday) return false;
    const key = monthDay(c.birthday);
    const diff = ((key - todayKey) + 365) % 365;
    return diff <= 7;
  }).slice(0, 3);
  if (birthdaySoon.length > 0) {
    const names = birthdaySoon.map((c) => c.name).join("، ");
    insights.push({
      id: "birthdays-upcoming",
      severity: "info",
      icon: "star",
      title: `🎂 عيد ميلاد قريب: ${names}`,
      message: "أرسلي تهنئة واتساب مع خصم بسيط — لفتة تبني ولاء",
      href: "/customers",
      priority: 90,
    });
  }

  // ─── 0. Weekly summary (hero insight) ────────────────────────────────────
  const weekRange = periodRange("week");
  const weekMetrics = metricsFor(state, weekRange);
  const weekPrev = metricsFor(state, previousRange(weekRange));
  const revChange = pctChange(weekMetrics.revenue, weekPrev.revenue);
  if (weekMetrics.invoiceCount > 0) {
    const up = revChange !== null && revChange > 5;
    const down = revChange !== null && revChange < -5;
    const trend = up ? "↗ ارتفعت" : down ? "↘ انخفضت" : "ثبتت";
    const pct = revChange === null ? "" : ` ${Math.abs(revChange).toFixed(0)}%`;
    insights.push({
      id: "weekly-summary",
      severity: up ? "success" : down ? "warn" : "info",
      icon: "chart",
      title: `الأسبوع: ${weekMetrics.revenue.toLocaleString()} ₪ مبيعات — ${trend}${pct}`,
      message: `${weekMetrics.invoiceCount} فاتورة · متوسط ${Math.round(weekMetrics.avgInvoice).toLocaleString()} ₪${weekMetrics.newCustomers > 0 ? ` · ${weekMetrics.newCustomers} زبائن نشطين` : ""}`,
      href: "/reports/monthly",
      priority: 110,
    });
  }

  // ─── 1. Overdue customer invoices ────────────────────────────────────────
  // Customers with big debt get flagged individually.
  const debtCustomers = state.customers
    .filter((c) => c.debt > 0)
    .sort((a, b) => b.debt - a.debt);

  if (debtCustomers.length > 0) {
    const top = debtCustomers[0];
    insights.push({
      id: `debt-top:${top.id}`,
      severity: top.debt >= 2000 ? "danger" : "warn",
      icon: "user",
      title: `${top.name} عليها ${top.debt.toLocaleString()} ₪`,
      message:
        debtCustomers.length > 1
          ? `أكبر زبونة ديون من أصل ${debtCustomers.length} زبائن عليهم مستحقات`
          : "راجعي الفواتير وخذي دفعة عند أقرب فرصة",
      href: `/customers/${top.id}`,
      priority: top.debt >= 2000 ? 95 : 75,
    });
  }

  // Customers overdue 30+ days on payment — if we have lastVisit ISO
  // lastVisit is in the past → daysUntil is negative → -daysUntil = days elapsed
  const seriouslyOverdue = state.customers.filter((c) => {
    if (c.debt <= 0) return false;
    if (!c.lastVisit) return false;
    const daysSince = -daysUntil(c.lastVisit, today);
    return daysSince > 30;
  });
  if (seriouslyOverdue.length >= 2) {
    insights.push({
      id: "overdue-cluster",
      severity: "warn",
      icon: "clock",
      title: `${seriouslyOverdue.length} زبائن تأخّروا أكثر من 30 يوم`,
      message: "أرسلي تذكير واتساب — التحصيل كلما تأخّر أصعب",
      href: "/customers",
      priority: 80,
    });
  }

  // ─── 2. Checks due soon ──────────────────────────────────────────────────
  const upcomingChecks = state.checks.filter((c) => c.status === "pending" && c.due_date);
  const dueSoon = upcomingChecks.filter((c) => {
    const d = daysUntil(c.due_date!);
    return d >= 0 && d <= 7;
  });
  const overdue = upcomingChecks.filter((c) => {
    const d = daysUntil(c.due_date!);
    return d < 0;
  });
  if (overdue.length > 0) {
    const outTotal = overdue.filter((c) => c.direction === "outgoing").reduce((s, c) => s + c.amount, 0);
    insights.push({
      id: "checks-overdue",
      severity: "danger",
      icon: "warn",
      title: `${overdue.length} شيك متأخر${outTotal > 0 ? ` — عليكِ ${outTotal.toLocaleString()} ₪` : ""}`,
      message: "تأخّر الشيكات بيضر السمعة — راجعيها فوراً",
      href: "/checks",
      priority: 100,
    });
  } else if (dueSoon.length > 0) {
    const inTotal = dueSoon.filter((c) => c.direction === "incoming").reduce((s, c) => s + c.amount, 0);
    const outTotal = dueSoon.filter((c) => c.direction === "outgoing").reduce((s, c) => s + c.amount, 0);
    insights.push({
      id: "checks-due-soon",
      severity: inTotal > outTotal ? "success" : "info",
      icon: "clock",
      title: `${dueSoon.length} شيك مستحق خلال أسبوع`,
      message: `وارد ${inTotal.toLocaleString()} ₪ · صادر ${outTotal.toLocaleString()} ₪`,
      href: "/checks",
      priority: 60,
    });
  }

  // ─── 3. Low stock products ───────────────────────────────────────────────
  const lowStock = state.products.filter(
    (p) => p.is_active !== false && p.stock < (p.low_stock_threshold || 5)
  );
  if (lowStock.length > 0) {
    const names = lowStock.slice(0, 3).map((p) => p.name).join("، ");
    insights.push({
      id: "low-stock",
      severity: lowStock.length >= 5 ? "danger" : "warn",
      icon: "box",
      title: `${lowStock.length} منتج مخزون منخفض`,
      message: lowStock.length <= 3 ? names : `${names}، و ${lowStock.length - 3} غيرها`,
      href: "/products",
      priority: 70,
    });
  }

  // ─── 4. Dead stock (never sold or long idle) ─────────────────────────────
  const soldProductIds = new Set<string>();
  for (const inv of state.invoices) {
    for (const it of inv.items) soldProductIds.add(it.pid);
  }
  const neverSold = state.products.filter(
    (p) => p.is_active !== false && !soldProductIds.has(p.id) && p.stock > 0
  );
  if (neverSold.length >= 3) {
    insights.push({
      id: "dead-stock",
      severity: "info",
      icon: "info",
      title: `${neverSold.length} منتج ما باع ولا مرة`,
      message: "فكّري في تخفيض الأسعار أو عرض جديد عليهم",
      href: "/reports/dead-stock",
      priority: 40,
    });
  }

  // ─── 5. Top customer this period ─────────────────────────────────────────
  const customerRevenue = new Map<string, number>();
  for (const inv of state.invoices) {
    customerRevenue.set(inv.customerId, (customerRevenue.get(inv.customerId) ?? 0) + inv.total);
  }
  const topCustomers = Array.from(customerRevenue.entries())
    .map(([cid, total]) => ({ cid, total, customer: state.customers.find((c) => c.id === cid) }))
    .filter((x) => x.customer)
    .sort((a, b) => b.total - a.total);

  if (topCustomers.length > 0 && topCustomers[0].total >= 1000) {
    const t = topCustomers[0];
    insights.push({
      id: `top-customer:${t.cid}`,
      severity: "success",
      icon: "star",
      title: `${t.customer!.name} أكبر زبونة`,
      message: `اشترت بـ ${t.total.toLocaleString()} ₪ — خصصّي لها عرض شكر`,
      href: `/customers/${t.cid}`,
      priority: 35,
    });
  }

  // ─── 6. Expense category spike ───────────────────────────────────────────
  const categorySum = new Map<string, number>();
  for (const e of state.expenses) categorySum.set(e.category, (categorySum.get(e.category) ?? 0) + e.amount);
  const sorted = Array.from(categorySum.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const [topCat, topAmt] = sorted[0];
    const totalExp = sorted.reduce((s, [, v]) => s + v, 0);
    const share = totalExp > 0 ? (topAmt / totalExp) * 100 : 0;
    if (share >= 45 && sorted.length >= 2) {
      insights.push({
        id: `expense-spike:${topCat}`,
        severity: "warn",
        icon: "trendUp",
        title: `${topCat} بتاكل ${share.toFixed(0)}% من المصاريف`,
        message: `${topAmt.toLocaleString()} ₪ — شوفي إذا في طريقة تخفّفيها`,
        href: "/reports/monthly",
        priority: 50,
      });
    }
  }

  // ─── 7. Cash-vs-revenue divergence (educational) ─────────────────────────
  const revenue = state.invoices.reduce((s, i) => s + i.total, 0);
  const paid = state.invoices.reduce((s, i) => s + i.paid, 0);
  const outstanding = revenue - paid;
  if (revenue > 0 && outstanding / revenue > 0.3) {
    insights.push({
      id: "cash-revenue-gap",
      severity: "info",
      icon: "info",
      title: `${((outstanding / revenue) * 100).toFixed(0)}% من مبيعاتك ما حُصِّلت`,
      message: `${outstanding.toLocaleString()} ₪ معلّقة — ركزي على التحصيل قبل البيع الجديد`,
      href: "/reports/cash-vs-revenue",
      priority: 55,
    });
  }

  // ─── 8. Profit celebration ───────────────────────────────────────────────
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);
  const profit = paid - totalExpenses;
  if (paid > 0 && profit > 0 && profit >= paid * 0.2) {
    const margin = (profit / paid) * 100;
    insights.push({
      id: "profit-healthy",
      severity: "success",
      icon: "trendUp",
      title: `هامش ربح ممتاز: ${margin.toFixed(0)}%`,
      message: "شغلك عالمسار الصحيح — حافظي على هالوتيرة",
      href: "/reports/pnl",
      priority: 30,
    });
  }

  // ─── 9. Recurring expense reminder ───────────────────────────────────────
  const activeRecurring = state.recurringExpenses?.filter((r) => r.is_active !== false) ?? [];
  if (activeRecurring.length > 0) {
    const recurringTotal = activeRecurring.reduce((s, r) => s + r.amount, 0);
    if (recurringTotal >= 3000) {
      insights.push({
        id: "recurring-heavy",
        severity: "info",
        icon: "calendar",
        title: `${recurringTotal.toLocaleString()} ₪ مصاريف ثابتة شهرياً`,
        message: `${activeRecurring.length} بند — لازم تدخلي هذا المبلغ قبل ما تربحي`,
        href: "/expenses/recurring",
        priority: 45,
      });
    }
  }

  // Sort by priority (highest first), cap at 6
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

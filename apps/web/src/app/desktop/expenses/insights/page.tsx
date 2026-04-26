"use client";

/**
 * Expense Insights — focused analytics for the expenses ledger.
 *
 * Answers four questions every business owner asks:
 *   1. Where did my money go this period? (pie of categories)
 *   2. Is my spending trending up or down? (line of last 6 months)
 *   3. Who do I pay the most? (top vendors bar)
 *   4. What were my biggest individual expenses? (top single items)
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { PieChart, BarChart, LineChart } from "@/components/charts";
import { useStore } from "@/lib/store/store-context";
import type { Expense } from "@/lib/store/types";
import { HubTabs } from "@/components/shell/hub-tabs";

type PeriodId = "month" | "quarter" | "year" | "all";

const PERIODS: Array<{ id: PeriodId; label: string }> = [
  { id: "month", label: "هذا الشهر" },
  { id: "quarter", label: "آخر 3 شهور" },
  { id: "year", label: "آخر سنة" },
  { id: "all", label: "كل البيانات" },
];

/**
 * Best-effort date parser — the store has dates in mixed formats:
 *   - ISO ("2026-04-15") from new uploads
 *   - Arabic month names ("21 أبريل 2026") from seed data
 * We try both, falling back to null.
 */
function parseExpenseDate(s: string): Date | null {
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const AR_MONTHS: Record<string, number> = {
    "يناير": 0, "فبراير": 1, "مارس": 2, "أبريل": 3, "مايو": 4, "يونيو": 5,
    "يوليو": 6, "أغسطس": 7, "سبتمبر": 8, "أكتوبر": 9, "نوفمبر": 10, "ديسمبر": 11,
  };
  const ar = s.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (ar && AR_MONTHS[ar[2]] !== undefined) {
    return new Date(+ar[3], AR_MONTHS[ar[2]], +ar[1]);
  }
  return null;
}

function inPeriod(e: Expense, period: PeriodId): boolean {
  if (period === "all") return true;
  const d = parseExpenseDate(e.expense_date);
  if (!d) return false;
  const now = new Date();
  if (period === "month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (period === "quarter") {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 3);
    return d >= cutoff;
  }
  if (period === "year") {
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    return d >= cutoff;
  }
  return true;
}

/** Extract the "vendor" portion from a description like "فاتورة من <vendor>". */
function extractVendor(description: string): string {
  const m = description.match(/^فاتورة من\s+(.+)$/);
  return m ? m[1].trim() : description;
}

const MONTHS_AR = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];

export default function ExpenseInsights() {
  const { state } = useStore();
  const [period, setPeriod] = useState<PeriodId>("month");

  const filtered = useMemo(
    () => state.expenses.filter((e) => inPeriod(e, period)),
    [state.expenses, period]
  );

  // ─── Totals ────────────────────────────────────────────────────────────
  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);
  const avgPerExpense = filtered.length > 0 ? total / filtered.length : 0;

  // ─── Categories (pie) ──────────────────────────────────────────────────
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // ─── Top vendors (bar) ─────────────────────────────────────────────────
  const topVendors = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const e of filtered) {
      const v = extractVendor(e.description);
      const cur = map.get(v) ?? { sum: 0, count: 0 };
      cur.sum += e.amount;
      cur.count += 1;
      map.set(v, cur);
    }
    return Array.from(map.entries())
      .map(([vendor, { sum, count }]) => ({ vendor, sum, count }))
      .sort((a, b) => b.sum - a.sum)
      .slice(0, 8);
  }, [filtered]);

  // ─── 6-month trend (line) ──────────────────────────────────────────────
  // Always shown across last 6 months regardless of period filter — gives
  // long-term context that the period-filtered numbers above miss.
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const buckets: Array<{ x: string; y: number; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ x: `${MONTHS_AR[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`, y: 0, label: "" });
    }
    for (const e of state.expenses) {
      const d = parseExpenseDate(e.expense_date);
      if (!d) continue;
      const monthsBack = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthsBack < 0 || monthsBack > 5) continue;
      const idx = 5 - monthsBack;
      buckets[idx].y += e.amount;
    }
    return buckets;
  }, [state.expenses]);

  // ─── Top single expenses ───────────────────────────────────────────────
  const topSingle = useMemo(() => {
    return filtered.slice().sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [filtered]);

  return (
    <DesktopPage
      breadcrumb="التقارير والذكاء"
      title="تحليلات المصاريف"
      subtitle="اكتشفي إلى أين تذهب أموال محلّك"
    >
      <HubTabs hub="expenses" />
      {/* Period filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-tj text-[12px] font-bold transition-colors ${
              period === p.id
                ? "bg-primary text-white"
                : "bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-danger dark:border-s-danger-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">الإجمالي</div>
          <Shekel amt={total} size={26} className="text-danger dark:text-danger-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">عدد العمليات</div>
          <Num size={26} className="text-text dark:text-text-dark" weight={700}>{filtered.length}</Num>
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">متوسط العملية</div>
          <Shekel amt={Math.round(avgPerExpense)} size={26} className="text-text dark:text-text-dark" weight={700} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-14 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center mx-auto mb-3">
            <Ico name="card" size={26} className="text-primary" sw={1.6} />
          </div>
          <div className="text-[14px] font-bold text-text dark:text-text-dark mb-1">لا مصاريف في هذه الفترة</div>
          <div className="text-[11px] text-muted dark:text-muted-dark mb-4">جرّبي فترة أوسع أو ارفعي فاتورة جديدة</div>
          <div className="flex gap-2 justify-center">
            <Link href="/desktop/tools/ocr" className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">
              ارفعي فاتورة
            </Link>
            <Link href="/desktop/expenses" className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark">
              قائمة المصاريف
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Row 1: Categories pie + 6-month trend */}
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-5 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
              <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">توزيع التصنيفات</h3>
              <PieChart
                data={byCategory.map((c) => ({
                  label: c.category,
                  value: c.value,
                }))}
                size={200}
              />
            </div>
            <div className="col-span-7 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
              <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-1">آخر 6 شهور</h3>
              <p className="text-[11px] text-muted dark:text-muted-dark mb-3">إجمالي المصاريف الشهرية</p>
              <LineChart data={monthlyTrend.map((b) => ({ label: b.x, value: b.y }))} height={200} />
            </div>
          </div>

          {/* Row 2: Top vendors */}
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-4">
            <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">أكبر الموردين</h3>
            <BarChart
              data={topVendors.map((v) => ({
                label: v.vendor,
                value: v.sum,
                sub: `${v.count} عملية`,
              }))}
              maxBars={8}
            />
          </div>

          {/* Row 3: Top single expenses */}
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-[14px] font-bold text-text dark:text-text-dark">أكبر العمليات الفردية</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                  <th className="text-start px-5 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">الوصف</th>
                  <th className="text-start px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">التصنيف</th>
                  <th className="text-start px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">التاريخ</th>
                  <th className="text-end px-5 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {topSingle.map((e) => (
                  <tr key={e.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark">
                    <td className="px-5 py-2.5">
                      <Link href={`/desktop/expenses/${e.id}`} className="text-[12px] font-bold text-text dark:text-text-dark hover:text-primary">
                        {e.description}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-muted dark:text-muted-dark">{e.category}</td>
                    <td className="px-3 py-2.5 text-[11px] text-muted dark:text-muted-dark tj-num">{e.expense_date}</td>
                    <td className="px-5 py-2.5 text-end tj-num text-[12px] font-bold text-danger dark:text-danger-dark">
                      {e.amount.toLocaleString()} ₪
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DesktopPage>
  );
}

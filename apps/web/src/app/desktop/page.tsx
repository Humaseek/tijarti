"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { PieChart, BarChart, MultiLineChart, Heatmap } from "@/components/charts";
import { INCOME, EXPENSE, shadesFor } from "@/lib/chart-palette";
import { DesktopInsightsCard } from "@/components/dashboard/insights-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { DailyTip } from "@/components/dashboard/daily-tip";
import { TimelineAnnotations } from "@/components/dashboard/timeline-annotations";
import { useCelebrationTrigger } from "@/components/ui/confetti";
import { useStore } from "@/lib/store/store-context";
import { KpiDrilldownModal, type DrilldownRow } from "@/components/ui/kpi-drilldown-modal";
import { todayIso, addDays, formatArDateShort } from "@/lib/dates";
import { formatYearMonth, currentYearMonth } from "@/lib/projections";
import {
  periodRange,
  previousRange,
  metricsFor,
  pctChange,
  monthlyTimeline,
  salesHeatmap,
  type PeriodId,
} from "@/lib/analytics";

const PERIOD_OPTIONS: Array<{ id: PeriodId; label: string }> = [
  { id: "today", label: "اليوم" },
  { id: "week", label: "آخر 7 أيام" },
  { id: "month", label: "هذا الشهر" },
  { id: "last_month", label: "الشهر الماضي" },
  { id: "quarter", label: "هذا الربع" },
  { id: "year", label: "هذه السنة" },
];

export default function DesktopDashboard() {
  const { state, getCashFlow } = useStore();
  const [periodId, setPeriodId] = useState<PeriodId>("month");
  const [drillKey, setDrillKey] = useState<"revenue" | "cashIn" | "expenses" | "profit" | "invoiceCount" | "avgInvoice" | null>(null);
  useCelebrationTrigger();

  // Period ranges + metrics
  const range = useMemo(() => periodRange(periodId), [periodId]);
  const prev = useMemo(() => previousRange(range), [range]);
  const current = useMemo(() => metricsFor(state, range), [state, range]);
  const previous = useMemo(() => metricsFor(state, prev), [state, prev]);

  // 12-month timeline
  const timeline = useMemo(() => monthlyTimeline(state, 12), [state]);

  // Sales heatmap (day-of-week × time-bucket)
  const heatmap = useMemo(() => salesHeatmap(state), [state]);

  // Next 7 days cash flow (for upcoming widget)
  const cf7 = useMemo(() => getCashFlow({ from: null, to: addDays(todayIso(), 7) }), [getCashFlow]);
  const upcoming = cf7
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .slice(0, 5);

  // Expense category breakdown (period-scoped)
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of state.expenses) m.set(e.category, (m.get(e.category) ?? 0) + e.amount);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [state.expenses]);
  const totalCat = byCategory.reduce((s, [, v]) => s + v, 0);

  // Top customers (period-scoped)
  const topCustomers = useMemo(() => {
    const m = new Map<string, number>();
    for (const inv of state.invoices) m.set(inv.customerId, (m.get(inv.customerId) ?? 0) + inv.total);
    return Array.from(m.entries())
      .map(([cid, v]) => ({ cid, v, customer: state.customers.find((c) => c.id === cid) }))
      .filter((x) => x.customer)
      .sort((a, b) => b.v - a.v)
      .slice(0, 5);
  }, [state.invoices, state.customers]);

  // Top products (period-scoped)
  const topProducts = useMemo(() => {
    const m = new Map<string, { qty: number; rev: number }>();
    for (const inv of state.invoices) {
      for (const it of inv.items) {
        const prev = m.get(it.pid) || { qty: 0, rev: 0 };
        m.set(it.pid, { qty: prev.qty + it.qty, rev: prev.rev + it.qty * it.price });
      }
    }
    return Array.from(m.entries())
      .map(([pid, data]) => ({ pid, ...data, product: state.products.find((p) => p.id === pid) }))
      .filter((x) => x.product)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
  }, [state.invoices, state.products]);

  // Payment method distribution
  const byMethod = useMemo(() => {
    const m = new Map<string, number>();
    for (const inv of state.invoices) m.set(inv.method, (m.get(inv.method) ?? 0) + inv.total);
    return Array.from(m.entries());
  }, [state.invoices]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      {/* Header + period picker */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">
            أهلاً {state.userProfile.full_name?.split(" ")[0] || "صديقنا"} · {formatYearMonth(currentYearMonth())}
          </div>
          <h1 className="text-[26px] font-bold text-text dark:text-text-dark">لوحة التحكم</h1>
          <div className="text-[11px] text-muted dark:text-muted-dark mt-1">
            {range.label} — من {range.from} إلى {range.to}
          </div>
        </div>
        <div className="flex bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-1 gap-0.5">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodId(p.id)}
              className={`px-3 py-1.5 rounded-tj text-[11px] font-bold transition-colors ${
                periodId === p.id
                  ? "bg-primary text-white"
                  : "text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row with comparison deltas */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        <KpiCard
          label="الإيرادات"
          value={<Shekel amt={current.revenue} size={19} className="text-success dark:text-success-dark" weight={700} />}
          delta={pctChange(current.revenue, previous.revenue)}
          goodUp
          icon="trendUp"
          onClick={() => setDrillKey("revenue")}
        />
        <KpiCard
          label="النقد الداخل"
          value={<Shekel amt={current.cashIn} size={19} className="text-success dark:text-success-dark" weight={700} />}
          delta={pctChange(current.cashIn, previous.cashIn)}
          goodUp
          icon="money"
          onClick={() => setDrillKey("cashIn")}
        />
        <KpiCard
          label="المصاريف"
          value={<Shekel amt={current.expenses} size={19} className="text-danger dark:text-danger-dark" weight={700} />}
          delta={pctChange(current.expenses, previous.expenses)}
          goodUp={false}
          icon="card"
          onClick={() => setDrillKey("expenses")}
        />
        <KpiCard
          label="صافي الربح"
          value={
            <Shekel
              amt={Math.abs(current.profit)}
              size={19}
              className={current.profit >= 0 ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}
              weight={700}
            />
          }
          delta={pctChange(current.profit, previous.profit)}
          goodUp
          icon="target"
          deltaSign={current.profit >= 0 ? "+" : "-"}
          onClick={() => setDrillKey("profit")}
        />
        <KpiCard
          label="عدد الفواتير"
          value={<Num size={19} className="text-text dark:text-text-dark" weight={700}>{current.invoiceCount}</Num>}
          delta={pctChange(current.invoiceCount, previous.invoiceCount)}
          goodUp
          icon="receipt"
          onClick={() => setDrillKey("invoiceCount")}
        />
        <KpiCard
          label="متوسط الفاتورة"
          value={<Shekel amt={current.avgInvoice} size={19} className="text-text dark:text-text-dark" weight={700} />}
          delta={pctChange(current.avgInvoice, previous.avgInvoice)}
          goodUp
          icon="chart"
          onClick={() => setDrillKey("avgInvoice")}
        />
      </div>

      {/* Drilldown modal */}
      {drillKey && (() => {
        const title =
          drillKey === "revenue" ? "الإيرادات" :
          drillKey === "cashIn" ? "النقد الداخل" :
          drillKey === "expenses" ? "المصاريف" :
          drillKey === "profit" ? "صافي الربح" :
          drillKey === "invoiceCount" ? "عدد الفواتير" : "متوسط الفاتورة";
        let rows: DrilldownRow[] = [];
        let total = 0;
        if (drillKey === "revenue" || drillKey === "cashIn" || drillKey === "invoiceCount" || drillKey === "avgInvoice" || drillKey === "profit") {
          rows = state.invoices.slice(0, 50).map((inv) => {
            const customer = state.customers.find((c) => c.id === inv.customerId);
            return {
              id: inv.id,
              title: `فاتورة ${inv.no}`,
              subtitle: `${customer?.name || "—"} · ${inv.date}`,
              value: drillKey === "cashIn" ? inv.paid : inv.total,
              sub_value: drillKey === "revenue" ? inv.paid : undefined,
              href: `/desktop/invoices/${inv.id}`,
            };
          });
          total = drillKey === "cashIn" ? current.cashIn : drillKey === "profit" ? Math.abs(current.profit) : drillKey === "invoiceCount" ? current.invoiceCount : drillKey === "avgInvoice" ? current.avgInvoice : current.revenue;
        }
        if (drillKey === "expenses") {
          rows = state.expenses.slice(0, 50).map((e) => ({
            id: e.id,
            title: e.description || e.category,
            subtitle: `${e.category} · ${e.expense_date}`,
            value: e.amount,
            href: "/desktop/expenses",
          }));
          total = current.expenses;
        }
        return (
          <KpiDrilldownModal
            open
            onClose={() => setDrillKey(null)}
            title={`تفاصيل: ${title}`}
            subtitle={range.label}
            total={total}
            rows={rows}
          />
        );
      })()}

      {/* Onboarding checklist (auto-hides when done) */}
      <OnboardingChecklist />

      {/* Daily tip */}
      <DailyTip />

      {/* Smart insights */}
      <DesktopInsightsCard />

      {/* Hero: 12-month timeline */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">الاتجاه السنوي</h2>
            <p className="text-[11px] text-muted dark:text-muted-dark">إيرادات، مصاريف، وصافي الربح — آخر 12 شهر</p>
          </div>
          <div className="text-[10px] text-muted dark:text-muted-dark">
            مرّري الماوس على النقاط لرؤية الأرقام
          </div>
        </div>
        <MultiLineChart
          labels={timeline.map((p) => p.month)}
          series={[
            { name: "إيرادات", color: INCOME.dark, data: timeline.map((p) => p.revenue) },
            { name: "مصاريف", color: EXPENSE.dark, data: timeline.map((p) => p.expenses) },
            { name: "صافي ربح", color: "rgb(var(--tj-primary))", data: timeline.map((p) => p.profit), dashed: true },
          ]}
          height={260}
          formatValue={(v) => `${Math.round(v).toLocaleString()} ₪`}
        />
        <div className="mt-3">
          <TimelineAnnotations labels={timeline.map((p) => p.month)} />
        </div>
      </div>

      {/* Middle: 3-col — expenses pie | top customers | top products */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h2 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">توزيع المصاريف</h2>
          {byCategory.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-muted dark:text-muted-dark">لا مصاريف</div>
          ) : (
            <PieChart
              data={byCategory.map(([cat, amt], i) => ({ label: cat, value: amt, color: shadesFor("expense", byCategory.length)[i] }))}
              size={160}
              innerRatio={0.58}
              centerLabel="إجمالي"
              centerValue={<Shekel amt={totalCat} size={13} className="text-danger dark:text-danger-dark" weight={700} />}
            />
          )}
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">أفضل الزبائن</h2>
            <Link href="/desktop/customers" className="text-[11px] text-primary font-bold hover:underline">كل الزبائن ←</Link>
          </div>
          {topCustomers.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-muted dark:text-muted-dark">لا بيانات</div>
          ) : (
            <BarChart
              orientation="horizontal"
              data={topCustomers.map((b, i) => ({
                label: b.customer!.name,
                value: b.v,
                color: shadesFor("income", topCustomers.length)[i],
                sub: `${b.customer!.invoices} فاتورة`,
              }))}
            />
          )}
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">أكثر المنتجات مبيعاً</h2>
            <Link href="/desktop/products" className="text-[11px] text-primary font-bold hover:underline">كل المنتجات ←</Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-muted dark:text-muted-dark">لا بيانات</div>
          ) : (
            <BarChart
              orientation="horizontal"
              data={topProducts.map((p, i) => ({
                label: p.product!.name,
                value: p.rev,
                color: shadesFor("income", topProducts.length)[i],
                sub: `${p.qty} قطعة`,
              }))}
            />
          )}
        </div>
      </div>

      {/* Heatmap + payment methods */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="col-span-2 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">خريطة المبيعات حسب اليوم والوقت</h2>
            <p className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
              متى بتكون الحركة أكتر — كل خانة تظهر إجمالي المبيعات
            </p>
          </div>
          <Heatmap
            rowLabels={heatmap.rowLabels}
            colLabels={heatmap.colLabels}
            cells={heatmap.cells}
            color={INCOME.dark}
            formatValue={(v) => `${Math.round(v).toLocaleString()} ₪`}
          />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h2 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">طرق الدفع</h2>
          {byMethod.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-muted dark:text-muted-dark">لا بيانات</div>
          ) : (
            <PieChart
              data={byMethod.map(([method, amt], i) => ({
                label: method,
                value: amt,
                color: shadesFor("income", byMethod.length)[i],
              }))}
              size={160}
              innerRatio={0.58}
              centerLabel="المجموع"
              centerValue={<Shekel amt={byMethod.reduce((s, [, v]) => s + v, 0)} size={13} className="text-success dark:text-success-dark" weight={700} />}
            />
          )}
        </div>
      </div>

      {/* Bottom: upcoming events + customers with debt */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">أحداث قادمة · 7 أيام</h2>
            <Link href="/desktop/checks" className="text-[11px] text-primary font-bold hover:underline">الشيكات ←</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-muted dark:text-muted-dark">لا أحداث قادمة</div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 p-3 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark"
                >
                  <div className={`w-9 h-9 rounded-tj flex items-center justify-center flex-shrink-0 ${
                    it.direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark" : "bg-danger-soft dark:bg-danger-soft-dark"
                  }`}>
                    <Ico
                      name="trendUp"
                      size={15}
                      className={it.direction === "incoming" ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}
                      style={{ transform: it.direction === "outgoing" ? "scaleY(-1)" : undefined }}
                      sw={1.8}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-text dark:text-text-dark truncate">{it.party_name}</div>
                    <div className="text-[10px] text-muted dark:text-muted-dark">
                      {it.ref} {it.due_date && `· ${formatArDateShort(it.due_date)}`}
                    </div>
                  </div>
                  <div className="text-end">
                    <Shekel
                      amt={it.amount}
                      size={13}
                      className={it.direction === "incoming" ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}
                      weight={700}
                    />
                    {it.status === "overdue" && (
                      <div className="text-[9px] font-bold text-warning dark:text-warning-dark mt-0.5">متأخر</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">زبائن عليهن مستحقات</h2>
            <Link href="/desktop/customers" className="text-[11px] text-primary font-bold hover:underline">الكل ←</Link>
          </div>
          {state.customers.filter((c) => c.debt > 0).length === 0 ? (
            <div className="text-center py-8 text-[12px] text-success dark:text-success-dark font-semibold">
              ✓ ما في مستحقات — وضع ممتاز
            </div>
          ) : (
            <div className="space-y-2">
              {state.customers.filter((c) => c.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/desktop/customers/${c.id}`}
                  className="flex items-center gap-3 p-2.5 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark hover:border-primary transition-colors"
                >
                  <Avatar name={c.name} initial={c.initial} size={32} bg={c.avatar_color || undefined} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-text dark:text-text-dark">{c.name}</div>
                    <div className="text-[10px] text-muted dark:text-muted-dark">{c.lastVisit}</div>
                  </div>
                  <Shekel amt={c.debt} size={13} className="text-warning dark:text-warning-dark" weight={700} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}

// ─── KPI Card with delta ───────────────────────────────────────────────────
function KpiCard({
  label, value, delta, goodUp, icon, deltaSign, onClick,
}: {
  label: string;
  value: React.ReactNode;
  delta: number | null;
  goodUp: boolean; // true if positive delta is good (revenue), false if bad (expenses)
  icon: string;
  deltaSign?: string;
  onClick?: () => void;
}) {
  let deltaColor = "text-muted dark:text-muted-dark";
  let arrow = "";
  if (delta !== null) {
    const isPositive = delta > 0;
    const isNegative = delta < 0;
    if (isPositive) {
      deltaColor = goodUp ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark";
      arrow = "↑";
    } else if (isNegative) {
      deltaColor = goodUp ? "text-danger dark:text-danger-dark" : "text-success dark:text-success-dark";
      arrow = "↓";
    }
  }

  return (
    <div
      onClick={onClick}
      className={`bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-3.5 ${onClick ? "cursor-pointer hover:border-primary transition-colors" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] text-muted dark:text-muted-dark font-semibold tracking-wider truncate">{label}</div>
        <Ico name={icon as any} size={12} className="text-muted dark:text-muted-dark" sw={1.8} />
      </div>
      <div className="mb-1">{value}</div>
      <div className={`text-[10px] font-bold tj-num ${deltaColor}`}>
        {delta === null ? (
          <span className="text-muted dark:text-muted-dark">— جديد</span>
        ) : delta === 0 ? (
          <span>بدون تغيير</span>
        ) : (
          <>
            {deltaSign}{arrow} {Math.abs(delta).toFixed(1)}%
            <span className="text-muted dark:text-muted-dark font-normal"> · vs السابق</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Dashboard analytics — period ranges, comparisons, and time-series builders.
 *
 * Since the current Invoice/Expense model doesn't ISO-date every record
 * (invoice.date is a display string), we simulate a realistic 12-month
 * history from the state by bucketing by what's available and synthesizing
 * the rest with deterministic pseudo-random seeded by id. The shapes and
 * types are correct — when you wire a real DB later, only the extraction
 * step changes.
 */

import { todayIso, addDays, parseIsoDate } from "@/lib/dates";
import type { StoreState } from "@/lib/store/types";

export type PeriodId = "today" | "week" | "month" | "quarter" | "year" | "last_month";

export interface DateRange {
  from: string; // ISO yyyy-mm-dd
  to: string;   // ISO yyyy-mm-dd
  label: string;
}

/** Resolve a period id to an ISO range ending today. */
export function periodRange(id: PeriodId): DateRange {
  const today = todayIso();
  const t = parseIsoDate(today)!;
  switch (id) {
    case "today":
      return { from: today, to: today, label: "اليوم" };
    case "week": {
      const from = addDays(today, -6);
      return { from, to: today, label: "آخر 7 أيام" };
    }
    case "month": {
      const first = new Date(t.getFullYear(), t.getMonth(), 1);
      return { from: toIso(first), to: today, label: "هذا الشهر" };
    }
    case "last_month": {
      const first = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const last = new Date(t.getFullYear(), t.getMonth(), 0);
      return { from: toIso(first), to: toIso(last), label: "الشهر الماضي" };
    }
    case "quarter": {
      const q = Math.floor(t.getMonth() / 3);
      const first = new Date(t.getFullYear(), q * 3, 1);
      return { from: toIso(first), to: today, label: "هذا الربع" };
    }
    case "year": {
      const first = new Date(t.getFullYear(), 0, 1);
      return { from: toIso(first), to: today, label: "هذه السنة" };
    }
  }
}

/** Returns the equivalent-length immediately-preceding range for comparison. */
export function previousRange(r: DateRange): DateRange {
  const from = parseIsoDate(r.from)!;
  const to = parseIsoDate(r.to)!;
  const spanMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 86400000);
  const prevFrom = new Date(prevTo.getTime() - spanMs);
  return { from: toIso(prevFrom), to: toIso(prevTo), label: "الفترة السابقة" };
}

/** Growth between current and previous value, as a percent (Infinity → 100 when prev = 0). */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null; // undefined — caller should display "جديد" / "—"
  }
  return ((current - previous) / previous) * 100;
}

// ─── Metric buckets ────────────────────────────────────────────────────────

export interface PeriodMetrics {
  revenue: number;        // sum of invoice totals in period
  cashIn: number;         // sum of paid + cashed incoming checks + settled incoming debts
  expenses: number;       // sum of expense records
  profit: number;         // cashIn - expenses (cash-basis)
  invoiceCount: number;
  avgInvoice: number;
  newCustomers: number;
}

/**
 * Compute metrics for a date range. Because our mock data doesn't have a per-
 * invoice ISO date field, we use a deterministic seeding: each invoice's
 * relative index into its array determines which month it "belongs to" across
 * a 12-month span. This produces stable, believable numbers for the demo.
 */
export function metricsFor(state: StoreState, range: DateRange): PeriodMetrics {
  const inRange = makeDateFilter(range);

  let revenue = 0, cashIn = 0, invoiceCount = 0, newCustomers = 0, expenses = 0;
  const counted = new Set<string>();

  // Invoices — synthesize a date distribution based on index
  state.invoices.forEach((inv, i) => {
    const iso = simulateDate(i, state.invoices.length, inv.id);
    if (!inRange(iso)) return;
    revenue += inv.total;
    cashIn += inv.paid;
    invoiceCount += 1;
    if (!counted.has(inv.customerId)) {
      counted.add(inv.customerId);
      newCustomers += 1;
    }
  });

  // Cashed incoming checks
  state.checks.forEach((ch, i) => {
    if (ch.direction !== "incoming" || ch.status !== "cashed") return;
    const iso = ch.due_date || simulateDate(i, state.checks.length, ch.id);
    if (!inRange(iso)) return;
    cashIn += ch.amount;
  });

  // Settled incoming debts
  state.debts.forEach((d, i) => {
    if (d.direction !== "incoming" || d.status !== "settled") return;
    const iso = d.due_date || d.issued_date || simulateDate(i, state.debts.length, d.id);
    if (!inRange(iso)) return;
    cashIn += d.amount;
  });

  // Expenses
  state.expenses.forEach((e, i) => {
    const iso = simulateDate(i, state.expenses.length, e.id);
    if (!inRange(iso)) return;
    expenses += e.amount;
  });

  const profit = cashIn - expenses;
  const avgInvoice = invoiceCount > 0 ? revenue / invoiceCount : 0;

  return { revenue, cashIn, expenses, profit, invoiceCount, avgInvoice, newCustomers };
}

// ─── 12-month timeline ─────────────────────────────────────────────────────

export interface TimelinePoint {
  month: string;       // "أبر 2026" etc
  ym: string;          // "2026-04"
  revenue: number;
  expenses: number;
  profit: number;
}

export function monthlyTimeline(state: StoreState, months = 12): TimelinePoint[] {
  const today = parseIsoDate(todayIso())!;
  const points: TimelinePoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const from = toIso(d);
    const to = toIso(last);
    const m = metricsFor(state, { from, to, label: "" });
    points.push({
      month: d.toLocaleDateString("ar", { month: "short" }),
      ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      revenue: m.revenue,
      expenses: m.expenses,
      profit: m.profit,
    });
  }

  return points;
}

// ─── Sales heatmap (day-of-week × hour bucket) ─────────────────────────────

export interface HeatmapData {
  rowLabels: string[];
  colLabels: string[];
  cells: Array<{ row: string; col: string; value: number }>;
}

/**
 * Day-of-week × time-bucket heatmap — shows when your shop is busiest.
 * Time buckets: صباحاً (6-12), ظهراً (12-16), مساءً (16-20), ليلاً (20-24).
 */
export function salesHeatmap(state: StoreState): HeatmapData {
  const dayLabels = ["أحد", "إثن", "ثلا", "أرب", "خمس", "جمع", "سبت"];
  const timeBuckets = ["صباحاً", "ظهراً", "مساءً", "ليلاً"];

  const counts = new Map<string, number>();

  state.invoices.forEach((inv, i) => {
    // Parse hour from time string "HH:MM"
    const hour = parseInt((inv.time || "12:00").split(":")[0], 10) || 12;
    const bucket = hour < 12 ? "صباحاً" : hour < 16 ? "ظهراً" : hour < 20 ? "مساءً" : "ليلاً";

    // Seed day-of-week from invoice index (deterministic)
    const day = dayLabels[(hashCode(inv.id + i) % 7 + 7) % 7];

    const key = `${day}|${bucket}`;
    counts.set(key, (counts.get(key) ?? 0) + inv.total);
  });

  const cells = [];
  for (const d of dayLabels) {
    for (const b of timeBuckets) {
      cells.push({ row: d, col: b, value: counts.get(`${d}|${b}`) ?? 0 });
    }
  }

  return { rowLabels: dayLabels, colLabels: timeBuckets, cells };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makeDateFilter(range: DateRange) {
  return (iso: string) => iso >= range.from && iso <= range.to;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Generate a pseudo-random but deterministic ISO date within the last
 * `spreadMonths` months for a given record. Used because the current
 * Invoice/Expense model doesn't carry ISO dates per record.
 *
 * Distribution is weighted so ~40% of records fall in the current month,
 * giving a believable "recent activity" feel.
 */
function simulateDate(idx: number, total: number, seed: string, spreadMonths = 12): string {
  const today = parseIsoDate(todayIso())!;
  const h = hashCode(seed + idx);
  // 40% in current month, 60% spread over previous (spreadMonths - 1) months
  const bias = (h % 100) / 100;
  let monthsBack: number;
  if (bias < 0.4) monthsBack = 0;
  else monthsBack = 1 + Math.floor(((bias - 0.4) / 0.6) * (spreadMonths - 1));

  const target = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const day = 1 + (hashCode(seed + "day") % lastDay);
  target.setDate(day);
  if (target > today) target.setTime(today.getTime());
  return toIso(target);
}

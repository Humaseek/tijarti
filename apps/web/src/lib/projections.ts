import type { RecurringExpense } from "./store/types";
import { parseIsoDate, addDays, todayIso } from "./dates";

/**
 * Expand a RecurringExpense into concrete occurrences within a date range.
 *
 * For monthly: emits one occurrence per calendar month at day_of_month
 *   (clamped to the last day of the month if day_of_month > month length).
 * For weekly: emits every 7 days at day_of_week.
 *
 * Only emits occurrences within [from, to] AND within [start_date, end_date].
 */
export interface RecurringOccurrence {
  recurringId: string;
  date: string;        // ISO YYYY-MM-DD
  amount: number;
  name: string;
  category: string;
}

export function expandRecurring(
  recurring: RecurringExpense,
  from: string,
  to: string
): RecurringOccurrence[] {
  if (!recurring.is_active) return [];
  const occurrences: RecurringOccurrence[] = [];

  const fromD = parseIsoDate(from);
  const toD = parseIsoDate(to);
  const startD = parseIsoDate(recurring.start_date);
  const endD = recurring.end_date ? parseIsoDate(recurring.end_date) : null;
  if (!fromD || !toD || !startD) return [];

  // Effective window is intersection of [fromD,toD] with [startD, endD || ∞]
  const windowStart = fromD > startD ? fromD : startD;
  const windowEnd = endD && endD < toD ? endD : toD;
  if (windowStart > windowEnd) return [];

  if (recurring.frequency === "monthly") {
    const day = Math.max(1, Math.min(31, recurring.day_of_month ?? 1));
    // Iterate months from windowStart.year-month to windowEnd.year-month
    let y = windowStart.getUTCFullYear();
    let m = windowStart.getUTCMonth();
    while (true) {
      // Clamp day to last day of this month
      const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const actualDay = Math.min(day, lastDay);
      const date = new Date(Date.UTC(y, m, actualDay));
      if (date >= windowStart && date <= windowEnd) {
        occurrences.push({
          recurringId: recurring.id,
          date: isoOf(date),
          amount: recurring.amount,
          name: recurring.name,
          category: recurring.category,
        });
      }
      // Advance a month
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      const next = new Date(Date.UTC(y, m, 1));
      if (next > windowEnd) break;
    }
  } else if (recurring.frequency === "weekly") {
    const dow = recurring.day_of_week ?? 0;
    // Find first occurrence >= windowStart that matches dow
    const cur = new Date(windowStart.getTime());
    const delta = (dow - cur.getUTCDay() + 7) % 7;
    cur.setUTCDate(cur.getUTCDate() + delta);
    while (cur <= windowEnd) {
      occurrences.push({
        recurringId: recurring.id,
        date: isoOf(cur),
        amount: recurring.amount,
        name: recurring.name,
        category: recurring.category,
      });
      cur.setUTCDate(cur.getUTCDate() + 7);
    }
  }

  return occurrences;
}

function isoOf(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Year-month helpers for the month-picker.
 * Months are represented as `{ year, month }` where month is 1-12.
 */
export interface YearMonth {
  year: number;
  month: number; // 1–12
}

const AR_MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function currentYearMonth(): YearMonth {
  const d = parseIsoDate(todayIso())!;
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function addMonths(ym: YearMonth, delta: number): YearMonth {
  const total = ym.year * 12 + (ym.month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function yearMonthRange(ym: YearMonth): { from: string; to: string } {
  const first = new Date(Date.UTC(ym.year, ym.month - 1, 1));
  const last = new Date(Date.UTC(ym.year, ym.month, 0));
  return { from: isoOf(first), to: isoOf(last) };
}

export function formatYearMonth(ym: YearMonth): string {
  return `${AR_MONTH_NAMES[ym.month - 1]} ${ym.year}`;
}

export function isSameYearMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

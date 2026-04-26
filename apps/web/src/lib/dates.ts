/**
 * Date utilities for Tijarti.
 *
 * The prototype uses ISO YYYY-MM-DD strings for dates that need math
 * (check due_date, cashed_date, etc.) and renders them as Arabic month strings.
 *
 * Uses a mocked "today" so the seed data stays meaningful regardless of the
 * calendar date — change MOCK_TODAY here to shift the simulation.
 */

export const MOCK_TODAY = "2026-04-23";

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

/** Parse YYYY-MM-DD to a UTC Date, null if invalid. */
export function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return isNaN(d.getTime()) ? null : d;
}

/** Format an ISO date as Arabic (e.g. "21 أبريل 2026"). */
export function formatArDate(iso: string | null | undefined): string {
  const d = parseIsoDate(iso);
  if (!d) return "—";
  return `${d.getUTCDate()} ${AR_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Short Arabic date, e.g. "21 أبريل". */
export function formatArDateShort(iso: string | null | undefined): string {
  const d = parseIsoDate(iso);
  if (!d) return "—";
  return `${d.getUTCDate()} ${AR_MONTHS[d.getUTCMonth()]}`;
}

/** Days from MOCK_TODAY until the given ISO date. Negative = overdue. */
export function daysUntil(iso: string | null | undefined, today: string = MOCK_TODAY): number {
  const target = parseIsoDate(iso);
  const now = parseIsoDate(today);
  if (!target || !now) return 0;
  const ms = target.getTime() - now.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Human relative label, e.g. "خلال 5 أيام" / "اليوم" / "متأخر 3 أيام". */
export function relativeDue(iso: string | null | undefined, today: string = MOCK_TODAY): string {
  const d = daysUntil(iso, today);
  if (d === 0) return "اليوم";
  if (d === 1) return "غداً";
  if (d === -1) return "أمس";
  if (d > 0) return `خلال ${d} ${d <= 10 ? "أيام" : "يوم"}`;
  return `متأخر ${Math.abs(d)} ${Math.abs(d) <= 10 ? "أيام" : "يوم"}`;
}

/** Returns today's ISO date (respects MOCK_TODAY). */
export function todayIso(): string {
  return MOCK_TODAY;
}

/** Add N days to an ISO date, returning ISO. */
export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Is this ISO date within the next N days from MOCK_TODAY (inclusive)? */
export function isWithinNextDays(iso: string | null | undefined, n: number, today: string = MOCK_TODAY): boolean {
  const d = daysUntil(iso, today);
  return d >= 0 && d <= n;
}

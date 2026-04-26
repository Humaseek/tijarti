/**
 * RFM customer segmentation.
 *
 * R (Recency)  — how recently the customer bought
 * F (Frequency)— how often they buy
 * M (Monetary) — how much they spend
 *
 * Each dimension scored 1-5 (5 = best). Overall segment derived from the
 * combined score.
 *
 * Segments surface automatically on the customer record as a tier badge:
 *   ذهبي (Gold)   — score ≥ 12
 *   فضي  (Silver) — score 8-11
 *   برونزي (Bronze) — score 4-7
 *   خامد (Dormant) — score 0-3 (hasn't bought recently AND not a big spender)
 */

import type { Customer, Invoice } from "@/lib/store/types";
import { todayIso, parseIsoDate } from "@/lib/dates";

export type RfmTier = "gold" | "silver" | "bronze" | "dormant";

export interface RfmScore {
  r: number;       // 1-5
  f: number;       // 1-5
  m: number;       // 1-5
  total: number;   // r+f+m (3-15)
  tier: RfmTier;
  lastPurchase: string | null;
  invoiceCount: number;
  totalSpent: number;
}

const TIER_LABELS: Record<RfmTier, string> = {
  gold: "ذهبي",
  silver: "فضّي",
  bronze: "برونزي",
  dormant: "خامد",
};

const TIER_STYLES: Record<RfmTier, { bg: string; text: string; border: string; emoji: string }> = {
  gold: {
    bg: "bg-[rgba(234,179,8,0.14)] dark:bg-[rgba(250,204,21,0.18)]",
    text: "text-[#a16207] dark:text-[#facc15]",
    border: "border-[#eab308]",
    emoji: "🥇",
  },
  silver: {
    bg: "bg-[rgba(148,163,184,0.18)] dark:bg-[rgba(203,213,225,0.14)]",
    text: "text-[#475569] dark:text-[#cbd5e1]",
    border: "border-[#94a3b8]",
    emoji: "🥈",
  },
  bronze: {
    bg: "bg-[rgba(180,83,9,0.14)] dark:bg-[rgba(245,158,11,0.14)]",
    text: "text-[#92400e] dark:text-[#f59e0b]",
    border: "border-[#b45309]",
    emoji: "🥉",
  },
  dormant: {
    bg: "bg-surface2 dark:bg-surface2-dark",
    text: "text-muted dark:text-muted-dark",
    border: "border-divider dark:border-divider-dark",
    emoji: "💤",
  },
};

export function tierLabel(t: RfmTier) { return TIER_LABELS[t]; }
export function tierStyle(t: RfmTier) { return TIER_STYLES[t]; }

/**
 * Compute RFM scores for all customers from a given invoice list.
 * Scores are calibrated quintile-style — best 20% of each dim gets 5, etc.
 */
export function computeRfmScores(
  customers: Customer[],
  invoices: Invoice[]
): Map<string, RfmScore> {
  const today = parseIsoDate(todayIso())!;
  const map = new Map<string, RfmScore>();

  // Aggregate per customer
  const agg = new Map<string, { last: string | null; count: number; spent: number }>();
  for (const c of customers) {
    agg.set(c.id, { last: null, count: 0, spent: 0 });
  }

  for (const inv of invoices) {
    const a = agg.get(inv.customerId);
    if (!a) continue;
    a.count += 1;
    a.spent += inv.total;
    // Use invoice `date` field as a best-effort; otherwise customer.lastVisit
    // (date is Arabic-formatted; we compare using customer.lastVisit ISO)
  }

  // Pull ISO recency from customer.lastVisit if present
  for (const c of customers) {
    const a = agg.get(c.id);
    if (!a) continue;
    a.last = c.lastVisit || null;
  }

  // Extract arrays for quintile calibration
  const entries = Array.from(agg.entries()).filter(([, v]) => v.count > 0);
  if (entries.length === 0) {
    // Everyone is "dormant" with no data
    for (const c of customers) {
      map.set(c.id, { r: 0, f: 0, m: 0, total: 0, tier: "dormant", lastPurchase: null, invoiceCount: 0, totalSpent: 0 });
    }
    return map;
  }

  const recencyDays = entries.map(([, v]) => {
    if (!v.last) return 365;
    const d = parseIsoDate(v.last);
    if (!d) return 365;
    return Math.max(0, Math.floor((today.getTime() - d.getTime()) / 86400000));
  });
  const frequencies = entries.map(([, v]) => v.count);
  const monetaries = entries.map(([, v]) => v.spent);

  // Quintile thresholds (lower-is-better for recency, higher-is-better for F + M)
  const rQuints = quintileThresholds(recencyDays, /*asc*/ true);
  const fQuints = quintileThresholds(frequencies, /*asc*/ false);
  const mQuints = quintileThresholds(monetaries, /*asc*/ false);

  entries.forEach(([cid, v], i) => {
    const r = scoreQuintile(recencyDays[i], rQuints, true);
    const f = scoreQuintile(frequencies[i], fQuints, false);
    const m = scoreQuintile(monetaries[i], mQuints, false);
    const total = r + f + m;
    const tier: RfmTier =
      total >= 12 ? "gold"
      : total >= 8 ? "silver"
      : total >= 4 ? "bronze"
      : "dormant";
    map.set(cid, {
      r, f, m, total, tier,
      lastPurchase: v.last,
      invoiceCount: v.count,
      totalSpent: v.spent,
    });
  });

  // Customers with no invoices = dormant
  for (const c of customers) {
    if (!map.has(c.id)) {
      map.set(c.id, { r: 0, f: 0, m: 0, total: 0, tier: "dormant", lastPurchase: null, invoiceCount: 0, totalSpent: 0 });
    }
  }

  return map;
}

/** Given sorted values, produce 4 thresholds creating 5 buckets. */
function quintileThresholds(values: number[], asc: boolean): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))];
  // We want thresholds in ASCENDING order for the score mapper
  // score 5 = best 20% — which is LOW recency (small days) or HIGH freq/monetary
  return [q(0.2), q(0.4), q(0.6), q(0.8)];
}

/**
 * Maps a value to 1-5 given quintile thresholds.
 * For `lowerIsBetter`, smaller value → higher score.
 */
function scoreQuintile(v: number, th: number[], lowerIsBetter: boolean): number {
  // th has 4 cut points → 5 buckets
  let bucket = 1;
  if (v <= th[0]) bucket = 5;
  else if (v <= th[1]) bucket = 4;
  else if (v <= th[2]) bucket = 3;
  else if (v <= th[3]) bucket = 2;
  else bucket = 1;
  return lowerIsBetter ? bucket : 6 - bucket;
}

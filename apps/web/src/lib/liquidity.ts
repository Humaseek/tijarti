import type { StoreState, RecurringExpense } from "./store/types";
import { daysUntil, todayIso, parseIsoDate } from "./dates";
import {
  currentYearMonth,
  yearMonthRange,
  expandRecurring,
  type YearMonth,
} from "./projections";

// ─── Status enum (used across cards/dots/borders) ───────────────────────────
export type HealthStatus = "healthy" | "attention" | "critical";

export const HEALTH_COLOR: Record<HealthStatus, { dot: string; badge: string; border: string; text: string }> = {
  healthy: {
    dot: "bg-success dark:bg-success-dark",
    badge: "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark",
    border: "border-success dark:border-success-dark",
    text: "text-success dark:text-success-dark",
  },
  attention: {
    dot: "bg-warning dark:bg-warning-dark",
    badge: "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark",
    border: "border-warning dark:border-warning-dark",
    text: "text-warning dark:text-warning-dark",
  },
  critical: {
    dot: "bg-danger dark:bg-danger-dark",
    badge: "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark",
    border: "border-danger dark:border-danger-dark",
    text: "text-danger dark:text-danger-dark",
  },
};

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "سليم",
  attention: "يحتاج انتباه",
  critical: "حرج",
};

// ─── Liquidity runway (the primary KPI — "months of cash") ──────────────────
/** Scale markers for the graduated bar: weak / minimum / healthy / excellent */
export const RUNWAY_MARKERS = [
  { value: 0, label: "ضعيف",   status: "critical" as HealthStatus },
  { value: 1, label: "حد أدنى", status: "critical" as HealthStatus },
  { value: 2, label: "صحي",    status: "attention" as HealthStatus },
  { value: 6, label: "ممتاز",  status: "healthy" as HealthStatus },
];
export const RUNWAY_SCALE_MAX = 8; // bar goes up to 8 months

export function runwayStatus(months: number): HealthStatus {
  if (months < 1) return "critical";
  if (months < 2.5) return "attention";
  return "healthy";
}

// ─── Month-level recurring status (for the list of fixed items) ─────────────
export type RecurringLineStatus = "paid-full" | "paid-partial" | "due-soon" | "overdue";

export interface RecurringLine {
  id: string;
  name: string;
  amount: number;           // total expected this month
  paid: number;             // approximate paid-so-far
  status: RecurringLineStatus;
  dueDate: string;          // ISO of this month's occurrence
  healthStatus: HealthStatus;
}

/**
 * Derive a simple "paid/upcoming/overdue" status from the day_of_month
 * relative to today. Prototype only — real app would track actual payments.
 */
export function recurringLineStatus(
  r: RecurringExpense,
  today: string = todayIso()
): RecurringLine {
  const todayD = parseIsoDate(today);
  if (!todayD) {
    return {
      id: r.id, name: r.name, amount: r.amount, paid: 0,
      status: "due-soon", dueDate: today, healthStatus: "attention",
    };
  }

  const y = todayD.getUTCFullYear();
  const m = todayD.getUTCMonth();
  const day = Math.max(1, Math.min(31, r.day_of_month ?? 1));
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const actualDay = Math.min(day, lastDay);
  const occurrence = new Date(Date.UTC(y, m, actualDay));
  const dueIso = isoFromDate(occurrence);
  const diff = daysUntil(dueIso, today);

  let status: RecurringLineStatus;
  let paid: number;
  let healthStatus: HealthStatus;

  if (diff > 7) {
    // Far future — not yet due
    status = "due-soon";
    paid = 0;
    healthStatus = "healthy";
  } else if (diff > 0) {
    // Due within a week — upcoming
    status = "due-soon";
    paid = 0;
    healthStatus = "attention";
  } else if (diff === 0) {
    status = "due-soon";
    paid = 0;
    healthStatus = "attention";
  } else if (diff > -7) {
    // 1-7 days past due — assume partially or fully paid (demo approximation)
    status = "paid-full";
    paid = r.amount;
    healthStatus = "healthy";
  } else {
    // More than 7 days past — assume fully paid
    status = "paid-full";
    paid = r.amount;
    healthStatus = "healthy";
  }

  return { id: r.id, name: r.name, amount: r.amount, paid, status, dueDate: dueIso, healthStatus };
}

function isoFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

// ─── Full liquidity snapshot ────────────────────────────────────────────────
export interface LiquiditySnapshot {
  ym: YearMonth;
  overallStatus: HealthStatus;
  // Runway
  cashOnHand: number;
  monthlyBurn: number;
  runwayMonths: number;
  runwayStatus: HealthStatus;
  // Recurring breakdown
  recurringLines: RecurringLine[];
  recurringPaid: number;
  recurringTotal: number;
  // KPI cards (6)
  kpis: {
    profitMargin: { value: number; status: HealthStatus; label: string; meaning: string; benchmark: string };
    fixedRatio:   { value: number; status: HealthStatus; label: string; meaning: string; benchmark: string };
    pendingIn:    { value: number; status: HealthStatus; label: string; meaning: string; benchmark: string };
    pendingOut:   { value: number; status: HealthStatus; label: string; meaning: string; benchmark: string };
    overdueCount: { value: number; status: HealthStatus; label: string; meaning: string; benchmark: string };
    cashDays:     { value: number; status: HealthStatus; label: string; meaning: string; benchmark: string };
  };
  // Alert message (the first or most critical finding)
  alert: { title: string; message: string; status: HealthStatus } | null;
}

export function computeLiquidity(state: StoreState): LiquiditySnapshot {
  const ym = currentYearMonth();
  const { from, to } = yearMonthRange(ym);

  // Recurring lines for this month + totals
  const recurringLines = state.recurringExpenses
    .filter((r) => r.is_active && expandRecurring(r, from, to).length > 0)
    .map((r) => recurringLineStatus(r));
  const recurringTotal = recurringLines.reduce((s, l) => s + l.amount, 0);
  const recurringPaid = recurringLines.reduce((s, l) => s + l.paid, 0);

  // Actual expenses this month (prototype approximation)
  const actualExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  // Monthly burn: actual + recurring (excluding one-time checks)
  const monthlyBurn = Math.max(1, actualExpenses + recurringTotal);

  // Cash on hand (approximate): month revenue − what's been paid out this month
  const paidOut = actualExpenses + recurringPaid;
  const cashOnHand = Math.max(0, state.stats.monthRevenue - paidOut);

  const runwayMonths = cashOnHand / monthlyBurn;
  const rStatus = runwayStatus(runwayMonths);

  // KPI computations
  const monthRevenue = state.stats.monthRevenue || 1;
  const profitMargin = ((monthRevenue - actualExpenses - recurringTotal) / monthRevenue) * 100;
  const fixedRatio = (recurringTotal / monthRevenue) * 100;

  const pendingIncomingChecks = state.checks
    .filter((c) => c.status === "pending" && c.direction === "incoming")
    .reduce((s, c) => s + c.amount, 0);
  const pendingIncomingDebts = state.debts
    .filter((d) => d.status === "pending" && d.direction === "incoming")
    .reduce((s, d) => s + d.amount, 0);
  const pendingIn = pendingIncomingChecks + pendingIncomingDebts;

  const pendingOutgoingChecks = state.checks
    .filter((c) => c.status === "pending" && c.direction === "outgoing")
    .reduce((s, c) => s + c.amount, 0);
  const pendingOutgoingDebts = state.debts
    .filter((d) => d.status === "pending" && d.direction === "outgoing")
    .reduce((s, d) => s + d.amount, 0);
  const pendingOut = pendingOutgoingChecks + pendingOutgoingDebts;

  const overdueCount = state.checks.filter(
    (c) => c.status === "pending" && daysUntil(c.due_date) < 0
  ).length + state.debts.filter(
    (d) => d.status === "pending" && d.due_date && daysUntil(d.due_date) < 0
  ).length;

  const cashDays = Math.round(runwayMonths * 30);

  const kpis = {
    profitMargin: {
      value: Math.round(profitMargin),
      label: "هامش الربح",
      meaning: "كم ₪ بتربحي من كل 100 ₪ مبيعات",
      benchmark: profitMargin >= 30 ? "ممتاز — فوق متوسط القطاع" : profitMargin >= 15 ? "ضمن متوسط القطاع" : "دون المتوسط",
      status: (profitMargin >= 30 ? "healthy" : profitMargin >= 15 ? "attention" : "critical") as HealthStatus,
    },
    fixedRatio: {
      value: Math.round(fixedRatio),
      label: "نسبة المصاريف الثابتة",
      meaning: "كم % من الإيرادات بتروح للإيجار والرواتب والفواتير",
      benchmark: fixedRatio <= 25 ? "مناسبة" : fixedRatio <= 40 ? "مرتفعة" : "عالية جداً",
      status: (fixedRatio <= 25 ? "healthy" : fixedRatio <= 40 ? "attention" : "critical") as HealthStatus,
    },
    pendingIn: {
      value: pendingIn,
      label: "لكِ عند الناس",
      meaning: "مبالغ زبائن/غيرهم لم يدفعوها بعد",
      benchmark: pendingIn > monthRevenue * 0.5 ? "مرتفعة — سرّعي التحصيل" : "طبيعية",
      status: (pendingIn > monthRevenue * 0.5 ? "attention" : "healthy") as HealthStatus,
    },
    pendingOut: {
      value: pendingOut,
      label: "عليكِ للناس",
      meaning: "مبالغ لازم تدفعيها للموردين/غيرهم",
      benchmark: pendingOut > cashOnHand ? "تتجاوز النقد المتوفّر!" : "ضمن المتوفّر",
      status: (pendingOut > cashOnHand ? "critical" : pendingOut > cashOnHand * 0.5 ? "attention" : "healthy") as HealthStatus,
    },
    overdueCount: {
      value: overdueCount,
      label: "متأخّرات",
      meaning: "شيكات وديون فات موعدها ولم تُسدَّد",
      benchmark: overdueCount === 0 ? "لا متأخرات — ممتاز" : `${overdueCount} بحاجة متابعة`,
      status: (overdueCount === 0 ? "healthy" : overdueCount <= 2 ? "attention" : "critical") as HealthStatus,
    },
    cashDays: {
      value: cashDays,
      label: "احتياطي نقدي",
      meaning: "كم يوم تقدري تشتغلي بالنقد الحالي",
      benchmark: cashDays >= 60 ? "كافٍ لشهرين+" : cashDays >= 30 ? "كافٍ لشهر" : "دون الشهر",
      status: (cashDays >= 60 ? "healthy" : cashDays >= 30 ? "attention" : "critical") as HealthStatus,
    },
  };

  // Overall status: worst of runway + any critical KPI
  const allStatuses: HealthStatus[] = [
    rStatus,
    kpis.profitMargin.status,
    kpis.fixedRatio.status,
    kpis.pendingOut.status,
    kpis.overdueCount.status,
    kpis.cashDays.status,
  ];
  const overallStatus: HealthStatus =
    allStatuses.includes("critical") ? "critical"
    : allStatuses.includes("attention") ? "attention"
    : "healthy";

  // Auto-detect #1 issue for the alert card
  let alert: LiquiditySnapshot["alert"] = null;
  if (overdueCount > 0) {
    alert = {
      title: `${overdueCount} التزام متأخّر`,
      message: "راجعي قسم التدفق النقدي وتابعي تحصيل الشيكات أو سدّدي الديون المتأخرة.",
      status: overdueCount > 2 ? "critical" : "attention",
    };
  } else if (rStatus === "critical") {
    alert = {
      title: "سيولة حرجة",
      message: "النقد المتوفّر لا يكفي لتغطية مصاريف شهر كامل — قلّلي النفقات أو سرّعي التحصيل.",
      status: "critical",
    };
  } else if (kpis.fixedRatio.status !== "healthy") {
    alert = {
      title: "مصاريف ثابتة مرتفعة",
      message: "المصاريف الشهرية الثابتة تستهلك نسبة كبيرة من الإيرادات. راجعي أيّها قابل للتخفيض.",
      status: kpis.fixedRatio.status,
    };
  } else if (kpis.profitMargin.status !== "healthy") {
    alert = {
      title: "هامش ربح منخفض",
      message: "صافي ربحك دون متوسط القطاع. راجعي التسعير أو خفّضي التكاليف المتغيّرة.",
      status: kpis.profitMargin.status,
    };
  }

  return {
    ym,
    overallStatus,
    cashOnHand,
    monthlyBurn,
    runwayMonths,
    runwayStatus: rStatus,
    recurringLines,
    recurringPaid,
    recurringTotal,
    kpis,
    alert,
  };
}

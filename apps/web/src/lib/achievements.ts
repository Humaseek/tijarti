/**
 * Achievements — compute progress & earned status for gamified badges.
 */

import type { StoreState } from "@/lib/store/types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  progress: number; // 0-1
  current: number;
  target: number;
  unit: string;
  earned: boolean;
}

export function computeAchievements(state: StoreState): Achievement[] {
  const invoiceCount = state.invoices.length;
  const totalRevenue = state.invoices.reduce((s, i) => s + i.total, 0);
  const goalsAchieved = state.goals.filter((g) => g.status === "achieved").length;

  // Consecutive selling days (last 30)
  const dates = new Set<string>();
  for (const inv of state.invoices) dates.add(inv.date);
  let maxStreak = 0;
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (dates.has(iso)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Year anniversary — earliest invoice date
  let daysSinceFirst = 0;
  if (state.invoices.length > 0) {
    const earliest = state.invoices
      .map((i) => i.date)
      .filter(Boolean)
      .sort()[0];
    if (earliest) {
      const diff = (Date.now() - Date.parse(earliest)) / (1000 * 60 * 60 * 24);
      daysSinceFirst = Math.floor(diff);
    }
  }

  const make = (
    id: string,
    title: string,
    description: string,
    emoji: string,
    current: number,
    target: number,
    unit: string
  ): Achievement => ({
    id, title, description, emoji, current, target, unit,
    progress: Math.min(1, target > 0 ? current / target : 0),
    earned: current >= target,
  });

  return [
    make("first_invoice",  "أول فاتورة",    "سجّلي فاتورتك الأولى",            "🎉", invoiceCount, 1,      "فاتورة"),
    make("10_invoices",    "10 فواتير",     "أول 10 فواتير — انطلقت رحلتك",   "🚀", invoiceCount, 10,     "فاتورة"),
    make("100_invoices",   "أول 100 فاتورة","سجل قوي!",                        "💯", invoiceCount, 100,    "فاتورة"),
    make("500_invoices",   "500 فاتورة",    "محترفة!",                          "🏆", invoiceCount, 500,    "فاتورة"),
    make("first_10k",      "أول 10 آلاف",    "إيرادات 10,000 شيكل",            "💰", totalRevenue, 10_000, "₪"),
    make("first_100k",     "أول 100 ألف",    "إيرادات 100,000 شيكل",           "💎", totalRevenue, 100_000, "₪"),
    make("first_million",  "أول مليون",      "إيرادات 1,000,000 شيكل",         "👑", totalRevenue, 1_000_000, "₪"),
    make("streak_7",       "الثبات ⚡",       "7 أيام متتالية بيع",              "⚡", maxStreak, 7,       "يوم"),
    make("streak_30",      "شهر كامل 🔥",    "30 يوم متتالية بيع",             "🔥", maxStreak, 30,      "يوم"),
    make("goal_crusher",   "قاهرة الأهداف",   "حققي 3 أهداف شهرية",            "🎯", goalsAchieved, 3,  "هدف"),
    make("one_year",       "سنة على التطبيق","٣٦٥ يوم منذ أول فاتورة",         "📅", daysSinceFirst, 365, "يوم"),
  ];
}

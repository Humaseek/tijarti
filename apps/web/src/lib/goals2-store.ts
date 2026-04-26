"use client";

/**
 * Goals 2.0 — extended goals store (localStorage-backed).
 *
 * Unlike the store-context goal which is a single-number monthly target,
 * Goals 2.0 supports multiple concurrent goals with different types
 * (revenue, new_customers, reduce_expenses, increase_avg_invoice),
 * trajectory tracking, and templates.
 */

import { useEffect, useState } from "react";

export type Goal2Type = "monthly_revenue" | "new_customers" | "reduce_expenses" | "avg_invoice";

export interface Goal2 {
  id: string;
  type: Goal2Type;
  title: string;
  target: number;
  period_start: string; // ISO
  period_end: string;   // ISO
  created_at: number;
  completed_at?: number | null;
}

const STORAGE_KEY = "tj_goals_v2";

export const GOAL2_LABELS: Record<Goal2Type, string> = {
  monthly_revenue: "مبيعات شهرية",
  new_customers: "زبائن جدد",
  reduce_expenses: "تقليل مصاريف",
  avg_invoice: "رفع متوسط الفاتورة",
};

export const GOAL2_TEMPLATES: Array<{ type: Goal2Type; title: string; target: number; icon: string }> = [
  { type: "monthly_revenue", title: "مبيعات 30,000 ₪ هالشهر", target: 30000, icon: "chart" },
  { type: "new_customers", title: "10 زبائن جدد هالشهر", target: 10, icon: "users" },
  { type: "reduce_expenses", title: "خفّضي المصاريف بنسبة 15%", target: 15, icon: "card" },
  { type: "avg_invoice", title: "متوسط فاتورة 200 ₪", target: 200, icon: "receipt" },
];

function load(): Goal2[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Goal2[];
  } catch { return []; }
}

function save(list: Goal2[]) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

/** React hook for reading + mutating extended goals. */
export function useGoals2() {
  const [goals, setGoals] = useState<Goal2[]>([]);

  useEffect(() => { setGoals(load()); }, []);

  const add = (g: Omit<Goal2, "id" | "created_at">) => {
    const next: Goal2 = { ...g, id: `g2_${Date.now()}`, created_at: Date.now() };
    const list = [next, ...goals];
    setGoals(list);
    save(list);
    return next;
  };

  const update = (id: string, patch: Partial<Goal2>) => {
    const list = goals.map((g) => (g.id === id ? { ...g, ...patch } : g));
    setGoals(list);
    save(list);
  };

  const remove = (id: string) => {
    const list = goals.filter((g) => g.id !== id);
    setGoals(list);
    save(list);
  };

  return { goals, add, update, remove };
}

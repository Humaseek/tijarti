"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { useStore } from "@/lib/store/store-context";

/**
 * Onboarding checklist — progressive disclosure for first-time users.
 *
 * Shows a friendly set-up progress bar with tasks like:
 *   ✓ Add first customer
 *   ✓ Add first product
 *   ☐ Create first invoice
 *   ☐ Add a recurring expense
 *   ☐ Set monthly goal
 *
 * Auto-hides once ALL tasks are done. Dismissible with an X (persists in localStorage).
 */

interface TaskDef {
  id: string;
  label: string;
  sub: string;
  icon: IconName;
  href: string;
  isDone: (state: ReturnType<typeof useStore>["state"]) => boolean;
}

const TASKS: TaskDef[] = [
  {
    id: "add-customer",
    label: "أضيفي أول زبون",
    sub: "بدون زبائن مش رح تقدري تسجّلي فواتير",
    icon: "user",
    href: "/customers/new",
    isDone: (s) => s.customers.length > 0,
  },
  {
    id: "add-product",
    label: "أضيفي أول منتج",
    sub: "مع سعره وتكلفته حتى نحسب الربح",
    icon: "box",
    href: "/products/new",
    isDone: (s) => s.products.length > 0,
  },
  {
    id: "first-invoice",
    label: "سجّلي أول فاتورة",
    sub: "ابدأي تتبّعي مبيعاتك الفعلية",
    icon: "receipt",
    href: "/sales/new",
    isDone: (s) => s.invoices.length > 0,
  },
  {
    id: "first-expense",
    label: "سجّلي أول مصروف",
    sub: "بدون مصاريف ما في احتساب صافي ربح",
    icon: "card",
    href: "/expenses/new",
    isDone: (s) => s.expenses.length > 0,
  },
  {
    id: "recurring-expense",
    label: "ضيفي مصروف ثابت",
    sub: "إيجار، كهرباء — بيحسن دقة التوقعات",
    icon: "calendar",
    href: "/expenses/recurring/new",
    isDone: (s) => (s.recurringExpenses?.length ?? 0) > 0,
  },
  {
    id: "set-goal",
    label: "حدّدي هدف شهري",
    sub: "هدف واضح بيحفّزك ويوضّح الأولويات",
    icon: "target",
    href: "/goals",
    isDone: (s) => (s.goals?.length ?? 0) > 0,
  },
];

const DISMISS_KEY = "tj_onboarding_dismissed";

export function OnboardingChecklist({ base = "/desktop" }: { base?: string }) {
  const { state } = useStore();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(DISMISS_KEY) === "1";
  });
  const [expanded, setExpanded] = useState(true);

  const { done, total, percent } = useMemo(() => {
    const doneCount = TASKS.filter((t) => t.isDone(state)).length;
    return {
      done: doneCount,
      total: TASKS.length,
      percent: Math.round((doneCount / TASKS.length) * 100),
    };
  }, [state]);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  };

  // Hide if dismissed OR fully complete (celebrate briefly with 100% ribbon then fade away)
  if (dismissed) return null;
  if (done === total) {
    // auto-hide after a moment — but we show for this render so user sees "✓ done"
    if (typeof window !== "undefined") {
      setTimeout(dismiss, 30);
    }
  }

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden mb-5">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <div className="w-10 h-10 rounded-tj bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Ico name="target" size={17} className="text-primary" sw={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">إعداد محلك</h2>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-tj tj-num">
              {done}/{total}
            </span>
          </div>
          <div className="text-[10px] text-muted dark:text-muted-dark">
            أكملي هذه الخطوات لتجربة تطبيق كاملة — {percent}% تم
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-primary font-bold hover:underline"
        >
          {expanded ? "إخفاء" : "عرض الخطوات"}
        </button>
        <button
          onClick={dismiss}
          aria-label="إغلاق"
          className="w-8 h-8 rounded-tj hover:bg-surface2 dark:hover:bg-surface2-dark flex items-center justify-center text-muted dark:text-muted-dark"
        >
          <Ico name="close" size={12} sw={1.8} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-bg dark:bg-bg-dark">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Tasks list */}
      {expanded && (
        <div className="p-3 grid grid-cols-2 gap-2">
          {TASKS.map((t) => {
            const done = t.isDone(state);
            return (
              <Link
                key={t.id}
                href={`${base}${t.href}`}
                className={`flex items-start gap-3 p-3 rounded-tj border transition-colors ${
                  done
                    ? "bg-success-soft/30 dark:bg-success-soft/10 border-success/30 dark:border-success-dark/30"
                    : "bg-bg dark:bg-bg-dark border-divider dark:border-divider-dark hover:border-primary"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done
                    ? "bg-success dark:bg-success-dark text-white"
                    : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
                }`}>
                  {done ? <Ico name="check" size={13} sw={3} /> : <Ico name={t.icon} size={13} sw={1.8} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-bold ${done ? "text-success dark:text-success-dark line-through" : "text-text dark:text-text-dark"}`}>
                    {t.label}
                  </div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5 leading-relaxed">{t.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

export default function DesktopRecurring() {
  const { state } = useStore();

  const active = state.recurringExpenses.filter((r) => r.is_active);
  const inactive = state.recurringExpenses.filter((r) => !r.is_active);

  const monthly = useMemo(
    () => active.filter((r) => r.frequency === "monthly").reduce((s, r) => s + r.amount, 0),
    [active]
  );
  const weekly = useMemo(
    () => active.filter((r) => r.frequency === "weekly").reduce((s, r) => s + r.amount, 0),
    [active]
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">العمليات</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">المصاريف الثابتة</h1>
          <p className="text-[11px] text-muted dark:text-muted-dark mt-1">مصاريف تتكرر تلقائياً كل شهر/أسبوع</p>
        </div>
        <Link href="/desktop/expenses/recurring/new" className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90">
          <Ico name="plus" size={16} sw={2.4} />
          مصروف ثابت
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-primary p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">إجمالي شهري</div>
          <Shekel amt={monthly} size={22} className="text-primary" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">إجمالي أسبوعي</div>
          <Shekel amt={weekly} size={22} className="text-text dark:text-text-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">نشطة / موقوفة</div>
          <div className="flex items-baseline gap-2">
            <Num size={22} className="text-success dark:text-success-dark" weight={700}>{active.length}</Num>
            <span className="text-[13px] text-muted dark:text-muted-dark">/ {inactive.length}</span>
          </div>
        </div>
      </div>

      {/* Grid of recurring expenses */}
      <div className="grid grid-cols-2 gap-4">
        {[...active, ...inactive].map((r) => {
          const freqLabel = r.frequency === "monthly" ? `شهري · يوم ${r.day_of_month || 1}` : "أسبوعي";
          return (
            <Link
              key={r.id}
              href={`/desktop/expenses/recurring/${r.id}/edit`}
              className={`bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 hover:border-primary transition-colors ${
                !r.is_active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-text dark:text-text-dark">{r.name}</div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">{r.category} · {freqLabel}</div>
                </div>
                {!r.is_active && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-tj bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark">موقوف</span>
                )}
              </div>
              <div className="flex items-baseline justify-between pt-2 border-t border-divider dark:border-divider-dark">
                <Shekel amt={r.amount} size={18} className="text-text dark:text-text-dark" weight={700} />
                {r.end_date && (
                  <div className="text-[10px] text-muted dark:text-muted-dark">حتى {r.end_date}</div>
                )}
              </div>
              {r.notes && (
                <div className="text-[10px] text-muted dark:text-muted-dark mt-2 pt-2 border-t border-divider dark:border-divider-dark">
                  {r.notes}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {state.recurringExpenses.length === 0 && (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-14 text-center px-8">
          <div className="mb-3 flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
              <Ico name="calendar" size={26} sw={1.6} className="text-primary" />
            </div>
          </div>
          <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا مصاريف ثابتة</div>
          <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[380px] mx-auto">
            أضيفي مصاريفك الثابتة (إيجار، كهرباء، إنترنت) — وبنحسبها تلقائياً في المدى النقدي والتوقعات
          </div>
          <div className="mt-3 inline-block text-[10px] text-primary bg-primary-soft dark:bg-primary-soft/20 px-2.5 py-1 rounded-tj font-semibold">
            💡 كل شيكل مصروف ثابت لازم تعرفيه قبل ما تربحي منه
          </div>
          <div className="mt-4">
            <Link
              href="/desktop/expenses/recurring/new"
              className="inline-block px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
            >
              + مصروف ثابت
            </Link>
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}

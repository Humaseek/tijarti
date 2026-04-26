"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { exportCsv } from "@/lib/csv-export";
import type { ExpenseCategory } from "@/lib/store/types";
import { EXPENSE_CATEGORIES } from "@/lib/store/types";

type CatFilter = "all" | ExpenseCategory;

export default function DesktopExpenses() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState<CatFilter>("all");

  const rows = useMemo(() => {
    const query = q.trim();
    return state.expenses.filter((e) => {
      if (query && !e.description.includes(query)) return false;
      if (catF !== "all" && e.category !== catF) return false;
      return true;
    });
  }, [state.expenses, q, catF]);

  const totals = useMemo(() => {
    const amount = rows.reduce((s, e) => s + e.amount, 0);
    const byMethod = new Map<string, number>();
    for (const e of rows) byMethod.set(e.payment_method, (byMethod.get(e.payment_method) ?? 0) + e.amount);
    return { amount, count: rows.length, byMethod };
  }, [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">العمليات</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">المصاريف</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(
              `expenses-${new Date().toISOString().slice(0, 10)}`,
              rows,
              [
                { header: "الوصف", get: (e) => e.description },
                { header: "المبلغ", get: (e) => e.amount },
                { header: "التصنيف", get: (e) => e.category },
                { header: "المورّد", get: () => "" },
                { header: "التاريخ", get: (e) => e.expense_date },
                { header: "طريقة الدفع", get: (e) => e.payment_method },
              ]
            )}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark disabled:opacity-40 disabled:cursor-not-allowed"
            title="تصدير CSV"
          >
            <Ico name="download" size={13} sw={1.8} />
            تصدير
          </button>
          <Link href="/desktop/expenses/insights" className="flex items-center gap-2 px-4 py-2.5 rounded-tj border border-divider dark:border-divider-dark text-[13px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
            <Ico name="chart" size={15} sw={1.8} />
            تحليلات
          </Link>
          <Link href="/desktop/expenses/recurring" className="flex items-center gap-2 px-4 py-2.5 rounded-tj border border-divider dark:border-divider-dark text-[13px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
            <Ico name="calendar" size={15} sw={1.8} />
            مصاريف ثابتة
          </Link>
          <Link href="/desktop/expenses/new" className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90">
            <Ico name="plus" size={16} sw={2.4} />
            مصروف جديد
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">عدد المصاريف</div>
          <Num size={22} className="text-text dark:text-text-dark" weight={700}>{totals.count}</Num>
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-danger dark:border-s-danger-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">إجمالي</div>
          <Shekel amt={totals.amount} size={22} className="text-danger dark:text-danger-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">نقدي</div>
          <Shekel amt={totals.byMethod.get("نقدي") ?? 0} size={22} className="text-text dark:text-text-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">بطاقة / تحويل</div>
          <Shekel amt={(totals.byMethod.get("بطاقة") ?? 0) + (totals.byMethod.get("تحويل") ?? 0)} size={22} className="text-text dark:text-text-dark" weight={700} />
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
            <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="الوصف..." className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar" dir="rtl" />
          </div>
          <select value={catF} onChange={(e) => setCatF(e.target.value as CatFilter)} className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar">
            <option value="all">كل التصنيفات</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {rows.length === 0 ? (
          state.expenses.length === 0 ? (
            <div className="py-14 text-center px-8">
              <div className="mb-3 flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
                  <Ico name="card" size={26} sw={1.6} className="text-primary" />
                </div>
              </div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا مصاريف مسجّلة</div>
              <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[340px] mx-auto">
                سجّلي كل مصاريفك — بدون هالمعلومة ما في طريقة نحسب صافي ربحك الحقيقي
              </div>
              <div className="mt-3 inline-block text-[10px] text-primary bg-primary-soft dark:bg-primary-soft/20 px-2.5 py-1 rounded-tj font-semibold">
                💡 صوّري فاتورة المصروف وخلّي OCR يقرأها تلقائياً
              </div>
              <div className="mt-4">
                <Link
                  href="/desktop/expenses/new"
                  className="inline-block px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
                >
                  + مصروف جديد
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Ico name="card" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
              <div className="text-[13px] text-muted dark:text-muted-dark">لا مصاريف مطابقة</div>
            </div>
          )
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الوصف</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التصنيف</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التاريخ</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">طريقة الدفع</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/desktop/expenses/${e.id}`} className="text-[12px] font-bold text-text dark:text-text-dark hover:text-primary">{e.description}</Link>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{e.category}</td>
                  <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{e.expense_date}</td>
                  <td className="px-4 py-3 text-[11px] text-text dark:text-text-dark">{e.payment_method}</td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-danger dark:text-danger-dark">{e.amount.toLocaleString()} ₪</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="h-6" />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { exportCsv } from "@/lib/csv-export";
import type { DebtDirection, DebtStatus } from "@/lib/store/types";
import { daysUntil, formatArDateShort, relativeDue } from "@/lib/dates";

type DirFilter = "all" | DebtDirection;
type StatusFilter = "all" | DebtStatus;

export default function DesktopDebts() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [dirF, setDirF] = useState<DirFilter>("all");
  const [statusF, setStatusF] = useState<StatusFilter>("all");

  const rows = useMemo(() => {
    const query = q.trim();
    return state.debts
      .filter((d) => {
        if (query && !d.party_name.includes(query) && !d.description.includes(query)) return false;
        if (dirF !== "all" && d.direction !== dirF) return false;
        if (statusF !== "all" && d.status !== statusF) return false;
        return true;
      })
      .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
  }, [state.debts, q, dirF, statusF]);

  const totals = useMemo(() => {
    const pendingIn = rows.filter((d) => d.status === "pending" && d.direction === "incoming").reduce((s, d) => s + d.amount, 0);
    const pendingOut = rows.filter((d) => d.status === "pending" && d.direction === "outgoing").reduce((s, d) => s + d.amount, 0);
    return { pendingIn, pendingOut, net: pendingIn - pendingOut };
  }, [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">العمليات</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">على الحساب</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(
              `debts-${new Date().toISOString().slice(0, 10)}`,
              rows,
              [
                { header: "الطرف", get: (d) => d.party_name },
                { header: "الوصف", get: (d) => d.description },
                { header: "المبلغ", get: (d) => d.amount },
                { header: "الاتجاه", get: (d) => (d.direction === "incoming" ? "لكِ" : "عليكِ") },
                { header: "التاريخ", get: (d) => d.issued_date },
                { header: "تاريخ الاستحقاق", get: (d) => d.due_date || "" },
                { header: "الحالة", get: (d) => (
                  d.status === "pending" ? "قيد"
                  : d.status === "settled" ? "مسدّد"
                  : "ملغى"
                ) },
              ]
            )}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark disabled:opacity-40 disabled:cursor-not-allowed"
            title="تصدير CSV"
          >
            <Ico name="download" size={13} sw={1.8} />
            تصدير
          </button>
          <Link href="/desktop/debts/new?direction=incoming" className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90">
            <Ico name="plus" size={16} sw={2.4} />
            دَين جديد
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-success dark:border-s-success-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">عليهن (لكِ)</div>
          <Shekel amt={totals.pendingIn} size={22} className="text-success dark:text-success-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-danger dark:border-s-danger-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">عليكِ</div>
          <Shekel amt={totals.pendingOut} size={22} className="text-danger dark:text-danger-dark" weight={700} />
        </div>
        <div className={`bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] p-4 ${totals.net >= 0 ? "border-s-success dark:border-s-success-dark" : "border-s-warning dark:border-s-warning-dark"}`}>
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">الصافي</div>
          <Shekel amt={Math.abs(totals.net)} size={22} className={totals.net >= 0 ? "text-success dark:text-success-dark" : "text-warning dark:text-warning-dark"} weight={700} />
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
            <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="الطرف أو الوصف..." className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar" dir="rtl" />
          </div>
          <select value={dirF} onChange={(e) => setDirF(e.target.value as DirFilter)} className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar">
            <option value="all">الكل</option>
            <option value="incoming">عليهن</option>
            <option value="outgoing">عليّ</option>
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value as StatusFilter)} className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar">
            <option value="all">كل الحالات</option>
            <option value="pending">قيد</option>
            <option value="settled">مسدّد</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {rows.length === 0 ? (
          state.debts.length === 0 ? (
            <div className="py-14 text-center px-8">
              <div className="mb-3 flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
                  <Ico name="money" size={26} sw={1.6} className="text-primary" />
                </div>
              </div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا ذمم على الحساب</div>
              <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[340px] mx-auto">
                سجّلي الذمم (ما لك أو ما عليك للناس) — وتابعي التحصيل والسداد بشكل واضح
              </div>
              <div className="mt-4">
                <Link
                  href="/desktop/debts/new?direction=incoming"
                  className="inline-block px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
                >
                  + ذمّة جديدة
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Ico name="money" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
              <div className="text-[13px] text-muted dark:text-muted-dark">لا ذمم مطابقة</div>
            </div>
          )
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاتجاه</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الطرف</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الوصف</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المبلغ</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاستحقاق</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const overdue = d.status === "pending" && d.due_date && daysUntil(d.due_date) < 0;
                return (
                  <tr key={d.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${
                        d.direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
                      }`}>
                        {d.direction === "incoming" ? "عليهن" : "عليّ"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/desktop/debts/${d.id}`} className="text-[12px] font-bold text-text dark:text-text-dark hover:text-primary">{d.party_name}</Link>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark max-w-[280px] truncate">{d.description}</td>
                    <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-text dark:text-text-dark">{d.amount.toLocaleString()} ₪</td>
                    <td className="px-4 py-3 text-end">
                      {d.due_date ? (
                        <>
                          <div className="text-[11px] text-text dark:text-text-dark">{formatArDateShort(d.due_date)}</div>
                          {d.status === "pending" && (
                            <div className={`text-[9px] ${overdue ? "text-warning dark:text-warning-dark font-bold" : "text-muted dark:text-muted-dark"}`}>
                              {relativeDue(d.due_date)}
                            </div>
                          )}
                        </>
                      ) : <span className="text-[11px] text-muted dark:text-muted-dark">—</span>}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-tj ${
                        d.status === "settled"   ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                        : d.status === "cancelled" ? "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
                        : overdue                  ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                        :                            "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
                      }`}>
                        {d.status === "pending" ? (overdue ? "متأخر" : "قيد") : d.status === "settled" ? "مسدّد" : "ملغى"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="h-6" />
    </div>
  );
}

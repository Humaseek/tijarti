"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { exportCsv } from "@/lib/csv-export";
import type { CheckDirection, CheckStatus } from "@/lib/store/types";
import { daysUntil, formatArDateShort, relativeDue } from "@/lib/dates";

type DirFilter = "all" | CheckDirection;
type StatusFilter = "all" | CheckStatus;

export default function DesktopChecks() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [dirF, setDirF] = useState<DirFilter>("all");
  const [statusF, setStatusF] = useState<StatusFilter>("all");

  const rows = useMemo(() => {
    const query = q.trim();
    return state.checks
      .filter((c) => {
        if (query && !c.party_name.includes(query) && !c.number.includes(query)) return false;
        if (dirF !== "all" && c.direction !== dirF) return false;
        if (statusF !== "all" && c.status !== statusF) return false;
        return true;
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [state.checks, q, dirF, statusF]);

  const totals = useMemo(() => {
    const pendingIn = rows.filter((c) => c.status === "pending" && c.direction === "incoming").reduce((s, c) => s + c.amount, 0);
    const pendingOut = rows.filter((c) => c.status === "pending" && c.direction === "outgoing").reduce((s, c) => s + c.amount, 0);
    const overdue = rows.filter((c) => c.status === "pending" && daysUntil(c.due_date) < 0).length;
    return { pendingIn, pendingOut, overdue };
  }, [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">العمليات</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">الشيكات</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(
              `checks-${new Date().toISOString().slice(0, 10)}`,
              rows,
              [
                { header: "رقم الشيك", get: (c) => c.number },
                { header: "الطرف", get: (c) => c.party_name },
                { header: "المبلغ", get: (c) => c.amount },
                { header: "الاتجاه", get: (c) => (c.direction === "incoming" ? "وارد" : "صادر") },
                { header: "البنك", get: (c) => c.bank || "" },
                { header: "تاريخ الاستحقاق", get: (c) => c.due_date },
                { header: "الحالة", get: (c) => (
                  c.status === "pending" ? "قيد التحصيل"
                  : c.status === "cashed" ? "محصّل"
                  : c.status === "bounced" ? "مرتجع"
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
          <Link href="/desktop/checks/new?direction=incoming" className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-success dark:bg-success-dark text-white text-[13px] font-bold hover:opacity-90">
            <Ico name="plus" size={16} sw={2.4} />
            شيك وارد
          </Link>
          <Link href="/desktop/checks/new?direction=outgoing" className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-danger dark:bg-danger-dark text-white text-[13px] font-bold hover:opacity-90">
            <Ico name="plus" size={16} sw={2.4} />
            شيك صادر
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-success dark:border-s-success-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">شيكات واردة قيد التحصيل</div>
          <Shekel amt={totals.pendingIn} size={22} className="text-success dark:text-success-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-danger dark:border-s-danger-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">شيكات صادرة قيد الدفع</div>
          <Shekel amt={totals.pendingOut} size={22} className="text-danger dark:text-danger-dark" weight={700} />
        </div>
        <div className={`bg-surface dark:bg-surface-dark rounded-tj border p-4 ${
          totals.overdue > 0 ? "border-warning dark:border-warning-dark border-s-[3px] border-s-warning dark:border-s-warning-dark" : "border-divider dark:border-divider-dark"
        }`}>
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">شيكات متأخرة</div>
          <Num size={22} className={totals.overdue > 0 ? "text-warning dark:text-warning-dark" : "text-text dark:text-text-dark"} weight={700}>{totals.overdue}</Num>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
            <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="الطرف أو رقم الشيك..." className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar" dir="rtl" />
          </div>
          <select value={dirF} onChange={(e) => setDirF(e.target.value as DirFilter)} className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar">
            <option value="all">الكل</option>
            <option value="incoming">وارد</option>
            <option value="outgoing">صادر</option>
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value as StatusFilter)} className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar">
            <option value="all">كل الحالات</option>
            <option value="pending">قيد التحصيل</option>
            <option value="cashed">محصّل</option>
            <option value="bounced">مرتجع</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {rows.length === 0 ? (
          state.checks.length === 0 ? (
            <div className="py-14 text-center px-8">
              <div className="mb-3 flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
                  <Ico name="receipt" size={26} sw={1.6} className="text-primary" />
                </div>
              </div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا شيكات مسجّلة</div>
              <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[340px] mx-auto">
                سجّلي الشيكات الواردة والصادرة — وبننبّهك قبل الاستحقاق حتى لا يرتد أي شيك
              </div>
              <div className="mt-3 inline-block text-[10px] text-primary bg-primary-soft dark:bg-primary-soft/20 px-2.5 py-1 rounded-tj font-semibold">
                💡 الشيك المرتجع يضر بالسمعة التجارية — التنبيه المبكر بيحميكِ
              </div>
              <div className="mt-4 flex gap-2 justify-center">
                <Link
                  href="/desktop/checks/new?direction=incoming"
                  className="inline-block px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
                >
                  + شيك جديد
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Ico name="receipt" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
              <div className="text-[13px] text-muted dark:text-muted-dark">لا شيكات مطابقة</div>
            </div>
          )
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">#</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاتجاه</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الطرف</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">البنك</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المبلغ</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاستحقاق</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const overdue = c.status === "pending" && daysUntil(c.due_date) < 0;
                return (
                  <tr key={c.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/desktop/checks/${c.id}`} className="text-[12px] font-bold text-primary hover:underline tj-num">#{c.number}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${
                        c.direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
                      }`}>
                        {c.direction === "incoming" ? "وارد ↓" : "صادر ↑"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-text dark:text-text-dark">{c.party_name}</td>
                    <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{c.bank || "—"}</td>
                    <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-text dark:text-text-dark">{c.amount.toLocaleString()} ₪</td>
                    <td className="px-4 py-3 text-end">
                      <div className="text-[11px] text-text dark:text-text-dark">{formatArDateShort(c.due_date)}</div>
                      {c.status === "pending" && (
                        <div className={`text-[9px] ${overdue ? "text-warning dark:text-warning-dark font-bold" : "text-muted dark:text-muted-dark"}`}>
                          {relativeDue(c.due_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-tj ${
                        c.status === "cashed"    ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                        : c.status === "bounced"  ? "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
                        : c.status === "cancelled" ? "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
                        : overdue                 ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                        :                           "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
                      }`}>
                        {c.status === "pending" ? (overdue ? "متأخر" : "قيد التحصيل") : c.status === "cashed" ? "محصّل" : c.status === "bounced" ? "مرتجع" : "ملغى"}
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

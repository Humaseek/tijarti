"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store-context";
import { exportCsv } from "@/lib/csv-export";
import { formatArDateShort } from "@/lib/dates";

export default function DesktopSuppliers() {
  const { state, supplierStats } = useStore();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const query = q.trim();
    return state.suppliers
      .filter((s) => s.is_active)
      .filter((s) => !query || s.name.includes(query))
      .map((s) => ({ supplier: s, stats: supplierStats(s.id) }))
      .sort((a, b) => b.stats.outstanding - a.stats.outstanding);
  }, [state.suppliers, q, supplierStats]);

  const totals = useMemo(() => {
    const paid = rows.reduce((s, r) => s + r.stats.totalPaid, 0);
    const outstanding = rows.reduce((s, r) => s + r.stats.outstanding, 0);
    return { paid, outstanding };
  }, [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">الأطراف والمخزون</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">الموردين</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(
              `suppliers-${new Date().toISOString().slice(0, 10)}`,
              rows,
              [
                { header: "الاسم", get: (r) => r.supplier.name },
                { header: "الهاتف", get: (r) => r.supplier.phone || "" },
                { header: "الإيميل", get: (r) => r.supplier.email || "" },
                { header: "التصنيف الافتراضي", get: (r) => r.supplier.default_category || "" },
                { header: "العنوان", get: (r) => r.supplier.address || "" },
                { header: "ح.פ", get: (r) => r.supplier.business_number || "" },
                { header: "شروط الدفع", get: (r) => r.supplier.payment_terms || "" },
              ]
            )}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark disabled:opacity-40 disabled:cursor-not-allowed"
            title="تصدير CSV"
          >
            <Ico name="download" size={13} sw={1.8} />
            تصدير
          </button>
          <Link href="/desktop/suppliers/new" className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90">
            <Ico name="plus" size={16} sw={2.4} />
            مورد جديد
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">إجمالي الموردين</div>
          <Num size={22} className="text-text dark:text-text-dark" weight={700}>{rows.length}</Num>
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-success dark:border-s-success-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">إجمالي المدفوع</div>
          <Shekel amt={totals.paid} size={22} className="text-success dark:text-success-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-warning dark:border-s-warning-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">مستحق عليكِ</div>
          <Shekel amt={totals.outstanding} size={22} className="text-warning dark:text-warning-dark" weight={700} />
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
          <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="اسم المورد..."
            className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar"
            dir="rtl"
          />
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {rows.length === 0 ? (
          state.suppliers.filter((s) => s.is_active).length === 0 ? (
            <div className="py-14 text-center px-8">
              <div className="mb-3 flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
                  <Ico name="store" size={26} sw={1.6} className="text-primary" />
                </div>
              </div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا موردين بعد</div>
              <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[340px] mx-auto">
                سجّلي المورّدين اللي بتشتري منهم — وبنتبّع لكِ المصاريف والشيكات الصادرة تلقائياً
              </div>
              <div className="mt-4">
                <Link
                  href="/desktop/suppliers/new"
                  className="inline-block px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
                >
                  + مورّد جديد
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Ico name="store" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
              <div className="text-[13px] text-muted dark:text-muted-dark">لا موردين مطابقين</div>
            </div>
          )
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاسم</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التصنيف</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الهاتف</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">شروط الدفع</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">فواتير</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المدفوع</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">مستحق</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">آخر معاملة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ supplier: s, stats }) => (
                <tr key={s.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/desktop/suppliers/${s.id}`} className="flex items-center gap-2.5">
                      <Avatar name={s.name} initial={s.initial} size={32} bg={s.avatar_color || undefined} />
                      <span className="text-[12px] font-bold text-text dark:text-text-dark hover:text-primary">{s.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{s.default_category || "—"}</td>
                  <td className="px-4 py-3 text-[11px] tj-num text-text dark:text-text-dark" dir="ltr">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{s.payment_terms || "—"}</td>
                  <td className="px-4 py-3 text-end tj-num text-[11px] text-text dark:text-text-dark">{stats.invoiceCount}</td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-success dark:text-success-dark">{stats.totalPaid.toLocaleString()} ₪</td>
                  <td className="px-4 py-3 text-end">
                    {stats.outstanding > 0 ? (
                      <span className="text-[12px] font-bold text-warning dark:text-warning-dark tj-num">{stats.outstanding.toLocaleString()} ₪</span>
                    ) : (
                      <span className="text-[11px] text-muted dark:text-muted-dark">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end text-[11px] text-muted dark:text-muted-dark">{stats.lastPurchaseIso ? formatArDateShort(stats.lastPurchaseIso) : "—"}</td>
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

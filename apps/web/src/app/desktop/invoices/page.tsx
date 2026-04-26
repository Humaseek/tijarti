"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store-context";
import { exportCsv } from "@/lib/csv-export";

type StatusFilter = "all" | "paid" | "unpaid";
type MethodFilter = "all" | "نقدي" | "بطاقة" | "آجل" | "تقسيط";
type SortCol = "no" | "total" | "customer";
type SortState = { col: SortCol | null; dir: "asc" | "desc" };

export default function DesktopInvoices() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<StatusFilter>("all");
  const [methodF, setMethodF] = useState<MethodFilter>("all");
  const [density, setDensity] = useState<"compact" | "normal">("normal");
  const [sort, setSort] = useState<SortState>({ col: null, dir: "asc" });

  const toggleSort = (col: SortCol) => {
    setSort((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: null, dir: "asc" };
    });
  };

  const rows = useMemo(() => {
    const query = q.trim();
    const filtered = state.invoices.filter((inv) => {
      const c = state.customers.find((x) => x.id === inv.customerId);
      if (query && !(c?.name.includes(query) || inv.no.includes(query))) return false;
      const debt = inv.total - inv.paid;
      if (statusF === "paid" && debt > 0) return false;
      if (statusF === "unpaid" && debt <= 0) return false;
      if (methodF !== "all" && inv.method !== methodF) return false;
      return true;
    });
    if (!sort.col) return filtered;
    const col = sort.col;
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (col === "no") return a.no.localeCompare(b.no) * mul;
      if (col === "customer") {
        const an = state.customers.find((x) => x.id === a.customerId)?.name || "";
        const bn = state.customers.find((x) => x.id === b.customerId)?.name || "";
        return an.localeCompare(bn, "ar") * mul;
      }
      return (a.total - b.total) * mul;
    });
  }, [state.invoices, state.customers, q, statusF, methodF, sort]);

  const rowPadY = density === "compact" ? "py-1.5" : "py-3";

  const totals = useMemo(() => {
    const total = rows.reduce((s, i) => s + i.total, 0);
    const paid = rows.reduce((s, i) => s + i.paid, 0);
    const outstanding = total - paid;
    return { total, paid, outstanding };
  }, [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">العمليات</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">المبيعات والفواتير</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(
              `invoices-${new Date().toISOString().slice(0, 10)}`,
              rows,
              [
                { header: "الرقم", get: (inv) => inv.no },
                { header: "التاريخ", get: (inv) => inv.date },
                { header: "الوقت", get: (inv) => inv.time },
                { header: "الزبون", get: (inv) => state.customers.find((x) => x.id === inv.customerId)?.name || "" },
                { header: "المبلغ", get: (inv) => inv.total },
                { header: "المدفوع", get: (inv) => inv.paid },
                { header: "المتبقّي", get: (inv) => inv.total - inv.paid },
                { header: "طريقة الدفع", get: (inv) => inv.method },
              ]
            )}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark disabled:opacity-40 disabled:cursor-not-allowed"
            title="تصدير CSV"
          >
            <Ico name="download" size={13} sw={1.8} />
            تصدير
          </button>
          <Link
            href="/desktop/sales/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90 transition-opacity"
          >
            <Ico name="plus" size={16} sw={2.4} />
            بيع جديد
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">عدد الفواتير</div>
          <Num size={22} className="text-text dark:text-text-dark" weight={700}>{rows.length}</Num>
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">إجمالي المبيعات</div>
          <Shekel amt={totals.total} size={22} className="text-text dark:text-text-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 border-s-[3px] border-s-success dark:border-s-success-dark">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">المحصّل</div>
          <Shekel amt={totals.paid} size={22} className="text-success dark:text-success-dark" weight={700} />
        </div>
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 border-s-[3px] border-s-warning dark:border-s-warning-dark">
          <div className="text-[11px] text-muted dark:text-muted-dark mb-1">المستحق</div>
          <Shekel amt={totals.outstanding} size={22} className="text-warning dark:text-warning-dark" weight={700} />
        </div>
      </div>

      {/* Filters + search */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
            <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالزبون أو رقم الفاتورة..."
              className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar"
              dir="rtl"
            />
          </div>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value as StatusFilter)}
            className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar"
          >
            <option value="all">كل الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="unpaid">غير مدفوعة</option>
          </select>
          <select
            value={methodF}
            onChange={(e) => setMethodF(e.target.value as MethodFilter)}
            className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar"
          >
            <option value="all">كل طرق الدفع</option>
            <option value="نقدي">نقدي</option>
            <option value="بطاقة">بطاقة</option>
            <option value="آجل">آجل</option>
            <option value="تقسيط">تقسيط</option>
          </select>
          <button
            type="button"
            onClick={() => setDensity((d) => (d === "normal" ? "compact" : "normal"))}
            title={density === "normal" ? "عرض مضغوط" : "عرض عادي"}
            aria-label="تبديل كثافة الصفوف"
            className="flex items-center justify-center p-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-muted dark:text-muted-dark hover:text-text dark:hover:text-text-dark transition-colors"
          >
            <Ico name="filter" size={14} sw={1.8} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {rows.length === 0 ? (
          state.invoices.length === 0 ? (
            <div className="py-14 text-center px-8">
              <div className="mb-3 flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
                  <Ico name="receipt" size={26} sw={1.6} className="text-primary" />
                </div>
              </div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا فواتير بعد</div>
              <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[340px] mx-auto">
                ابدئي تسجيل مبيعاتك — كل فاتورة بتبني صورة واضحة لأرباحك وزبائنك
              </div>
              <div className="mt-3 inline-block text-[10px] text-primary bg-primary-soft dark:bg-primary-soft/20 px-2.5 py-1 rounded-tj font-semibold">
                💡 استخدمي زر &quot;بيع جديد&quot; أعلى الصفحة
              </div>
              <div className="mt-4">
                <Link
                  href="/desktop/sales/new"
                  className="inline-block px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
                >
                  + فاتورة جديدة
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Ico name="receipt" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
              <div className="text-[13px] text-muted dark:text-muted-dark">لا فواتير مطابقة</div>
            </div>
          )
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("no")}
                    className="inline-flex items-center gap-1 hover:text-text dark:hover:text-text-dark transition-colors"
                  >
                    #
                    {sort.col === "no" && <span className="tj-num">{sort.dir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("customer")}
                    className="inline-flex items-center gap-1 hover:text-text dark:hover:text-text-dark transition-colors"
                  >
                    الزبون
                    {sort.col === "customer" && <span className="tj-num">{sort.dir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المنتجات</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">طريقة الدفع</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("total")}
                    className="inline-flex items-center gap-1 hover:text-text dark:hover:text-text-dark transition-colors"
                  >
                    المجموع
                    {sort.col === "total" && <span className="tj-num">{sort.dir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المتبقي</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const c = state.customers.find((x) => x.id === inv.customerId);
                const debt = inv.total - inv.paid;
                const isPaid = debt <= 0;
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark transition-colors"
                  >
                    <td className={`px-4 ${rowPadY}`}>
                      <Link
                        href={`/desktop/invoices/${inv.id}`}
                        className="text-[12px] font-bold text-primary hover:underline"
                      >
                        #{inv.no}
                      </Link>
                    </td>
                    <td className={`px-4 ${rowPadY}`}>
                      <div className="flex items-center gap-2">
                        <Avatar name={c?.name} initial={c?.initial} size={28} bg={c?.avatar_color || undefined} />
                        <span className="text-[12px] font-semibold text-text dark:text-text-dark">{c?.name || "—"}</span>
                      </div>
                    </td>
                    <td className={`px-4 ${rowPadY} text-[11px] text-muted dark:text-muted-dark`}>
                      <Num size={11} className="text-muted dark:text-muted-dark" weight={600}>{inv.items.length}</Num> منتج
                    </td>
                    <td className={`px-4 ${rowPadY} text-[11px] text-text dark:text-text-dark`}>{inv.method}</td>
                    <td className={`px-4 ${rowPadY} text-end tj-num text-[12px] font-bold text-text dark:text-text-dark`}>
                      {inv.total.toLocaleString()} ₪
                    </td>
                    <td className={`px-4 ${rowPadY} text-end tj-num text-[12px] text-warning dark:text-warning-dark font-bold`}>
                      {debt > 0 ? `${debt.toLocaleString()} ₪` : "—"}
                    </td>
                    <td className={`px-4 ${rowPadY} text-end`}>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-tj ${
                        isPaid
                          ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                          : "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                      }`}>
                        {isPaid ? "مدفوع" : "معلّق"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-center text-[11px] text-muted dark:text-muted-dark mt-4">
        اضغطي على رقم الفاتورة لعرض التفاصيل (نسخة الموبايل)
      </div>

      <div className="h-6" />
    </div>
  );
}

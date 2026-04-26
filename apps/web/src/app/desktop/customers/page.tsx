"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store-context";
import { exportCsv } from "@/lib/csv-export";
import { computeRfmScores, tierLabel, tierStyle } from "@/lib/rfm";
import { BulkWhatsAppModal } from "@/components/ui/bulk-whatsapp-modal";
import { CustomerQuickView } from "@/components/ui/customer-quick-view";

type TagFilter = "all" | "VIP" | "عادية" | "جديدة";
type SortCol = "name" | "totalSpent" | "debt";
type SortState = { col: SortCol | null; dir: "asc" | "desc" };

export default function DesktopCustomers() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [bulkWhatsOpen, setBulkWhatsOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const rfm = useMemo(() => computeRfmScores(state.customers, state.invoices), [state.customers, state.invoices]);
  const debtorCount = state.customers.filter((c) => c.debt > 0 && (c.whatsapp || c.phone)).length;
  const [tagF, setTagF] = useState<TagFilter>("all");
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
    const filtered = state.customers.filter((c) => {
      if (query && !c.name.includes(query) && !(c.phone || "").includes(query)) return false;
      if (tagF !== "all" && c.tag !== tagF) return false;
      return true;
    });
    if (!sort.col) return filtered;
    const col = sort.col;
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (col === "name") return a.name.localeCompare(b.name, "ar") * mul;
      const av = (a[col] as number) || 0;
      const bv = (b[col] as number) || 0;
      return (av - bv) * mul;
    });
  }, [state.customers, q, tagF, sort]);

  const rowPadY = density === "compact" ? "py-1.5" : "py-3";

  const totals = useMemo(() => {
    const totalSpent = rows.reduce((s, c) => s + c.totalSpent, 0);
    const totalDebt = rows.reduce((s, c) => s + c.debt, 0);
    const vip = rows.filter((c) => c.tag === "VIP").length;
    return { totalSpent, totalDebt, vip, count: rows.length };
  }, [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">المبيعات</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">الزبائن</h1>
        </div>
        <div className="flex items-center gap-2">
          {debtorCount > 0 && (
            <button
              onClick={() => setBulkWhatsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-tj text-[12px] font-bold text-white hover:opacity-90"
              style={{ background: "#25D366" }}
            >
              <Ico name="whatsapp" size={13} sw={1.8} />
              تذكير {debtorCount} مدين
            </button>
          )}
          <button
            onClick={() => exportCsv(
              `customers-${new Date().toISOString().slice(0, 10)}`,
              rows,
              [
                { header: "الاسم", get: (c) => c.name },
                { header: "الهاتف", get: (c) => c.phone },
                { header: "التصنيف", get: (c) => c.tag },
                { header: "عدد الفواتير", get: (c) => c.invoices },
                { header: "إجمالي المشتريات", get: (c) => c.totalSpent },
                { header: "الدين", get: (c) => c.debt },
                { header: "آخر زيارة", get: (c) => c.lastVisit || "" },
                { header: "العنوان", get: (c) => c.address || "" },
                { header: "واتساب", get: (c) => c.whatsapp || "" },
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
            href="/desktop/customers/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90 transition-opacity"
          >
            <Ico name="plus" size={16} sw={2.4} />
            زبونة جديدة
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <KpiCard label="إجمالي الزبائن" value={<Num size={22} className="text-text dark:text-text-dark" weight={700}>{totals.count}</Num>} />
        <KpiCard label="VIP" value={<Num size={22} className="text-primary" weight={700}>{totals.vip}</Num>} />
        <KpiCard label="إجمالي المبيعات" value={<Shekel amt={totals.totalSpent} size={22} className="text-success dark:text-success-dark" weight={700} />} />
        <KpiCard label="ديون غير محصّلة" value={<Shekel amt={totals.totalDebt} size={22} className="text-warning dark:text-warning-dark" weight={700} />} />
      </div>

      {/* Filters */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
            <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالاسم أو رقم الهاتف..."
              className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar"
              dir="rtl"
            />
          </div>
          <select
            value={tagF}
            onChange={(e) => setTagF(e.target.value as TagFilter)}
            className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar"
          >
            <option value="all">كل التصنيفات</option>
            <option value="VIP">VIP</option>
            <option value="عادية">عادية</option>
            <option value="جديدة">جديدة</option>
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
          state.customers.length === 0 ? (
            <div className="py-14 text-center px-8">
              <div className="mb-3 flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
                  <Ico name="users" size={26} sw={1.6} className="text-primary" />
                </div>
              </div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا زبائن بعد</div>
              <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[340px] mx-auto">
                سجّلي زبائنك الثابتين — وبنتبّع لكِ مبيعاتهم وذممهم المعلّقة تلقائياً
              </div>
              <div className="mt-4">
                <Link
                  href="/desktop/customers/new"
                  className="inline-block px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
                >
                  + زبونة جديدة
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Ico name="users" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
              <div className="text-[13px] text-muted dark:text-muted-dark">لا زبائن مطابقين</div>
            </div>
          )
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1 hover:text-text dark:hover:text-text-dark transition-colors"
                  >
                    الاسم
                    {sort.col === "name" && <span className="tj-num">{sort.dir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التصنيف</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الهاتف</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">فواتير</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("totalSpent")}
                    className="inline-flex items-center gap-1 hover:text-text dark:hover:text-text-dark transition-colors"
                  >
                    إجمالي المبيعات
                    {sort.col === "totalSpent" && <span className="tj-num">{sort.dir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort("debt")}
                    className="inline-flex items-center gap-1 hover:text-text dark:hover:text-text-dark transition-colors"
                  >
                    دَين
                    {sort.col === "debt" && <span className="tj-num">{sort.dir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark transition-colors"
                >
                  <td className={`px-4 ${rowPadY}`}>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setQuickViewId(c.id);
                        }}
                        aria-label={`نظرة سريعة على ${c.name}`}
                        title="نظرة سريعة"
                        className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 hover:opacity-80 transition-opacity"
                      >
                        <Avatar name={c.name} initial={c.initial} size={32} bg={c.avatar_color || undefined} />
                      </button>
                      <Link
                        href={`/desktop/customers/${c.id}`}
                        className="text-[12px] font-bold text-text dark:text-text-dark hover:text-primary"
                      >
                        {c.name}
                      </Link>
                    </div>
                  </td>
                  <td className={`px-4 ${rowPadY}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-tj ${
                        c.tag === "VIP"
                          ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                          : c.tag === "جديدة"
                          ? "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
                          : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
                      }`}>
                        {c.tag}
                      </span>
                      {(() => {
                        const score = rfm.get(c.id);
                        if (!score || score.tier === "dormant") return null;
                        const style = tierStyle(score.tier);
                        return (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-1 rounded-tj ${style.bg} ${style.text}`}
                            title={`RFM: ${score.r}-${score.f}-${score.m} · ${tierLabel(score.tier)}`}
                          >
                            {style.emoji} {tierLabel(score.tier)}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className={`px-4 ${rowPadY} text-[11px] tj-num text-text dark:text-text-dark`} dir="ltr">{c.phone || "—"}</td>
                  <td className={`px-4 ${rowPadY} text-end`}>
                    <Num size={12} className="text-text dark:text-text-dark" weight={600}>{c.invoices}</Num>
                  </td>
                  <td className={`px-4 ${rowPadY} text-end tj-num text-[12px] font-bold text-text dark:text-text-dark`}>
                    {c.totalSpent.toLocaleString()} ₪
                  </td>
                  <td className={`px-4 ${rowPadY} text-end`}>
                    {c.debt > 0 ? (
                      <span className="text-[12px] font-bold text-warning dark:text-warning-dark tj-num">
                        {c.debt.toLocaleString()} ₪
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted dark:text-muted-dark">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="h-6" />

      <BulkWhatsAppModal open={bulkWhatsOpen} onClose={() => setBulkWhatsOpen(false)} />
      <CustomerQuickView
        customerId={quickViewId}
        open={!!quickViewId}
        onClose={() => setQuickViewId(null)}
      />
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
      <div className="text-[11px] text-muted dark:text-muted-dark mb-1">{label}</div>
      {value}
    </div>
  );
}

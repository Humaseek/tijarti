"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { exportCsv } from "@/lib/csv-export";
import { HubTabs } from "@/components/shell/hub-tabs";

type StockFilter = "all" | "low" | "available" | "inactive";

export default function DesktopProducts() {
  const { state, calculateMargin, getProductStats } = useStore();
  const [q, setQ] = useState("");
  const [categoryF, setCategoryF] = useState<string>("all");
  const [stockF, setStockF] = useState<StockFilter>("all");
  const [view, setView] = useState<"table" | "gallery">("table");

  const categories = useMemo(() => {
    const set = new Set(state.products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [state.products]);

  const rows = useMemo(() => {
    const query = q.trim();
    return state.products.filter((p) => {
      if (query && !p.name.includes(query) && !p.sku.includes(query)) return false;
      if (categoryF !== "all" && p.category !== categoryF) return false;
      const low = p.stock < (p.low_stock_threshold || 5);
      if (stockF === "low" && !low) return false;
      if (stockF === "available" && low) return false;
      if (stockF === "inactive" && p.is_active !== false) return false;
      if (stockF !== "inactive" && p.is_active === false) return false;
      return true;
    });
  }, [state.products, q, categoryF, stockF]);

  const totals = useMemo(() => {
    const active = rows.filter((p) => p.is_active !== false).length;
    const low = rows.filter((p) => p.stock < (p.low_stock_threshold || 5)).length;
    const inventoryValue = rows.reduce((s, p) => s + p.stock * p.cost, 0);
    return { active, low, inventoryValue, count: rows.length };
  }, [rows]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">المخزون</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">المنتجات</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(
              `products-${new Date().toISOString().slice(0, 10)}`,
              rows,
              [
                { header: "الاسم", get: (p) => p.name },
                { header: "SKU", get: (p) => p.sku },
                { header: "الباركود", get: (p) => p.barcode || "" },
                { header: "التصنيف", get: (p) => p.category },
                { header: "السعر", get: (p) => p.price },
                { header: "التكلفة", get: (p) => p.cost },
                { header: "المخزون", get: (p) => p.stock },
                { header: "نشط", get: (p) => (p.is_active === false ? "no" : "yes") },
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
            href="/desktop/products/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90"
          >
            <Ico name="plus" size={16} sw={2.4} />
            منتج جديد
          </Link>
        </div>
      </div>

      <HubTabs hub="products" />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <Kpi label="إجمالي" value={<Num size={22} className="text-text dark:text-text-dark" weight={700}>{totals.count}</Num>} />
        <Kpi label="نشطة" value={<Num size={22} className="text-success dark:text-success-dark" weight={700}>{totals.active}</Num>} />
        <Kpi label="مخزون منخفض" value={<Num size={22} className="text-warning dark:text-warning-dark" weight={700}>{totals.low}</Num>} tone="warn" />
        <Kpi label="قيمة المخزون (تكلفة)" value={<Shekel amt={totals.inventoryValue} size={22} className="text-text dark:text-text-dark" weight={700} />} />
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
            <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="اسم المنتج أو SKU..."
              className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar"
              dir="rtl"
            />
          </div>
          <select
            value={categoryF}
            onChange={(e) => setCategoryF(e.target.value)}
            className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar"
          >
            <option value="all">كل التصنيفات</option>
            {categories.filter((c) => c !== "all").map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={stockF}
            onChange={(e) => setStockF(e.target.value as StockFilter)}
            className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar"
          >
            <option value="all">كل المخزون</option>
            <option value="low">منخفض</option>
            <option value="available">متوفر</option>
            <option value="inactive">موقوف</option>
          </select>
          <div className="flex items-center gap-1 p-1 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
            <button
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              title="عرض جدول"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-tj text-[11px] font-bold transition-colors ${
                view === "table"
                  ? "bg-surface dark:bg-surface-dark text-text dark:text-text-dark shadow-sm"
                  : "text-muted dark:text-muted-dark hover:text-text dark:hover:text-text-dark"
              }`}
            >
              <Ico name="home" size={12} sw={1.8} />
              جدول
            </button>
            <button
              onClick={() => setView("gallery")}
              aria-pressed={view === "gallery"}
              title="عرض شبكة"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-tj text-[11px] font-bold transition-colors ${
                view === "gallery"
                  ? "bg-surface dark:bg-surface-dark text-text dark:text-text-dark shadow-sm"
                  : "text-muted dark:text-muted-dark hover:text-text dark:hover:text-text-dark"
              }`}
            >
              <Ico name="box" size={12} sw={1.8} />
              شبكة
            </button>
          </div>
        </div>
      </div>

      {view === "gallery" && rows.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map((p) => {
            const low = p.stock < (p.low_stock_threshold || 5);
            const inactive = p.is_active === false;
            const letter = p.name.charAt(0) || "?";
            return (
              <Link
                key={p.id}
                href={`/desktop/products/${p.id}`}
                className={`group bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden hover:border-primary transition-colors ${
                  inactive ? "opacity-60" : ""
                }`}
              >
                <div className="aspect-square bg-surface2 dark:bg-surface2-dark flex items-center justify-center relative">
                  <span className="text-[48px] font-bold text-muted/50 dark:text-muted-dark/50 font-ar">
                    {letter}
                  </span>
                  {low && (
                    <span className="absolute top-2 end-2 text-[9px] font-bold px-2 py-0.5 rounded-tj bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark">
                      منخفض
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-muted dark:text-muted-dark mb-1 truncate">{p.category}</div>
                  <div className="text-[13px] font-bold text-text dark:text-text-dark mb-1.5 truncate group-hover:text-primary transition-colors">
                    {p.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-primary tj-num">
                      {p.price.toLocaleString()} ₪
                    </span>
                    <span className={`text-[11px] font-bold tj-num ${
                      low ? "text-warning dark:text-warning-dark" : "text-success dark:text-success-dark"
                    }`}>
                      {p.stock}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {rows.length === 0 ? (
          state.products.length === 0 ? (
            <div className="py-14 text-center px-8">
              <div className="mb-3 flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
                  <Ico name="box" size={26} sw={1.6} className="text-primary" />
                </div>
              </div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا منتجات بعد</div>
              <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[340px] mx-auto">
                المنتجات هي قلب محلك — سجّليها مع سعرها وتكلفتها عشان نحسب لك الربح تلقائياً
              </div>
              <div className="mt-3 inline-block text-[10px] text-primary bg-primary-soft dark:bg-primary-soft/20 px-2.5 py-1 rounded-tj font-semibold">
                💡 بتقدري تستوردي قائمة منتجات من Excel لاحقاً
              </div>
              <div className="mt-4">
                <Link
                  href="/desktop/products/new"
                  className="inline-block px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
                >
                  + منتج جديد
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Ico name="box" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
              <div className="text-[13px] text-muted dark:text-muted-dark">لا منتجات مطابقة</div>
            </div>
          )
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">SKU</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاسم</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التصنيف</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">السعر</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التكلفة</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الهامش</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المخزون</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">مبيع</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const margin = calculateMargin(p.price, p.cost);
                const stats = getProductStats(p.id);
                const low = p.stock < (p.low_stock_threshold || 5);
                const inactive = p.is_active === false;
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark transition-colors ${
                      inactive ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-[11px] tj-num text-muted dark:text-muted-dark">{p.sku}</td>
                    <td className="px-4 py-3">
                      <Link href={`/desktop/products/${p.id}`} className="text-[12px] font-bold text-text dark:text-text-dark hover:text-primary">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{p.category}</td>
                    <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-text dark:text-text-dark">{p.price.toLocaleString()} ₪</td>
                    <td className="px-4 py-3 text-end tj-num text-[11px] text-muted dark:text-muted-dark">{p.cost.toLocaleString()} ₪</td>
                    <td className="px-4 py-3 text-end">
                      <span className={`text-[11px] font-bold tj-num ${
                        margin >= 40 ? "text-success dark:text-success-dark"
                        : margin >= 20 ? "text-warning dark:text-warning-dark"
                        : "text-danger dark:text-danger-dark"
                      }`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <span className={`text-[11px] font-bold tj-num ${low ? "text-warning dark:text-warning-dark" : "text-text dark:text-text-dark"}`}>
                        {p.stock}
                      </span>
                      {low && <span className="text-[9px] text-warning dark:text-warning-dark ms-1">منخفض</span>}
                    </td>
                    <td className="px-4 py-3 text-end tj-num text-[11px] text-muted dark:text-muted-dark">
                      {stats.soldQty}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      )}
      <div className="h-6" />
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" }) {
  return (
    <div className={`bg-surface dark:bg-surface-dark rounded-tj border p-4 ${
      tone === "warn" ? "border-warning dark:border-warning-dark" : "border-divider dark:border-divider-dark"
    }`}>
      <div className="text-[11px] text-muted dark:text-muted-dark mb-1">{label}</div>
      {value}
    </div>
  );
}

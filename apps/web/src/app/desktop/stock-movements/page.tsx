"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { HubTabs } from "@/components/shell/hub-tabs";
import { Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { exportCsv } from "@/lib/csv-export";

/**
 * Stock Movements — derived log of every stock change.
 *
 * Sources:
 *  - Invoice line items (sale → negative movement)
 *  - (future) Manual adjustments via this page
 *
 * Expenses don't carry a "product_id" so we can't derive purchases here.
 */

type MovementType = "sale" | "adjustment";
type MovementDirection = "in" | "out";

interface Movement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  qty: number;           // always positive; `direction` tells signed
  direction: MovementDirection;
  type: MovementType;
  ref: string;           // e.g. "فاتورة #1234"
  refHref?: string;
  reason?: string;       // for manual adjustments
}

export default function StockMovementsPage() {
  const { state } = useStore();
  const [filterProd, setFilterProd] = useState<string>("");
  const [filterType, setFilterType] = useState<MovementType | "all">("all");

  const movements = useMemo<Movement[]>(() => {
    const list: Movement[] = [];
    for (const inv of state.invoices) {
      for (const it of inv.items) {
        const p = state.products.find((x) => x.id === it.pid);
        list.push({
          id: `inv-${inv.id}-${it.pid}`,
          date: inv.date,
          productId: it.pid,
          productName: p?.name || "منتج محذوف",
          qty: it.qty,
          direction: "out",
          type: "sale",
          ref: `فاتورة #${inv.no}`,
          refHref: `/desktop/invoices/${inv.id}`,
        });
      }
    }

    // Add manual adjustments from localStorage
    try {
      const raw = localStorage.getItem("tj_stock_adjustments_v1");
      if (raw) {
        const adj = JSON.parse(raw) as Array<{
          id: string; date: string; productId: string; qty: number; direction: MovementDirection; reason: string;
        }>;
        for (const a of adj) {
          const p = state.products.find((x) => x.id === a.productId);
          list.push({
            id: a.id,
            date: a.date,
            productId: a.productId,
            productName: p?.name || "منتج محذوف",
            qty: a.qty,
            direction: a.direction,
            type: "adjustment",
            ref: "تعديل يدوي",
            reason: a.reason,
          });
        }
      }
    } catch { /* ignore */ }

    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [state.invoices, state.products]);

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      if (filterProd && m.productId !== filterProd) return false;
      if (filterType !== "all" && m.type !== filterType) return false;
      return true;
    });
  }, [movements, filterProd, filterType]);

  const summary = useMemo(() => {
    const totalOut = filtered.filter((m) => m.direction === "out").reduce((s, m) => s + m.qty, 0);
    const totalIn = filtered.filter((m) => m.direction === "in").reduce((s, m) => s + m.qty, 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filtered]);

  return (
    <DesktopPage
      breadcrumb="المخزون"
      title="سجل حركة المخزون"
      subtitle="كل حركة مخزون — بيع + تعديلات يدوية"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const r = prompt("كود المنتج:");
              if (!r) return;
              const qtyS = prompt("الكمية (موجب = إضافة، سالب = خصم):");
              if (!qtyS) return;
              const qty = parseInt(qtyS, 10);
              if (isNaN(qty) || qty === 0) return;
              const reason = prompt("السبب (مثلاً: جرد، كسر، هدية):") || "—";
              const adj = {
                id: `adj_${Date.now()}`,
                date: new Date().toISOString().slice(0, 10),
                productId: r,
                qty: Math.abs(qty),
                direction: qty > 0 ? "in" : "out",
                reason,
              };
              try {
                const raw = localStorage.getItem("tj_stock_adjustments_v1") || "[]";
                const list = JSON.parse(raw);
                localStorage.setItem("tj_stock_adjustments_v1", JSON.stringify([adj, ...list]));
                window.location.reload();
              } catch { /* ignore */ }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark"
          >
            <Ico name="plus" size={13} sw={2.4} />
            تعديل يدوي
          </button>
          <button
            onClick={() => exportCsv(
              `stock-movements-${new Date().toISOString().slice(0, 10)}`,
              filtered,
              [
                { header: "التاريخ", get: (m) => m.date },
                { header: "المنتج", get: (m) => m.productName },
                { header: "الاتجاه", get: (m) => m.direction === "in" ? "إضافة" : "خصم" },
                { header: "الكمية", get: (m) => m.qty },
                { header: "النوع", get: (m) => m.type === "sale" ? "بيع" : "تعديل يدوي" },
                { header: "المرجع", get: (m) => m.ref },
                { header: "السبب", get: (m) => m.reason || "" },
              ]
            )}
            className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark"
          >
            <Ico name="download" size={13} sw={1.8} />
            تصدير
          </button>
        </div>
      }
    >
      <HubTabs hub="products" />
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="إجمالي الحركات" value={filtered.length} />
        <StatCard label="خارج (بيع)" value={summary.totalOut} cls="text-danger dark:text-danger-dark" />
        <StatCard label="داخل (إضافة)" value={summary.totalIn} cls="text-success dark:text-success-dark" />
        <StatCard
          label="الصافي"
          value={Math.abs(summary.net)}
          cls={summary.net >= 0 ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}
          prefix={summary.net >= 0 ? "+" : "-"}
        />
      </div>

      {/* Filters */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 mb-4 flex gap-3 flex-wrap">
        <select
          value={filterProd}
          onChange={(e) => setFilterProd(e.target.value)}
          className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar min-w-[200px]"
        >
          <option value="">كل المنتجات</option>
          {state.products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj text-[12px] text-text dark:text-text-dark font-ar"
        >
          <option value="all">كل الأنواع</option>
          <option value="sale">بيع فقط</option>
          <option value="adjustment">تعديلات يدوية</option>
        </select>
        {(filterProd || filterType !== "all") && (
          <button
            onClick={() => { setFilterProd(""); setFilterType("all"); }}
            className="px-3 py-2 text-[11px] text-primary font-bold hover:underline"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Ico name="box" size={32} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.4} />
            <div className="text-[13px] text-muted dark:text-muted-dark">لا حركات مخزون</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التاريخ</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المنتج</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">النوع</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الكمية</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المرجع</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((m) => (
                <tr key={m.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark">
                  <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{m.date}</td>
                  <td className="px-4 py-3">
                    <Link href={`/desktop/products/${m.productId}`} className="text-[12px] font-semibold text-text dark:text-text-dark hover:text-primary">
                      {m.productName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${
                      m.type === "sale" ? "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark" : "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                    }`}>
                      {m.type === "sale" ? "بيع" : "تعديل"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <span className={`text-[13px] font-bold tj-num ${m.direction === "in" ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}`}>
                      {m.direction === "in" ? "+" : "−"}{m.qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">
                    {m.refHref ? (
                      <Link href={m.refHref} className="hover:text-primary">{m.ref}</Link>
                    ) : (
                      <>{m.ref}{m.reason && ` · ${m.reason}`}</>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 200 && (
          <div className="px-4 py-3 text-center text-[10px] text-muted dark:text-muted-dark border-t border-divider dark:border-divider-dark">
            عرض أول 200 حركة من {filtered.length}
          </div>
        )}
      </div>
    </DesktopPage>
  );
}

function StatCard({ label, value, cls, prefix }: { label: string; value: number; cls?: string; prefix?: string }) {
  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
      <div className="text-[11px] text-muted dark:text-muted-dark mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        {prefix && <span className={`text-[14px] font-bold ${cls}`}>{prefix}</span>}
        <Num size={22} className={cls || "text-text dark:text-text-dark"} weight={700}>{value}</Num>
      </div>
    </div>
  );
}

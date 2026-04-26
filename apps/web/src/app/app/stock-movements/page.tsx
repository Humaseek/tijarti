"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

type MovementType = "sale" | "adjustment";
type MovementDirection = "in" | "out";

interface Movement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  qty: number;
  direction: MovementDirection;
  type: MovementType;
  ref: string;
  refHref?: string;
  reason?: string;
}

export default function MobileStockMovements() {
  const { state } = useStore();
  const [filterProd, setFilterProd] = useState<string>("");

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
          refHref: `/app/invoices/${inv.id}`,
        });
      }
    }

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
    return movements.filter((m) => !filterProd || m.productId === filterProd);
  }, [movements, filterProd]);

  const summary = useMemo(() => {
    const totalOut = filtered.filter((m) => m.direction === "out").reduce((s, m) => s + m.qty, 0);
    const totalIn = filtered.filter((m) => m.direction === "in").reduce((s, m) => s + m.qty, 0);
    return { totalIn, totalOut, net: totalIn - totalOut, count: filtered.length };
  }, [filtered]);

  return (
    <Screen>
      <TopBar title="سجل المخزون" noBack />

      <div className="px-4 pb-3">
        {/* 2x2 stats grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <Card className="p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark mb-1">إجمالي الحركات</div>
            <Num size={20} className="text-text dark:text-text-dark" weight={700}>{summary.count}</Num>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark mb-1">خارج (بيع)</div>
            <Num size={20} className="text-danger dark:text-danger-dark" weight={700}>{summary.totalOut}</Num>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark mb-1">داخل (إضافة)</div>
            <Num size={20} className="text-success dark:text-success-dark" weight={700}>{summary.totalIn}</Num>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark mb-1">الصافي</div>
            <Row className="gap-0.5">
              <span className={`text-[14px] font-bold ${summary.net >= 0 ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}`}>
                {summary.net >= 0 ? "+" : "−"}
              </span>
              <Num size={20} className={summary.net >= 0 ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"} weight={700}>
                {Math.abs(summary.net)}
              </Num>
            </Row>
          </Card>
        </div>

        {/* Product filter */}
        <Card className="p-2.5 mb-3">
          <select
            value={filterProd}
            onChange={(e) => setFilterProd(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar"
            dir="rtl"
          >
            <option value="">كل المنتجات</option>
            {state.products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Card>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <Empty
            icon="box"
            title="لا حركات مخزون"
            sub="حركات المخزون بتظهر هنا لما تبيعي منتجات أو تعدّلي يدوياً"
          />
        ) : (
          <Card>
            {filtered.slice(0, 200).map((m, i, arr) => (
              <div
                key={m.id}
                className={`px-3 py-2.5 ${i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
              >
                <Row className="gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.direction === "in"
                        ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                        : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
                    }`}
                  >
                    <span className="text-[14px] font-bold">{m.direction === "in" ? "↑" : "↓"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/app/products/${m.productId}`}
                      className="text-[12px] font-semibold text-text dark:text-text-dark truncate block"
                    >
                      {m.productName}
                    </Link>
                    <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                      {m.refHref ? (
                        <Link href={m.refHref} className="hover:text-primary">{m.ref}</Link>
                      ) : (
                        <>{m.ref}{m.reason && ` · ${m.reason}`}</>
                      )}
                      <span className="mx-1">·</span>
                      <span className="tj-num">{m.date}</span>
                    </div>
                  </div>
                  <div className={`text-[14px] font-bold tj-num flex-shrink-0 ${
                    m.direction === "in" ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"
                  }`}>
                    {m.direction === "in" ? "+" : "−"}{m.qty}
                  </div>
                </Row>
              </div>
            ))}
            {filtered.length > 200 && (
              <div className="px-3 py-2 text-center text-[10px] text-muted dark:text-muted-dark border-t border-divider dark:border-divider-dark">
                عرض أول 200 حركة من <Num size={10} weight={700}>{filtered.length}</Num>
              </div>
            )}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

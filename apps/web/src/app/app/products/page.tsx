"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

export default function ProductsList() {
  const router = useRouter();
  const { state } = useStore();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const query = q.trim();
    return state.products.filter(
      (p) => !query || p.name.includes(query) || p.sku.includes(query)
    );
  }, [state.products, q]);

  return (
    <Screen>
      <TopBar
        title="المنتجات"
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => router.push("/app/products/new")}
            label="منتج جديد"
            className="text-primary"
          />
        }
      />

      <div className="px-4 pb-3">
        <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2.5 gap-2">
          <Ico name="search" size={16} className="text-muted dark:text-muted-dark" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحثي بالاسم أو SKU..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-text dark:text-text-dark font-ar"
            dir="rtl"
          />
        </Row>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {list.length === 0 ? (
          q.trim() ? (
            <Empty icon="box" title="لا منتج مطابق" sub="جرّبي كلمة ثانية" />
          ) : (
            <Empty
              icon="box"
              title="لا منتجات بعد"
              sub="المنتجات هي قلب محلك — سجّليها مع سعرها وتكلفتها عشان نحسب لك الربح تلقائياً"
              tip="بتقدري تستوردي قائمة منتجات من Excel لاحقاً"
              actions={[{ label: "+ منتج جديد", href: "/app/products/new", primary: true }]}
            />
          )
        ) : (
          <Card>
            {list.map((p, i, arr) => {
              const threshold = p.low_stock_threshold || 5;
              const lowStock = p.stock < threshold;
              const inactive = p.is_active === false;
              return (
                <Link
                  key={p.id}
                  href={`/app/products/${p.id}`}
                  className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${
                    i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  } ${inactive ? "opacity-55" : ""}`}
                >
                  <div className="w-10 h-10 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center flex-shrink-0">
                    <Ico name="tag" size={18} className="text-muted dark:text-muted-dark" sw={1.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Row className="gap-1.5">
                      <div className="text-[13px] font-semibold text-text dark:text-text-dark">{p.name}</div>
                      {inactive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-tj bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark">
                          مخفي
                        </span>
                      )}
                    </Row>
                    <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                      <Num size={11} className="text-muted dark:text-muted-dark" weight={500}>{p.sku}</Num>{" · "}{p.category}
                    </div>
                  </div>
                  <div className="text-end">
                    <Shekel amt={p.price} size={13} className="text-text dark:text-text-dark" weight={700} />
                    <div
                      className={`text-[10px] mt-0.5 ${
                        lowStock ? "text-warning dark:text-warning-dark font-bold" : "text-muted dark:text-muted-dark font-medium"
                      }`}
                    >
                      مخزون:{" "}
                      <Num
                        size={10}
                        className={
                          lowStock ? "text-warning dark:text-warning-dark" : "text-muted dark:text-muted-dark"
                        }
                        weight={lowStock ? 700 : 500}
                      >
                        {p.stock}
                      </Num>
                    </div>
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

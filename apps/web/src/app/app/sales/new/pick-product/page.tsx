"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Screen, Card, Row, Empty, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Btn } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

export default function PickProduct() {
  const router = useRouter();
  const { state, addDraftItem } = useStore();
  const { toast } = useToast();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const query = q.trim();
    return state.products.filter(
      (p) =>
        p.is_active !== false &&
        (!query || p.name.includes(query) || p.sku.includes(query))
    );
  }, [state.products, q]);

  const addedMap = useMemo(() => {
    const m = new Map<string, number>();
    if (!state.draft) return m;
    for (const it of state.draft.items) m.set(it.pid, it.qty);
    return m;
  }, [state.draft]);

  const add = (id: string, name: string) => {
    addDraftItem(id, 1);
    toast(`تمّت إضافة ${name}`, "success");
  };

  // After creating a product, come back to pick-product to continue shopping.
  const addHref = "/app/products/new?returnTo=pick";

  return (
    <Screen>
      <TopBar title="إضافة منتج" />

      <div className="px-4 pb-2">
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

      {/* Add-new CTA */}
      <div className="px-4 pb-2.5">
        <Link
          href={addHref}
          className="tj-btn flex items-center gap-3 px-3.5 py-3 rounded-tj border-2 border-dashed border-primary bg-primary-soft/50"
        >
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
            <Ico name="plus" size={18} sw={2.4} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-primary">إضافة منتج جديد</div>
            <div className="text-[10px] text-primary/80 mt-0.5">منتج ما موجود في المخزون</div>
          </div>
          <Ico name="chev" size={13} className="text-primary" style={{ transform: "scaleX(-1)" }} />
        </Link>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {list.length === 0 ? (
          q.trim() ? (
            <Empty icon="box" title="لا منتج مطابق" sub={`جرّبي كلمة ثانية أو أضيفي "${q.trim()}" كمنتج جديد`} />
          ) : (
            <Empty icon="box" title="لا منتجات بعد" sub="اضغطي الزر فوق لإضافة أول منتج" />
          )
        ) : (
          <Card>
            {list.map((p, i, arr) => {
              const threshold = p.low_stock_threshold || 5;
              const lowStock = p.stock < threshold;
              const addedQty = addedMap.get(p.id) || 0;
              return (
                <Row
                  key={p.id}
                  onClick={() => add(p.id, p.name)}
                  className={`px-3.5 py-3 gap-3 tj-tap ${
                    i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center flex-shrink-0">
                    <Ico name="tag" size={18} className="text-muted dark:text-muted-dark" sw={1.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text dark:text-text-dark">{p.name}</div>
                    <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                      <Num size={11} className="text-muted dark:text-muted-dark" weight={500}>{p.sku}</Num> · {p.category}
                    </div>
                  </div>
                  <div className="text-end">
                    <Shekel amt={p.price} size={13} className="text-text dark:text-text-dark" weight={700} />
                    <div
                      className={`text-[10px] mt-0.5 font-${lowStock ? "bold" : "medium"} ${
                        lowStock ? "text-warning dark:text-warning-dark" : "text-muted dark:text-muted-dark"
                      }`}
                    >
                      {lowStock ? "منخفض" : "متوفر"}: <Num size={10} className={lowStock ? "text-warning dark:text-warning-dark" : "text-muted dark:text-muted-dark"} weight={lowStock ? 700 : 500}>{p.stock}</Num>
                    </div>
                  </div>
                  {addedQty > 0 && (
                    <div className="w-7 h-7 rounded-full bg-success dark:bg-success-dark text-white flex items-center justify-center flex-shrink-0">
                      <Num size={11} className="text-white" weight={700}>{addedQty}</Num>
                    </div>
                  )}
                </Row>
              );
            })}
          </Card>
        )}
      </div>

      <BottomBar>
        <Btn primary fullWidth onClick={() => router.back()}>
          <Ico name="check" size={15} sw={2.4} />
          تم
        </Btn>
      </BottomBar>
    </Screen>
  );
}

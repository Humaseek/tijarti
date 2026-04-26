"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

export default function Page() {
  const router = useRouter();
  const { toast } = useToast();
  const { state, addDraftItem } = useStore();
  const [q, setQ] = useState("");

  const list = useMemo(() => state.products.filter((p) => p.is_active !== false && (!q.trim() || p.name.includes(q.trim()) || p.sku.includes(q.trim()))), [state.products, q]);

  const addedMap = useMemo(() => {
    const m = new Map<string, number>();
    if (!state.draft) return m;
    for (const it of state.draft.items) m.set(it.pid, it.qty);
    return m;
  }, [state.draft]);

  const add = (id: string, name: string) => { addDraftItem(id, 1); toast(`تمّت إضافة ${name}`, "success"); };

  return (
    <DesktopPage
      breadcrumb="فاتورة جديدة"
      backHref="/desktop/sales/new"
      title="إضافة منتج"
      actions={
        <button onClick={() => router.back()} className="flex items-center gap-1.5 px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">
          <Ico name="check" size={13} sw={2.4} /> تم
        </button>
      }
    >
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj">
          <Ico name="search" size={14} className="text-muted dark:text-muted-dark" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي بالاسم أو SKU..." className="flex-1 bg-transparent border-0 outline-none text-[12px] text-text dark:text-text-dark font-ar" dir="rtl" />
        </div>
      </div>

      <Link href="/desktop/products/new?returnTo=pick" className="block bg-primary-soft border-2 border-dashed border-primary rounded-tj p-4 mb-4 hover:opacity-90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
            <Ico name="plus" size={18} sw={2.4} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-primary">إضافة منتج جديد</div>
            <div className="text-[11px] text-primary/80 mt-0.5">منتج مش موجود في المخزون</div>
          </div>
          <Ico name="chev" size={14} className="text-primary" style={{ transform: "scaleX(-1)" }} />
        </div>
      </Link>

      {list.length === 0 ? (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">
          {q.trim() ? `لا منتج بـ "${q}"` : "لا منتجات بعد"}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {list.map((p) => {
            const threshold = p.low_stock_threshold || 5;
            const lowStock = p.stock < threshold;
            const addedQty = addedMap.get(p.id) || 0;
            return (
              <button key={p.id} onClick={() => add(p.id, p.name)} className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4 text-start hover:border-primary transition-colors relative">
                {addedQty > 0 && (
                  <div className="absolute top-3 end-3 w-7 h-7 rounded-full bg-success dark:bg-success-dark text-white flex items-center justify-center text-[11px] font-bold">
                    {addedQty}
                  </div>
                )}
                <div className="w-12 h-12 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center mb-3">
                  <Ico name="tag" size={20} className="text-muted dark:text-muted-dark" sw={1.4} />
                </div>
                <div className="text-[13px] font-bold text-text dark:text-text-dark mb-1 truncate">{p.name}</div>
                <div className="text-[10px] text-muted dark:text-muted-dark mb-2">{p.category}</div>
                <div className="flex items-center justify-between">
                  <Shekel amt={p.price} size={14} className="text-text dark:text-text-dark" weight={700} />
                  <div className={`text-[10px] font-${lowStock ? "bold" : "medium"} ${lowStock ? "text-warning dark:text-warning-dark" : "text-muted dark:text-muted-dark"}`}>
                    {lowStock ? "منخفض" : "متوفر"}: <Num size={10} className={lowStock ? "text-warning dark:text-warning-dark" : "text-muted dark:text-muted-dark"} weight={lowStock ? 700 : 500}>{p.stock}</Num>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </DesktopPage>
  );
}

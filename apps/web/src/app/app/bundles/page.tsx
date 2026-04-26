"use client";

import { useState, useMemo } from "react";
import { Screen, Card, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { IconButton } from "@/components/ui/controls";
import { Shekel } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { useBundles } from "@/lib/extensions-store";

export default function MobileBundlesPage() {
  const { state } = useStore();
  const { list, add, remove } = useBundles();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState<Array<{ pid: string; qty: number }>>([]);

  const totalCost = useMemo(() => items.reduce((s, it) => {
    const p = state.products.find((x) => x.id === it.pid); return s + (p ? p.cost * it.qty : 0);
  }, 0), [items, state.products]);

  const priceNum = Number(price) || 0;
  const valid = name.trim() && items.length > 0 && priceNum > totalCost;

  const submit = () => {
    if (!valid) { toast("السعر لازم يكون أكبر من التكلفة", "warn"); return; }
    add({
      id: `bdl_${Date.now()}`, name: name.trim(), price: priceNum, items, is_active: true, created_at: new Date().toISOString(),
    });
    setName(""); setPrice(""); setItems([]); setShowForm(false);
    toast("تمت الإضافة", "success");
  };

  return (
    <Screen>
      <TopBar title="الباقات" trailing={<IconButton name={showForm ? "close" : "plus"} size={22} onClick={() => setShowForm(!showForm)} label="جديدة" className="text-primary" />} />
      <div className="px-4 pb-6 space-y-3">
        {showForm && (
          <Card className="p-3 space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الباقة" className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] font-ar" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="سعر الباقة (₪)" className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] tj-num text-end" />

            <div className="border border-divider dark:border-divider-dark rounded-tj overflow-hidden">
              <div className="bg-bg dark:bg-bg-dark px-2 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-text dark:text-text-dark">المنتجات</span>
                <button onClick={() => setItems([...items, { pid: "", qty: 1 }])} className="text-[10px] text-primary font-bold">+ سطر</button>
              </div>
              <div className="p-2 space-y-1.5">
                {items.length === 0 ? (
                  <div className="text-center text-[10px] text-muted dark:text-muted-dark py-2">لا منتجات</div>
                ) : items.map((it, i) => (
                  <div key={i} className="flex gap-1">
                    <select value={it.pid} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], pid: e.target.value }; setItems(arr); }} className="flex-1 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-2 py-1.5 text-[11px] font-ar">
                      <option value="">-- منتج --</option>
                      {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" min={1} value={it.qty} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], qty: parseInt(e.target.value) || 1 }; setItems(arr); }} className="w-12 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-1 py-1.5 text-[11px] text-center tj-num" />
                    <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="w-7 text-danger flex items-center justify-center"><Ico name="close" size={11} sw={1.8} /></button>
                  </div>
                ))}
              </div>
            </div>

            {items.length > 0 && (
              <div className="text-[11px] text-muted dark:text-muted-dark">تكلفتك: <span className="tj-num">{totalCost.toLocaleString()} ₪</span></div>
            )}
            <button onClick={submit} disabled={!valid} className="w-full py-2 rounded-tj bg-primary text-white text-[13px] font-bold disabled:opacity-40">حفظ</button>
          </Card>
        )}

        {list.length === 0 ? (
          <Empty icon="box" title="لا باقات بعد" sub="بيع مجموعة منتجات بسعر مخفّض = متوسّط فاتورة أعلى" />
        ) : (
          list.map((b) => {
            const cost = b.items.reduce((s, it) => { const p = state.products.find((x) => x.id === it.pid); return s + (p ? p.cost * it.qty : 0); }, 0);
            const marginPct = b.price > 0 ? Math.round(((b.price - cost) / b.price) * 100) : 0;
            return (
              <Card key={b.id} className="p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="text-[13px] font-bold text-text dark:text-text-dark">{b.name}</div>
                  <button onClick={() => { if (confirm("حذف؟")) remove(b.id); }} className="text-muted dark:text-muted-dark"><Ico name="trash" size={12} sw={1.6} /></button>
                </div>
                <div className="text-[10px] text-muted dark:text-muted-dark mb-2">{b.items.length} منتج · هامش {marginPct}%</div>
                <Shekel amt={b.price} size={18} weight={700} className="text-primary" />
              </Card>
            );
          })
        )}
      </div>
    </Screen>
  );
}

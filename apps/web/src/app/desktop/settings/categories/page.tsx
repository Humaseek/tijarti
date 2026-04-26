"use client";

import { useMemo, useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Num } from "@/components/ui/num";
import { Label, TextInput } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, PRODUCT_CATEGORIES } from "@/lib/store/types";
import { catMeta } from "@/lib/expenses";

type Tab = "expense" | "product";

export default function Page() {
  const { state } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("expense");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [customExpense, setCustomExpense] = useState<string[]>([]);
  const [customProduct, setCustomProduct] = useState<string[]>([]);

  const expenseUsage = useMemo(() => {
    const m = new Map<string, number>();
    for (const cat of EXPENSE_CATEGORIES) m.set(cat, 0);
    for (const e of state.expenses) m.set(e.category, (m.get(e.category) ?? 0) + 1);
    for (const r of state.recurringExpenses) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return m;
  }, [state.expenses, state.recurringExpenses]);

  const productUsage = useMemo(() => {
    const m = new Map<string, number>();
    for (const cat of PRODUCT_CATEGORIES) m.set(cat, 0);
    for (const p of state.products) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [state.products]);

  const list = tab === "expense"
    ? [...EXPENSE_CATEGORIES.map((c) => ({ name: c, count: expenseUsage.get(c) ?? 0, isCustom: false })), ...customExpense.map((c) => ({ name: c, count: 0, isCustom: true }))]
    : [...PRODUCT_CATEGORIES.map((c) => ({ name: c, count: productUsage.get(c) ?? 0, isCustom: false })), ...customProduct.map((c) => ({ name: c, count: 0, isCustom: true }))];

  const add = () => {
    const n = newName.trim(); if (!n) return;
    if (tab === "expense") setCustomExpense([n, ...customExpense]);
    else setCustomProduct([n, ...customProduct]);
    toast(`تم إضافة "${n}"`, "success");
    setNewName(""); setShowAdd(false);
  };

  return (
    <DesktopPage
      breadcrumb="الإعدادات"
      backHref="/desktop/settings"
      title="التصنيفات"
      actions={<button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"><Ico name="plus" size={13} sw={2.4} />تصنيف جديد</button>}
    >
      <div className="flex gap-1 mb-4 bg-surface dark:bg-surface-dark rounded-tj p-1 border border-divider dark:border-divider-dark w-fit">
        {(["expense", "product"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-tj text-[12px] font-bold transition-colors ${tab === t ? "bg-primary text-white" : "text-text dark:text-text-dark hover:bg-surface2 dark:hover:bg-surface2-dark"}`}>
            {t === "expense" ? "مصاريف" : "منتجات"}
          </button>
        ))}
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {list.map((item, i, arr) => {
          const meta = tab === "expense" ? catMeta(item.name as any) : null;
          return (
            <div key={item.name} className={`flex items-center gap-3 px-5 py-3 ${i < arr.length - 1 ? "border-b border-divider/50 dark:border-divider-dark/50" : ""}`}>
              <div className={`w-10 h-10 rounded-tj flex items-center justify-center ${meta?.soft ?? "bg-surface2 dark:bg-surface2-dark"}`}>
                <Ico name={(meta?.icon as any) ?? "tag"} size={16} className={meta?.tint ?? "text-muted dark:text-muted-dark"} sw={1.8} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-text dark:text-text-dark">{item.name}</div>
                <div className="text-[10px] text-muted dark:text-muted-dark"><Num size={10} className="text-muted dark:text-muted-dark" weight={500}>{item.count}</Num> {tab === "expense" ? "مصروف" : "منتج"}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${item.isCustom ? "bg-primary-soft text-primary" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"}`}>{item.isCustom ? "مخصّص" : "افتراضي"}</span>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAdd(false)} />
          <div className="fixed top-1/2 start-1/2 z-50 w-[420px] bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5" style={{ transform: "translate(50%, -50%)" }}>
            <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-4">تصنيف {tab === "expense" ? "مصروف" : "منتج"} جديد</h3>
            <Label required>اسم التصنيف</Label>
            <TextInput value={newName} onChange={setNewName} placeholder="مثال: تحسينات المحل" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark">إلغاء</button>
              <button onClick={add} disabled={!newName.trim()} className={`flex-1 py-2 rounded-tj text-[12px] font-bold ${newName.trim() ? "bg-primary text-white" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"}`}>إضافة</button>
            </div>
          </div>
        </>
      )}
    </DesktopPage>
  );
}

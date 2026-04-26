"use client";

import { useMemo, useState } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Num } from "@/components/ui/num";
import { Btn, IconButton } from "@/components/ui/controls";
import { Label, TextInput } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, PRODUCT_CATEGORIES } from "@/lib/store/types";
import { catMeta } from "@/lib/expenses";

type Tab = "expense" | "product";

export default function CategoriesManagement() {
  const { state } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("expense");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  // Session-local custom categories (per tab). Persisted properly when DB lands.
  const [customExpense, setCustomExpense] = useState<string[]>([]);
  const [customProduct, setCustomProduct] = useState<string[]>([]);

  // Usage stats
  const expenseUsage = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of EXPENSE_CATEGORIES) map.set(cat, 0);
    for (const e of state.expenses) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    for (const r of state.recurringExpenses) map.set(r.category, (map.get(r.category) ?? 0) + 1);
    return map;
  }, [state.expenses, state.recurringExpenses]);

  const productUsage = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of PRODUCT_CATEGORIES) map.set(cat, 0);
    for (const p of state.products) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [state.products]);

  const list = tab === "expense"
    ? [
        ...EXPENSE_CATEGORIES.map((c) => ({ name: c, count: expenseUsage.get(c) ?? 0, isCustom: false })),
        ...customExpense.map((c) => ({ name: c, count: 0, isCustom: true })),
      ]
    : [
        ...PRODUCT_CATEGORIES.map((c) => ({ name: c, count: productUsage.get(c) ?? 0, isCustom: false })),
        ...customProduct.map((c) => ({ name: c, count: 0, isCustom: true })),
      ];

  return (
    <Screen>
      <TopBar
        title="التصنيفات"
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => setShowAdd(true)}
            label="تصنيف جديد"
            className="text-primary"
          />
        }
      />

      {/* Tabs */}
      <div className="px-4 pb-2.5">
        <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-0.5">
          {(["expense", "product"] as Tab[]).map((t) => {
            const label = t === "expense" ? "مصاريف" : "منتجات";
            const active = tab === t;
            return (
              <div
                key={t}
                onClick={() => setTab(t)}
                role="tab"
                tabIndex={0}
                className={`tj-btn flex-1 py-1.5 text-center text-[12px] rounded-tj ${
                  active ? "bg-primary text-white dark:text-bg-dark font-bold" : "text-text dark:text-text-dark font-medium"
                }`}
              >
                {label}
              </div>
            );
          })}
        </Row>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        <Card>
          {list.map((item, i, arr) => {
            const meta = tab === "expense" ? catMeta(item.name as any) : null;
            return (
              <Row
                key={item.name}
                className={`px-3.5 py-3 gap-3 ${i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
              >
                <div className={`w-9 h-9 rounded-tj flex items-center justify-center ${meta?.soft ?? "bg-surface2 dark:bg-surface2-dark"}`}>
                  <Ico name={(meta?.icon as any) ?? "tag"} size={15} className={meta?.tint ?? "text-muted dark:text-muted-dark"} sw={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text dark:text-text-dark">{item.name}</div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                    <Num size={10} className="text-muted dark:text-muted-dark" weight={500}>{item.count}</Num>
                    {tab === "expense" ? " مصروف/مصروف ثابت" : " منتج"}
                  </div>
                </div>
                <div className="text-[10px] text-muted dark:text-muted-dark">{item.isCustom ? "مخصّص" : "افتراضي"}</div>
              </Row>
            );
          })}
        </Card>

        <Card className="p-3.5 mt-3 bg-info-soft/50 dark:bg-info-soft-dark/50">
          <Row className="gap-2 mb-1.5">
            <Ico name="info" size={14} className="text-info dark:text-info-dark" sw={1.8} />
            <div className="text-[11px] font-bold text-info dark:text-info-dark">التصنيفات المخصصة</div>
          </Row>
          <div className="text-[11px] text-text dark:text-text-dark leading-relaxed">
            بإمكانك إضافة تصنيفات خاصة فيكي ما موجودة فوق (مثل: "تحسينات المحل"). اضغطي + لإضافة تصنيف مخصّص.
          </div>
        </Card>

        <div className="h-4" />
      </div>

      {/* Add modal — placeholder that shows "coming soon" */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-x-4 bottom-4 top-auto z-50 max-w-[360px] mx-auto">
            <Card className="p-4">
              <div className="text-[14px] font-bold text-text dark:text-text-dark mb-3">
                تصنيف {tab === "expense" ? "مصروف" : "منتج"} جديد
              </div>
              <div className="mb-3">
                <Label required>اسم التصنيف</Label>
                <TextInput value={newName} onChange={setNewName} placeholder="مثال: تحسينات المحل" />
              </div>
              <Row className="gap-2">
                <Btn fullWidth onClick={() => setShowAdd(false)}>إلغاء</Btn>
                <Btn primary fullWidth disabled={!newName.trim()} onClick={() => {
                  const n = newName.trim();
                  if (tab === "expense") setCustomExpense([n, ...customExpense]);
                  else setCustomProduct([n, ...customProduct]);
                  toast(`تم إضافة "${n}"`, "success");
                  setNewName("");
                  setShowAdd(false);
                }}>
                  إضافة
                </Btn>
              </Row>
            </Card>
          </div>
        </>
      )}
    </Screen>
  );
}

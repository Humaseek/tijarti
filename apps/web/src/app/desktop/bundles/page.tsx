"use client";

import { useState, useMemo } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { HubTabs } from "@/components/shell/hub-tabs";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { useBundles, type ProductBundle } from "@/lib/extensions-store";

interface BundleDraft {
  name: string;
  description: string;
  price: string;
  items: Array<{ pid: string; qty: number }>;
}

const EMPTY_DRAFT: BundleDraft = { name: "", description: "", price: "", items: [] };

export default function DesktopBundlesPage() {
  const { state } = useStore();
  const { list, add, update, remove } = useBundles();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BundleDraft>(EMPTY_DRAFT);

  const totalCost = useMemo(() => draft.items.reduce((s, it) => {
    const p = state.products.find((x) => x.id === it.pid);
    return s + (p ? p.cost * it.qty : 0);
  }, 0), [draft.items, state.products]);

  const totalRetail = useMemo(() => draft.items.reduce((s, it) => {
    const p = state.products.find((x) => x.id === it.pid);
    return s + (p ? p.price * it.qty : 0);
  }, 0), [draft.items, state.products]);

  const priceNum = Number(draft.price) || 0;
  const validBundle = draft.name.trim() && draft.items.length > 0 && priceNum > totalCost;
  const savings = totalRetail - priceNum;

  const startEdit = (b: ProductBundle) => {
    setEditId(b.id);
    setDraft({ name: b.name, description: b.description || "", price: String(b.price), items: b.items });
    setShowForm(true);
  };
  const startNew = () => { setEditId(null); setDraft(EMPTY_DRAFT); setShowForm(true); };

  const submit = () => {
    if (!validBundle) {
      toast("تأكّدي: السعر لازم يكون أكبر من تكلفة الباقة", "warn");
      return;
    }
    if (editId) {
      update(editId, { name: draft.name.trim(), description: draft.description.trim() || undefined, price: priceNum, items: draft.items });
      toast("تم التحديث", "success");
    } else {
      add({
        id: `bdl_${Date.now()}`,
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        price: priceNum,
        items: draft.items,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      toast("تمت إضافة الباقة", "success");
    }
    setShowForm(false);
    setDraft(EMPTY_DRAFT);
    setEditId(null);
  };

  return (
    <DesktopPage
      breadcrumb="المخزون"
      title="الباقات (Bundles)"
      subtitle="بيع مجموعة منتجات بسعر أقل من مجموع أسعارها — يرفع متوسّط الفاتورة"
      actions={
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90">
          <Ico name="plus" size={16} sw={2.4} />
          باقة جديدة
        </button>
      }
    >
      <HubTabs hub="products" />
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Stat label="عدد الباقات" value={<Num size={22} weight={700} className="text-text dark:text-text-dark">{list.length}</Num>} />
        <Stat label="فعّالة" value={<Num size={22} weight={700} className="text-success dark:text-success-dark">{list.filter((b) => b.is_active).length}</Num>} />
        <Stat label="متوسّط السعر" value={<Shekel amt={list.length ? Math.round(list.reduce((s, b) => s + b.price, 0) / list.length) : 0} size={22} weight={700} className="text-primary" />} />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-4">{editId ? "تعديل باقة" : "باقة جديدة"}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-bold text-muted dark:text-muted-dark mb-1 block">اسم الباقة</label>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="مثلاً: عرض الإفطار" className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] font-ar" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted dark:text-muted-dark mb-1 block">سعر الباقة (₪)</label>
              <input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] tj-num text-end" />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[11px] font-bold text-muted dark:text-muted-dark mb-1 block">وصف (اختياري)</label>
            <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] font-ar" />
          </div>

          <div className="border border-divider dark:border-divider-dark rounded-tj overflow-hidden mb-3">
            <div className="bg-bg dark:bg-bg-dark px-3 py-2 flex items-center justify-between">
              <h4 className="text-[12px] font-bold text-text dark:text-text-dark">المنتجات</h4>
              <button onClick={() => setDraft({ ...draft, items: [...draft.items, { pid: "", qty: 1 }] })}
                className="text-[11px] text-primary font-bold">+ سطر</button>
            </div>
            {draft.items.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-muted dark:text-muted-dark">أضيفي منتج واحد على الأقل</div>
            ) : (
              <div className="p-2 space-y-2">
                {draft.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <select value={it.pid} onChange={(e) => {
                      const items = [...draft.items]; items[i] = { ...items[i], pid: e.target.value }; setDraft({ ...draft, items });
                    }} className="col-span-8 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-2 py-1.5 text-[11px] font-ar">
                      <option value="">-- اختاري منتج --</option>
                      {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" min={1} value={it.qty} onChange={(e) => {
                      const items = [...draft.items]; items[i] = { ...items[i], qty: parseInt(e.target.value) || 1 }; setDraft({ ...draft, items });
                    }} className="col-span-3 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-2 py-1.5 text-[11px] text-center tj-num" />
                    <button onClick={() => setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== i) })}
                      className="col-span-1 text-danger hover:bg-danger-soft/40 rounded-tj flex items-center justify-center">
                      <Ico name="close" size={10} sw={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation */}
          {draft.items.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3 text-[11px]">
              <div className="bg-bg dark:bg-bg-dark p-2 rounded-tj"><span className="text-muted dark:text-muted-dark">تكلفتك: </span><Shekel amt={totalCost} size={11} weight={700} className="text-text dark:text-text-dark" /></div>
              <div className="bg-bg dark:bg-bg-dark p-2 rounded-tj"><span className="text-muted dark:text-muted-dark">قيمة بالأسعار العادية: </span><Shekel amt={totalRetail} size={11} weight={700} className="text-text dark:text-text-dark" /></div>
              <div className={`p-2 rounded-tj ${savings > 0 ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"}`}>
                <span className="font-bold">توفير للزبون: {savings > 0 ? "+" : ""}{savings.toLocaleString()} ₪</span>
              </div>
            </div>
          )}

          {!validBundle && draft.items.length > 0 && priceNum > 0 && priceNum <= totalCost && (
            <div className="text-[11px] font-bold text-danger dark:text-danger-dark mb-3">⚠️ السعر ({priceNum} ₪) أقل من أو يساوي تكلفة الباقة ({totalCost} ₪) — راجعي السعر</div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setDraft(EMPTY_DRAFT); setEditId(null); }} className="px-4 py-2 rounded-tj border border-divider text-[12px] font-bold">إلغاء</button>
            <button onClick={submit} disabled={!validBundle} className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold disabled:opacity-40">حفظ</button>
          </div>
        </div>
      )}

      {/* List */}
      {list.length === 0 ? (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-14 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary-soft flex items-center justify-center">
            <Ico name="box" size={26} className="text-primary" sw={1.8} />
          </div>
          <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">لا باقات بعد</div>
          <div className="text-[11px] text-muted dark:text-muted-dark max-w-[300px] mx-auto">
            باقات منتجات بسعر أقل من مجموع الأسعار = ترفع متوسّط الفاتورة
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {list.map((b) => {
            const cost = b.items.reduce((s, it) => {
              const p = state.products.find((x) => x.id === it.pid);
              return s + (p ? p.cost * it.qty : 0);
            }, 0);
            const retail = b.items.reduce((s, it) => {
              const p = state.products.find((x) => x.id === it.pid);
              return s + (p ? p.price * it.qty : 0);
            }, 0);
            const marginPct = b.price > 0 ? ((b.price - cost) / b.price) * 100 : 0;
            return (
              <div key={b.id} className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-[14px] font-bold text-text dark:text-text-dark">{b.name}</h4>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(b)} className="w-7 h-7 rounded-tj hover:bg-primary/10 flex items-center justify-center text-primary" title="تعديل"><Ico name="edit" size={12} sw={1.8} /></button>
                    <button onClick={() => { if (confirm("حذف؟")) remove(b.id); }} className="w-7 h-7 rounded-tj hover:bg-danger-soft/40 flex items-center justify-center text-muted hover:text-danger" title="حذف"><Ico name="trash" size={12} sw={1.8} /></button>
                  </div>
                </div>
                {b.description && <p className="text-[11px] text-muted dark:text-muted-dark mb-2">{b.description}</p>}

                <div className="bg-bg dark:bg-bg-dark p-2 rounded-tj mb-2 max-h-32 overflow-auto">
                  {b.items.map((it, i) => {
                    const p = state.products.find((x) => x.id === it.pid);
                    return (
                      <div key={i} className="text-[11px] flex items-center justify-between py-0.5">
                        <span className="text-text dark:text-text-dark">{p?.name || "—"}</span>
                        <span className="text-muted dark:text-muted-dark tj-num">×{it.qty}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-end justify-between pt-2 border-t border-divider dark:border-divider-dark">
                  <div>
                    <div className="text-[10px] text-muted dark:text-muted-dark">سعر الباقة</div>
                    <Shekel amt={b.price} size={20} weight={700} className="text-primary" />
                    {retail > b.price && <div className="text-[10px] text-success dark:text-success-dark font-bold">يوفّر {(retail - b.price).toLocaleString()} ₪</div>}
                  </div>
                  <div className="text-end">
                    <div className="text-[10px] text-muted dark:text-muted-dark">هامش</div>
                    <div className="text-[14px] font-bold tj-num text-text dark:text-text-dark">{Math.round(marginPct)}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DesktopPage>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
      <div className="text-[11px] text-muted dark:text-muted-dark mb-1">{label}</div>
      <div>{value}</div>
    </div>
  );
}

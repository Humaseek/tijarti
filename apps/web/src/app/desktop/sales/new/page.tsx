"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const router = useRouter();
  const { state, findCustomer, findProduct, draftTotal, startDraft, clearDraft, updateDraftItemQty, removeDraftItem } = useStore();

  useEffect(() => { if (!state.draft) startDraft(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const draft = state.draft;
  const customer = draft?.customerId ? findCustomer(draft.customerId) : null;
  const total = draftTotal();
  const canContinue = !!customer && !!draft && draft.items.length > 0;

  const cancel = () => { clearDraft(); router.push("/desktop"); };

  return (
    <DesktopPage
      breadcrumb="المبيعات"
      backHref="/desktop/invoices"
      title="فاتورة جديدة"
      subtitle="اختاري زبونة ومنتجات لبدء البيع"
      actions={
        <>
          <button onClick={cancel} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={() => router.push("/desktop/sales/new/payment")} disabled={!canContinue} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canContinue ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>
            متابعة للدفع ←
          </button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-text dark:text-text-dark">الزبونة</h3>
              <button onClick={() => router.push("/desktop/sales/new/pick-customer")} className="text-[11px] text-primary font-bold hover:underline">
                {customer ? "تبديل" : "اختاري ←"}
              </button>
            </div>
            {customer ? (
              <div className="flex items-center gap-3 p-3 rounded-tj bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark">
                <Avatar name={customer.name} initial={customer.initial} size={40} bg={customer.avatar_color || undefined} />
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-text dark:text-text-dark">{customer.name}</div>
                  <div className="text-[11px] text-muted dark:text-muted-dark tj-num" dir="ltr">{customer.phone}</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 rounded-tj ${customer.tag === "VIP" ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"}`}>{customer.tag}</span>
              </div>
            ) : (
              <button onClick={() => router.push("/desktop/sales/new/pick-customer")} className="w-full p-4 rounded-tj border-2 border-dashed border-divider dark:border-divider-dark text-[12px] text-muted dark:text-muted-dark hover:border-primary hover:bg-primary-soft/30 transition-colors">
                اضغطي لاختيار زبونة أو إنشاء جديدة
              </button>
            )}
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-text dark:text-text-dark">المنتجات ({draft?.items.length || 0})</h3>
              <button onClick={() => router.push("/desktop/sales/new/pick-product")} className="flex items-center gap-1 px-3 py-1.5 rounded-tj bg-primary text-white text-[11px] font-bold hover:opacity-90">
                <Ico name="plus" size={12} sw={2.4} /> إضافة منتج
              </button>
            </div>
            {!draft || draft.items.length === 0 ? (
              <button onClick={() => router.push("/desktop/sales/new/pick-product")} className="w-full p-6 rounded-tj border-2 border-dashed border-divider dark:border-divider-dark text-[12px] text-muted dark:text-muted-dark hover:border-primary hover:bg-primary-soft/30 transition-colors">
                ابدأي بإضافة منتج للفاتورة
              </button>
            ) : (
              <div className="space-y-2">
                {draft.items.map((it) => {
                  const p = findProduct(it.pid);
                  const lineTotal = it.qty * it.price;
                  return (
                    <div key={it.pid} className="flex items-center gap-3 p-3 rounded-tj bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark">
                      <div className="w-10 h-10 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center flex-shrink-0">
                        <Ico name="tag" size={16} className="text-muted dark:text-muted-dark" sw={1.4} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-text dark:text-text-dark">{p?.name || "—"}</div>
                        <div className="text-[10px] text-muted dark:text-muted-dark tj-num mt-0.5">
                          <Shekel amt={it.price} size={10} className="text-muted dark:text-muted-dark" weight={500} /> × {it.qty}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateDraftItemQty(it.pid, Math.max(0, it.qty - 1))} className="w-7 h-7 rounded-tj bg-surface2 dark:bg-surface2-dark hover:bg-danger-soft dark:hover:bg-danger-soft-dark text-text dark:text-text-dark font-bold">−</button>
                        <span className="w-8 text-center"><Num size={13} className="text-text dark:text-text-dark" weight={700}>{it.qty}</Num></span>
                        <button onClick={() => updateDraftItemQty(it.pid, it.qty + 1)} className="w-7 h-7 rounded-tj bg-surface2 dark:bg-surface2-dark hover:bg-primary-soft text-text dark:text-text-dark font-bold">+</button>
                      </div>
                      <div className="w-24 text-end">
                        <Shekel amt={lineTotal} size={13} className="text-text dark:text-text-dark" weight={700} />
                      </div>
                      <button onClick={() => removeDraftItem(it.pid)} className="w-8 h-8 rounded-tj hover:bg-danger-soft dark:hover:bg-danger-soft-dark text-danger dark:text-danger-dark flex items-center justify-center">
                        <Ico name="trash" size={13} sw={1.8} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 h-fit sticky top-6">
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3 tracking-wider">الإجمالي</div>
          <Shekel amt={total} size={32} className="text-text dark:text-text-dark" weight={700} />
          <div className="mt-4 pt-4 border-t border-divider dark:border-divider-dark space-y-2 text-[11px] text-muted dark:text-muted-dark">
            <div className="flex justify-between"><span>عدد المنتجات</span><span className="tj-num font-bold text-text dark:text-text-dark">{draft?.items.reduce((s, it) => s + it.qty, 0) || 0}</span></div>
            <div className="flex justify-between"><span>الأصناف</span><span className="tj-num font-bold text-text dark:text-text-dark">{draft?.items.length || 0}</span></div>
          </div>
          <button onClick={() => router.push("/desktop/sales/new/payment")} disabled={!canContinue} className={`w-full mt-4 py-3 rounded-tj text-[13px] font-bold ${canContinue ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>
            متابعة للدفع ←
          </button>
        </div>
      </div>
    </DesktopPage>
  );
}

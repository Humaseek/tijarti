"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { InvoiceMethod } from "@/lib/store/types";

const METHODS: { value: InvoiceMethod; label: string; sub: string; icon: "money" | "card" | "clock" | "target" }[] = [
  { value: "نقدي", label: "نقدي", sub: "دفعة كاملة الآن", icon: "money" },
  { value: "بطاقة", label: "بطاقة", sub: "ائتمان / خصم", icon: "card" },
  { value: "آجل", label: "آجل", sub: "الدفع لاحقاً كاملاً", icon: "clock" },
  { value: "تقسيط", label: "تقسيط", sub: "أقساط شهرية", icon: "target" },
];

const INSTALLMENT_PLANS = [2, 3, 4, 6];

export default function Page() {
  const router = useRouter();
  const { toast } = useToast();
  const { state, draftTotal, setDraftMethod, commitDraft, findCustomer } = useStore();
  const [plan, setPlan] = useState(3);

  const draft = state.draft;
  useEffect(() => { if (!draft) router.replace("/desktop/sales/new"); }, [draft, router]);
  if (!draft) return null;

  const total = draftTotal();
  const customer = draft.customerId ? findCustomer(draft.customerId) : null;
  const method = draft.method;
  const monthly = method === "تقسيط" ? Math.round(total / plan) : 0;

  const save = () => {
    if (!customer || draft.items.length === 0) { toast("تحقّقي من البيانات", "warn"); return; }
    const inv = commitDraft();
    if (!inv) return;
    toast(method === "نقدي" || method === "بطاقة" ? "تم حفظ الفاتورة ✓" : "تم إنشاء الفاتورة — دين مسجّل", "success");
    router.push(`/desktop/invoices/${inv.id}`);
  };

  return (
    <DesktopPage
      breadcrumb="فاتورة جديدة"
      backHref="/desktop/sales/new"
      title="طريقة الدفع"
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">رجوع</button>
          <button onClick={save} className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">حفظ البيع</button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">اختاري طريقة الدفع</h3>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => {
                const active = method === m.value;
                return (
                  <button key={m.value} onClick={() => setDraftMethod(m.value, plan)} className={`p-4 rounded-tj border transition-colors text-start ${active ? "border-primary bg-primary-soft" : "border-divider dark:border-divider-dark bg-surface dark:bg-surface-dark hover:bg-bg dark:hover:bg-bg-dark"}`}>
                    <div className={`w-10 h-10 rounded-tj flex items-center justify-center mb-2 ${active ? "bg-primary text-white" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"}`}>
                      <Ico name={m.icon} size={18} sw={1.8} />
                    </div>
                    <div className="text-[14px] font-bold text-text dark:text-text-dark">{m.label}</div>
                    <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">{m.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {method === "تقسيط" && (
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
              <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">خطة التقسيط</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {INSTALLMENT_PLANS.map((p) => (
                  <button key={p} onClick={() => { setPlan(p); setDraftMethod("تقسيط", p); }} className={`py-3 rounded-tj border font-bold ${plan === p ? "bg-primary text-white border-transparent" : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark"}`}>
                    <div className="text-[14px]">{p}×</div>
                    <div className="text-[9px] opacity-80">{p} دفعات</div>
                  </button>
                ))}
              </div>
              <div className="bg-bg dark:bg-bg-dark rounded-tj p-3 border border-divider dark:border-divider-dark">
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] text-muted dark:text-muted-dark">كل دفعة</span>
                  <Shekel amt={monthly} size={18} className="text-primary" weight={700} />
                </div>
                <div className="text-[10px] text-muted dark:text-muted-dark mt-1">{plan} دفعات شهرية متساوية</div>
              </div>
            </div>
          )}

          {(method === "آجل" || method === "تقسيط") && (
            <div className="bg-warning-soft/40 dark:bg-warning-soft-dark/40 border-s-[3px] border-s-warning dark:border-s-warning-dark rounded-tj p-4">
              <div className="flex items-start gap-2">
                <Ico name="info" size={14} className="text-warning dark:text-warning-dark" sw={1.8} />
                <div className="text-[11px] text-text dark:text-text-dark">
                  {method === "آجل" ? "البيع رح يُسجّل كدَين كامل على الزبونة" : `البيع رح يُسجّل مع خطة تقسيط ${plan} دفعات`}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 h-fit border-s-[3px] border-s-success dark:border-s-success-dark sticky top-6">
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3 tracking-wider">ملخص الفاتورة</div>
          {customer && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-divider dark:border-divider-dark">
              <Avatar name={customer.name} initial={customer.initial} size={32} bg={customer.avatar_color || undefined} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-text dark:text-text-dark truncate">{customer.name}</div>
                <div className="text-[10px] text-muted dark:text-muted-dark"><Num size={10} className="text-muted dark:text-muted-dark" weight={600}>{draft.items.length}</Num> منتج</div>
              </div>
            </div>
          )}
          <div className="text-[11px] text-muted dark:text-muted-dark">المجموع</div>
          <Shekel amt={total} size={28} className="text-text dark:text-text-dark" weight={700} />
          <div className="mt-3 pt-3 border-t border-divider dark:border-divider-dark text-[11px] text-muted dark:text-muted-dark">
            طريقة الدفع: <span className="font-bold text-text dark:text-text-dark">{method}</span>
            {method === "تقسيط" && <> · {plan} دفعات</>}
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel } from "@/components/ui/num";
import { Label, ShekelInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { findInvoice, findCustomer, recordPayment } = useStore();
  const inv = findInvoice(params.id);

  const [amount, setAmount] = useState(inv ? String(inv.total - inv.paid) : "");
  const [method, setMethod] = useState<"نقدي" | "بطاقة" | "تحويل" | "شيك">("نقدي");

  if (!inv) return (
    <DesktopPage breadcrumb="الفواتير" backHref="/desktop/invoices" title="الفاتورة غير موجودة">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">الفاتورة غير موجودة</div>
    </DesktopPage>
  );

  const customer = findCustomer(inv.customerId);
  const remaining = inv.total - inv.paid;
  const n = Number(amount) || 0;
  const canSave = n > 0 && n <= remaining;

  const save = () => {
    if (!canSave) return;
    recordPayment(inv.id, n);
    toast(`تم تسجيل دفعة ${n.toLocaleString()} ₪`, "success");
    router.push(`/desktop/invoices/${inv.id}`);
  };

  return (
    <DesktopPage
      breadcrumb={`فاتورة #${inv.no}`}
      backHref={`/desktop/invoices/${inv.id}`}
      title="تسجيل دفعة"
      subtitle={`${customer?.name || "—"} · متبقّي ${remaining.toLocaleString()} ₪`}
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={save} disabled={!canSave} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canSave ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>حفظ الدفعة</button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">تفاصيل الدفعة</h3>
            <div className="space-y-3">
              <div><Label required>المبلغ</Label><ShekelInput value={amount} onChange={setAmount} /></div>
              <div>
                <Label>طريقة الدفع</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["نقدي", "بطاقة", "تحويل", "شيك"] as const).map((m) => (
                    <button key={m} onClick={() => setMethod(m)} className={`py-2.5 text-[12px] rounded-tj border font-semibold ${method === m ? "bg-primary text-white border-transparent" : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAmount(String(remaining))} className="flex-1 py-2 text-[11px] rounded-tj bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark font-semibold hover:bg-bg dark:hover:bg-bg-dark">الكامل ({remaining.toLocaleString()} ₪)</button>
                <button onClick={() => setAmount(String(Math.floor(remaining / 2)))} className="flex-1 py-2 text-[11px] rounded-tj bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark font-semibold hover:bg-bg dark:hover:bg-bg-dark">النصف</button>
                <button onClick={() => setAmount(String(Math.floor(remaining / 4)))} className="flex-1 py-2 text-[11px] rounded-tj bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark font-semibold hover:bg-bg dark:hover:bg-bg-dark">الربع</button>
              </div>
              {n > remaining && n > 0 && <div className="text-[11px] text-danger dark:text-danger-dark font-medium">⚠ المبلغ أكبر من المتبقّي ({remaining.toLocaleString()} ₪)</div>}
            </div>
          </div>
        </div>

        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 h-fit">
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3">ملخص الفاتورة</div>
          <div className="space-y-2.5 text-[12px]">
            <div className="flex justify-between py-1.5 border-b border-divider dark:border-divider-dark"><span className="text-muted dark:text-muted-dark">الإجمالي</span><Shekel amt={inv.total} size={13} className="text-text dark:text-text-dark" weight={700} /></div>
            <div className="flex justify-between py-1.5 border-b border-divider dark:border-divider-dark"><span className="text-muted dark:text-muted-dark">مدفوع</span><Shekel amt={inv.paid} size={13} className="text-success dark:text-success-dark" weight={700} /></div>
            <div className="flex justify-between py-1.5 border-b border-divider dark:border-divider-dark"><span className="text-muted dark:text-muted-dark">متبقّي</span><Shekel amt={remaining} size={13} className="text-warning dark:text-warning-dark" weight={700} /></div>
            <div className="flex justify-between py-2 bg-primary-soft rounded-tj px-2 mt-3"><span className="text-[12px] font-bold text-primary">بعد هذه الدفعة</span><Shekel amt={Math.max(0, remaining - n)} size={14} className="text-primary" weight={700} /></div>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

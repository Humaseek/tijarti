"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import { Label, ShekelInput } from "@/components/ui/form";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { state, findCustomer, recordPayment } = useStore();
  const customer = findCustomer(params.id);

  const unpaid = customer ? state.invoices.filter((i) => i.customerId === customer.id && i.total - i.paid > 0) : [];
  const [selectedId, setSelectedId] = useState<string>(unpaid[0]?.id || "");
  const selected = unpaid.find((i) => i.id === selectedId);
  const remaining = selected ? selected.total - selected.paid : 0;
  const [amount, setAmount] = useState(remaining ? String(remaining) : "");

  if (!customer) return (
    <DesktopPage breadcrumb="الزبائن" backHref="/desktop/customers" title="الزبون غير موجود">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">الزبون غير موجود</div>
    </DesktopPage>
  );

  const n = Number(amount) || 0;
  const canSave = selected !== undefined && n > 0 && n <= remaining;

  const save = () => {
    if (!canSave || !selected) return;
    recordPayment(selected.id, n);
    toast(`تم تسجيل دفعة ${n.toLocaleString()} ₪ من ${customer.name}`, "success");
    router.push(`/desktop/customers/${customer.id}`);
  };

  return (
    <DesktopPage
      breadcrumb={customer.name}
      backHref={`/desktop/customers/${customer.id}`}
      title="تسجيل دفعة دَين"
      subtitle={`إجمالي الدَين: ${customer.debt.toLocaleString()} ₪`}
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={save} disabled={!canSave} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canSave ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>حفظ الدفعة</button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          {/* Customer card */}
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 flex items-center gap-3">
            <Avatar name={customer.name} initial={customer.initial} size={48} bg={customer.avatar_color || undefined} />
            <div className="flex-1">
              <div className="text-[14px] font-bold text-text dark:text-text-dark">{customer.name}</div>
              <div className="text-[11px] text-muted dark:text-muted-dark" dir="ltr">{customer.phone || "—"}</div>
            </div>
            <Shekel amt={customer.debt} size={18} className="text-warning dark:text-warning-dark" weight={700} />
          </div>

          {/* Unpaid invoices */}
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">اختاري الفاتورة ({unpaid.length})</h3>
            {unpaid.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-muted dark:text-muted-dark">لا فواتير غير مدفوعة 🎉</div>
            ) : (
              <div className="space-y-2">
                {unpaid.map((inv) => {
                  const rem = inv.total - inv.paid;
                  return (
                    <button key={inv.id} onClick={() => { setSelectedId(inv.id); setAmount(String(rem)); }} className={`w-full flex items-center gap-3 p-3 rounded-tj border transition-colors ${selectedId === inv.id ? "border-primary bg-primary-soft" : "border-divider dark:border-divider-dark hover:bg-bg dark:hover:bg-bg-dark"}`}>
                      <div className="flex-1 text-start">
                        <div className="text-[12px] font-bold text-text dark:text-text-dark">فاتورة #{inv.no}</div>
                        <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">{inv.date} · {inv.method}</div>
                      </div>
                      <div className="text-end">
                        <Shekel amt={rem} size={13} className="text-warning dark:text-warning-dark" weight={700} />
                        <div className="text-[9px] text-muted dark:text-muted-dark mt-0.5">متبقّي</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount */}
          {selected && (
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
              <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">مبلغ الدفعة</h3>
              <ShekelInput value={amount} onChange={setAmount} />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setAmount(String(remaining))} className="flex-1 py-2 text-[11px] rounded-tj bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark font-semibold hover:bg-bg dark:hover:bg-bg-dark">الكامل</button>
                <button onClick={() => setAmount(String(Math.floor(remaining / 2)))} className="flex-1 py-2 text-[11px] rounded-tj bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark font-semibold hover:bg-bg dark:hover:bg-bg-dark">النصف</button>
              </div>
            </div>
          )}
        </div>

        {selected && (
          <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 h-fit">
            <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3">ملخص الفاتورة</div>
            <div className="space-y-2 text-[12px]">
              <Row label="الإجمالي" value={<Shekel amt={selected.total} size={13} className="text-text dark:text-text-dark" weight={700} />} />
              <Row label="مدفوع" value={<Shekel amt={selected.paid} size={13} className="text-success dark:text-success-dark" weight={700} />} />
              <Row label="متبقّي" value={<Shekel amt={remaining} size={13} className="text-warning dark:text-warning-dark" weight={700} />} />
              <div className="flex justify-between py-2 bg-primary-soft rounded-tj px-3 mt-3">
                <span className="text-[12px] font-bold text-primary">بعد هذه الدفعة</span>
                <Shekel amt={Math.max(0, remaining - n)} size={14} className="text-primary" weight={700} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DesktopPage>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-divider/50 dark:border-divider-dark/50">
      <span className="text-muted dark:text-muted-dark">{label}</span>
      <span>{value}</span>
    </div>
  );
}

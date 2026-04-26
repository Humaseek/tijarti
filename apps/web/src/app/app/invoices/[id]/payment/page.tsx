"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Btn } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

type Method = "نقدي" | "بطاقة" | "تحويل";

const METHODS: { value: Method; icon: "money" | "card" | "share" }[] = [
  { value: "نقدي",  icon: "money" },
  { value: "بطاقة", icon: "card"  },
  { value: "تحويل", icon: "share" },
];

export default function RecordPayment() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { findInvoice, findCustomer, recordPayment } = useStore();

  const inv = findInvoice(params.id);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("نقدي");

  if (!inv) {
    return (
      <Screen>
        <TopBar title="تسجيل دفعة" />
        <Empty icon="receipt" title="الفاتورة غير موجودة" />
      </Screen>
    );
  }

  const customer = findCustomer(inv.customerId);
  const remaining = inv.total - inv.paid;
  const amountNum = Number(amount) || 0;
  const canConfirm = amountNum > 0 && amountNum <= remaining;
  const willRemain = Math.max(0, remaining - amountNum);
  const fullyPaid = amountNum >= remaining && amountNum > 0;

  const suggest = [
    { label: "كامل",  amount: remaining        },
    { label: "نصف",   amount: Math.round(remaining / 2) },
    { label: "ثلث",   amount: Math.round(remaining / 3) },
  ];

  const confirm = () => {
    if (!canConfirm) return;
    recordPayment(inv.id, amountNum);
    toast(
      fullyPaid ? "تم السداد بالكامل ✓" : `تم تسجيل ${amountNum.toLocaleString()} ₪`,
      "success"
    );
    router.back();
  };

  return (
    <Screen>
      <TopBar title="تسجيل دفعة" />

      <div className="px-4 pb-4 flex-1">
        {/* Context */}
        <Card className="p-3.5 mb-3.5">
          {customer && (
            <Row className="mb-3 gap-2.5">
              <div className="w-9 h-9 rounded-full bg-surface2 dark:bg-surface2-dark flex items-center justify-center">
                <Ico name="user" size={18} className="text-muted dark:text-muted-dark" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-text dark:text-text-dark">{customer.name}</div>
                <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                  فاتورة <Num size={11} className="text-muted dark:text-muted-dark" weight={700}>{inv.no}</Num>
                </div>
              </div>
            </Row>
          )}
          <Row className="justify-between pt-3 border-t border-divider dark:border-divider-dark">
            <div className="text-[11px] text-subtext dark:text-subtext-dark font-semibold">المتبقّي</div>
            <Shekel amt={remaining} size={18} className="text-warning dark:text-warning-dark" weight={700} />
          </Row>
        </Card>

        {/* Amount input */}
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
          المبلغ المدفوع
        </div>
        <Card className="p-5 text-center mb-3.5">
          <Row className="justify-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              className="tj-num text-[36px] font-bold text-text dark:text-text-dark text-center bg-transparent border-0 outline-none w-[160px]"
            />
            <span className="tj-num text-[22px] font-medium text-subtext dark:text-subtext-dark self-center">₪</span>
          </Row>
        </Card>

        {/* Quick suggestions */}
        <Row className="gap-2 mb-3.5">
          {suggest.map((s) => (
            <div
              key={s.label}
              onClick={() => setAmount(String(s.amount))}
              className="tj-btn flex-1 py-2.5 rounded-tj border border-divider dark:border-divider-dark bg-surface dark:bg-surface-dark text-center"
              role="button"
              tabIndex={0}
            >
              <div className="text-[10px] text-subtext dark:text-subtext-dark mb-0.5">{s.label}</div>
              <Shekel amt={s.amount} size={12} className="text-text dark:text-text-dark" weight={700} />
            </div>
          ))}
        </Row>

        {/* Method picker */}
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
          طريقة الدفع
        </div>
        <Row className="gap-2 mb-3.5">
          {METHODS.map((m) => {
            const active = method === m.value;
            return (
              <div
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`tj-btn flex-1 py-3 text-center text-sm rounded-tj border flex flex-col items-center gap-1.5 ${
                  active
                    ? "bg-primary text-white dark:text-bg-dark border-transparent font-bold"
                    : "bg-surface dark:bg-surface-dark border-divider dark:border-divider-dark text-text dark:text-text-dark font-medium"
                }`}
                role="button"
                tabIndex={0}
              >
                <Ico name={m.icon} size={14} sw={1.8} />
                <span className="text-[12px]">{m.value}</span>
              </div>
            );
          })}
        </Row>

        {/* Preview */}
        {amountNum > 0 && (
          <Card
            className={`p-3.5 border ${
              fullyPaid
                ? "bg-success-soft dark:bg-success-soft-dark border-success dark:border-success-dark"
                : "bg-warning-soft dark:bg-warning-soft-dark border-warning dark:border-warning-dark"
            }`}
          >
            <Row className="justify-between">
              <div className="text-[11px] text-subtext dark:text-subtext-dark font-semibold">
                {fullyPaid ? "الفاتورة ستُغلق" : "سيبقى"}
              </div>
              <Shekel
                amt={willRemain}
                size={16}
                className={
                  fullyPaid ? "text-success dark:text-success-dark" : "text-warning dark:text-warning-dark"
                }
                weight={700}
              />
            </Row>
          </Card>
        )}

        {amountNum > remaining && (
          <div className="text-[11px] text-danger dark:text-danger-dark mt-2 font-medium">
            ⚠ المبلغ أكبر من الـ remaining
          </div>
        )}
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canConfirm} onClick={confirm}>
          <Ico name="check" size={15} sw={2.4} />
          تأكيد الدفعة
        </Btn>
      </BottomBar>
    </Screen>
  );
}

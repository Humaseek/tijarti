"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Btn } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { InvoiceMethod } from "@/lib/store/types";

const METHODS: { value: InvoiceMethod; label: string; sub: string; icon: "money" | "card" | "clock" | "target" }[] = [
  { value: "نقدي",   label: "نقدي",  sub: "دفعة كاملة الآن",      icon: "money" },
  { value: "بطاقة",  label: "بطاقة", sub: "بطاقة ائتمان / خصم",    icon: "card" },
  { value: "آجل",    label: "آجل",   sub: "الدفع لاحقاً كاملاً",   icon: "clock" },
  { value: "تقسيط",  label: "تقسيط", sub: "أقساط شهرية",          icon: "target" },
];

const INSTALLMENT_PLANS = [2, 3, 4, 6];

export default function Payment() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    state,
    draftTotal,
    setDraftMethod,
    commitDraft,
    findCustomer,
  } = useStore();

  const [plan, setPlan] = useState(3);

  const draft = state.draft;
  useEffect(() => {
    if (!draft) router.replace("/app/sales/new");
  }, [draft, router]);

  if (!draft) return null;

  const total = draftTotal();
  const customer = draft.customerId ? findCustomer(draft.customerId) : null;
  const method = draft.method;
  const monthly = method === "تقسيط" ? Math.round(total / plan) : 0;

  const save = () => {
    if (!customer || draft.items.length === 0) {
      toast("تحقّقي من البيانات", "warn");
      return;
    }
    const inv = commitDraft();
    if (!inv) return;
    toast(
      method === "نقدي" || method === "بطاقة"
        ? "تم حفظ الفاتورة ✓"
        : "تم إنشاء الفاتورة — دين مُسجَّل",
      "success"
    );
    router.push(`/app/invoices/${inv.id}`);
  };

  return (
    <Screen>
      <TopBar title="طريقة الدفع" />

      <div className="px-4 pb-4 flex-1">
        {/* Summary */}
        <Card className="p-4 mb-4 border-s-[3px] border-s-success dark:border-s-success-dark">
          <Row className="justify-between mb-1">
            <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
              المجموع
            </div>
            <Shekel amt={total} size={24} className="text-text dark:text-text-dark" weight={700} />
          </Row>
          {customer && (
            <div className="text-[11px] text-subtext dark:text-subtext-dark mt-1">
              {customer.name} · <Num size={11} className="text-subtext dark:text-subtext-dark" weight={600}>{draft.items.length}</Num> منتج
            </div>
          )}
        </Card>

        {/* Method picker */}
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
          اختاري طريقة الدفع
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {METHODS.map((m) => {
            const active = method === m.value;
            return (
              <Card
                key={m.value}
                onClick={() => setDraftMethod(m.value, m.value === "تقسيط" ? plan : undefined)}
                className={`p-3.5 ${active ? "border-primary bg-primary-soft" : ""}`}
              >
                <Row className="justify-between mb-1.5">
                  <div className={`w-8 h-8 rounded-tj flex items-center justify-center ${
                    active ? "bg-primary text-white dark:text-bg-dark" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
                  }`}>
                    <Ico name={m.icon} size={15} sw={1.8} />
                  </div>
                  {active && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white dark:text-bg-dark">
                      <Ico name="check" size={12} sw={3} />
                    </div>
                  )}
                </Row>
                <div className={`text-[13px] font-bold ${active ? "text-primary" : "text-text dark:text-text-dark"}`}>
                  {m.label}
                </div>
                <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">{m.sub}</div>
              </Card>
            );
          })}
        </div>

        {/* Installment picker */}
        {method === "تقسيط" && (
          <div className="animate-fade-in mb-4">
            <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
              عدد الأقساط
            </div>
            <Row className="gap-2 mb-3">
              {INSTALLMENT_PLANS.map((n) => {
                const active = plan === n;
                return (
                  <div
                    key={n}
                    onClick={() => {
                      setPlan(n);
                      setDraftMethod("تقسيط", n);
                    }}
                    className={`tj-btn flex-1 py-3 text-center rounded-tj border ${
                      active
                        ? "bg-primary text-white dark:text-bg-dark border-transparent"
                        : "bg-surface dark:bg-surface-dark border-divider dark:border-divider-dark text-text dark:text-text-dark"
                    }`}
                  >
                    <Num size={16} className={active ? "text-white dark:text-bg-dark" : "text-text dark:text-text-dark"} weight={700}>{n}</Num>
                  </div>
                );
              })}
            </Row>
            <Card className="p-3.5 bg-info-soft dark:bg-info-soft-dark border-info dark:border-info-dark">
              <Row className="justify-between">
                <div>
                  <div className="text-[11px] text-info dark:text-info-dark font-semibold">القسط الشهري</div>
                  <div className="text-[10px] text-subtext dark:text-subtext-dark mt-0.5">
                    × <Num size={10} className="text-subtext dark:text-subtext-dark" weight={600}>{plan}</Num> أشهر
                  </div>
                </div>
                <Shekel amt={monthly} size={18} className="text-info dark:text-info-dark" weight={700} bump />
              </Row>
            </Card>
          </div>
        )}

        {/* Debt note */}
        {(method === "آجل" || method === "تقسيط") && (
          <Card className="p-3.5 bg-warning-soft dark:bg-warning-soft-dark border-warning dark:border-warning-dark">
            <Row className="gap-2">
              <Ico name="warn" size={16} className="text-warning dark:text-warning-dark flex-shrink-0" sw={1.8} />
              <div className="flex-1 text-[11px] text-text dark:text-text-dark leading-relaxed">
                هذه الفاتورة ستُسجَّل كدين على <span className="font-bold">{customer?.name}</span>. لا تنسي متابعتها.
              </div>
            </Row>
          </Card>
        )}
      </div>

      <BottomBar>
        <Btn primary fullWidth onClick={save}>
          <Ico name="check" size={15} sw={2.4} />
          حفظ الفاتورة ({total.toLocaleString()} ₪)
        </Btn>
      </BottomBar>
    </Screen>
  );
}

"use client";

import { useState } from "react";
import { Screen, Card, Row } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Btn } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [autoRenew, setAutoRenew] = useState(true);

  // Mock data — will come from Stripe in the real implementation
  const plan = {
    name: "اشتراك شهري",
    price: 300,
    currency: "₪",
    nextRenewalIso: "2026-05-01",
    paymentMethod: { type: "visa", last4: "1234", expires: "08/27" },
  };

  const invoices = [
    { id: "inv1", dateIso: "2026-04-01", amount: 300, status: "paid" as const },
    { id: "inv2", dateIso: "2026-03-01", amount: 300, status: "paid" as const },
    { id: "inv3", dateIso: "2026-02-01", amount: 300, status: "paid" as const },
    { id: "inv4", dateIso: "2026-01-01", amount: 300, status: "paid" as const },
  ];

  return (
    <Screen>
      <TopBar title="الاشتراك والفوترة" />

      <div className="px-4 flex-1 overflow-auto">
        {/* Current plan */}
        <Card className="p-4 mb-3.5 border-s-[3px] border-s-primary">
          <Row className="justify-between mb-1.5">
            <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
              الخطة الحالية
            </div>
            <span className="text-[10px] font-bold px-2 py-[3px] rounded-tj bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark">
              نشط
            </span>
          </Row>
          <div className="text-[17px] font-bold text-text dark:text-text-dark mb-1">{plan.name}</div>
          <Row className="gap-1.5 items-baseline">
            <Shekel amt={plan.price} size={22} className="text-primary" weight={700} />
            <span className="text-[12px] text-muted dark:text-muted-dark">/ شهر</span>
          </Row>
          <div className="text-[11px] text-muted dark:text-muted-dark mt-2 pt-2 border-t border-divider dark:border-divider-dark">
            التجديد القادم: <b className="text-text dark:text-text-dark">{plan.nextRenewalIso}</b>
          </div>
        </Card>

        {/* Upgrade to annual */}
        <Card className="p-3.5 mb-3.5 bg-warning-soft/50 dark:bg-warning-soft-dark/50">
          <Row className="justify-between items-start">
            <div className="flex-1">
              <Row className="gap-1.5 mb-1">
                <Ico name="trendUp" size={14} className="text-warning dark:text-warning-dark" sw={1.8} />
                <div className="text-[12px] font-bold text-warning dark:text-warning-dark">وفّري مع الاشتراك السنوي</div>
              </Row>
              <div className="text-[11px] text-text dark:text-text-dark">
                3,000 ₪/سنة بدل 3,600 ₪ — وفّري <b>600 ₪</b> (شهرين مجاناً)
              </div>
            </div>
          </Row>
          <Btn primary fullWidth onClick={() => {
            if (!confirm("التبديل للاشتراك السنوي (3,000 ₪/سنة، توفير 600 ₪)؟")) return;
            toast("تم تسجيل طلبك — رح يصلك إيميل للتأكيد", "success");
          }} className="mt-3">
            التبديل للسنوي
          </Btn>
        </Card>

        {/* Payment method */}
        <div className="text-[11px] font-bold text-subtext dark:text-subtext-dark tracking-wider pb-2 px-1">
          طريقة الدفع
        </div>
        <Card className="p-3.5 mb-3.5">
          <Row className="gap-3">
            <div className="w-10 h-7 rounded-[3px] bg-gradient-to-br from-[#2563A6] to-[#1d4f7f] flex items-center justify-center text-white text-[9px] font-bold">
              VISA
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-text dark:text-text-dark tj-num" dir="ltr">
                •••• •••• •••• {plan.paymentMethod.last4}
              </div>
              <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                ينتهي {plan.paymentMethod.expires}
              </div>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => toast("رح يفتح Stripe Checkout لتحديث بطاقة الدفع", "info")}
              className="tj-btn text-[11px] text-primary font-bold"
            >
              تحديث
            </div>
          </Row>
        </Card>

        {/* Invoices history */}
        <div className="text-[11px] font-bold text-subtext dark:text-subtext-dark tracking-wider pb-2 px-1">
          الفواتير السابقة
        </div>
        <Card className="mb-3.5">
          {invoices.map((inv, i, arr) => (
            <Row
              key={inv.id}
              className={`px-3.5 py-3 gap-3 ${i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
            >
              <div className="w-9 h-9 rounded-tj bg-success-soft dark:bg-success-soft-dark flex items-center justify-center">
                <Ico name="check" size={14} className="text-success dark:text-success-dark" sw={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-text dark:text-text-dark">{inv.dateIso}</div>
                <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">مدفوعة</div>
              </div>
              <div className="text-end">
                <Shekel amt={inv.amount} size={12} className="text-text dark:text-text-dark" weight={700} />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    toast("جاري تحضير الفاتورة...", "info");
                    // Simulate download via opening a data URL
                    const pdfStub = `Tijarti Invoice ${inv.dateIso}\n\nPaid: ${inv.amount} ILS\nStatus: ${inv.status}`;
                    const blob = new Blob([pdfStub], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `invoice-${inv.dateIso}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="tj-btn text-[10px] text-primary font-bold mt-0.5"
                >
                  تحميل
                </div>
              </div>
            </Row>
          ))}
        </Card>

        {/* Danger zone */}
        <div className="text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider pb-2 px-1">
          إجراءات
        </div>
        <Card className="mb-3.5">
          <Row
            className="px-3.5 py-3 justify-between tj-tap"
            onClick={() => {
              setAutoRenew(!autoRenew);
              toast(autoRenew ? "تم إيقاف التجديد التلقائي" : "تم تفعيل التجديد التلقائي", "info");
            }}
          >
            <div>
              <div className="text-[13px] font-semibold text-text dark:text-text-dark">التجديد التلقائي</div>
              <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                {autoRenew ? "اشتراكك يتجدد تلقائياً" : "اشتراكك لن يتجدد"}
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors ${autoRenew ? "bg-primary" : "bg-surface2 dark:bg-surface2-dark"}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform mt-0.5 ${autoRenew ? "translate-x-[18px] ms-0.5" : "translate-x-0.5"}`} />
            </div>
          </Row>
        </Card>

        <Btn
          danger
          fullWidth
          onClick={() => {
            if (!confirm("إلغاء الاشتراك؟ رح تظل تستخدمي التطبيق لحد نهاية الفترة الحالية.")) return;
            toast("تم تسجيل طلب الإلغاء — رح يصلك إيميل بالتفاصيل", "warn");
          }}
        >
          إلغاء الاشتراك
        </Btn>

        <div className="h-4" />
      </div>
    </Screen>
  );
}

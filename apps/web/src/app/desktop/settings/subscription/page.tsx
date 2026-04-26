"use client";

import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export default function Page() {
  const { toast } = useToast();
  const [autoRenew, setAutoRenew] = useState(true);

  const plan = { name: "اشتراك شهري", price: 300, nextRenewal: "2026-05-01", card: { last4: "1234", exp: "08/27" } };
  const invoices = [
    { id: "inv1", date: "2026-04-01", amount: 300 },
    { id: "inv2", date: "2026-03-01", amount: 300 },
    { id: "inv3", date: "2026-02-01", amount: 300 },
    { id: "inv4", date: "2026-01-01", amount: 300 },
  ];

  return (
    <DesktopPage breadcrumb="الإعدادات" backHref="/desktop/settings" title="الاشتراك والفوترة">
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-6 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-primary p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] text-muted dark:text-muted-dark font-semibold">الخطة الحالية</div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-tj bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark">نشط</span>
          </div>
          <div className="text-[18px] font-bold text-text dark:text-text-dark mb-2">{plan.name}</div>
          <div className="flex items-baseline gap-1.5"><Shekel amt={plan.price} size={28} className="text-primary" weight={700} /><span className="text-[13px] text-muted dark:text-muted-dark">/ شهر</span></div>
          <div className="text-[11px] text-muted dark:text-muted-dark mt-3 pt-3 border-t border-divider dark:border-divider-dark">التجديد القادم: <b className="text-text dark:text-text-dark">{plan.nextRenewal}</b></div>
        </div>

        <div className="col-span-6 bg-warning-soft/50 dark:bg-warning-soft-dark/50 rounded-tj p-5">
          <div className="flex items-center gap-2 mb-2"><Ico name="trendUp" size={16} className="text-warning dark:text-warning-dark" sw={1.8} /><div className="text-[13px] font-bold text-warning dark:text-warning-dark">وفّري مع الاشتراك السنوي</div></div>
          <p className="text-[12px] text-text dark:text-text-dark mb-3">3,000 ₪/سنة بدل 3,600 ₪ — وفّري <b>600 ₪</b> (شهرين مجاناً)</p>
          <button onClick={() => { if (!confirm("التبديل للاشتراك السنوي؟")) return; toast("تم تسجيل طلبك", "success"); }} className="w-full py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">
            التبديل للسنوي
          </button>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-4">
        <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">طريقة الدفع</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded-[3px] bg-gradient-to-br from-[#2563A6] to-[#1d4f7f] flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-text dark:text-text-dark tj-num" dir="ltr">•••• •••• •••• {plan.card.last4}</div>
            <div className="text-[10px] text-muted dark:text-muted-dark">ينتهي {plan.card.exp}</div>
          </div>
          <button onClick={() => toast("Stripe Checkout لتحديث البطاقة", "info")} className="text-[11px] text-primary font-bold hover:underline">تحديث</button>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-divider dark:border-divider-dark"><h3 className="text-[13px] font-bold text-text dark:text-text-dark">الفواتير السابقة</h3></div>
        <table className="w-full">
          <thead>
            <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
              <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التاريخ</th>
              <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الحالة</th>
              <th className="text-end px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المبلغ</th>
              <th className="text-end px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark">
                <td className="px-5 py-3 text-[12px] text-text dark:text-text-dark">{inv.date}</td>
                <td className="px-5 py-3"><span className="text-[10px] font-bold px-2 py-1 rounded-tj bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark">مدفوعة</span></td>
                <td className="px-5 py-3 text-end tj-num text-[12px] font-bold text-text dark:text-text-dark">{inv.amount.toLocaleString()} ₪</td>
                <td className="px-5 py-3 text-end"><button onClick={() => toast("تحميل فاتورة PDF", "info")} className="text-[11px] text-primary font-bold hover:underline">تحميل</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark">التجديد التلقائي</h3>
            <div className="text-[11px] text-muted dark:text-muted-dark mt-1">{autoRenew ? "اشتراكك يتجدد تلقائياً" : "اشتراكك لن يتجدد"}</div>
          </div>
          <input type="checkbox" checked={autoRenew} onChange={(e) => { setAutoRenew(e.target.checked); toast(e.target.checked ? "تم تفعيل" : "تم إيقاف", "info"); }} className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-danger dark:border-danger-dark p-5">
        <h3 className="text-[13px] font-bold text-danger dark:text-danger-dark mb-2">إلغاء الاشتراك</h3>
        <p className="text-[11px] text-muted dark:text-muted-dark mb-3">رح تظلي تستخدمي التطبيق لحد نهاية الفترة الحالية.</p>
        <button onClick={() => { if (!confirm("إلغاء الاشتراك؟")) return; toast("تم تسجيل طلب الإلغاء", "warn"); }} className="px-4 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
          إلغاء الاشتراك
        </button>
      </div>
    </DesktopPage>
  );
}

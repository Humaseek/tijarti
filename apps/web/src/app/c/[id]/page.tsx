"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useLoyaltyLog, loyaltyBalance } from "@/lib/extensions-store";
import { whatsappUrl, paymentReminderMessage } from "@/lib/whatsapp";
import { useToast } from "@/components/ui/toast";

export default function CustomerPortalPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { state } = useStore();
  const { list: loyalty } = useLoyaltyLog();
  const { toast } = useToast();

  const customer = state.customers.find((c) => c.id === id);
  const invoices = useMemo(
    () => state.invoices.filter((i) => i.customerId === id).slice(0, 20),
    [state.invoices, id],
  );
  const debts = useMemo(
    () => invoices.reduce((s, i) => s + (i.total - i.paid), 0),
    [invoices],
  );
  const points = loyaltyBalance(loyalty, id);
  const settings = state.storeSettings;

  const share = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/c/${id}`;
    if (navigator.share) {
      navigator.share({ title: "بوابة الزبون", url }).catch(() => {/* ignored */});
    } else {
      navigator.clipboard?.writeText(url).then(() => toast("تم نسخ الرابط", "success"));
    }
  };

  const payHref = customer
    ? whatsappUrl(
        settings.store_phone,
        paymentReminderMessage({
          storeName: settings.store_name,
          customerName: customer.name,
          invoiceNo: "—",
          remaining: debts,
        }),
      )
    : null;

  if (!customer) {
    return (
      <div className="max-w-[640px] mx-auto px-5 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-warning-soft dark:bg-warning-soft-dark flex items-center justify-center mb-4">
          <Ico name="warn" size={26} className="text-warning dark:text-warning-dark" />
        </div>
        <h1 className="text-[18px] font-bold text-text dark:text-text-dark mb-1">الرابط غير متاح</h1>
        <p className="text-[13px] text-muted dark:text-muted-dark">هذه البوابة للعرض فقط — يُرجى التواصل مع المحل.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-5 py-8">
      {/* Banner note */}
      <div className="mb-4 bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark text-[11px] font-semibold px-3 py-2 rounded-tj">
        رابط الزبون — للمشاركة عبر واتساب
      </div>

      {/* Header */}
      <div className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={customer.name} initial={customer.initial} size={56} bg={customer.avatar_color ?? undefined} />
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-bold text-text dark:text-text-dark truncate">{customer.name}</div>
            <div className="text-[11px] text-muted dark:text-muted-dark">{settings.store_name}</div>
          </div>
          <button onClick={share} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-primary">
            <Ico name="share" size={14} sw={1.8} /> مشاركة
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="مشتريات" value={<Num size={18} weight={700} className="text-text dark:text-text-dark">{customer.invoices}</Num>} />
          <Stat label="دين قائم" value={<Shekel amt={debts} size={18} weight={700} className={debts > 0 ? "text-danger dark:text-danger-dark" : "text-success dark:text-success-dark"} />} />
          <Stat label="نقاط ولاء" value={<Num size={18} weight={700} className="text-primary">{points}</Num>} />
        </div>

        {debts > 0 && payHref && (
          <a href={payHref} target="_blank" rel="noopener noreferrer" className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-tj bg-success dark:bg-success-dark text-white text-[14px] font-bold">
            <Ico name="whatsapp" size={16} sw={2} /> ادفعي الآن عبر واتساب
          </a>
        )}
      </div>

      {/* Purchases */}
      <div className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-4 mb-4">
        <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">مشترياتكِ الأخيرة</h3>
        {invoices.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-muted dark:text-muted-dark">لا مشتريات بعد</div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => {
              const remaining = inv.total - inv.paid;
              return (
                <div key={inv.id} className="flex items-center justify-between p-2 bg-bg dark:bg-bg-dark rounded-tj">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-text dark:text-text-dark">فاتورة #{inv.no}</div>
                    <div className="text-[10px] text-muted dark:text-muted-dark">{inv.date} · {inv.method}</div>
                  </div>
                  <div className="text-end">
                    <Shekel amt={inv.total} size={13} weight={700} className="text-text dark:text-text-dark" />
                    {remaining > 0 && <div className="text-[10px] text-danger dark:text-danger-dark font-bold">متبقّي {remaining.toLocaleString()} ₪</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Store contact */}
      <div className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-4">
        <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">معلومات المحل</h3>
        <div className="space-y-2 text-[12px]">
          <InfoRow icon="store" label="المحل" value={settings.store_name} />
          {settings.store_phone && <InfoRow icon="phone" label="الهاتف" value={settings.store_phone} />}
          {settings.store_address && <InfoRow icon="home" label="العنوان" value={settings.store_address} />}
          {settings.store_email && <InfoRow icon="mail" label="البريد" value={settings.store_email} />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-bg dark:bg-bg-dark rounded-tj p-3 text-center">
      <div className="text-[10px] text-muted dark:text-muted-dark mb-1">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: "store" | "phone" | "home" | "mail"; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center text-primary">
        <Ico name={icon} size={13} sw={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted dark:text-muted-dark">{label}</div>
        <div className="text-[12px] font-bold text-text dark:text-text-dark truncate">{value}</div>
      </div>
    </div>
  );
}

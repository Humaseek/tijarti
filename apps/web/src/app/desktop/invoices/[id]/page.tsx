"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { whatsappUrl, whatsappUrlNoContact, invoiceMessage } from "@/lib/whatsapp";
import { shareInvoice } from "@/lib/native-share";

export default function DesktopInvoiceDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { state, findInvoice, findCustomer, findProduct } = useStore();
  const inv = findInvoice(params.id);

  if (!inv) {
    return (
      <DesktopPage breadcrumb="الفواتير" backHref="/desktop/invoices" title="الفاتورة غير موجودة">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center">
          <Ico name="receipt" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
          <div className="text-[13px] text-muted dark:text-muted-dark">هذه الفاتورة غير موجودة</div>
        </div>
      </DesktopPage>
    );
  }

  const customer = findCustomer(inv.customerId);
  const debt = inv.total - inv.paid;
  const isPaid = debt <= 0;

  const buildMessage = () => invoiceMessage({
    storeName: state.storeSettings.store_name || "محلّنا",
    customerName: customer?.name,
    invoiceNo: inv.no,
    total: inv.total,
    paid: inv.paid,
    date: inv.date,
    method: inv.method,
    items: inv.items.map((it) => {
      const p = findProduct(it.pid);
      return { name: p?.name || "منتج", qty: it.qty, price: it.price };
    }),
  });

  const sendWhatsApp = () => {
    const msg = buildMessage();
    const url = whatsappUrl(customer?.phone, msg) || whatsappUrlNoContact(msg);
    window.open(url, "_blank", "noopener,noreferrer");
    if (!customer?.phone) toast("اختاري الزبون من واتساب", "info");
  };

  const share = async () => {
    const res = await shareInvoice(inv, customer?.name);
    if (res.method === "clipboard" && res.ok) toast("تم نسخ تفاصيل الفاتورة", "success");
    else if (res.method === "none") toast("المتصفح لا يدعم المشاركة", "warn");
  };

  return (
    <DesktopPage
      breadcrumb="الفواتير"
      backHref="/desktop/invoices"
      title={`فاتورة #${inv.no}`}
      subtitle={`${inv.date} · ${inv.time} · ${inv.method}`}
      actions={
        <>
          <button
            onClick={() => toast("هذه الميزة محذوفة في النسخة الحالية", "info")}
            className="hidden flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark"
            title="غير متوفر"
          >
            <Ico name="box" size={13} sw={1.8} />
            نسخ
          </button>
          <button
            onClick={sendWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-tj text-[12px] font-bold text-white hover:opacity-90"
            style={{ background: "#25D366" }}
            title={customer?.phone ? `إرسال إلى ${customer.phone}` : "اختاري الزبون من واتساب"}
          >
            <Ico name="whatsapp" size={13} sw={1.8} />
            إرسال واتساب
          </button>
          <a
            href={`/print/invoice/${inv.id}?auto=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark"
          >
            <Ico name="download" size={13} sw={1.8} />
            طباعة / PDF
          </a>
          <button onClick={share} className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
            <Ico name="share" size={13} sw={1.8} />
            مشاركة
          </button>
          {!isPaid && (
            <Link href={`/desktop/invoices/${inv.id}/payment`} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">
              <Ico name="money" size={13} sw={1.8} />
              تسجيل دفعة
            </Link>
          )}
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4 mb-5">
        {/* Invoice summary */}
        <div className="col-span-5 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 border-s-[3px] border-s-success dark:border-s-success-dark">
          <div className="text-[11px] text-muted dark:text-muted-dark tracking-wider font-semibold mb-2">المجموع</div>
          <Shekel amt={inv.total} size={32} className="text-text dark:text-text-dark" weight={700} />
          <div className="mt-3 pt-3 border-t border-divider dark:border-divider-dark">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-tj font-bold text-[11px] ${
              isPaid ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
            }`}>
              <span>{isPaid ? "✓" : "⏳"}</span>
              {isPaid ? "مدفوعة بالكامل" : `متبقّي ${debt.toLocaleString()} ₪`}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 text-[11px]">
            <div>
              <div className="text-muted dark:text-muted-dark">مدفوع</div>
              <Shekel amt={inv.paid} size={15} className="text-success dark:text-success-dark" weight={700} />
            </div>
            <div>
              <div className="text-muted dark:text-muted-dark">متبقّي</div>
              <Shekel amt={debt} size={15} className={debt > 0 ? "text-warning dark:text-warning-dark" : "text-muted dark:text-muted-dark"} weight={700} />
            </div>
          </div>
        </div>

        {/* Customer card */}
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="text-[11px] text-muted dark:text-muted-dark tracking-wider font-semibold mb-3">الزبون</div>
          {customer ? (
            <Link href={`/desktop/customers/${customer.id}`} className="flex items-center gap-3 hover:opacity-80">
              <Avatar name={customer.name} initial={customer.initial} size={48} bg={customer.avatar_color || undefined} />
              <div>
                <div className="text-[14px] font-bold text-text dark:text-text-dark">{customer.name}</div>
                <div className="text-[10px] tj-num text-muted dark:text-muted-dark" dir="ltr">{customer.phone || "—"}</div>
                <div className="text-[10px] text-primary font-bold mt-1">عرض الملف الكامل ←</div>
              </div>
            </Link>
          ) : <div className="text-[12px] text-muted dark:text-muted-dark">بدون زبون — بيع نقدي</div>}
        </div>

        {/* Meta */}
        <div className="col-span-3 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="text-[11px] text-muted dark:text-muted-dark tracking-wider font-semibold mb-3">تفاصيل</div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between"><span className="text-muted dark:text-muted-dark">الرقم</span><span className="font-bold text-text dark:text-text-dark tj-num">#{inv.no}</span></div>
            <div className="flex justify-between"><span className="text-muted dark:text-muted-dark">طريقة الدفع</span><span className="font-semibold text-text dark:text-text-dark">{inv.method}</span></div>
            <div className="flex justify-between"><span className="text-muted dark:text-muted-dark">التاريخ</span><span className="font-semibold text-text dark:text-text-dark">{inv.date}</span></div>
            <div className="flex justify-between"><span className="text-muted dark:text-muted-dark">الوقت</span><span className="font-semibold text-text dark:text-text-dark">{inv.time}</span></div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-divider dark:border-divider-dark">
          <h2 className="text-[14px] font-bold text-text dark:text-text-dark">المنتجات ({inv.items.length})</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
              <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المنتج</th>
              <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">السعر</th>
              <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الكمية</th>
              <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => {
              const p = findProduct(it.pid);
              return (
                <tr key={`${it.pid}-${i}`} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0">
                  <td className="px-4 py-3 text-[12px] font-semibold text-text dark:text-text-dark">{p?.name || "منتج محذوف"}</td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] text-muted dark:text-muted-dark">{it.price.toLocaleString()} ₪</td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] text-text dark:text-text-dark">{it.qty}</td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-text dark:text-text-dark">{(it.qty * it.price).toLocaleString()} ₪</td>
                </tr>
              );
            })}
            <tr className="bg-bg dark:bg-bg-dark border-t-[1.5px] border-divider dark:border-divider-dark">
              <td colSpan={3} className="px-4 py-3 text-end text-[13px] font-bold text-text dark:text-text-dark">الإجمالي</td>
              <td className="px-4 py-3 text-end"><Shekel amt={inv.total} size={16} className="text-success dark:text-success-dark" weight={700} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Installment plan */}
      {inv.installment && (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">خطة التقسيط</h2>
            <Link href={`/desktop/installments/${inv.id}`} className="text-[11px] text-primary font-bold hover:underline">عرض التفاصيل ←</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">عدد الدفعات</div>
              <Num size={18} className="text-text dark:text-text-dark" weight={700}>{inv.installment.plan}</Num>
            </div>
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">مدفوع</div>
              <Shekel amt={inv.installment.paid} size={16} className="text-success dark:text-success-dark" weight={700} />
            </div>
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">متبقّي</div>
              <Shekel amt={inv.installment.total - inv.installment.paid} size={16} className="text-warning dark:text-warning-dark" weight={700} />
            </div>
          </div>
          <div className="mt-3 h-2 bg-surface2 dark:bg-surface2-dark rounded-tj overflow-hidden">
            <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, (inv.installment.paid / inv.installment.total) * 100)}%` }} />
          </div>
        </div>
      )}
    </DesktopPage>
  );
}

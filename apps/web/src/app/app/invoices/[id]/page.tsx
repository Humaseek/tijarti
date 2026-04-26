"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, Card, Row, BottomBar, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Btn, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { whatsappUrl, whatsappUrlNoContact, invoiceMessage } from "@/lib/whatsapp";
import { shareInvoice } from "@/lib/native-share";

export default function InvoiceDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { state, findInvoice, findCustomer, findProduct } = useStore();

  const inv = findInvoice(params.id);
  if (!inv) {
    return (
      <Screen>
        <TopBar title="فاتورة" />
        <Empty icon="receipt" title="الفاتورة غير موجودة" />
      </Screen>
    );
  }

  const customer = findCustomer(inv.customerId);
  const debt = inv.total - inv.paid;
  const isPaid = debt <= 0;

  const payNow = () => router.push(`/app/invoices/${inv.id}/payment`);

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

  return (
    <Screen>
      <TopBar
        title={`فاتورة ${inv.no}`}
        trailing={
          <Row className="gap-1">
            <button
              onClick={sendWhatsApp}
              aria-label="إرسال واتساب"
              className="tj-btn w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: "#25D366" }}
              title={customer?.phone ? `إرسال إلى ${customer.phone}` : "اختاري الزبون من واتساب"}
            >
              <Ico name="whatsapp" size={18} sw={1.8} />
            </button>
            <IconButton name="share" onClick={async () => {
              const res = await shareInvoice(inv, customer?.name);
              if (res.method === "clipboard" && res.ok) toast("تم نسخ تفاصيل الفاتورة", "success");
              else if (res.method === "none") toast("المتصفح لا يدعم المشاركة", "warn");
            }} size={20} />
          </Row>
        }
      />

      {inv._new && (
        <div className="px-4 pb-3 animate-fade-in">
          <Card className="p-3.5 bg-success-soft dark:bg-success-soft-dark border-success dark:border-success-dark">
            <Row className="gap-2">
              <div className="w-6 h-6 rounded-full bg-success dark:bg-success-dark flex items-center justify-center text-white">
                <Ico name="check" size={14} sw={3} />
              </div>
              <div className="flex-1 text-[12px] font-semibold text-success dark:text-success-dark">
                تم إنشاء الفاتورة بنجاح
              </div>
            </Row>
          </Card>
        </div>
      )}

      <div className="px-4 pb-4 flex-1">
        {/* Header card */}
        <Card className="p-4 mb-3.5 text-center border-s-[3px] border-s-success dark:border-s-success-dark">
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider">المجموع</div>
          <div className="mt-1.5">
            <Shekel amt={inv.total} size={32} className="text-text dark:text-text-dark" weight={700} />
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-tj font-bold text-[11px]"
            style={{
              background: isPaid ? "rgb(15 110 86 / 0.14)" : "rgb(186 117 23 / 0.14)",
              color: isPaid ? "#0F6E56" : "#BA7517",
            }}
          >
            <span>{isPaid ? "✓" : "⏳"}</span>
            {isPaid ? "مدفوعة بالكامل" : `متبقّي ${debt.toLocaleString()} ₪`}
          </div>
          <div className="text-[11px] text-muted dark:text-muted-dark mt-2.5">
            {inv.date} · {inv.time}
          </div>
        </Card>

        {/* Customer */}
        {customer && (
          <Card
            onClick={() => router.push(`/app/customers`)}
            className="p-3.5 mb-3.5 flex items-center gap-3"
          >
            <Avatar name={customer.name} initial={customer.initial} size={40} bg={customer.avatar_color || undefined} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-text dark:text-text-dark">{customer.name}</div>
              <div className="text-[11px] text-muted dark:text-muted-dark tj-num" dir="ltr">{customer.phone}</div>
            </div>
            <Ico name="chev" size={14} className="text-muted dark:text-muted-dark" style={{ transform: "scaleX(-1)" }} />
          </Card>
        )}

        {/* Items */}
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
          المنتجات (<Num size={11} className="text-subtext dark:text-subtext-dark" weight={700}>{inv.items.length}</Num>)
        </div>
        <Card className="mb-3.5">
          {inv.items.map((it, i, arr) => {
            const p = findProduct(it.pid);
            const lineTotal = it.qty * it.price;
            return (
              <Row
                key={`${it.pid}-${i}`}
                className={`px-3.5 py-3 gap-3 ${
                  i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text dark:text-text-dark">
                    {p?.name || "منتج محذوف"}
                  </div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                    <Shekel amt={it.price} size={10} className="text-muted dark:text-muted-dark" weight={500} /> × <Num size={10} className="text-muted dark:text-muted-dark" weight={500}>{it.qty}</Num>
                  </div>
                </div>
                <Shekel amt={lineTotal} size={13} className="text-text dark:text-text-dark" weight={700} />
              </Row>
            );
          })}
        </Card>

        {/* Installment plan */}
        {inv.installment && (
          <Card className="p-3.5 mb-3.5">
            <Row className="justify-between mb-2">
              <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
                خطة التقسيط
              </div>
              <span className="text-[10px] px-[7px] py-0.5 rounded-tj bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark font-bold">
                × <Num size={10} className="text-info dark:text-info-dark" weight={700}>{inv.installment.plan}</Num>
              </span>
            </Row>
            <Row className="justify-between mb-2">
              <div className="text-xs text-subtext dark:text-subtext-dark">مدفوع</div>
              <Shekel amt={inv.installment.paid} size={13} className="text-success dark:text-success-dark" weight={700} />
            </Row>
            <div className="h-1.5 bg-surface2 dark:bg-surface2-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-success dark:bg-success-dark transition-[width] duration-300"
                style={{ width: `${Math.min(100, (inv.installment.paid / inv.installment.total) * 100)}%` }}
              />
            </div>
          </Card>
        )}

        {/* Meta */}
        <Card>
          <Meta label="طريقة الدفع" value={inv.method} />
          <Meta label="التاريخ" value={inv.date} />
          <Meta label="الوقت" value={inv.time} />
          <Meta label="رقم الفاتورة" value={<Num size={13} className="text-text dark:text-text-dark" weight={600}>{inv.no}</Num>} last />
        </Card>
      </div>

      {!isPaid && (
        <BottomBar>
          <Btn primary fullWidth onClick={payNow}>
            <Ico name="money" size={15} sw={1.8} />
            تسجيل دفعة ({debt.toLocaleString()} ₪)
          </Btn>
        </BottomBar>
      )}
    </Screen>
  );
}

function Meta({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <Row className={`px-3.5 py-3 justify-between ${last ? "" : "border-b border-divider dark:border-divider-dark"}`}>
      <span className="text-[12px] text-subtext dark:text-subtext-dark font-medium">{label}</span>
      <span className="text-[13px] text-text dark:text-text-dark font-semibold text-end">{value}</span>
    </Row>
  );
}

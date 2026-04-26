"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store/store-context";

/**
 * Printable invoice — A4-optimized, black-on-white, no chrome.
 * Auto-triggers `window.print()` when `?auto=1` is in the URL.
 * Saves as PDF via the browser's "save as PDF" option in the print dialog.
 */
export default function PrintableInvoice() {
  const params = useParams<{ id: string }>();
  const { state, findInvoice, findCustomer, findProduct } = useStore();
  const inv = findInvoice(params.id);

  // Auto-open print dialog shortly after mount so it feels instant
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("auto") === "1") {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, []);

  if (!inv) {
    return (
      <div className="p-10 text-center font-serif">
        <h1 className="text-2xl font-bold">الفاتورة غير موجودة</h1>
      </div>
    );
  }

  const customer = findCustomer(inv.customerId);
  const store = state.storeSettings;
  const debt = inv.total - inv.paid;
  const isPaid = debt <= 0;
  const subtotal = inv.items.reduce((s, it) => s + it.qty * it.price, 0);

  return (
    <>
      {/* Screen-only controls bar */}
      <div className="print:hidden bg-gray-100 py-4 border-b border-gray-300">
        <div className="max-w-[800px] mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => window.close()}
            className="text-sm text-gray-700 hover:text-black"
          >
            ← إغلاق
          </button>
          <h2 className="text-sm font-bold text-gray-900">معاينة الطباعة</h2>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded hover:opacity-90"
            style={{ backgroundColor: "#0F6E56" }}
          >
            🖨 طباعة
          </button>
        </div>
      </div>

      {/* A4 sheet */}
      <div className="invoice-sheet max-w-[800px] mx-auto bg-white text-black px-10 py-10 font-ar" style={{ minHeight: "297mm" }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-5 mb-8">
          <div>
            <div className="text-[28px] font-bold tracking-tight">{store.store_name || "محلّنا"}</div>
            <div className="text-[12px] text-gray-700 mt-1">{store.business_type || "—"}</div>
            {store.store_address && <div className="text-[11px] text-gray-600 mt-2">{store.store_address}</div>}
            {store.store_phone && (
              <div className="text-[11px] text-gray-600 mt-1" dir="ltr">
                📞 {store.store_phone}
              </div>
            )}
            {/* business number not stored on store settings in current model */}
          </div>
          <div className="text-end">
            <div className="text-[32px] font-bold uppercase tracking-tight">فاتورة</div>
            <div className="text-[11px] text-gray-600 mt-1">INVOICE</div>
            <div className="mt-3 inline-block bg-black text-white px-3 py-1 text-[13px] font-bold tj-num">
              #{inv.no}
            </div>
          </div>
        </div>

        {/* Customer + Meta */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">مُرسَلة إلى</div>
            {customer ? (
              <>
                <div className="text-[15px] font-bold">{customer.name}</div>
                {customer.phone && <div className="text-[11px] text-gray-700 mt-0.5 tj-num" dir="ltr">{customer.phone}</div>}
                {customer.address && <div className="text-[11px] text-gray-700 mt-0.5">{customer.address}</div>}
                {/* no business_number on Customer model */}
              </>
            ) : (
              <div className="text-[13px] text-gray-600">بيع نقدي</div>
            )}
          </div>

          <div className="text-end">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="text-gray-600">التاريخ</div>
              <div className="font-bold">{inv.date}</div>
              <div className="text-gray-600">الوقت</div>
              <div className="font-bold">{inv.time}</div>
              <div className="text-gray-600">طريقة الدفع</div>
              <div className="font-bold">{inv.method}</div>
              {inv.installment && (
                <>
                  <div className="text-gray-600">تقسيط</div>
                  <div className="font-bold tj-num">× {inv.installment.plan} دفعات</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-black text-white">
              <th className="text-start px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider">#</th>
              <th className="text-start px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider">المنتج</th>
              <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider">الكمية</th>
              <th className="text-end px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider">السعر</th>
              <th className="text-end px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => {
              const p = findProduct(it.pid);
              return (
                <tr key={`${it.pid}-${i}`} className="border-b border-gray-200">
                  <td className="px-3 py-2.5 text-[11px] tj-num text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2.5 text-[12px] font-semibold">{p?.name || "—"}</td>
                  <td className="px-3 py-2.5 text-center text-[11px] tj-num">{it.qty}</td>
                  <td className="px-3 py-2.5 text-end text-[11px] tj-num">{it.price.toLocaleString()} ₪</td>
                  <td className="px-3 py-2.5 text-end text-[12px] font-bold tj-num">{(it.qty * it.price).toLocaleString()} ₪</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals block */}
        <div className="flex justify-end mb-10">
          <div className="w-[280px] space-y-2 text-[12px]">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-700">المجموع الفرعي</span>
              <span className="tj-num font-semibold">{subtotal.toLocaleString()} ₪</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-700">الإجمالي</span>
              <span className="tj-num font-bold text-[14px]">{inv.total.toLocaleString()} ₪</span>
            </div>
            {inv.paid > 0 && (
              <>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-700">مدفوع</span>
                  <span className="tj-num font-semibold">{inv.paid.toLocaleString()} ₪</span>
                </div>
                <div className="flex justify-between py-2 bg-gray-100 px-2 rounded">
                  <span className="font-bold">{isPaid ? "الحالة" : "المتبقّي"}</span>
                  <span className={`tj-num font-bold text-[14px] ${isPaid ? "" : ""}`}>
                    {isPaid ? "✓ مدفوعة" : `${debt.toLocaleString()} ₪`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8 p-4 border border-gray-300 bg-gray-50 rounded text-[11px] text-gray-700 leading-relaxed">
          <div className="font-bold mb-1">ملاحظات</div>
          {isPaid ? (
            <div>شكراً لتعاملك معنا — نتمنى رؤيتك مرة أخرى.</div>
          ) : (
            <div>المبلغ المتبقّي <span className="tj-num font-bold">{debt.toLocaleString()} ₪</span> يُرجى سداده في أقرب فرصة. شكراً لتعاونكم.</div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-5 border-t border-gray-300 flex items-center justify-between text-[10px] text-gray-500">
          <div>هذه الفاتورة تم إنشاؤها إلكترونياً — لا تحتاج توقيع</div>
          <div>Tijarti · تجارتي</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white !important;
          }
          .invoice-sheet {
            box-shadow: none !important;
            padding: 15mm !important;
          }
        }
      `}</style>
    </>
  );
}

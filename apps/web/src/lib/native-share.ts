/**
 * Native share helpers — wrap `navigator.share` with clipboard fallback.
 *
 * Use these on invoice/customer detail pages so we get the real OS-level
 * share sheet on supported devices, and a "copied to clipboard" UX
 * everywhere else.
 */

import type { Invoice, Customer } from "@/lib/store/types";

export interface ShareResult {
  method: "native" | "clipboard" | "none";
  ok: boolean;
}

async function doShare(data: { title: string; text: string; url?: string }): Promise<ShareResult> {
  if (typeof navigator === "undefined") return { method: "none", ok: false };
  // Try the native share sheet first
  if (typeof (navigator as any).share === "function") {
    try {
      await (navigator as any).share(data);
      return { method: "native", ok: true };
    } catch {
      // user cancelled — treat as no-op (still count as handled)
      return { method: "native", ok: false };
    }
  }
  // Fallback — copy text to clipboard
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${data.text}${data.url ? `\n${data.url}` : ""}`);
      return { method: "clipboard", ok: true };
    } catch {
      return { method: "clipboard", ok: false };
    }
  }
  return { method: "none", ok: false };
}

/** Share an invoice — full summary text with total, customer, items. */
export async function shareInvoice(invoice: Invoice, customerName?: string): Promise<ShareResult> {
  const itemsLine = invoice.items.length > 0
    ? `${invoice.items.length} بند`
    : "";
  const text =
    `فاتورة رقم ${invoice.no}\n` +
    (customerName ? `الزبون: ${customerName}\n` : "") +
    `التاريخ: ${invoice.date}\n` +
    `المجموع: ${invoice.total.toLocaleString()} ₪\n` +
    `المدفوع: ${invoice.paid.toLocaleString()} ₪\n` +
    `طريقة الدفع: ${invoice.method}` +
    (itemsLine ? `\n${itemsLine}` : "");
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/app/invoices/${invoice.id}`
    : undefined;
  return doShare({
    title: `فاتورة ${invoice.no}`,
    text,
    url,
  });
}

/** Share a customer — basic contact + debt info. */
export async function shareCustomer(customer: Customer): Promise<ShareResult> {
  const text =
    `${customer.name}\n` +
    (customer.phone ? `هاتف: ${customer.phone}\n` : "") +
    (customer.whatsapp ? `واتس آب: ${customer.whatsapp}\n` : "") +
    (customer.debt > 0 ? `مستحقات: ${customer.debt.toLocaleString()} ₪\n` : "") +
    `إجمالي الإنفاق: ${customer.totalSpent.toLocaleString()} ₪`;
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/app/customers/${customer.id}`
    : undefined;
  return doShare({
    title: customer.name,
    text,
    url,
  });
}

/** Generic text share. */
export async function shareText(title: string, text: string, url?: string): Promise<ShareResult> {
  return doShare({ title, text, url });
}

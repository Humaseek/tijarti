/**
 * WhatsApp sharing helpers.
 *
 * Builds `https://wa.me/{phone}?text={msg}` URLs and provides message
 * templates for common actions (invoice share, payment reminder, etc.).
 *
 * Phone numbers are normalized to international format without `+` —
 * which is what wa.me expects. Israeli numbers defaulting to `972`.
 */

const DEFAULT_COUNTRY_CODE = "972"; // Israel

/**
 * Normalize a phone number to the format wa.me expects: digits only,
 * country-code prefix, no leading `+` or `0`.
 *
 * Examples:
 *   "054-433-2211"   → "972544332211"
 *   "0544332211"     → "972544332211"
 *   "+972544332211"  → "972544332211"
 *   "972544332211"   → "972544332211"
 *   "044332211"      → "972044332211" (keeps as-is if no leading 0 recognized)
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Strip everything that isn't a digit or +
  let s = phone.replace(/[^\d+]/g, "");
  if (!s) return null;
  // Drop leading +
  if (s.startsWith("+")) s = s.slice(1);
  // If it starts with 0 (local Israeli format), replace with country code
  if (s.startsWith("0")) s = DEFAULT_COUNTRY_CODE + s.slice(1);
  // If it doesn't start with a country code digit pattern, prepend default
  if (!/^\d{10,15}$/.test(s)) return null;
  return s;
}

/** Build a wa.me URL for a phone + message. Returns null if phone invalid. */
export function whatsappUrl(phone: string | null | undefined, text: string): string | null {
  const p = normalizePhone(phone);
  if (!p) return null;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

/** Fallback: open WhatsApp with just a message (user picks the contact). */
export function whatsappUrlNoContact(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// ─── Message templates ─────────────────────────────────────────────────────

export interface InvoiceShareData {
  storeName: string;
  customerName?: string;
  invoiceNo: number | string;
  total: number;
  paid: number;
  date: string;
  method?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
}

/** Message for sharing an invoice with the customer. */
export function invoiceMessage(d: InvoiceShareData): string {
  const remaining = d.total - d.paid;
  const isPaid = remaining <= 0;
  const lines: string[] = [];

  if (d.customerName) {
    lines.push(`مرحباً ${d.customerName} 👋`);
    lines.push("");
  }

  lines.push(`🧾 *فاتورة رقم ${d.invoiceNo}*`);
  lines.push(`التاريخ: ${d.date}`);
  if (d.method) lines.push(`طريقة الدفع: ${d.method}`);
  lines.push("");

  if (d.items && d.items.length > 0) {
    lines.push("*المنتجات:*");
    for (const it of d.items) {
      lines.push(`• ${it.name} — ${it.qty} × ${it.price.toLocaleString()} ₪`);
    }
    lines.push("");
  }

  lines.push(`💰 *الإجمالي:* ${d.total.toLocaleString()} ₪`);
  if (d.paid > 0 && !isPaid) {
    lines.push(`✓ مدفوع: ${d.paid.toLocaleString()} ₪`);
    lines.push(`⏳ متبقّي: ${remaining.toLocaleString()} ₪`);
  } else if (isPaid) {
    lines.push("✅ مدفوعة بالكامل");
  }

  lines.push("");
  lines.push(`شكراً لتعاملك معنا — ${d.storeName}`);

  return lines.join("\n");
}

/** Shorter reminder message for overdue / upcoming payments. */
export function paymentReminderMessage(d: {
  storeName: string;
  customerName?: string;
  invoiceNo: number | string;
  remaining: number;
  dueDate?: string;
}): string {
  const lines: string[] = [];
  if (d.customerName) lines.push(`مرحباً ${d.customerName} 👋`);
  lines.push("");
  lines.push(`📋 تذكير بخصوص فاتورة رقم *${d.invoiceNo}*`);
  lines.push(`المبلغ المستحق: *${d.remaining.toLocaleString()} ₪*`);
  if (d.dueDate) lines.push(`تاريخ الاستحقاق: ${d.dueDate}`);
  lines.push("");
  lines.push(`نرجو التواصل معنا لترتيب الدفع. شكراً لتعاونك.`);
  lines.push(`— ${d.storeName}`);
  return lines.join("\n");
}

/** Check-due reminder. */
export function checkReminderMessage(d: {
  storeName: string;
  partyName?: string;
  checkNumber: string;
  amount: number;
  dueDate: string;
}): string {
  const lines: string[] = [];
  if (d.partyName) lines.push(`مرحباً ${d.partyName} 👋`);
  lines.push("");
  lines.push(`💳 تذكير بشيك رقم *${d.checkNumber}*`);
  lines.push(`المبلغ: ${d.amount.toLocaleString()} ₪`);
  lines.push(`تاريخ الاستحقاق: ${d.dueDate}`);
  lines.push("");
  lines.push(`— ${d.storeName}`);
  return lines.join("\n");
}

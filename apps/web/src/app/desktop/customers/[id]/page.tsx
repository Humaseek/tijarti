"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import { BarChart } from "@/components/charts";
import { useStore } from "@/lib/store/store-context";
import { INCOME } from "@/lib/chart-palette";
import { whatsappUrl, whatsappUrlNoContact, paymentReminderMessage } from "@/lib/whatsapp";
import { useLoyaltyLog, loyaltyBalance } from "@/lib/extensions-store";

export default function DesktopCustomerDetail() {
  const params = useParams<{ id: string }>();
  const { state, findCustomer } = useStore();
  const { list: loyaltyLog } = useLoyaltyLog();
  const c = findCustomer(params.id);
  const points = c ? loyaltyBalance(loyaltyLog, c.id) : 0;

  if (!c) {
    return (
      <DesktopPage breadcrumb="الزبائن" backHref="/desktop/customers" title="الزبون غير موجود">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center">
          <Ico name="users" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
          <div className="text-[13px] text-muted dark:text-muted-dark">هذا الزبون مش موجود</div>
        </div>
      </DesktopPage>
    );
  }

  const invoices = state.invoices.filter((i) => i.customerId === c.id);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);
  const outstanding = invoices.reduce((s, i) => s + (i.total - i.paid), 0);
  const relatedChecks = state.checks.filter((ch) => ch.party_name === c.name && ch.direction === "incoming");
  const relatedDebts = state.debts.filter((d) => d.party_name === c.name && d.direction === "incoming");

  return (
    <DesktopPage
      breadcrumb="الزبائن"
      backHref="/desktop/customers"
      title={c.name}
      subtitle={`${c.tag} · ${c.invoices} فاتورة · ${c.lastVisit || "—"}`}
      actions={
        <>
          {c.debt > 0 && (
            <button
              onClick={() => {
                const msg = paymentReminderMessage({
                  storeName: state.storeSettings.store_name || "محلّنا",
                  customerName: c.name,
                  invoiceNo: invoices.find((i) => i.total - i.paid > 0)?.no ?? "—",
                  remaining: c.debt,
                });
                const url = whatsappUrl(c.whatsapp || c.phone, msg) || whatsappUrlNoContact(msg);
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-tj text-[12px] font-bold text-white hover:opacity-90"
              style={{ background: "#25D366" }}
              title="إرسال تذكير واتساب"
            >
              <Ico name="whatsapp" size={13} sw={1.8} />
              تذكير واتساب
            </button>
          )}
          <Link href={`/desktop/customers/${c.id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
            <Ico name="edit" size={13} sw={1.8} />
            تعديل
          </Link>
          {c.debt > 0 && (
            <Link href={`/desktop/customers/${c.id}/debt`} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-warning dark:bg-warning-dark text-white text-[12px] font-bold hover:opacity-90">
              تسجيل دفعة
            </Link>
          )}
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4 mb-5">
        {/* Identity card */}
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="flex flex-col items-center text-center mb-4">
            <Avatar name={c.name} initial={c.initial} size={80} bg={c.avatar_color || undefined} />
            <div className="text-[16px] font-bold text-text dark:text-text-dark mt-3">{c.name}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${
                c.tag === "VIP" ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                : c.tag === "جديدة" ? "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
                : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
              }`}>{c.tag}</span>
              {points > 0 && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-tj bg-primary/10 text-primary flex items-center gap-1" title={`${points} نقطة ولاء`}>
                  ⭐ <Num size={10} className="text-primary" weight={700}>{points}</Num> نقطة
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-divider dark:border-divider-dark">
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-[12px] text-text dark:text-text-dark hover:text-primary">
                <Ico name="phone" size={13} className="text-muted dark:text-muted-dark" sw={1.8} />
                <span dir="ltr" className="tj-num">{c.phone}</span>
              </a>
            )}
            {c.whatsapp && c.whatsapp !== c.phone && (
              <a href={`https://wa.me/${c.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-text dark:text-text-dark hover:text-primary">
                <Ico name="whatsapp" size={13} className="text-success dark:text-success-dark" sw={1.8} />
                <span dir="ltr" className="tj-num">{c.whatsapp}</span>
              </a>
            )}
            {c.address && (
              <div className="flex items-start gap-2 text-[12px] text-text dark:text-text-dark">
                <Ico name="store" size={13} className="text-muted dark:text-muted-dark" sw={1.8} />
                <span>{c.address}</span>
              </div>
            )}
            {c.birthday && (
              <div className="flex items-center gap-2 text-[12px] text-text dark:text-text-dark">
                <Ico name="calendar" size={13} className="text-muted dark:text-muted-dark" sw={1.8} />
                <span>{c.birthday}</span>
              </div>
            )}
          </div>
          {c.notes && (
            <div className="mt-4 pt-4 border-t border-divider dark:border-divider-dark">
              <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider mb-1">ملاحظات</div>
              <div className="text-[12px] text-text dark:text-text-dark leading-relaxed">{c.notes}</div>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="col-span-8 grid grid-cols-2 gap-4 auto-rows-min">
          <Stat label="إجمالي المشتريات" value={<Shekel amt={c.totalSpent} size={24} className="text-success dark:text-success-dark" weight={700} />} />
          <Stat label="عدد الفواتير" value={<Num size={24} className="text-text dark:text-text-dark" weight={700}>{c.invoices}</Num>} />
          <Stat label="دين حالي" value={<Shekel amt={c.debt} size={24} className={c.debt > 0 ? "text-warning dark:text-warning-dark" : "text-muted dark:text-muted-dark"} weight={700} />} tone={c.debt > 0 ? "warn" : undefined} />
          <Stat label="آخر زيارة" value={<div className="text-[14px] font-bold text-text dark:text-text-dark">{c.lastVisit || "—"}</div>} />
        </div>
      </div>

      {/* Activity timeline — chronological history of invoices, checks, debts */}
      <CustomerTimeline customerName={c.name} invoices={invoices} checks={relatedChecks} debts={relatedDebts} />

      {/* Invoices chart */}
      {invoices.length > 0 && (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-4">
          <h2 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">قيمة الفواتير</h2>
          <BarChart
            orientation="horizontal"
            data={invoices.slice(0, 5).map((inv) => ({
              label: `#${inv.no}`,
              value: inv.total,
              compareValue: inv.paid,
              color: inv.total - inv.paid > 0 ? INCOME.light : INCOME.dark,
              sub: inv.total - inv.paid > 0 ? `متبقّي ${(inv.total - inv.paid).toLocaleString()} ₪` : "مدفوعة",
            }))}
          />
          <div className="text-[10px] text-muted dark:text-muted-dark mt-3 text-center">الشريط الأغمق = الإجمالي · الأفتح = المدفوع</div>
        </div>
      )}

      {/* Invoices table */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-divider dark:border-divider-dark flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-text dark:text-text-dark">الفواتير ({invoices.length})</h2>
          {invoices.length > 0 && (
            <div className="text-[11px] text-muted dark:text-muted-dark">
              مدفوع: <span className="text-success dark:text-success-dark font-bold tj-num">{totalPaid.toLocaleString()} ₪</span>
              {outstanding > 0 && <> · متبقّي: <span className="text-warning dark:text-warning-dark font-bold tj-num">{outstanding.toLocaleString()} ₪</span></>}
            </div>
          )}
        </div>
        {invoices.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-muted dark:text-muted-dark">ما في فواتير</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">#</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التاريخ</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">طريقة الدفع</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المبلغ</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">متبقّي</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const debt = inv.total - inv.paid;
                return (
                  <tr key={inv.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark">
                    <td className="px-4 py-3"><Link href={`/desktop/invoices/${inv.id}`} className="text-[12px] font-bold text-primary hover:underline">#{inv.no}</Link></td>
                    <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{inv.date}</td>
                    <td className="px-4 py-3 text-[11px] text-text dark:text-text-dark">{inv.method}</td>
                    <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-text dark:text-text-dark">{inv.total.toLocaleString()} ₪</td>
                    <td className="px-4 py-3 text-end">
                      {debt > 0
                        ? <span className="text-[12px] font-bold text-warning dark:text-warning-dark tj-num">{debt.toLocaleString()} ₪</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-tj bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark">مدفوعة</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(relatedChecks.length > 0 || relatedDebts.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h2 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">الشيكات ({relatedChecks.length})</h2>
            {relatedChecks.length === 0 ? <div className="text-[11px] text-muted dark:text-muted-dark">لا شيكات</div> : (
              <div className="space-y-2">
                {relatedChecks.map((ch) => (
                  <Link key={ch.id} href={`/desktop/checks/${ch.id}`} className="flex items-center justify-between p-2.5 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark hover:border-primary">
                    <div>
                      <div className="text-[12px] font-bold text-text dark:text-text-dark">#{ch.number}</div>
                      <div className="text-[10px] text-muted dark:text-muted-dark">{ch.due_date}</div>
                    </div>
                    <div className="text-end">
                      <Shekel amt={ch.amount} size={12} className="text-text dark:text-text-dark" weight={700} />
                      <div className={`text-[9px] font-bold mt-0.5 ${ch.status === "cashed" ? "text-success dark:text-success-dark" : ch.status === "bounced" ? "text-danger dark:text-danger-dark" : "text-info dark:text-info-dark"}`}>{ch.status === "cashed" ? "محصّل" : ch.status === "bounced" ? "مرتجع" : "قيد"}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h2 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">على الحساب ({relatedDebts.length})</h2>
            {relatedDebts.length === 0 ? <div className="text-[11px] text-muted dark:text-muted-dark">لا ذمم</div> : (
              <div className="space-y-2">
                {relatedDebts.map((d) => (
                  <Link key={d.id} href={`/desktop/debts/${d.id}`} className="flex items-center justify-between p-2.5 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark hover:border-primary">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-text dark:text-text-dark truncate">{d.description}</div>
                      <div className="text-[10px] text-muted dark:text-muted-dark">{d.due_date || "—"}</div>
                    </div>
                    <Shekel amt={d.amount} size={12} className="text-text dark:text-text-dark" weight={700} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DesktopPage>
  );
}

// ─── Activity timeline — shows invoices, checks, and debts chronologically ──
type TimelineEvent = {
  id: string;
  date: string;
  kind: "invoice" | "check" | "debt";
  label: string;
  sub: string;
  amount: number;
  direction: "in" | "out"; // from the shop's perspective
  href: string;
  status?: string;
};

function CustomerTimeline({
  customerName,
  invoices,
  checks,
  debts,
}: {
  customerName: string;
  invoices: { id: string; no: string; date: string; total: number; paid: number; method: string }[];
  checks: { id: string; number: string; due_date: string | null; amount: number; status: string; direction: string }[];
  debts: { id: string; description: string; issued_date: string; due_date?: string | null; amount: number; status: string; direction: string }[];
}) {
  const events: TimelineEvent[] = [
    ...invoices.map((inv) => ({
      id: `inv:${inv.id}`,
      date: inv.date,
      kind: "invoice" as const,
      label: `فاتورة #${inv.no}`,
      sub: `${inv.method} · ${inv.paid >= inv.total ? "مدفوعة" : `متبقّي ${(inv.total - inv.paid).toLocaleString()} ₪`}`,
      amount: inv.total,
      direction: "in" as const,
      href: `/desktop/invoices/${inv.id}`,
    })),
    ...checks.map((ch) => ({
      id: `chk:${ch.id}`,
      date: ch.due_date || "",
      kind: "check" as const,
      label: `شيك #${ch.number}`,
      sub: ch.status === "cashed" ? "✓ محصّل" : ch.status === "bounced" ? "⚠ مرتجع" : "قيد الاستحقاق",
      amount: ch.amount,
      direction: "in" as const,
      href: `/desktop/checks/${ch.id}`,
      status: ch.status,
    })),
    ...debts.map((d) => ({
      id: `debt:${d.id}`,
      date: d.due_date || d.issued_date,
      kind: "debt" as const,
      label: d.description || "على الحساب",
      sub: d.status === "settled" ? "✓ مسدّدة" : `قيد التسديد${d.due_date ? ` · ${d.due_date}` : ""}`,
      amount: d.amount,
      direction: "in" as const,
      href: `/desktop/debts/${d.id}`,
      status: d.status,
    })),
  ].sort((a, b) => (a.date > b.date ? -1 : 1));

  if (events.length === 0) return null;

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[14px] font-bold text-text dark:text-text-dark">الخط الزمني</h2>
          <p className="text-[10px] text-muted dark:text-muted-dark">كل تعاملات {customerName} بالترتيب الزمني</p>
        </div>
        <span className="text-[10px] font-bold text-muted dark:text-muted-dark bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-2 py-0.5">
          {events.length} حدث
        </span>
      </div>
      <div className="relative ps-6">
        {/* Vertical line */}
        <div className="absolute top-1 bottom-1 w-px bg-divider dark:bg-divider-dark" style={{ insetInlineStart: "9px" }} />
        <div className="space-y-3">
          {events.slice(0, 10).map((ev) => {
            const kindStyle =
              ev.kind === "invoice" ? { bg: "bg-primary", icon: "receipt" as const, color: "text-primary" }
              : ev.kind === "check" ? { bg: "bg-warning dark:bg-warning-dark", icon: "receipt" as const, color: "text-warning dark:text-warning-dark" }
              : { bg: "bg-info dark:bg-info-dark", icon: "money" as const, color: "text-info dark:text-info-dark" };
            return (
              <Link
                key={ev.id}
                href={ev.href}
                className="block relative group"
              >
                {/* Dot */}
                <div
                  className={`absolute w-[18px] h-[18px] rounded-full border-[3px] border-surface dark:border-surface-dark ${kindStyle.bg} group-hover:scale-110 transition-transform`}
                  style={{ insetInlineStart: "-22px", top: "3px" }}
                />
                <div className="flex items-center gap-3 p-3 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark group-hover:border-primary transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Ico name={kindStyle.icon} size={12} className={kindStyle.color} sw={1.8} />
                      <span className="text-[12px] font-bold text-text dark:text-text-dark truncate">{ev.label}</span>
                      <span className="text-[10px] text-muted dark:text-muted-dark">· {ev.date}</span>
                    </div>
                    <div className="text-[10px] text-muted dark:text-muted-dark">{ev.sub}</div>
                  </div>
                  <Shekel
                    amt={ev.amount}
                    size={13}
                    className="text-text dark:text-text-dark"
                    weight={700}
                  />
                </div>
              </Link>
            );
          })}
          {events.length > 10 && (
            <div className="text-center text-[11px] text-muted dark:text-muted-dark pt-2">
              … {events.length - 10} حدث أقدم (استعرضي الأقسام بالأسفل)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" }) {
  return (
    <div className={`bg-surface dark:bg-surface-dark rounded-tj border p-5 ${tone === "warn" ? "border-warning dark:border-warning-dark border-s-[3px] border-s-warning dark:border-s-warning-dark" : "border-divider dark:border-divider-dark"}`}>
      <div className="text-[11px] text-muted dark:text-muted-dark mb-1.5">{label}</div>
      <div>{value}</div>
    </div>
  );
}

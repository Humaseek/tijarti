"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import { PieChart, BarChart } from "@/components/charts";
import { useStore } from "@/lib/store/store-context";
import { formatArDateShort } from "@/lib/dates";
import { EXPENSE } from "@/lib/chart-palette";

export default function DesktopSupplierDetail() {
  const params = useParams<{ id: string }>();
  const { state, findSupplier, supplierStats } = useStore();
  const s = findSupplier(params.id);

  if (!s) {
    return (
      <DesktopPage breadcrumb="الموردين" backHref="/desktop/suppliers" title="المورد غير موجود">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center">
          <Ico name="store" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
          <div className="text-[13px] text-muted dark:text-muted-dark">هذا المورد مش موجود</div>
        </div>
      </DesktopPage>
    );
  }

  const stats = supplierStats(s.id);
  const checks = state.checks.filter((c) => c.party_name === s.name && c.direction === "outgoing");
  const debts = state.debts.filter((d) => d.party_name === s.name && d.direction === "outgoing");
  const allEvents = [
    ...checks.map((c) => ({ kind: "check" as const, id: c.id, amount: c.amount, date: c.due_date, status: c.status, ref: `شيك #${c.number}` })),
    ...debts.map((d) => ({ kind: "debt" as const, id: d.id, amount: d.amount, date: d.due_date || d.issued_date, status: d.status, ref: `على الحساب · ${d.description}` })),
  ].sort((a, b) => (a.date && b.date ? (a.date > b.date ? -1 : 1) : 0));

  return (
    <DesktopPage
      breadcrumb="الموردين"
      backHref="/desktop/suppliers"
      title={s.name}
      subtitle={`${s.default_category || "مورد"} · ${stats.invoiceCount} معاملة`}
      actions={
        <Link href={`/desktop/suppliers/${s.id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
          <Ico name="edit" size={13} sw={1.8} />
          تعديل
        </Link>
      }
    >
      <div className="grid grid-cols-12 gap-4 mb-5">
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="flex flex-col items-center text-center mb-4">
            <Avatar name={s.name} initial={s.initial} size={80} bg={s.avatar_color || undefined} />
            <div className="text-[16px] font-bold text-text dark:text-text-dark mt-3">{s.name}</div>
            {s.default_category && <span className="text-[10px] font-semibold text-muted dark:text-muted-dark mt-1">{s.default_category}</span>}
          </div>
          <div className="space-y-2 pt-4 border-t border-divider dark:border-divider-dark">
            {s.phone && (
              <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-[12px] text-text dark:text-text-dark hover:text-primary">
                <Ico name="phone" size={13} className="text-muted dark:text-muted-dark" sw={1.8} />
                <span dir="ltr" className="tj-num">{s.phone}</span>
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-[12px] text-text dark:text-text-dark hover:text-primary">
                <Ico name="mail" size={13} className="text-muted dark:text-muted-dark" sw={1.8} />
                <span dir="ltr">{s.email}</span>
              </a>
            )}
            {s.address && <div className="flex items-start gap-2 text-[12px] text-text dark:text-text-dark"><Ico name="store" size={13} className="text-muted dark:text-muted-dark" sw={1.8} /><span>{s.address}</span></div>}
            {s.business_number && <div className="flex items-center gap-2 text-[12px] text-text dark:text-text-dark"><Ico name="info" size={13} className="text-muted dark:text-muted-dark" sw={1.8} /><span dir="ltr" className="tj-num">{s.business_number}</span></div>}
            {s.payment_terms && <div className="flex items-center gap-2 text-[12px] text-text dark:text-text-dark"><Ico name="clock" size={13} className="text-muted dark:text-muted-dark" sw={1.8} /><span>{s.payment_terms}</span></div>}
          </div>
          {s.notes && (
            <div className="mt-4 pt-4 border-t border-divider dark:border-divider-dark">
              <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider mb-1">ملاحظات</div>
              <div className="text-[12px] text-text dark:text-text-dark leading-relaxed">{s.notes}</div>
            </div>
          )}
        </div>
        <div className="col-span-8 grid grid-cols-3 gap-4 auto-rows-min">
          <Stat label="المدفوع" value={<Shekel amt={stats.totalPaid} size={24} className="text-success dark:text-success-dark" weight={700} />} />
          <Stat label="مستحق عليكِ" value={<Shekel amt={stats.outstanding} size={24} className={stats.outstanding > 0 ? "text-danger dark:text-danger-dark" : "text-muted dark:text-muted-dark"} weight={700} />} tone={stats.outstanding > 0 ? "warn" : undefined} />
          <Stat label="عدد المعاملات" value={<Num size={24} className="text-text dark:text-text-dark" weight={700}>{stats.invoiceCount}</Num>} />
          <Stat label="آخر معاملة" value={<div className="text-[14px] font-bold text-text dark:text-text-dark">{stats.lastPurchaseIso ? formatArDateShort(stats.lastPurchaseIso) : "—"}</div>} />
        </div>
      </div>

      {allEvents.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">توزيع المعاملات</h2>
            <PieChart
              data={[
                { label: "شيكات", value: checks.reduce((s, c) => s + c.amount, 0), color: EXPENSE.dark },
                { label: "على الحساب", value: debts.reduce((s, d) => s + d.amount, 0), color: EXPENSE.light },
              ].filter((d) => d.value > 0)}
              size={180}
              innerRatio={0.55}
              centerLabel="الإجمالي"
              centerValue={<Shekel amt={checks.reduce((s, c) => s + c.amount, 0) + debts.reduce((s, d) => s + d.amount, 0)} size={14} className="text-text dark:text-text-dark" weight={700} />}
            />
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">أكبر المعاملات</h2>
            <BarChart
              orientation="horizontal"
              data={allEvents.slice(0, 5).map((ev) => ({
                label: ev.ref,
                value: ev.amount,
                color: ev.status === "cashed" || ev.status === "settled" ? EXPENSE.dark : ev.status === "bounced" ? EXPENSE.darkest : EXPENSE.light,
                sub: ev.status === "cashed" ? "محصّل" : ev.status === "settled" ? "مسدّد" : ev.status === "bounced" ? "مرتجع" : "قيد الانتظار",
              }))}
            />
          </div>
        </div>
      )}

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        <div className="px-5 py-4 border-b border-divider dark:border-divider-dark">
          <h2 className="text-[14px] font-bold text-text dark:text-text-dark">سجل المعاملات ({allEvents.length})</h2>
        </div>
        {allEvents.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-muted dark:text-muted-dark">ما في معاملات</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">النوع</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المرجع</th>
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">التاريخ</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">المبلغ</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.map((ev) => (
                <tr key={`${ev.kind}:${ev.id}`} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark">
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${ev.kind === "check" ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark" : "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"}`}>{ev.kind === "check" ? "شيك" : "على الحساب"}</span></td>
                  <td className="px-4 py-3"><Link href={ev.kind === "check" ? `/desktop/checks/${ev.id}` : `/desktop/debts/${ev.id}`} className="text-[12px] font-bold text-text dark:text-text-dark hover:text-primary">{ev.ref}</Link></td>
                  <td className="px-4 py-3 text-[11px] text-muted dark:text-muted-dark">{ev.date ? formatArDateShort(ev.date) : "—"}</td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-text dark:text-text-dark">{ev.amount.toLocaleString()} ₪</td>
                  <td className="px-4 py-3 text-end"><span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${
                    ev.status === "cashed" || ev.status === "settled" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                    : ev.status === "bounced" ? "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
                    : "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
                  }`}>{ev.status === "cashed" ? "محصّل" : ev.status === "settled" ? "مسدّد" : ev.status === "bounced" ? "مرتجع" : "قيد"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DesktopPage>
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

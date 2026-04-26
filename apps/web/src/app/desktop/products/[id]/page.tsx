"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { PieChart, BarChart } from "@/components/charts";
import { useStore } from "@/lib/store/store-context";
import { INCOME, shadesFor } from "@/lib/chart-palette";

export default function DesktopProductDetail() {
  const params = useParams<{ id: string }>();
  const { state, findProduct, calculateMargin, getProductStats } = useStore();
  const p = findProduct(params.id);

  if (!p) {
    return (
      <DesktopPage breadcrumb="المنتجات" backHref="/desktop/products" title="المنتج غير موجود">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center">
          <Ico name="box" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} />
          <div className="text-[13px] text-muted dark:text-muted-dark">هذا المنتج مش موجود</div>
        </div>
      </DesktopPage>
    );
  }

  const stats = getProductStats(p.id);
  const margin = calculateMargin(p.price, p.cost);
  const low = p.stock < (p.low_stock_threshold || 5);
  const inactive = p.is_active === false;

  const buyers = new Map<string, { count: number; qty: number; amount: number }>();
  for (const inv of state.invoices) {
    for (const it of inv.items) {
      if (it.pid === p.id) {
        const prev = buyers.get(inv.customerId) || { count: 0, qty: 0, amount: 0 };
        buyers.set(inv.customerId, { count: prev.count + 1, qty: prev.qty + it.qty, amount: prev.amount + it.qty * it.price });
      }
    }
  }
  const topBuyers = Array.from(buyers.entries())
    .map(([cid, data]) => ({ customer: state.customers.find((c) => c.id === cid), ...data }))
    .filter((b) => b.customer)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <DesktopPage
      breadcrumb="المنتجات"
      backHref="/desktop/products"
      title={p.name}
      subtitle={`${p.category} · SKU ${p.sku}${inactive ? " · موقوف" : ""}`}
      actions={
        <Link href={`/desktop/products/${p.id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
          <Ico name="edit" size={13} sw={1.8} />
          تعديل
        </Link>
      }
    >
      <div className="grid grid-cols-12 gap-4 mb-5">
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="aspect-square bg-surface2 dark:bg-surface2-dark rounded-tj flex items-center justify-center mb-4">
            <Ico name="box" size={56} className="text-muted dark:text-muted-dark" sw={1.2} />
          </div>
          <div className="space-y-2">
            <FieldRow label="السعر" value={<Shekel amt={p.price} size={18} className="text-text dark:text-text-dark" weight={700} />} />
            <FieldRow label="التكلفة" value={<Shekel amt={p.cost} size={14} className="text-muted dark:text-muted-dark" weight={600} />} />
            <FieldRow label="هامش الربح" value={<span className={`text-[15px] font-bold tj-num ${margin >= 40 ? "text-success dark:text-success-dark" : margin >= 20 ? "text-warning dark:text-warning-dark" : "text-danger dark:text-danger-dark"}`}>{margin}%</span>} />
            <FieldRow label="الربح لكل قطعة" value={<Shekel amt={p.price - p.cost} size={13} className="text-success dark:text-success-dark" weight={700} />} />
          </div>
          {p.description && (
            <div className="mt-4 pt-4 border-t border-divider dark:border-divider-dark">
              <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider mb-1">الوصف</div>
              <div className="text-[12px] text-text dark:text-text-dark leading-relaxed">{p.description}</div>
            </div>
          )}
        </div>

        <div className="col-span-8 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="مخزون حالي" value={<div className="flex items-baseline gap-1.5"><Num size={24} className={low ? "text-warning dark:text-warning-dark" : "text-text dark:text-text-dark"} weight={700}>{p.stock}</Num><span className="text-[11px] text-muted dark:text-muted-dark">قطعة</span></div>} tone={low ? "warn" : undefined} />
            <Stat label="مبيع (كل الوقت)" value={<div className="flex items-baseline gap-1.5"><Num size={24} className="text-text dark:text-text-dark" weight={700}>{stats.soldQty}</Num><span className="text-[11px] text-muted dark:text-muted-dark">قطعة</span></div>} />
            <Stat label="قيمة المخزون" value={<Shekel amt={p.stock * p.cost} size={20} className="text-text dark:text-text-dark" weight={700} />} />
            <Stat label="إجمالي الدخل" value={<Shekel amt={stats.revenue} size={20} className="text-success dark:text-success-dark" weight={700} />} />
            <Stat label="إجمالي الربح" value={<Shekel amt={stats.profit} size={20} className="text-primary" weight={700} />} />
            <Stat label="الباركود" value={<div className="text-[13px] font-bold tj-num text-text dark:text-text-dark" dir="ltr">{p.barcode || "—"}</div>} />
          </div>

          {low && (
            <div className="bg-warning-soft/50 dark:bg-warning-soft-dark/50 border-s-[3px] border-s-warning dark:border-s-warning-dark rounded-tj p-4 flex items-center gap-3">
              <Ico name="warn" size={18} className="text-warning dark:text-warning-dark" sw={1.8} />
              <div>
                <div className="text-[13px] font-bold text-warning dark:text-warning-dark">مخزون منخفض</div>
                <div className="text-[11px] text-text dark:text-text-dark">عتبة التنبيه: {p.low_stock_threshold || 5} قطعة — أعيدي الطلب قبل النفاد</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {topBuyers.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">توزيع المبيعات على الزبائن</h2>
            <PieChart
              data={topBuyers.map((b, i, arr) => ({ label: b.customer!.name, value: b.amount, color: shadesFor("income", arr.length)[i] }))}
              size={180}
              innerRatio={0.55}
              centerLabel="إجمالي"
              centerValue={<Shekel amt={topBuyers.reduce((s, b) => s + b.amount, 0)} size={14} className="text-text dark:text-text-dark" weight={700} />}
            />
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">أكبر الزبائن بالكمية</h2>
            <BarChart
              orientation="horizontal"
              data={topBuyers.slice(0, 5).map((b, i, arr) => ({
                label: b.customer!.name,
                value: b.qty,
                color: shadesFor("income", arr.length)[i],
                sub: `${b.count} فاتورة · ${b.amount.toLocaleString()} ₪`,
              }))}
            />
          </div>
        </div>
      )}

      {topBuyers.length > 0 && (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
          <div className="px-5 py-4 border-b border-divider dark:border-divider-dark">
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">أفضل الزبائن لهذا المنتج</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الزبون</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">فواتير</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الكمية</th>
                <th className="text-end px-4 py-3 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {topBuyers.map((b) => (
                <tr key={b.customer!.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark">
                  <td className="px-4 py-3"><Link href={`/desktop/customers/${b.customer!.id}`} className="text-[12px] font-bold text-text dark:text-text-dark hover:text-primary">{b.customer!.name}</Link></td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] text-text dark:text-text-dark">{b.count}</td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] text-text dark:text-text-dark">{b.qty}</td>
                  <td className="px-4 py-3 text-end tj-num text-[12px] font-bold text-text dark:text-text-dark">{b.amount.toLocaleString()} ₪</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DesktopPage>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" }) {
  return (
    <div className={`bg-surface dark:bg-surface-dark rounded-tj border p-4 ${tone === "warn" ? "border-warning dark:border-warning-dark border-s-[3px] border-s-warning dark:border-s-warning-dark" : "border-divider dark:border-divider-dark"}`}>
      <div className="text-[11px] text-muted dark:text-muted-dark mb-1.5">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-divider/50 dark:border-divider-dark/50 last:border-0">
      <span className="text-[11px] text-muted dark:text-muted-dark">{label}</span>
      <span>{value}</span>
    </div>
  );
}

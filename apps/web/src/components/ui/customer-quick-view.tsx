"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Ico } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Shekel, Num } from "@/components/ui/num";
import { useStore } from "@/lib/store/store-context";
import { computeRfmScores, tierLabel, tierStyle } from "@/lib/rfm";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * Customer Quick-View modal — opens when a user clicks a customer's avatar
 * in the desktop customers list. Shows a compact overview of the customer
 * (stats, last invoices, contact shortcuts) without navigating away from
 * the list. A link to the full detail page is provided.
 */

interface CustomerQuickViewProps {
  customerId: string | null;
  open: boolean;
  onClose: () => void;
}

export function CustomerQuickView({ customerId, open, onClose }: CustomerQuickViewProps) {
  const { state, findCustomer } = useStore();
  const customer = customerId ? findCustomer(customerId) : null;

  const rfm = useMemo(
    () => computeRfmScores(state.customers, state.invoices),
    [state.customers, state.invoices]
  );

  const customerInvoices = useMemo(() => {
    if (!customerId) return [];
    return state.invoices
      .filter((inv) => inv.customerId === customerId)
      .slice()
      .sort((a, b) => {
        // Fallback: assume newer invoices appended later -> reverse by id if no comparable date
        if (a.date && b.date) {
          if (a.date > b.date) return -1;
          if (a.date < b.date) return 1;
        }
        return b.id.localeCompare(a.id);
      });
  }, [state.invoices, customerId]);

  const stats = useMemo(() => {
    const totalSpent = customerInvoices.reduce((s, i) => s + i.total, 0);
    return {
      totalSpent,
      invoiceCount: customerInvoices.length,
      debt: customer?.debt ?? 0,
    };
  }, [customerInvoices, customer]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !customer) return null;

  const score = rfm.get(customer.id);
  const tier = score?.tier ?? "dormant";
  const tierStyles = tierStyle(tier);
  const hasTier = score && score.tier !== "dormant";

  const phone = customer.phone || "";
  const waPhone = customer.whatsapp || customer.phone || "";
  const waUrl = whatsappUrl(waPhone, `مرحباً ${customer.name} 👋`);
  const lastThree = customerInvoices.slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] mx-4 max-h-[90vh] flex flex-col bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-divider dark:border-divider-dark">
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute top-3 end-3 w-8 h-8 rounded-tj hover:bg-surface2 dark:hover:bg-surface2-dark flex items-center justify-center text-muted dark:text-muted-dark"
          >
            <Ico name="close" size={14} sw={1.8} />
          </button>
          <div className="flex items-center gap-3 pe-10">
            <Avatar
              name={customer.name}
              initial={customer.initial}
              size={52}
              bg={customer.avatar_color || undefined}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-bold text-text dark:text-text-dark truncate">
                {customer.name}
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className={`text-[9px] font-bold px-2 py-1 rounded-tj ${
                    customer.tag === "VIP"
                      ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                      : customer.tag === "جديدة"
                      ? "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
                      : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
                  }`}
                >
                  {customer.tag}
                </span>
                {hasTier && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-1 rounded-tj ${tierStyles.bg} ${tierStyles.text}`}
                    title={`RFM: ${score!.r}-${score!.f}-${score!.m} · ${tierLabel(tier)}`}
                  >
                    {tierStyles.emoji} {tierLabel(tier)}
                  </span>
                )}
                {phone && (
                  <span className="text-[10px] text-muted dark:text-muted-dark tj-num" dir="ltr">
                    {phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {/* Contact quick actions */}
          <div className="px-5 py-3 border-b border-divider dark:border-divider-dark grid grid-cols-3 gap-2">
            <a
              href={phone ? `tel:${phone}` : undefined}
              aria-disabled={!phone}
              onClick={(e) => {
                if (!phone) e.preventDefault();
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors ${
                !phone ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <Ico name="phone" size={13} sw={1.8} />
              اتصال
            </a>
            <a
              href={waUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!waUrl}
              onClick={(e) => {
                if (!waUrl) e.preventDefault();
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-tj text-white text-[12px] font-bold hover:opacity-90 transition-opacity ${
                !waUrl ? "opacity-40 cursor-not-allowed" : ""
              }`}
              style={{ background: "#25D366" }}
            >
              <Ico name="whatsapp" size={13} sw={1.8} />
              واتساب
            </a>
            <Link
              href={`/desktop/customers/${customer.id}`}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90 transition-opacity"
            >
              <Ico name="user" size={13} sw={1.8} />
              الملف الكامل
            </Link>
          </div>

          {/* Stat cards */}
          <div className="px-5 py-4 grid grid-cols-3 gap-3">
            <StatCard label="إجمالي المشتريات">
              <Shekel
                amt={stats.totalSpent}
                size={16}
                className="text-success dark:text-success-dark"
                weight={700}
              />
            </StatCard>
            <StatCard label="عدد الفواتير">
              <Num size={16} className="text-text dark:text-text-dark" weight={700}>
                {stats.invoiceCount}
              </Num>
            </StatCard>
            <StatCard label="دين حالي">
              {stats.debt > 0 ? (
                <Shekel
                  amt={stats.debt}
                  size={16}
                  className="text-warning dark:text-warning-dark"
                  weight={700}
                />
              ) : (
                <span className="text-[13px] font-bold text-muted dark:text-muted-dark">—</span>
              )}
            </StatCard>
          </div>

          {/* Last invoices */}
          <div className="px-5 pb-5">
            <div className="text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider mb-2">
              آخر الفواتير
            </div>
            {lastThree.length === 0 ? (
              <div className="py-6 text-center rounded-tj border border-dashed border-divider dark:border-divider-dark">
                <div className="text-[12px] text-muted dark:text-muted-dark">لا فواتير بعد</div>
              </div>
            ) : (
              <div className="rounded-tj border border-divider dark:border-divider-dark divide-y divide-divider dark:divide-divider-dark overflow-hidden">
                {lastThree.map((inv) => {
                  const remaining = Math.max(0, inv.total - inv.paid);
                  return (
                    <Link
                      key={inv.id}
                      href={`/desktop/invoices/${inv.id}`}
                      onClick={onClose}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-text dark:text-text-dark">
                          #{inv.no}
                        </div>
                        <div className="text-[10px] text-muted dark:text-muted-dark">
                          {inv.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {remaining > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-tj bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark">
                            متبقّي {remaining.toLocaleString()} ₪
                          </span>
                        )}
                        <Shekel
                          amt={inv.total}
                          size={13}
                          className="text-text dark:text-text-dark"
                          weight={700}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark p-3">
      <div className="text-[10px] text-muted dark:text-muted-dark mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}

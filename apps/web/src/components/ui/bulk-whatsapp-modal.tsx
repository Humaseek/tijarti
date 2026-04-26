"use client";

import { useMemo, useState } from "react";
import { Ico } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Shekel } from "@/components/ui/num";
import { useStore } from "@/lib/store/store-context";
import { whatsappUrl, paymentReminderMessage } from "@/lib/whatsapp";

/**
 * Bulk WhatsApp reminder modal — lets the user select multiple debtor
 * customers and send individual reminders in sequence (one wa.me tab per
 * customer). Only sends to customers with a phone number.
 */

interface BulkWhatsAppModalProps {
  open: boolean;
  onClose: () => void;
}

export function BulkWhatsAppModal({ open, onClose }: BulkWhatsAppModalProps) {
  const { state } = useStore();
  const debtors = useMemo(
    () => state.customers.filter((c) => c.debt > 0 && (c.whatsapp || c.phone)).sort((a, b) => b.debt - a.debt),
    [state.customers]
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set(debtors.map((c) => c.id)));
  const [sent, setSent] = useState(0);
  const [sending, setSending] = useState(false);

  // Keep selection in sync when modal opens
  useMemo(() => {
    if (open) {
      setSelected(new Set(debtors.map((c) => c.id)));
      setSent(0);
    }
  }, [open, debtors]);

  if (!open) return null;

  const storeName = state.storeSettings.store_name || "محلّنا";
  const totalAmount = Array.from(selected)
    .map((id) => debtors.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .reduce((s, c) => s + c.debt, 0);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === debtors.length) setSelected(new Set());
    else setSelected(new Set(debtors.map((c) => c.id)));
  };

  const sendAll = async () => {
    setSending(true);
    setSent(0);
    for (const id of Array.from(selected)) {
      const c = debtors.find((x) => x.id === id);
      if (!c) continue;
      const msg = paymentReminderMessage({
        storeName,
        customerName: c.name,
        invoiceNo: "",
        remaining: c.debt,
      });
      const url = whatsappUrl(c.whatsapp || c.phone, msg);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        setSent((s) => s + 1);
        // Stagger so browser doesn't block popups
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    setSending(false);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] mx-4 max-h-[85vh] flex flex-col bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider dark:border-divider-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-tj flex items-center justify-center text-white" style={{ background: "#25D366" }}>
              <Ico name="whatsapp" size={18} sw={1.8} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-text dark:text-text-dark">تذكيرات واتساب جماعية</h2>
              <p className="text-[10px] text-muted dark:text-muted-dark">إرسال تذكيرات دفع للزبائن المديونين</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="w-8 h-8 rounded-tj hover:bg-surface2 dark:hover:bg-surface2-dark flex items-center justify-center text-muted dark:text-muted-dark"
          >
            <Ico name="close" size={14} sw={1.8} />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 px-5 py-3 border-b border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark">
          <div>
            <div className="text-[10px] text-muted dark:text-muted-dark">مدينون</div>
            <div className="text-[16px] font-bold text-text dark:text-text-dark tj-num mt-0.5">{debtors.length}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted dark:text-muted-dark">مختارة</div>
            <div className="text-[16px] font-bold text-primary tj-num mt-0.5">{selected.size}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted dark:text-muted-dark">الإجمالي المحدد</div>
            <Shekel amt={totalAmount} size={16} className="text-warning dark:text-warning-dark" weight={700} />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {debtors.length === 0 ? (
            <div className="py-12 text-center">
              <Ico name="check" size={32} className="text-success dark:text-success-dark mx-auto mb-3" sw={1.8} />
              <div className="text-[14px] font-bold text-text dark:text-text-dark mb-1">كل الزبائن دافعين!</div>
              <div className="text-[11px] text-muted dark:text-muted-dark">ما في أحد عليه مستحقات مع رقم تلفون</div>
            </div>
          ) : (
            <>
              <div className="px-5 py-2 border-b border-divider dark:border-divider-dark">
                <button
                  onClick={toggleAll}
                  className="text-[11px] text-primary font-bold hover:underline"
                >
                  {selected.size === debtors.length ? "إلغاء الكل" : "اختاري الكل"}
                </button>
              </div>
              <div className="divide-y divide-divider dark:divide-divider-dark">
                {debtors.map((c) => {
                  const isSelected = selected.has(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                        isSelected ? "bg-primary-soft/30" : "hover:bg-surface2 dark:hover:bg-surface2-dark"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(c.id)}
                        className="w-4 h-4 accent-primary"
                      />
                      <Avatar name={c.name} initial={c.initial} size={32} bg={c.avatar_color || undefined} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-text dark:text-text-dark truncate">{c.name}</div>
                        <div className="text-[10px] text-muted dark:text-muted-dark tj-num" dir="ltr">
                          {c.whatsapp || c.phone}
                        </div>
                      </div>
                      <Shekel
                        amt={c.debt}
                        size={13}
                        className="text-warning dark:text-warning-dark"
                        weight={700}
                      />
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-divider dark:border-divider-dark flex items-center justify-between bg-bg dark:bg-bg-dark">
          <div className="text-[10px] text-muted dark:text-muted-dark">
            {sending
              ? `📤 إرسال... ${sent}/${selected.size}`
              : `رح تفتح ${selected.size} تاب واتساب`}
          </div>
          <button
            onClick={sendAll}
            disabled={selected.size === 0 || sending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-tj text-white text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#25D366" }}
          >
            <Ico name="whatsapp" size={14} sw={1.8} />
            {sending ? "جاري الإرسال..." : `إرسال ${selected.size} تذكير`}
          </button>
        </div>
      </div>
    </div>
  );
}

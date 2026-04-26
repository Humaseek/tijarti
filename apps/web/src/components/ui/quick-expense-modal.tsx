"use client";

import { useState, useEffect, useRef } from "react";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { suggestCategory } from "@/lib/auto-category";

/**
 * Quick-expense modal — minimal inline form to add an expense without leaving
 * the current page. Opens from the FAB or via `data-open-quick-expense` event.
 *
 * Designed for the flow "I just bought something, log it fast":
 *   - Amount (big input)
 *   - Category (chips)
 *   - Description (optional)
 *   - Submit
 */

interface QuickExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_CATEGORIES = [
  { label: "إيجار", icon: "store" },
  { label: "كهرباء", icon: "zap" },
  { label: "إنترنت", icon: "globe" },
  { label: "بضاعة", icon: "box" },
  { label: "نقل", icon: "truck" },
  { label: "صيانة", icon: "tool" },
  { label: "طعام", icon: "store" },
  { label: "أخرى", icon: "card" },
] as const;

export function QuickExpenseModal({ open, onClose }: QuickExpenseModalProps) {
  const { addExpense } = useStore();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("إيجار");
  const [desc, setDesc] = useState("");
  const [autoSuggested, setAutoSuggested] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setDesc("");
      setCategory("إيجار");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const numeric = parseFloat(amount) || 0;
  const disabled = numeric <= 0;

  const submit = () => {
    if (disabled) return;
    addExpense({
      amount: numeric,
      category: category as never,
      description: desc.trim() || category,
      expense_date: new Date().toISOString().slice(0, 10),
      payment_method: "نقدي" as never,
    });
    toast(`تم تسجيل مصروف ${numeric.toLocaleString()} ₪`, "success");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm tj-slide-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[440px] bg-surface dark:bg-surface-dark rounded-t-[24px] sm:rounded-tj border-t sm:border border-divider dark:border-divider-dark shadow-2xl overflow-hidden"
      >
        {/* Handle grip (mobile bottom sheet hint) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-divider dark:bg-divider-dark" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-divider dark:border-divider-dark">
          <div>
            <h2 className="text-[15px] font-bold text-text dark:text-text-dark">مصروف سريع</h2>
            <p className="text-[10px] text-muted dark:text-muted-dark">سجّلي بدون ما تخرجي من الصفحة</p>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="w-8 h-8 rounded-tj hover:bg-surface2 dark:hover:bg-surface2-dark flex items-center justify-center text-muted dark:text-muted-dark"
          >
            <Ico name="close" size={14} sw={1.8} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount input — hero */}
          <div>
            <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">المبلغ</label>
            <div className="flex items-baseline gap-2 mt-1.5">
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !disabled && submit()}
                placeholder="0"
                className="flex-1 bg-transparent text-[38px] font-bold text-text dark:text-text-dark outline-none tj-num"
                dir="ltr"
              />
              <span className="text-[22px] font-bold text-muted dark:text-muted-dark">₪</span>
            </div>
            <div className="h-px bg-divider dark:bg-divider-dark mt-1" />
          </div>

          {/* Category chips */}
          <div>
            <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">التصنيف</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_CATEGORIES.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setCategory(c.label)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-tj text-[12px] font-bold transition-colors ${
                    category === c.label
                      ? "bg-primary text-white"
                      : "bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark text-text dark:text-text-dark"
                  }`}
                >
                  <Ico name={c.icon as never} size={12} sw={1.8} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">الوصف (اختياري)</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => {
                const v = e.target.value;
                setDesc(v);
                const s = suggestCategory(v);
                if (s && s !== category) {
                  setAutoSuggested(s);
                } else {
                  setAutoSuggested(null);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && !disabled && submit()}
              placeholder="مثلاً: فاتورة كهرباء نيسان"
              className="mt-1.5 w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] text-text dark:text-text-dark outline-none focus:border-primary"
            />
            {autoSuggested && (
              <button
                onClick={() => {
                  setCategory(autoSuggested);
                  setAutoSuggested(null);
                }}
                className="mt-2 flex items-center gap-1.5 text-[11px] text-primary font-semibold hover:underline"
              >
                <Ico name="ai" size={11} sw={1.8} />
                اقتراح: استخدمي تصنيف "{autoSuggested}"
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-tj border border-divider dark:border-divider-dark text-[13px] font-bold text-text dark:text-text-dark"
          >
            إلغاء
          </button>
          <button
            onClick={submit}
            disabled={disabled}
            className="flex-1 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            تسجيل المصروف
          </button>
        </div>
      </div>
    </div>
  );
}

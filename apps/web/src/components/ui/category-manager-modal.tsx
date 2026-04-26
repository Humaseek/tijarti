"use client";

/**
 * Category Manager — small modal for adding and removing custom expense
 * categories. Triggered from the ExpenseForm's category dropdown.
 *
 * Behaviour:
 *   - Type a name → see a LIVE preview of the auto-suggested icon + color
 *   - "إضافة" persists it to localStorage and selects it in the parent form
 *   - List below shows existing custom categories with delete buttons
 *   - Built-in categories cannot be deleted (only customs)
 */

import { useEffect, useMemo, useState } from "react";
import { Ico } from "./icon";
import {
  loadCustomCategories,
  addCustomCategory,
  deleteCustomCategory,
  suggestIconAndColor,
  type CustomCategory,
} from "@/lib/custom-categories";

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  /** Called with the name of a newly-added category so the form can select it. */
  onAdded?: (name: string) => void;
}

export function CategoryManagerModal({ open, onClose, onAdded }: CategoryManagerProps) {
  const [name, setName] = useState("");
  const [list, setList] = useState<CustomCategory[]>([]);

  // Refresh list whenever the modal opens
  useEffect(() => {
    if (!open) return;
    setName("");
    setList(loadCustomCategories());
  }, [open]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const trimmed = name.trim();
  const preview = useMemo(() => suggestIconAndColor(trimmed || "تصنيف"), [trimmed]);
  const canAdd = trimmed.length >= 2;

  if (!open) return null;

  const submit = () => {
    if (!canAdd) return;
    const cat = addCustomCategory(trimmed);
    setList(loadCustomCategories());
    onAdded?.(cat.name);
    setName("");
  };

  const remove = (id: string) => {
    deleteCustomCategory(id);
    setList(loadCustomCategories());
  };

  return (
    <div
      className="absolute inset-0 z-[90] flex items-end justify-center bg-black/55 backdrop-blur-sm tj-slide-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[85%] overflow-y-auto bg-surface dark:bg-surface-dark rounded-t-[24px] border-t border-divider dark:border-divider-dark shadow-2xl"
      >
        {/* Grip */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-divider dark:bg-divider-dark" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-divider dark:border-divider-dark">
          <h2 className="text-[15px] font-bold text-text dark:text-text-dark">إدارة التصنيفات</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="w-8 h-8 rounded-tj hover:bg-bg dark:hover:bg-bg-dark flex items-center justify-center text-muted dark:text-muted-dark"
          >
            <Ico name="close" size={14} sw={1.8} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Add new */}
          <div>
            <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">
              تصنيف جديد
            </label>
            <div className="flex gap-2 mt-1.5">
              {/* Live preview of suggested icon + color */}
              <div
                className="w-12 h-12 rounded-tj flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  background: `${preview.color}1f`, // hex + 0x1f alpha (~12%)
                  border: `2px solid ${preview.color}`,
                  color: preview.color,
                }}
              >
                <Ico name={preview.icon} size={20} sw={1.8} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAdd && submit()}
                placeholder="مثلاً: تأمين السيارة"
                className="flex-1 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2.5 text-[14px] text-text dark:text-text-dark outline-none focus:border-primary"
                autoFocus
              />
              <button
                onClick={submit}
                disabled={!canAdd}
                className="px-4 py-2.5 rounded-tj text-white text-[12px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canAdd ? preview.color : undefined }}
              >
                إضافة
              </button>
            </div>
            <p className="text-[10px] text-muted dark:text-muted-dark mt-1.5 leading-relaxed">
              الأيقونة واللون يُختاران تلقائياً حسب اسم التصنيف
              {trimmed && (
                <> — لـ <span className="font-bold" style={{ color: preview.color }}>&quot;{trimmed}&quot;</span></>
              )}
            </p>
          </div>

          {/* Existing customs */}
          <div>
            <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">
              تصنيفاتي المخصّصة ({list.length})
            </label>
            {list.length === 0 ? (
              <div className="mt-2 text-[12px] text-muted dark:text-muted-dark text-center py-6 bg-bg dark:bg-bg-dark rounded-tj border border-dashed border-divider dark:border-divider-dark">
                لا تصنيفات مخصّصة بعد
              </div>
            ) : (
              <div className="mt-2 space-y-1.5">
                {list.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-2.5 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark"
                  >
                    <div
                      className="w-9 h-9 rounded-tj flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${cat.color}1f`,
                        border: `1.5px solid ${cat.color}`,
                        color: cat.color,
                      }}
                    >
                      <Ico name={cat.icon} size={16} sw={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-text dark:text-text-dark truncate">{cat.name}</div>
                    </div>
                    <button
                      onClick={() => remove(cat.id)}
                      className="text-[10px] text-danger dark:text-danger-dark font-bold px-2 py-1 rounded-tj hover:bg-danger-soft dark:hover:bg-danger-soft-dark"
                      aria-label={`حذف ${cat.name}`}
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted dark:text-muted-dark text-center">
            التصنيفات الافتراضية (إيجار، كهرباء، ...) لا يمكن حذفها — فقط المخصّصة
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-tj border border-divider dark:border-divider-dark text-[13px] font-bold text-text dark:text-text-dark"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
}

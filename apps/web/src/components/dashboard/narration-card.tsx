"use client";

import { useMemo } from "react";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { monthlyNarration } from "@/lib/narration";

/**
 * Narration card — renders the natural-language monthly summary.
 * Paragraphs + highlight chips at the bottom.
 */
export function NarrationCard() {
  const { state } = useStore();
  const narr = useMemo(() => monthlyNarration(state), [state]);

  if (narr.paragraphs.length === 0) return null;

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-tj bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Ico name="ai" size={17} className="text-primary" sw={1.8} />
        </div>
        <div>
          <h2 className="text-[14px] font-bold text-text dark:text-text-dark">{narr.title}</h2>
          <p className="text-[10px] text-muted dark:text-muted-dark">ملخّص تلقائي لبيانات محلّك هذا الشهر</p>
        </div>
      </div>

      <div className="text-[13px] text-text dark:text-text-dark leading-[1.9] font-normal space-y-2">
        {narr.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {narr.highlights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-divider dark:border-divider-dark flex flex-wrap gap-2">
          {narr.highlights.map((h, i) => {
            const toneCls =
              h.tone === "positive"
                ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                : h.tone === "negative"
                ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                : "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark";
            return (
              <span key={i} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-tj ${toneCls}`}>
                <span>{h.emoji}</span>
                {h.text}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

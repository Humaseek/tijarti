"use client";

/**
 * TimelineAnnotations — adds a "+ ملاحظة" button + flag markers over a
 * chart's month labels. Annotations stored in localStorage.
 */

import { useEffect, useState } from "react";
import { Ico } from "@/components/ui/icon";
import { lsRead, lsWrite, rid } from "@/lib/local-storage";

interface Annotation {
  id: string;
  month: string; // matches timeline label (e.g. "يناير")
  text: string;
  created_at: string;
}

const KEY = "tj_chart_annotations_v1";

interface Props {
  labels: string[];
}

export function TimelineAnnotations({ labels }: Props) {
  const [items, setItems] = useState<Annotation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(lsRead<Annotation[]>(KEY, []));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) lsWrite(KEY, items);
  }, [items, loaded]);

  const add = () => {
    const text = prompt("نص الملاحظة؟");
    if (!text) return;
    const monthChoice = prompt(
      `اختاري الشهر (من هذه القائمة):\n${labels.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n\nاكتبي رقم أو اسم الشهر:`,
      labels[labels.length - 1]
    );
    if (!monthChoice) return;
    let month = monthChoice.trim();
    const numMatch = parseInt(month, 10);
    if (!isNaN(numMatch) && numMatch >= 1 && numMatch <= labels.length) {
      month = labels[numMatch - 1];
    }
    if (!labels.includes(month)) {
      alert("الشهر غير موجود بالقائمة");
      return;
    }
    setItems((prev) => [
      ...prev,
      { id: rid("ann"), month, text, created_at: new Date().toISOString() },
    ]);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map((a) => (
            <div
              key={a.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-tj bg-warning-soft dark:bg-warning-soft-dark border border-warning/30 text-[11px] text-warning dark:text-warning-dark"
              title={a.text}
            >
              <span>🚩</span>
              <span className="font-bold">{a.month}:</span>
              <span className="max-w-[200px] truncate">{a.text}</span>
              <button
                onClick={() => remove(a.id)}
                className="opacity-60 hover:opacity-100 ms-1"
                aria-label="حذف"
              >
                <Ico name="close" size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 text-[11px] text-primary font-bold hover:underline"
      >
        <Ico name="plus" size={11} />
        ملاحظة
      </button>
    </div>
  );
}

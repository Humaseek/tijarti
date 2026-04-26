"use client";

import type { ReactNode } from "react";
import { Ico } from "./icon";
import { Shekel, Num } from "./num";

/**
 * KpiDrilldownModal — a simple records table shown inside a modal.
 * Used by the desktop dashboard to reveal the underlying invoices / expenses /
 * customers behind each KPI card.
 */

export interface DrilldownRow {
  id: string;
  title: string;
  subtitle?: string;
  value: number;
  /** Secondary value (e.g. paid amount). Displayed muted if present. */
  sub_value?: number;
  /** Href to navigate to the record. */
  href?: string;
}

interface KpiDrilldownModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  total: number;
  rows: DrilldownRow[];
  /** Value formatter — default money. */
  formatValue?: (n: number) => ReactNode;
  /** Optional helpful subtitle under the title. */
  subtitle?: string;
}

export function KpiDrilldownModal({
  open, onClose, title, subtitle, total, rows, formatValue,
}: KpiDrilldownModalProps) {
  if (!open) return null;

  const fmt = formatValue || ((n) => <Shekel amt={Math.round(n)} size={13} className="text-text dark:text-text-dark" weight={700} />);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark shadow-2xl w-full max-w-[640px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-divider dark:border-divider-dark">
          <div>
            <h3 className="text-[16px] font-bold text-text dark:text-text-dark">{title}</h3>
            {subtitle && (
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-tj text-muted dark:text-muted-dark hover:bg-bg dark:hover:bg-bg-dark flex items-center justify-center"
            aria-label="إغلاق"
          >
            <Ico name="close" size={16} sw={2} />
          </button>
        </div>

        <div className="p-5 pb-3 border-b border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark">
          <div className="text-[10px] text-muted dark:text-muted-dark font-semibold mb-1">المجموع</div>
          <Shekel amt={Math.round(total)} size={24} weight={800} className="text-primary" />
          <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
            <Num size={10} className="text-muted dark:text-muted-dark" weight={600}>{rows.length}</Num> سجل
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-[12px] text-muted dark:text-muted-dark">
              <Ico name="info" size={24} className="mx-auto mb-2 opacity-50" />
              لا سجلات ضمن هذه الفترة
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="bg-bg dark:bg-bg-dark sticky top-0 border-b border-divider dark:border-divider-dark">
                <tr className="text-[10px] font-bold text-muted dark:text-muted-dark">
                  <th className="text-right px-5 py-2.5">الوصف</th>
                  <th className="text-left px-5 py-2.5 w-[120px]">القيمة</th>
                  <th className="text-left px-5 py-2.5 w-[80px]">% من المجموع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pct = total > 0 ? (r.value / total) * 100 : 0;
                  const rowContent = (
                    <>
                      <td className="px-5 py-2.5">
                        <div className="font-semibold text-text dark:text-text-dark">{r.title}</div>
                        {r.subtitle && (
                          <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">{r.subtitle}</div>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-left">
                        {fmt(r.value)}
                        {r.sub_value !== undefined && (
                          <div className="text-[10px] text-muted dark:text-muted-dark tj-num">
                            {r.sub_value.toLocaleString()} ₪ مدفوع
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-left">
                        <Num size={11} className="text-primary" weight={700}>{pct.toFixed(1)}</Num>
                        <span className="text-muted dark:text-muted-dark">%</span>
                      </td>
                    </>
                  );
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-divider dark:border-divider-dark ${r.href ? "hover:bg-bg dark:hover:bg-bg-dark cursor-pointer" : ""}`}
                      onClick={r.href ? () => { if (typeof window !== "undefined") window.location.href = r.href!; } : undefined}
                    >
                      {rowContent}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-divider dark:border-divider-dark flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";

export interface BarItem {
  label: string;
  value: number;
  /** Optional secondary value for comparison (renders as lighter bar). */
  compareValue?: number;
  color?: string;
  /** Optional sub-label shown below value. */
  sub?: string;
}

interface BarChartProps {
  data: BarItem[];
  /** Orientation. Default horizontal (RTL-friendly). */
  orientation?: "horizontal" | "vertical";
  /** Height in px. Default 200 for vertical, auto for horizontal. */
  height?: number;
  /** Format values. Default: locale string + ₪. */
  formatValue?: (v: number) => string;
  /** Max bars to show. Default: all. */
  maxBars?: number;
  /** Hide values on bars. */
  hideValues?: boolean;
  className?: string;
}

const DEFAULT_COLOR = "rgb(var(--tj-primary))";
const COMPARE_COLOR = "rgba(var(--tj-primary), 0.35)";

/**
 * Horizontal bar chart — RTL-friendly, ideal for rankings and comparisons.
 * Supports optional compareValue for side-by-side comparison.
 */
export function BarChart({
  data,
  orientation = "horizontal",
  height = 200,
  formatValue = (v) => `${v.toLocaleString()} ₪`,
  maxBars,
  hideValues = false,
  className = "",
}: BarChartProps) {
  const { rows, max } = useMemo(() => {
    const rows = maxBars ? data.slice(0, maxBars) : data;
    const max = Math.max(1, ...rows.map((r) => Math.max(r.value, r.compareValue ?? 0)));
    return { rows, max };
  }, [data, maxBars]);

  if (rows.length === 0) {
    return <div className={`flex items-center justify-center text-[11px] text-muted dark:text-muted-dark py-8 ${className}`}>لا بيانات</div>;
  }

  if (orientation === "vertical") {
    return <VerticalBars rows={rows} max={max} height={height} formatValue={formatValue} hideValues={hideValues} className={className} />;
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {rows.map((r, i) => {
        const color = r.color || DEFAULT_COLOR;
        const pct = (r.value / max) * 100;
        const comparePct = r.compareValue !== undefined ? (r.compareValue / max) * 100 : 0;
        return (
          <div key={i}>
            <div className="flex justify-between mb-1.5 items-baseline">
              <div>
                <span className="text-[12px] font-medium text-text dark:text-text-dark">{r.label}</span>
                {r.sub && <span className="text-[10px] text-muted dark:text-muted-dark ms-2">· {r.sub}</span>}
              </div>
              {!hideValues && (
                <span className="text-[12px] font-bold tj-num text-text dark:text-text-dark">{formatValue(r.value)}</span>
              )}
            </div>
            <div className="relative h-2 bg-surface2 dark:bg-surface2-dark rounded-tj overflow-hidden">
              {/* Compare bar — behind */}
              {r.compareValue !== undefined && (
                <div
                  className="absolute inset-y-0 rounded-tj transition-[width] duration-500"
                  style={{ width: `${comparePct}%`, background: COMPARE_COLOR }}
                />
              )}
              {/* Main bar */}
              <div
                className="h-full rounded-tj transition-[width] duration-500"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerticalBars({
  rows, max, height, formatValue, hideValues, className,
}: {
  rows: BarItem[]; max: number; height: number;
  formatValue: (v: number) => string; hideValues: boolean; className: string;
}) {
  return (
    <div className={`flex items-end gap-2 ${className}`} style={{ height }}>
      {rows.map((r, i) => {
        const color = r.color || DEFAULT_COLOR;
        const pct = (r.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {!hideValues && <div className="text-[10px] tj-num font-bold text-text dark:text-text-dark">{formatValue(r.value)}</div>}
            <div className="w-full bg-surface2 dark:bg-surface2-dark rounded-tj overflow-hidden flex items-end" style={{ height: height - 50 }}>
              <div className="w-full rounded-tj transition-[height] duration-500" style={{ height: `${pct}%`, background: color }} />
            </div>
            <div className="text-[10px] text-muted dark:text-muted-dark truncate max-w-full">{r.label}</div>
          </div>
        );
      })}
    </div>
  );
}

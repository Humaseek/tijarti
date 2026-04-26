"use client";

import { useMemo, useState } from "react";

export interface PieSlice {
  label: string;
  value: number;
  /** Tailwind class OR hex/rgb color. Falls back to a rotating palette. */
  color?: string;
}

interface PieChartProps {
  data: PieSlice[];
  /** Diameter in pixels. Default 200. */
  size?: number;
  /** Inner radius as fraction of outer (0.6 = donut, 0 = full pie). Default 0.6. */
  innerRatio?: number;
  /** Show legend. Default true. */
  legend?: boolean;
  /** Optional center content (e.g. total value). */
  centerLabel?: string;
  centerValue?: React.ReactNode;
  /** Format for legend values. Default: locale string + ₪. */
  formatValue?: (v: number) => string;
  className?: string;
}

const PALETTE = [
  "rgb(var(--tj-primary))",
  "#0F6E56", // success
  "#BA7517", // warning
  "#2563A6", // info
  "#A32D2D", // danger
  "#6B4B8F", // purple
  "#C2185B", // pink
  "#00897B", // teal
  "#8B5CF6", // violet
  "#A89F91", // muted
];

/**
 * Simple SVG-based donut/pie chart. Zero external dependencies.
 * Hovering a slice highlights it + its legend row.
 */
export function PieChart({
  data,
  size = 200,
  innerRatio = 0.6,
  legend = true,
  centerLabel,
  centerValue,
  formatValue = (v) => `${v.toLocaleString()} ₪`,
  className = "",
}: PieChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const slices = useMemo(() => {
    const filtered = data.filter((d) => d.value > 0);
    const total = filtered.reduce((s, d) => s + d.value, 0);
    if (total === 0) return { arcs: [], total: 0 };

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;
    const ir = r * innerRatio;

    let startAngle = -Math.PI / 2; // start at top
    const arcs = filtered.map((d, i) => {
      const pct = d.value / total;
      const endAngle = startAngle + pct * Math.PI * 2;
      const large = endAngle - startAngle > Math.PI ? 1 : 0;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + ir * Math.cos(startAngle);
      const iy1 = cy + ir * Math.sin(startAngle);
      const ix2 = cx + ir * Math.cos(endAngle);
      const iy2 = cy + ir * Math.sin(endAngle);

      const path = [
        `M ${x1} ${y1}`,
        `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1}`,
        "Z",
      ].join(" ");

      const a = startAngle;
      startAngle = endAngle;

      return {
        ...d,
        color: d.color || PALETTE[i % PALETTE.length],
        pct,
        path,
        startAngle: a,
        endAngle,
      };
    });
    return { arcs, total };
  }, [data, size, innerRatio]);

  if (slices.total === 0) {
    return (
      <div className={`flex items-center justify-center text-[11px] text-muted dark:text-muted-dark ${className}`} style={{ width: size, height: size }}>
        لا بيانات
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-5 ${className}`}>
      {/* SVG chart */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.arcs.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={slice.color}
              opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.35}
              style={{ transition: "opacity 200ms, transform 200ms", cursor: "pointer", transformOrigin: `${size / 2}px ${size / 2}px` }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>
        {/* Center content for donut */}
        {innerRatio > 0 && (centerLabel || centerValue !== undefined) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {centerLabel && <div className="text-[10px] text-muted dark:text-muted-dark font-semibold">{centerLabel}</div>}
            {centerValue !== undefined && <div className="mt-1">{centerValue}</div>}
          </div>
        )}
      </div>

      {/* Legend */}
      {legend && (
        <div className="flex-1 min-w-0 space-y-1.5">
          {slices.arcs.map((slice, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 px-2 py-1.5 rounded-tj cursor-pointer transition-colors ${hoveredIdx === i ? "bg-bg dark:bg-bg-dark" : ""}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: slice.color }} />
                <span className="text-[12px] text-text dark:text-text-dark truncate">{slice.label}</span>
              </div>
              <div className="flex items-baseline gap-2 flex-shrink-0">
                <span className="text-[12px] font-bold text-text dark:text-text-dark tj-num">{formatValue(slice.value)}</span>
                <span className="text-[10px] text-muted dark:text-muted-dark tj-num w-8 text-end">{(slice.pct * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

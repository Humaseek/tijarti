"use client";

import { useMemo, useState } from "react";

export interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LinePoint[];
  height?: number;
  /** Fill under line with gradient. Default true. */
  filled?: boolean;
  color?: string;
  /** Show y-axis labels. Default true. */
  showYAxis?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
}

/**
 * Simple SVG line chart for trends. RTL-friendly (mirrored).
 */
export function LineChart({
  data,
  height = 180,
  filled = true,
  color = "rgb(var(--tj-primary))",
  showYAxis = true,
  formatValue = (v) => v.toLocaleString(),
  className = "",
}: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const geom = useMemo(() => {
    if (data.length === 0) return null;
    const padL = showYAxis ? 40 : 10;
    const padR = 10;
    const padT = 20;
    const padB = 30;
    const max = Math.max(...data.map((d) => d.value), 1);
    const min = Math.min(...data.map((d) => d.value), 0);
    const range = max - min || 1;

    const width = 600;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const points = data.map((d, i) => {
      const x = padL + (i / Math.max(1, data.length - 1)) * innerW;
      const y = padT + (1 - (d.value - min) / range) * innerH;
      return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = [
      `M ${points[0].x} ${padT + innerH}`,
      ...points.map((p) => `L ${p.x} ${p.y}`),
      `L ${points[points.length - 1].x} ${padT + innerH}`,
      "Z",
    ].join(" ");

    // Y-axis tick values (3 ticks)
    const yTicks = [min, min + range / 2, max];

    return { points, linePath, areaPath, width, height, padL, padT, innerH, padB, yTicks, max, min };
  }, [data, height, showYAxis]);

  if (!geom || data.length === 0) {
    return <div className={`flex items-center justify-center text-[11px] text-muted dark:text-muted-dark ${className}`} style={{ height }}>لا بيانات</div>;
  }

  const gradId = `line-gradient-${Math.random().toString(36).slice(2, 8)}`;
  const hovered = hoveredIdx !== null ? geom.points[hoveredIdx] : null;

  return (
    <div className={`relative ${className}`} style={{ width: "100%" }} dir="ltr">
      <svg viewBox={`0 0 ${geom.width} ${geom.height}`} className="w-full" preserveAspectRatio="none" height={height}>
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        {showYAxis && geom.yTicks.map((t, i) => {
          const y = geom.padT + (1 - (t - geom.min) / (geom.max - geom.min || 1)) * geom.innerH;
          return (
            <g key={i}>
              <line x1={geom.padL} x2={geom.width - 10} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 4" />
              <text x={geom.padL - 5} y={y + 3} fontSize="9" textAnchor="end" fill="currentColor" opacity="0.5" className="tj-num">{formatValue(t)}</text>
            </g>
          );
        })}

        {/* Area fill */}
        {filled && <path d={geom.areaPath} fill={`url(#${gradId})`} />}

        {/* Line */}
        <path d={geom.linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points + invisible hover areas */}
        {geom.points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3} fill="white" stroke={color} strokeWidth="2" style={{ transition: "r 150ms" }} />
            <rect
              x={p.x - 15} y={geom.padT} width={30} height={geom.innerH}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            />
          </g>
        ))}

        {/* X-axis labels (show first, middle, last) */}
        {geom.points.length > 0 && [0, Math.floor(geom.points.length / 2), geom.points.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((idx) => (
          <text
            key={idx}
            x={geom.points[idx].x}
            y={geom.height - 8}
            fontSize="9"
            textAnchor="middle"
            fill="currentColor"
            opacity="0.6"
            className="font-ar"
          >
            {geom.points[idx].label}
          </text>
        ))}
      </svg>

      {/* Tooltip on hover */}
      {hovered && (
        <div
          className="absolute px-2.5 py-1.5 rounded-tj bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark shadow-lg pointer-events-none"
          style={{ left: `${(hovered.x / geom.width) * 100}%`, top: `${(hovered.y / geom.height) * 100}%`, transform: "translate(-50%, -130%)" }}
        >
          <div className="text-[10px] text-muted dark:text-muted-dark">{hovered.label}</div>
          <div className="text-[12px] font-bold text-text dark:text-text-dark tj-num">{formatValue(hovered.value)}</div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

export interface LineSeries {
  name: string;
  color: string;
  data: number[];
  /** Dashed line style. Default false. */
  dashed?: boolean;
}

interface MultiLineChartProps {
  /** Shared x-axis labels. */
  labels: string[];
  series: LineSeries[];
  height?: number;
  /** Area fill under each line. Default true for first series, false for others. */
  filled?: boolean;
  /** Format y-axis / tooltip values. */
  formatValue?: (v: number) => string;
  /** Y-axis visible. Default true. */
  showYAxis?: boolean;
  /** Show legend above chart. Default true. */
  showLegend?: boolean;
  className?: string;
}

/**
 * Multi-series line chart with shared X axis. Supports area fills, hover
 * tooltips across all series at the hovered index, and a legend.
 *
 * Zero dependencies, pure SVG.
 */
export function MultiLineChart({
  labels,
  series,
  height = 220,
  filled = true,
  formatValue = (v) => v.toLocaleString(),
  showYAxis = true,
  showLegend = true,
  className = "",
}: MultiLineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const geom = useMemo(() => {
    const n = labels.length;
    if (n === 0 || series.length === 0) return null;
    const padL = showYAxis ? 48 : 10;
    const padR = 12;
    const padT = 14;
    const padB = 26;
    const width = 720;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    let max = 0, min = 0;
    for (const s of series) {
      for (const v of s.data) {
        if (v > max) max = v;
        if (v < min) min = v;
      }
    }
    if (max === 0 && min === 0) max = 1;
    const range = max - min || 1;

    // x positions per index
    const xs = Array.from({ length: n }, (_, i) => padL + (i / Math.max(1, n - 1)) * innerW);

    // build paths per series
    const paths = series.map((s) => {
      const pts = s.data.map((v, i) => ({
        x: xs[i],
        y: padT + (1 - (v - min) / range) * innerH,
        v,
      }));
      const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      const areaPath = [
        `M ${pts[0].x} ${padT + innerH}`,
        ...pts.map((p) => `L ${p.x} ${p.y}`),
        `L ${pts[pts.length - 1].x} ${padT + innerH}`,
        "Z",
      ].join(" ");
      return { ...s, pts, linePath, areaPath };
    });

    const yTicks = [min, min + range / 4, min + range / 2, min + (3 * range) / 4, max];

    return { paths, xs, width, height, padL, padR, padT, padB, innerW, innerH, max, min, yTicks };
  }, [labels, series, height, showYAxis]);

  if (!geom) {
    return (
      <div className={`flex items-center justify-center text-[11px] text-muted dark:text-muted-dark ${className}`} style={{ height }}>
        لا بيانات
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Legend */}
      {showLegend && series.length > 0 && (
        <div className="flex items-center gap-4 mb-3 flex-wrap" dir="rtl">
          {geom.paths.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full" style={{ background: s.color }} />
              <span className="text-[11px] text-text dark:text-text-dark font-semibold">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative" dir="ltr">
        <svg
          viewBox={`0 0 ${geom.width} ${geom.height}`}
          className="w-full"
          preserveAspectRatio="none"
          height={height}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            {geom.paths.map((s, i) => (
              <linearGradient key={i} id={`grad-ml-${i}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {/* Y-axis grid + labels */}
          {showYAxis && geom.yTicks.map((t, i) => {
            const y = geom.padT + (1 - (t - geom.min) / (geom.max - geom.min || 1)) * geom.innerH;
            return (
              <g key={i}>
                <line
                  x1={geom.padL}
                  x2={geom.width - geom.padR}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="2 4"
                />
                <text
                  x={geom.padL - 6}
                  y={y + 3}
                  fontSize="9"
                  textAnchor="end"
                  fill="currentColor"
                  opacity="0.5"
                  className="tj-num"
                >
                  {formatValue(t)}
                </text>
              </g>
            );
          })}

          {/* Area fills */}
          {filled && geom.paths.map((s, i) => (
            <path key={`a-${i}`} d={s.areaPath} fill={`url(#grad-ml-${i})`} />
          ))}

          {/* Lines */}
          {geom.paths.map((s, i) => (
            <path
              key={`l-${i}`}
              d={s.linePath}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? "4 4" : undefined}
            />
          ))}

          {/* Vertical hover line */}
          {hoverIdx !== null && (
            <line
              x1={geom.xs[hoverIdx]}
              x2={geom.xs[hoverIdx]}
              y1={geom.padT}
              y2={geom.padT + geom.innerH}
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeDasharray="3 3"
            />
          )}

          {/* Dots on hover */}
          {hoverIdx !== null && geom.paths.map((s, i) => {
            const pt = s.pts[hoverIdx];
            return (
              <circle
                key={`d-${i}`}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="white"
                stroke={s.color}
                strokeWidth="2.2"
              />
            );
          })}

          {/* Invisible hover rect per x index */}
          {labels.map((_, i) => {
            const x = geom.xs[i];
            const prev = i > 0 ? geom.xs[i - 1] : x;
            const next = i < labels.length - 1 ? geom.xs[i + 1] : x;
            const w = (next - prev) / 2 || 20;
            return (
              <rect
                key={`h-${i}`}
                x={x - w / 2}
                y={geom.padT}
                width={w}
                height={geom.innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                style={{ cursor: "pointer" }}
              />
            );
          })}

          {/* X-axis labels (first, middle, last) */}
          {[0, Math.floor(labels.length / 2), labels.length - 1]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((idx) => (
              <text
                key={`x-${idx}`}
                x={geom.xs[idx]}
                y={geom.height - 8}
                fontSize="9"
                textAnchor="middle"
                fill="currentColor"
                opacity="0.6"
                className="font-ar"
              >
                {labels[idx]}
              </text>
            ))}
        </svg>

        {/* Tooltip */}
        {hoverIdx !== null && (
          <div
            className="absolute px-3 py-2 rounded-tj bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark shadow-lg pointer-events-none"
            style={{
              left: `${(geom.xs[hoverIdx] / geom.width) * 100}%`,
              top: "8px",
              transform: "translateX(-50%)",
              minWidth: "140px",
            }}
            dir="rtl"
          >
            <div className="text-[10px] text-muted dark:text-muted-dark mb-1 font-semibold">{labels[hoverIdx]}</div>
            {geom.paths.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-[10px] text-text dark:text-text-dark">{s.name}</span>
                </div>
                <span className="text-[11px] font-bold text-text dark:text-text-dark tj-num">
                  {formatValue(s.pts[hoverIdx].v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

export interface HeatmapCell {
  row: string;   // e.g. day of week
  col: string;   // e.g. hour / week of month
  value: number;
}

interface HeatmapProps {
  cells: HeatmapCell[];
  rowLabels: string[];
  colLabels: string[];
  /** Cell base color (CSS color). Opacity scales with value. */
  color?: string;
  formatValue?: (v: number) => string;
  className?: string;
}

/**
 * Simple SVG heatmap — rows × cols grid with cell intensity mapped to value.
 * Pure CSS/SVG, no dependencies.
 */
export function Heatmap({
  cells,
  rowLabels,
  colLabels,
  color = "rgb(15, 110, 86)", // brand green
  formatValue = (v) => v.toLocaleString(),
  className = "",
}: HeatmapProps) {
  const [hovered, setHovered] = useState<{ r: number; c: number; v: number; label: string } | null>(null);

  const { map, max } = useMemo(() => {
    const m = new Map<string, number>();
    let mx = 0;
    for (const c of cells) {
      const key = `${c.row}|${c.col}`;
      m.set(key, c.value);
      if (c.value > mx) mx = c.value;
    }
    return { map: m, max: mx || 1 };
  }, [cells]);

  const gridCols = colLabels.length;
  const gridRows = rowLabels.length;

  return (
    <div className={`relative ${className}`} dir="rtl">
      <div className="flex" style={{ width: "100%" }}>
        {/* Row labels */}
        <div className="flex flex-col">
          <div className="h-5" />
          {rowLabels.map((r) => (
            <div key={r} className="h-8 flex items-center pe-2 text-[10px] font-semibold text-muted dark:text-muted-dark">
              {r}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1">
          {/* Column headers */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
            {colLabels.map((c) => (
              <div key={c} className="text-[9px] text-center text-muted dark:text-muted-dark font-semibold">
                {c}
              </div>
            ))}
          </div>
          {/* Cells */}
          {rowLabels.map((r, ri) => (
            <div
              key={r}
              className="grid gap-1 mb-1"
              style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
            >
              {colLabels.map((c, ci) => {
                const key = `${r}|${c}`;
                const v = map.get(key) || 0;
                const intensity = max > 0 ? v / max : 0;
                const opacity = intensity === 0 ? 0.04 : 0.12 + intensity * 0.88;
                const isHovered = hovered?.r === ri && hovered?.c === ci;
                return (
                  <div
                    key={c}
                    onMouseEnter={() => setHovered({ r: ri, c: ci, v, label: `${r} · ${c}` })}
                    onMouseLeave={() => setHovered(null)}
                    className="h-8 rounded-tj relative cursor-pointer transition-all"
                    style={{
                      background: color,
                      opacity,
                      outline: isHovered ? `2px solid currentColor` : undefined,
                      outlineOffset: isHovered ? 1 : 0,
                    }}
                  >
                    {v > 0 && intensity > 0.4 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white tj-num">
                        {Math.round(v).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hovered tooltip */}
      {hovered && (
        <div
          className="absolute top-0 end-0 px-3 py-2 rounded-tj bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark shadow-lg pointer-events-none"
          style={{ transform: "translateY(-100%)" }}
        >
          <div className="text-[10px] text-muted dark:text-muted-dark">{hovered.label}</div>
          <div className="text-[12px] font-bold text-text dark:text-text-dark tj-num">{formatValue(hovered.v)}</div>
        </div>
      )}
    </div>
  );
}

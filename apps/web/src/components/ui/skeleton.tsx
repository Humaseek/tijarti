"use client";

import type { CSSProperties } from "react";

/**
 * Generic loading skeleton — shimmer rectangle.
 *
 * Usage:
 *   <Skeleton width="60%" height={16} />
 *   <Skeleton className="w-full h-20 rounded-tj" />
 *
 * Compose complex placeholders from several of these. A global shimmer
 * keyframe is already injected below once — no style file changes needed.
 */

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ width, height, circle, className = "", style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`tj-skeleton bg-surface2 dark:bg-surface2-dark ${circle ? "rounded-full" : "rounded-tj"} ${className}`}
      style={{ width, height, ...style }}
    />
  );
}

/** Skeleton line(s) of text — convenience wrapper for multiple rows. */
export function SkeletonLines({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === rows - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

/** Skeleton card — typical list-row placeholder. */
export function SkeletonRow({ showAvatar = true }: { showAvatar?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark">
      {showAvatar && <Skeleton circle width={36} height={36} />}
      <div className="flex-1 space-y-2">
        <Skeleton height={12} width="40%" />
        <Skeleton height={10} width="65%" />
      </div>
      <Skeleton height={14} width={60} />
    </div>
  );
}

/** Skeleton KPI card. */
export function SkeletonKpi() {
  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-4">
      <Skeleton height={10} width="45%" className="mb-3" />
      <Skeleton height={24} width="70%" className="mb-2" />
      <Skeleton height={10} width="50%" />
    </div>
  );
}

/** Skeleton chart placeholder. */
export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
      <Skeleton height={14} width="35%" className="mb-4" />
      <div className="flex items-end gap-2" style={{ height }}>
        {[45, 70, 55, 80, 65, 90, 75, 60, 85, 50, 75, 65].map((h, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

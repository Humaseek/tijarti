"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { computeInsights, type Insight, type InsightSeverity } from "@/lib/insights";

const SEV_STYLES: Record<InsightSeverity, { bg: string; border: string; iconBg: string; iconText: string }> = {
  success: {
    bg: "bg-success-soft/40 dark:bg-success-soft-dark/40",
    border: "border-s-success dark:border-s-success-dark",
    iconBg: "bg-success-soft dark:bg-success-soft-dark",
    iconText: "text-success dark:text-success-dark",
  },
  info: {
    bg: "bg-info-soft/40 dark:bg-info-soft-dark/40",
    border: "border-s-info dark:border-s-info-dark",
    iconBg: "bg-info-soft dark:bg-info-soft-dark",
    iconText: "text-info dark:text-info-dark",
  },
  warn: {
    bg: "bg-warning-soft/40 dark:bg-warning-soft-dark/40",
    border: "border-s-warning dark:border-s-warning-dark",
    iconBg: "bg-warning-soft dark:bg-warning-soft-dark",
    iconText: "text-warning dark:text-warning-dark",
  },
  danger: {
    bg: "bg-danger-soft/40 dark:bg-danger-soft-dark/40",
    border: "border-s-danger dark:border-s-danger-dark",
    iconBg: "bg-danger-soft dark:bg-danger-soft-dark",
    iconText: "text-danger dark:text-danger-dark",
  },
};

/**
 * Desktop insights card. Renders up to 6 smart observations.
 * `base` is the url prefix so we can link to /desktop/... or /app/...
 */
export function DesktopInsightsCard({ base = "/desktop" }: { base?: string }) {
  const { state } = useStore();
  const insights = useMemo(() => computeInsights(state), [state]);

  if (insights.length === 0) return null;

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-tj bg-primary/10 flex items-center justify-center">
            <Ico name="ai" size={15} className="text-primary" sw={1.8} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-text dark:text-text-dark">أهم الملاحظات</h2>
            <p className="text-[10px] text-muted dark:text-muted-dark">تحليلات ذكية من بياناتك</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-muted dark:text-muted-dark bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-2 py-0.5">
          {insights.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {insights.map((ins) => (
          <InsightRow key={ins.id} insight={ins} base={base} />
        ))}
      </div>
    </div>
  );
}

/** Mobile variant — stacked, single-column. */
export function MobileInsightsCard({ base = "/app" }: { base?: string }) {
  const { state } = useStore();
  const insights = useMemo(() => computeInsights(state), [state]);

  if (insights.length === 0) return null;

  return (
    <div className="px-5 pb-3.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
          أهم الملاحظات
        </div>
        <span className="text-[9px] font-bold text-muted dark:text-muted-dark">{insights.length}</span>
      </div>
      <div className="space-y-2">
        {insights.slice(0, 3).map((ins) => (
          <InsightRow key={ins.id} insight={ins} base={base} compact />
        ))}
      </div>
    </div>
  );
}

function InsightRow({ insight, base, compact }: { insight: Insight; base: string; compact?: boolean }) {
  const sv = SEV_STYLES[insight.severity];
  const href = insight.href ? `${base}${insight.href}` : undefined;

  const content = (
    <div className={`flex items-start gap-3 p-3 rounded-tj border-s-[3px] ${sv.bg} ${sv.border} ${href ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}>
      <div className={`w-8 h-8 rounded-tj flex items-center justify-center flex-shrink-0 ${sv.iconBg}`}>
        <Ico name={insight.icon} size={14} className={sv.iconText} sw={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-text dark:text-text-dark ${compact ? "text-[12px]" : "text-[13px]"} leading-snug`}>
          {insight.title}
        </div>
        <div className={`text-muted dark:text-muted-dark mt-0.5 ${compact ? "text-[10px]" : "text-[11px]"} leading-relaxed`}>
          {insight.message}
        </div>
      </div>
      {href && (
        <Ico
          name="chev"
          size={12}
          className="text-muted dark:text-muted-dark flex-shrink-0 mt-2"
          style={{ transform: "scaleX(-1)" }}
          sw={1.8}
        />
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

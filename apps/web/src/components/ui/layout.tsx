import type { CSSProperties, ReactNode } from "react";
import { Ico } from "./icon";
import type { IconName } from "@/lib/icons";

// ─── Row ─────────────────────────────────────────────────────────────────────
interface RowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
  /** Apply tap feedback even without onClick. */
  tappable?: boolean;
}

export function Row({ children, className, onClick, style, tappable }: RowProps) {
  const tap = tappable || onClick ? "tj-tap" : "";
  return (
    <div
      onClick={onClick}
      className={`flex items-center ${tap} ${className ?? ""}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Card({ children, className, onClick, style }: CardProps) {
  const tap = onClick ? "tj-tap" : "";
  return (
    <div
      onClick={onClick}
      className={`bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj ${tap} ${className ?? ""}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
interface SectionProps {
  title?: string;
  trailing?: ReactNode;
  children: ReactNode;
  /** Remove default horizontal padding. */
  noPad?: boolean;
  className?: string;
}

export function Section({ title, trailing, children, noPad, className }: SectionProps) {
  return (
    <div className={`${noPad ? "" : "px-5 pb-4"} ${className ?? ""}`.trim()}>
      {title && (
        <Row className="justify-between mb-2">
          <div className="text-[13px] font-semibold text-text dark:text-text-dark">{title}</div>
          {trailing}
        </Row>
      )}
      {children}
    </div>
  );
}

// ─── BottomBar ───────────────────────────────────────────────────────────────
interface BottomBarProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function BottomBar({ children, className, style }: BottomBarProps) {
  return (
    <div
      className={`px-4 pt-[14px] pb-[22px] border-t border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark flex-shrink-0 ${className ?? ""}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── Empty ───────────────────────────────────────────────────────────────────
interface EmptyAction {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

interface EmptyProps {
  icon?: IconName;
  title: string;
  sub?: string;
  /** Optional helpful tip — rendered below sub in a muted accent card. */
  tip?: string;
  /** One or two action buttons — primary style for the main CTA. */
  actions?: EmptyAction[];
}

export function Empty({ icon, title, sub, tip, actions }: EmptyProps) {
  return (
    <div className="text-center px-8 py-14 text-muted dark:text-muted-dark">
      {icon && (
        <div className="mb-3 flex justify-center">
          <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
            <Ico name={icon} size={26} sw={1.6} className="text-primary" />
          </div>
        </div>
      )}
      <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">{title}</div>
      {sub && <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[280px] mx-auto">{sub}</div>}
      {tip && (
        <div className="mt-3 inline-block text-[10px] text-primary bg-primary-soft dark:bg-primary-soft/20 px-2.5 py-1 rounded-tj font-semibold">
          💡 {tip}
        </div>
      )}
      {actions && actions.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {actions.map((a, i) => {
            const cls = a.primary
              ? "px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
              : "px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-text dark:text-text-dark text-[12px] font-semibold hover:bg-surface dark:hover:bg-surface-dark";
            if (a.href) return <a key={i} href={a.href} className={cls}>{a.label}</a>;
            return <button key={i} onClick={a.onClick} className={cls}>{a.label}</button>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
interface ScreenProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Enable vertical scrolling (default true). */
  scroll?: boolean;
}

/** Full-height scrollable RTL screen within the device frame. */
export function Screen({ children, className, style, scroll = true }: ScreenProps) {
  return (
    <div
      dir="rtl"
      className={`bg-bg dark:bg-bg-dark min-h-full h-full pt-[60px] flex flex-col font-ar ${scroll ? "overflow-auto" : "overflow-hidden"} ${className ?? ""}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

"use client";

import type { CSSProperties, ReactNode } from "react";
import { Row } from "./layout";
import { Ico } from "./icon";
import type { IconName } from "@/lib/icons";

// ─── Btn ─────────────────────────────────────────────────────────────────────
interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  ghost?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Btn({
  children,
  onClick,
  primary,
  danger,
  ghost,
  disabled,
  fullWidth,
  className,
  style,
}: BtnProps) {
  const variant = disabled
    ? "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
    : primary
    ? "bg-primary text-white dark:text-bg-dark"
    : danger
    ? "bg-danger dark:bg-danger-dark text-white"
    : ghost
    ? "bg-transparent text-primary border border-primary"
    : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark";
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`${disabled ? "" : "tj-btn"} ${variant} rounded-tj font-semibold text-sm font-ar inline-flex items-center justify-center gap-2 px-[18px] py-[13px] text-center ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-60" : ""} ${className ?? ""}`.trim()}
      style={{ boxSizing: "border-box", ...style }}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </div>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────
interface ChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, active, onClick, className }: ChipProps) {
  const state = active
    ? "bg-text dark:bg-text-dark text-bg dark:text-bg-dark border-transparent"
    : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark";
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-[13px] py-[7px] text-[12.5px] font-medium ${
        onClick ? "tj-btn" : ""
      } ${state} ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────
interface FieldProps {
  label?: string;
  value?: string;
  placeholder?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/** Read-only "field" — tappable to open a picker / submit. */
export function Field({ label, value, placeholder, trailing, onClick, className }: FieldProps) {
  return (
    <div className={`mb-3 ${className ?? ""}`.trim()}>
      {label && (
        <div className="text-[11px] text-subtext dark:text-subtext-dark mb-1.5 tracking-wide">
          {label}
        </div>
      )}
      <div
        onClick={onClick}
        className={`bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-[14px] py-3 text-sm ${
          onClick ? "tj-tap" : ""
        } ${value ? "text-text dark:text-text-dark" : "text-muted dark:text-muted-dark"}`}
      >
        <Row className="justify-between">
          <span>{value || placeholder}</span>
          {trailing}
        </Row>
      </div>
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
interface ToggleProps {
  on: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <div
      onClick={() => onChange(!on)}
      className={`tj-btn inline-flex items-center flex-shrink-0 p-[2px] rounded-[14px] transition-colors ${
        on ? "bg-primary" : "bg-surface2 dark:bg-surface2-dark"
      }`}
      style={{ width: 42, height: 24 }}
      role="switch"
      aria-checked={on}
      tabIndex={0}
    >
      <div
        className="w-5 h-5 rounded-full bg-white shadow transition-[margin] duration-150"
        style={{
          marginInlineStart: on ? 18 : 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

// ─── IconButton ──────────────────────────────────────────────────────────────
interface IconButtonProps {
  name: IconName;
  onClick?: () => void;
  size?: number;
  className?: string;
  label?: string;
}

export function IconButton({ name, onClick, size = 22, className, label }: IconButtonProps) {
  return (
    <div
      onClick={onClick}
      className={`tj-btn inline-flex items-center justify-center p-1.5 ${className ?? ""}`.trim()}
      role="button"
      aria-label={label}
      tabIndex={0}
    >
      <Ico name={name} size={size} />
    </div>
  );
}

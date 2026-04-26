"use client";

import type { ReactNode } from "react";
import { Row } from "./layout";

// ─── Label ───────────────────────────────────────────────────────────────────
interface LabelProps {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  trailing?: ReactNode;
}

export function Label({ children, required, optional, trailing }: LabelProps) {
  return (
    <Row className="justify-between mb-1.5">
      <span className="text-[11px] text-subtext dark:text-subtext-dark font-semibold tracking-wide">
        {children}
        {required && <span className="text-danger dark:text-danger-dark ms-1">*</span>}
      </span>
      {optional && !trailing && (
        <span className="text-[10px] text-muted dark:text-muted-dark">اختياري</span>
      )}
      {trailing}
    </Row>
  );
}

// ─── TextInput ───────────────────────────────────────────────────────────────
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  dir?: "rtl" | "ltr";
}

export function TextInput({ value, onChange, placeholder, type = "text", inputMode, dir = "rtl" }: TextInputProps) {
  const isNum = dir === "ltr" || inputMode === "numeric" || inputMode === "decimal" || inputMode === "email" || inputMode === "tel";
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className={`w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none box-border ${
        isNum ? "tj-num" : "font-ar"
      }`}
      dir={dir}
    />
  );
}

// ─── Textarea ────────────────────────────────────────────────────────────────
interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function Textarea({ value, onChange, placeholder, rows = 2 }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none box-border font-ar resize-y"
      dir="rtl"
    />
  );
}

// ─── ShekelInput ─────────────────────────────────────────────────────────────
interface ShekelInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ShekelInput({ value, onChange, placeholder = "0" }: ShekelInputProps) {
  return (
    <div
      dir="ltr"
      className="flex items-center bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-[14px] py-3 gap-1.5"
    >
      <span className="tj-num text-xs text-subtext dark:text-subtext-dark font-medium flex-shrink-0">₪</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder={placeholder}
        dir="ltr"
        className="flex-1 min-w-0 bg-transparent border-0 outline-none tj-num text-sm font-semibold text-text dark:text-text-dark text-right"
      />
    </div>
  );
}

// ─── NumberInput (integer, centered) ─────────────────────────────────────────
interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  align?: "start" | "center" | "end";
}

export function NumberInput({ value, onChange, align = "center" }: NumberInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
      dir="ltr"
      className={`w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none box-border tj-num ${
        align === "center" ? "text-center" : align === "end" ? "text-right" : "text-left"
      }`}
    />
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
interface SelectProps<T extends string> {
  value: T;
  options: readonly T[] | readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Select<T extends string>({ value, options, onChange }: SelectProps<T>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full appearance-none px-[14px] ps-9 py-3 text-sm font-medium bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none font-ar"
        dir="rtl"
      >
        {options.map((o) => {
          const [val, label] =
            typeof o === "string" ? [o, o] : [o.value, o.label];
          return (
            <option key={val} value={val}>
              {label}
            </option>
          );
        })}
      </select>
      <div
        className="absolute inset-y-0 flex items-center text-muted dark:text-muted-dark pointer-events-none"
        style={{ insetInlineStart: 12 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

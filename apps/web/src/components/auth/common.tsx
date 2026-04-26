"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Row } from "@/components/ui/layout";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

// ─── Brand mark (T logo + TIJARTI) ───────────────────────────────────────────
interface BrandMarkProps {
  size?: "md" | "lg";
}

export function BrandMark({ size = "md" }: BrandMarkProps) {
  const box = size === "lg" ? 56 : 44;
  const fs  = size === "lg" ? 24 : 19;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center rounded-tj bg-primary text-white dark:text-bg-dark tj-num font-extrabold"
        style={{ width: box, height: box, fontSize: fs, letterSpacing: "-0.02em" }}
      >
        T
      </div>
      <div className="tj-num text-[11px] font-bold text-subtext dark:text-subtext-dark" style={{ letterSpacing: "0.3em" }}>
        TIJARTI
      </div>
    </div>
  );
}

// ─── AuthCard ────────────────────────────────────────────────────────────────
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-lg p-7"
      style={{
        boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Auth field label + optional inline error ────────────────────────────────
interface AuthFieldProps {
  label?: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function AuthField({ label, error, hint, children }: AuthFieldProps) {
  return (
    <div className="mb-3.5">
      {label && (
        <div className="text-[11px] text-subtext dark:text-subtext-dark font-semibold tracking-wide mb-1.5">
          {label}
        </div>
      )}
      {children}
      {error && <div className="text-[11px] text-danger dark:text-danger-dark mt-1.5 font-medium">⚠ {error}</div>}
      {hint && !error && <div className="text-[10px] text-muted dark:text-muted-dark mt-1.5">{hint}</div>}
    </div>
  );
}

// ─── InputBox — email / phone / text with leading icon ───────────────────────
interface InputBoxProps {
  icon?: IconName;
  type?: "text" | "email" | "tel" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  dir?: "rtl" | "ltr";
  trailing?: ReactNode;
}

export function InputBox({ icon, type = "text", value, onChange, placeholder, inputMode, dir = "rtl", trailing }: InputBoxProps) {
  const isNum = dir === "ltr" || type === "email" || type === "tel" || inputMode === "numeric" || inputMode === "decimal";
  return (
    <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-[11px] gap-2.5">
      {icon && <Ico name={icon} size={16} className="text-muted dark:text-muted-dark" sw={1.6} />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={`flex-1 bg-transparent border-0 outline-none text-sm font-medium text-text dark:text-text-dark ${isNum ? "tj-num" : "font-ar"}`}
        dir={dir}
      />
      {trailing}
    </Row>
  );
}

// ─── PasswordInput with show/hide eye ────────────────────────────────────────
const EYE_OPEN = "M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7zm0 11a4 4 0 110-8 4 4 0 010 8z";
const EYE_OFF  = "M3 3l18 18M10.5 10.5a3 3 0 004 4M6 6c-2.5 2-4 5-4 6 0 0 4 7 11 7 2.3 0 4.2-.6 5.7-1.5M18 14.5c1.5-1.4 2.5-3 2.5-3.5 0-1-4-6-10-6-.6 0-1.2 0-1.7.2";

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function PasswordInput({ value, onChange, placeholder }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <InputBox
      icon="lock"
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      dir="ltr"
      trailing={
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="tj-btn p-0.5 text-muted dark:text-muted-dark"
          aria-label={show ? "إخفاء" : "إظهار"}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={show ? EYE_OPEN : EYE_OFF} />
          </svg>
        </button>
      }
    />
  );
}

// ─── Password strength ───────────────────────────────────────────────────────
export type StrengthScore = 0 | 1 | 2 | 3;

export function strengthOf(pwd: string): { score: StrengthScore; label: string; color: "muted" | "danger" | "warning" | "success" } {
  if (!pwd) return { score: 0, label: "", color: "muted" };
  const len = pwd.length;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSym = /[^A-Za-z0-9]/.test(pwd);
  if (len < 8) return { score: 1, label: "ضعيفة", color: "danger" };
  if (hasUpper && hasDigit && hasSym) return { score: 3, label: "قوية", color: "success" };
  if (hasUpper || hasDigit) return { score: 2, label: "متوسطة", color: "warning" };
  return { score: 2, label: "متوسطة", color: "warning" };
}

export function StrengthBar({ pwd }: { pwd: string }) {
  const { score, label, color } = strengthOf(pwd);
  const colorCls =
    color === "success" ? "bg-success dark:bg-success-dark"
    : color === "warning" ? "bg-warning dark:bg-warning-dark"
    : color === "danger" ? "bg-danger dark:bg-danger-dark"
    : "bg-muted dark:bg-muted-dark";
  const textCls =
    color === "success" ? "text-success dark:text-success-dark"
    : color === "warning" ? "text-warning dark:text-warning-dark"
    : color === "danger" ? "text-danger dark:text-danger-dark"
    : "text-muted dark:text-muted-dark";
  return (
    <div className="mt-2">
      <Row className="gap-1 mb-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
              i <= score ? colorCls : "bg-surface2 dark:bg-surface2-dark"
            }`}
          />
        ))}
      </Row>
      {pwd && <div className={`text-[10px] font-semibold ${textCls}`}>قوة كلمة المرور: {label}</div>}
    </div>
  );
}

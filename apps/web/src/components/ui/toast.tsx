"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type ToastType = "success" | "warn" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastState {
  id: number;
  text: string;
  type: ToastType;
  action?: ToastAction;
  duration: number;
}

interface ToastCtx {
  toast: (text: string, type?: ToastType) => void;
  /** Toast with an action button (e.g. "تراجع"). `duration` defaults to 6s. */
  toastWithAction: (text: string, action: ToastAction, options?: { type?: ToastType; duration?: number }) => void;
  current: ToastState | null;
  dismiss: () => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => setCurrent(null), []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const toast = useCallback((text: string, type: ToastType = "success") => {
    clearTimer();
    idRef.current += 1;
    setCurrent({ id: idRef.current, text, type, duration: 2800 });
    timerRef.current = setTimeout(() => setCurrent(null), 2800);
  }, []);

  const toastWithAction = useCallback(
    (text: string, action: ToastAction, options?: { type?: ToastType; duration?: number }) => {
      clearTimer();
      idRef.current += 1;
      const duration = options?.duration ?? 6000;
      setCurrent({
        id: idRef.current,
        text,
        type: options?.type ?? "info",
        action,
        duration,
      });
      timerRef.current = setTimeout(() => setCurrent(null), duration);
    },
    []
  );

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return <Ctx.Provider value={{ toast, toastWithAction, current, dismiss }}>{children}</Ctx.Provider>;
}

// ─── Toaster renderer ────────────────────────────────────────────────────────
/**
 * Render this inside the device frame to display toasts.
 * Position: absolute at top of containing frame.
 */
export function Toaster() {
  const { current, dismiss } = useToast();
  if (!current) return null;

  const borderColor =
    current.type === "success"
      ? "border-s-success dark:border-s-success-dark"
      : current.type === "warn"
      ? "border-s-warning dark:border-s-warning-dark"
      : "border-s-info dark:border-s-info-dark";
  const textColor =
    current.type === "success"
      ? "text-success dark:text-success-dark"
      : current.type === "warn"
      ? "text-warning dark:text-warning-dark"
      : "text-info dark:text-info-dark";
  const icon = current.type === "success" ? "✓" : current.type === "warn" ? "⚠" : "ⓘ";

  return (
    <div
      key={current.id}
      className={`absolute top-[70px] inset-x-4 z-20 flex items-center gap-2.5 px-3.5 py-3 rounded-tj bg-surface dark:bg-surface-dark ${borderColor} border-s-[3px] shadow-lg text-sm font-medium text-text dark:text-text-dark animate-toast-in`}
    >
      <span className={`${textColor} font-bold text-base`}>{icon}</span>
      <span className="flex-1">{current.text}</span>
      {current.action && (
        <button
          onClick={() => {
            current.action?.onClick();
            dismiss();
          }}
          className={`text-[12px] font-bold tj-btn px-2.5 py-1 rounded-tj ${textColor} hover:bg-bg dark:hover:bg-bg-dark`}
        >
          {current.action.label}
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Ico } from "./icon";

const DISMISS_KEY = "tj_pwa_dismissed_at";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * PWAInstallBanner — prompts the user to add the app to their home screen.
 *
 * Listens for `beforeinstallprompt`, shows a dismissable banner,
 * and respects a 7-day cooldown on dismiss so we don't nag.
 */
export function PWAInstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect cooldown
    const shouldShow = (): boolean => {
      if (typeof localStorage === "undefined") return true;
      try {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (!dismissed) return true;
        const t = parseInt(dismissed, 10);
        if (Number.isNaN(t)) return true;
        return Date.now() - t > SEVEN_DAYS_MS;
      } catch { return true; }
    };

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      if (shouldShow()) setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onInstall = async () => {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch { /* ignore */ }
    setVisible(false);
    setPromptEvent(null);
  };

  const onDismiss = () => {
    setVisible(false);
    if (typeof localStorage !== "undefined") {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    }
  };

  if (!visible || !promptEvent) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 inset-x-4 z-[75] bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj shadow-xl p-3.5 flex items-center gap-3 max-w-[420px] mx-auto"
      role="dialog"
      aria-label="تثبيت التطبيق"
    >
      <div className="w-10 h-10 rounded-tj bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center flex-shrink-0">
        <Ico name="download" size={18} className="text-primary" sw={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-text dark:text-text-dark">أضيفي التطبيق للشاشة الرئيسية</div>
        <div className="text-[10px] text-muted dark:text-muted-dark leading-snug">للوصول الأسرع بدون فتح المتصفح</div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onInstall}
          className="px-3 py-1.5 rounded-tj bg-primary text-white text-[11px] font-bold hover:opacity-90"
        >
          تثبيت
        </button>
        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-tj text-muted dark:text-muted-dark hover:bg-bg dark:hover:bg-bg-dark flex items-center justify-center"
          aria-label="إغلاق"
        >
          <Ico name="close" size={14} sw={2} />
        </button>
      </div>
    </div>
  );
}

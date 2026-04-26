"use client";

import { useEffect, useState } from "react";
import { Ico } from "./icon";

/**
 * OfflineBanner — renders a floating banner at the top of the screen
 * when the browser goes offline, and a brief "back online" confirmation
 * when it recovers.
 *
 * Mount once per shell — it listens to `window.online/offline` events.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(true);
  const [recentlyRecovered, setRecentlyRecovered] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // initial state
    setOnline(navigator.onLine);

    const onOnline = () => {
      setOnline(true);
      setRecentlyRecovered(true);
      const t = setTimeout(() => setRecentlyRecovered(false), 3000);
      return () => clearTimeout(t);
    };
    const onOffline = () => {
      setOnline(false);
      setRecentlyRecovered(false);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online && !recentlyRecovered) return null;

  const isOffline = !online;
  return (
    <div
      dir="rtl"
      className={`fixed top-0 inset-x-0 z-[80] flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-bold shadow-lg ${
        isOffline
          ? "bg-danger dark:bg-danger-dark text-white"
          : "bg-success dark:bg-success-dark text-white"
      }`}
      role="status"
      aria-live="polite"
    >
      <Ico name={isOffline ? "warn" : "check"} size={14} sw={2} />
      <span>
        {isOffline
          ? "أنتِ غير متصلة — التغييرات ستُحفظ محلياً"
          : "عدتِ للإنترنت!"}
      </span>
    </div>
  );
}

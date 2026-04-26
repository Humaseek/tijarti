"use client";

import { useEffect } from "react";

/**
 * Service worker registration — mounts once in the root providers.
 * Silent failure is fine (browser may not support SW, or user is in private mode).
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // skip in dev to avoid caching stale HMR

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // swallow — not critical
      }
    };
    // Defer to idle so it doesn't block render
    if ("requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(register);
    } else {
      setTimeout(register, 2000);
    }
  }, []);
  return null;
}

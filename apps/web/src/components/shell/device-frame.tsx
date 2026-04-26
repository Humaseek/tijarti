"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TabBar } from "@/components/ui/tab-bar";
import { SmartFab } from "@/components/ui/smart-fab";
import { Toaster } from "@/components/ui/toast";
import { Row } from "@/components/ui/layout";
import { CommandPalette } from "@/components/ui/command-palette";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { PWAInstallBanner } from "@/components/ui/pwa-install-banner";

const FULLSCREEN_ROUTES = ["/app/onboarding/step-1", "/app/onboarding/step-2"];

/**
 * DeviceFrame — iPhone-shaped shell that contains the app screens.
 *
 * Structure:
 *   [status bar]   — 54px
 *   [screen area]  — scrollable content, bottom inset for tab bar
 *   [tab bar]      — 4 tabs + center spacer for FAB
 *   [smart FAB]    — floats above the tab bar
 *   [toast]        — anchored top of device
 *   [home bar]     — thin indicator pill at the very bottom
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const W = 390;
  const H = 820;
  const pathname = usePathname();
  const fullScreen = FULLSCREEN_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EDE6D4] dark:bg-[#0E0D0C] p-6">
      <div
        className="relative bg-bg dark:bg-bg-dark overflow-hidden rounded-[48px]"
        style={{
          width: W,
          height: H,
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.18), 0 0 0 2px rgba(0,0,0,0.12)",
        }}
      >
        {/* Dynamic island */}
        <div
          className="absolute bg-black z-[50]"
          style={{
            top: 11,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 34,
            borderRadius: 22,
          }}
          aria-hidden="true"
        />

        {/* Status bar */}
        <div
          className="absolute inset-x-0 top-0 flex items-end justify-between px-7 pb-2 text-text dark:text-text-dark tj-num font-semibold"
          style={{ height: 54, fontSize: 15, pointerEvents: "none", zIndex: 40 }}
          aria-hidden="true"
        >
          <div>9:41</div>
          <Row className="gap-1.5 items-center">
            <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor">
              <rect x="0"  y="7" width="3" height="4" rx="0.5"/>
              <rect x="5"  y="4" width="3" height="7" rx="0.5"/>
              <rect x="10" y="1" width="3" height="10" rx="0.5"/>
              <rect x="15" y="0" width="3" height="11" rx="0.5" opacity="0.35"/>
            </svg>
            <svg width="26" height="12" viewBox="0 0 26 12">
              <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" fill="none" stroke="currentColor" opacity="0.4"/>
              <rect x="2" y="2" width="16" height="8" rx="1.2" fill="currentColor"/>
              <rect x="23.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4"/>
            </svg>
          </Row>
        </div>

        {/* Screen area — full height on onboarding (tab bar + FAB hidden) */}
        <div
          className="absolute inset-x-0 top-0 overflow-hidden"
          style={{ bottom: fullScreen ? 0 : 80 }}
        >
          {children}
        </div>

        {/* Tab bar (hidden on onboarding) */}
        {!fullScreen && (
          <div className="absolute inset-x-0 bottom-0 z-30">
            <TabBar />
          </div>
        )}

        {/* Smart FAB — hidden on onboarding */}
        {!fullScreen && <SmartFab />}

        {/* Toast renderer */}
        <Toaster />

        {/* Global command palette (⌘K / Ctrl+K) */}
        <CommandPalette />

        {/* Home indicator */}
        <div
          className="absolute bottom-1.5 inset-x-0 flex justify-center pointer-events-none z-[70]"
          aria-hidden="true"
        >
          <div className="w-[130px] h-1 rounded-full bg-black/35 dark:bg-white/50" />
        </div>
      </div>

      {/* Offline / PWA banners — outside the device frame so they overlay everything */}
      <OfflineBanner />
      <PWAInstallBanner />
    </div>
  );
}

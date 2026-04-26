"use client";

/**
 * SmartFab — speed-dial Floating Action Button. The single most important
 * input control in the entire mobile app: every "log a transaction" path
 * starts here.
 *
 * Each option opens the QuickCaptureModal pre-set to a specific transaction
 * type, so the user goes from idle → saved record in just 3 taps:
 *   1. Tap +
 *   2. Tap the type
 *   3. Type amount → Save (Enter)
 *
 * The full-page versions (`/app/expenses/new`, `/app/checks/new`, etc.) are
 * still reachable for editing existing records or for multi-step flows that
 * don't fit in a modal.
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ico } from "./icon";
import type { IconName } from "@/lib/icons";
import { QuickCaptureModal, type CaptureType } from "./quick-capture-modal";

interface ActionDef {
  label: string;
  icon: IconName;
  color: string;
  /** Tailwind class for the soft background behind the icon. */
  soft: string;
  /** Either opens the QuickCapture modal with this type, or navigates. */
  capture?: CaptureType;
  path?: string;
  /** Optional CSS transform on the icon (for flipping trendUp → down). */
  iconFlip?: boolean;
}

export function SmartFab() {
  const [open, setOpen] = useState(false);
  const [captureType, setCaptureType] = useState<CaptureType | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close speed-dial when the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC closes the speed-dial (the modal handles its own ESC)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hide on onboarding routes — early-return MUST come after all hooks
  const hideOn = ["/app/onboarding/step-1", "/app/onboarding/step-2"];
  if (hideOn.some((p) => pathname.startsWith(p))) return null;

  // Order: bottom (visual top) → top (visual bottom).
  //
  // Each option opens a DEDICATED full-page form (more breathing room,
  // less cramped than a modal). The full pages already include:
  //   • مصروف  — embedded photo/PDF capture + manual entry + payment method
  //   • بيعة   — full multi-item POS-style flow
  //   • دفعة   — quick payment-in form (modal kept as quick fallback)
  //   • دَين    — debt entry with direction toggle
  //
  // The QuickCaptureModal stays available for non-FAB invocations (e.g.
  // a future home-screen widget or keyboard shortcut).
  const actions: ActionDef[] = [
    { label: "مصروف",             icon: "card",    color: "#8B5CF6", soft: "bg-[rgba(139,92,246,0.14)]",               path: "/app/expenses/new" },
    { label: "بيعة",              icon: "tag",     color: "#2563A6", soft: "bg-info-soft dark:bg-info-soft-dark",      path: "/app/sales/new" },
    { label: "دفعة من زبونة",     icon: "money",   color: "#0F6E56", soft: "bg-success-soft dark:bg-success-soft-dark",capture: "payment-in" },
    { label: "دَين على الحساب",    icon: "money",   color: "#BA7517", soft: "bg-warning-soft dark:bg-warning-soft-dark",path: "/app/debts/new?direction=incoming" },
  ];

  const handleAction = (a: ActionDef) => {
    setOpen(false);
    if (a.capture) {
      // Small delay so the speed-dial collapse animation completes first
      setTimeout(() => setCaptureType(a.capture!), 220);
    } else if (a.path) {
      setTimeout(() => router.push(a.path!), 220);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 z-[40] bg-[rgba(28,27,26,0.55)] backdrop-blur-[4px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Options — right-aligned so icons stack vertically under FAB center */}
      <div
        className={`absolute z-[45] flex flex-col-reverse items-end gap-2.5 pointer-events-${open ? "auto" : "none"}`}
        style={{
          bottom: 112,
          right: "calc(50% - 20px)",
        }}
      >
        {actions.map((a, i) => (
          <div
            key={a.label}
            onClick={() => handleAction(a)}
            className={`fab-option flex items-center gap-2.5 cursor-pointer ${open ? "is-open" : ""}`}
            style={{ transitionDelay: open ? `${i * 50}ms` : "0ms" }}
          >
            <div className="bg-white dark:bg-surface-dark text-text dark:text-text-dark text-xs font-semibold px-3 py-1.5 rounded-[4px] whitespace-nowrap border border-divider dark:border-divider-dark shadow-md font-ar">
              {a.label}
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px] bg-white dark:bg-surface-dark transition-transform hover:scale-110 active:scale-95 shadow-md"
              style={{ borderColor: a.color, color: a.color }}
            >
              <Ico name={a.icon} size={18} sw={1.8} style={a.iconFlip ? { transform: "scaleY(-1)" } : undefined} />
            </div>
          </div>
        ))}
      </div>

      {/* Main button — locked position, only rotate + color change */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "إغلاق القائمة السريعة" : "فتح القائمة السريعة"}
        aria-expanded={open}
        className="absolute z-[50] flex items-center justify-center text-white dark:text-bg-dark rounded-full border-0 cursor-pointer"
        style={{
          bottom: 42,
          left: "50%",
          width: 56,
          height: 56,
          transform: open ? "translateX(-50%) rotate(135deg)" : "translateX(-50%) rotate(0deg)",
          background: open ? "#e05a5a" : "rgb(var(--tj-primary))",
          boxShadow: open
            ? "0 8px 20px rgba(224,90,90,0.35)"
            : "0 8px 20px rgb(var(--tj-primary) / 0.30)",
          transition: "transform 300ms cubic-bezier(0.4,0,0.2,1), background-color 250ms ease",
        }}
      >
        <Ico name="plus" size={22} sw={2.4} />
      </button>

      {/* Universal Quick Capture modal — opens via FAB option */}
      <QuickCaptureModal
        open={captureType !== null}
        type={captureType ?? "expense"}
        onClose={() => setCaptureType(null)}
      />

      {/* Local styles for the option stagger animation */}
      <style jsx>{`
        .fab-option {
          opacity: 0;
          transform: translateY(16px) scale(0.85);
          transition:
            opacity 250ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fab-option.is-open {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>
    </>
  );
}

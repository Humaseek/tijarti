"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Ico } from "@/components/ui/icon";

/**
 * Global keyboard shortcuts (desktop-focused).
 *
 *   N   → new invoice (sale)
 *   C   → new customer
 *   P   → new product
 *   X   → new expense
 *   K   → new check
 *   D   → new debt
 *   G then H → go home (dashboard)
 *   G then F → go to finances
 *   G then R → go to reports
 *   G then C → go to customers
 *   ?   → open shortcuts help
 *
 * Ignored while typing in an input/textarea. ⌘K for search is handled by
 * the command palette component.
 */

interface Shortcut {
  key: string;
  label: string;
  action: "go" | "new" | "help";
  target?: string;
  group: "new" | "navigate" | "help";
}

const SHORTCUTS: Shortcut[] = [
  // Create actions
  { key: "n", label: "فاتورة جديدة", action: "new", target: "/sales/new", group: "new" },
  { key: "c", label: "زبون جديد", action: "new", target: "/customers/new", group: "new" },
  { key: "p", label: "منتج جديد", action: "new", target: "/products/new", group: "new" },
  { key: "x", label: "مصروف جديد", action: "new", target: "/expenses/new", group: "new" },
  // Navigation (single-key)
  { key: "h", label: "الرئيسية", action: "go", target: "", group: "navigate" },
  { key: "f", label: "المالية", action: "go", target: "/finances", group: "navigate" },
  { key: "r", label: "التقارير", action: "go", target: "/reports", group: "navigate" },
  { key: "l", label: "السيولة", action: "go", target: "/liquidity", group: "navigate" },
  // Help
  { key: "?", label: "عرض الاختصارات", action: "help", group: "help" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  const isDesktop = pathname.startsWith("/desktop");
  const base = isDesktop ? "/desktop" : "/app";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore while typing
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      // Ignore modifier combos (those belong to the command palette)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Help overlay toggle
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      if (helpOpen && e.key === "Escape") {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }

      // Single-letter triggers
      const k = e.key.toLowerCase();
      const match = SHORTCUTS.find((s) => s.key === k);
      if (!match) return;

      e.preventDefault();
      if (match.action === "help") {
        setHelpOpen(true);
      } else if (match.action === "new" || match.action === "go") {
        router.push(`${base}${match.target || ""}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, base, helpOpen]);

  if (!helpOpen) return null;

  const groups: Array<{ title: string; key: Shortcut["group"] }> = [
    { title: "إنشاء", key: "new" },
    { title: "تنقل", key: "navigate" },
    { title: "مساعدة", key: "help" },
  ];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => setHelpOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] mx-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider dark:border-divider-dark">
          <div>
            <h2 className="text-[15px] font-bold text-text dark:text-text-dark">اختصارات لوحة المفاتيح</h2>
            <p className="text-[10px] text-muted dark:text-muted-dark mt-0.5">اضغطي الحرف مباشرة — من غير Ctrl</p>
          </div>
          <button
            onClick={() => setHelpOpen(false)}
            aria-label="إغلاق"
            className="w-8 h-8 rounded-tj hover:bg-surface2 dark:hover:bg-surface2-dark flex items-center justify-center text-muted dark:text-muted-dark"
          >
            <Ico name="close" size={14} sw={1.8} />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-auto space-y-5">
          {/* Command palette hint (special) */}
          <div className="p-3 rounded-tj bg-primary-soft dark:bg-primary-soft/20 flex items-center gap-3">
            <div className="w-9 h-9 rounded-tj bg-primary text-white flex items-center justify-center">
              <Ico name="search" size={15} sw={1.8} />
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-bold text-text dark:text-text-dark">البحث الشامل</div>
              <div className="text-[10px] text-muted dark:text-muted-dark">ابحثي عن أي زبون، منتج، أو فاتورة</div>
            </div>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>

          {groups.map((g) => {
            const items = SHORTCUTS.filter((s) => s.group === g.key);
            if (items.length === 0) return null;
            return (
              <div key={g.key}>
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider mb-2">
                  {g.title}
                </div>
                <div className="space-y-1">
                  {items.map((s) => (
                    <div key={s.key} className="flex items-center justify-between px-3 py-2 rounded-tj hover:bg-surface2 dark:hover:bg-surface2-dark">
                      <span className="text-[12px] text-text dark:text-text-dark">{s.label}</span>
                      <Kbd>{s.key.toUpperCase()}</Kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark text-[10px] text-muted dark:text-muted-dark flex items-center justify-between">
          <span>الاختصارات تعمل من خارج حقول الإدخال فقط</span>
          <span>اضغطي <Kbd inline>?</Kbd> لإعادة الفتح</span>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  return (
    <kbd className={`inline-flex items-center justify-center ${inline ? "" : "min-w-[24px]"} h-[22px] px-1.5 font-mono text-[10px] font-bold bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded text-text dark:text-text-dark`}>
      {children}
    </kbd>
  );
}

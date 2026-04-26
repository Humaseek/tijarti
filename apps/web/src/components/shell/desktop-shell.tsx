"use client";

/**
 * Desktop shell — sidebar + topbar + content frame.
 *
 * The sidebar is organized around the 8 things business owners actually do,
 * not 14 categories of features. Each section can be collapsed; sub-items
 * open inline. A search box at the top filters everything live.
 *
 * Information architecture:
 *   1. 🏠 الرئيسية         — at-a-glance dashboard
 *   2. 💰 المبيعات          — POS, invoices, customers, quotes, returns
 *   3. 💸 النقد والمصاريف   — expenses, suppliers, checks, debts, cash drawer
 *   4. 📦 المخزون           — products, bundles, stock movements
 *   5. 📅 العمليات          — appointments, delivery, tasks
 *   6. 📊 التقارير والذكاء  — single hub: finance, liquidity, analytics, AI
 *   7. 📣 التسويق           — campaigns, social, coupons
 *   8. 🛠️ الأدوات          — OCR, scanner, voice, assistant, calculators
 *
 * Settings + Profile live at the bottom.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { useStore } from "@/lib/store/store-context";
import { Toaster } from "@/components/ui/toast";
import { CommandPalette, CommandPaletteTrigger } from "@/components/ui/command-palette";
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { QuickExpenseModal } from "@/components/ui/quick-expense-modal";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { PWAInstallBanner } from "@/components/ui/pwa-install-banner";

interface NavItem {
  href: string;
  label: string;
  icon?: IconName;
  /** If true, shown only inside the expanded section (not in the always-visible top items). */
  secondary?: boolean;
}

interface NavSection {
  /** Stable key for collapsed-state persistence. */
  id: string;
  title: string;
  icon: IconName;
  items: NavItem[];
}

// ─── Lean IA: 5 focused sections — only what's actually shipped ─────────────
// All pages outside Income / Expenses / Customers / Products / main were
// deleted. Sidebar reflects only what exists.
const NAV: NavSection[] = [
  {
    id: "home",
    title: "الرئيسية",
    icon: "home",
    items: [
      { href: "/desktop",               label: "لوحة التحكم", icon: "home" },
      { href: "/desktop/notifications", label: "التنبيهات",   icon: "bell" },
    ],
  },
  {
    id: "income",
    title: "الدخل",
    icon: "receipt",
    items: [
      { href: "/desktop/sales",     label: "المبيعات",  icon: "tag" },
      { href: "/desktop/invoices",  label: "الفواتير",  icon: "receipt" },
    ],
  },
  {
    id: "expenses",
    title: "المصاريف",
    icon: "card",
    items: [
      { href: "/desktop/expenses",            label: "المصاريف",         icon: "card" },
      { href: "/desktop/expenses/insights",   label: "تحليل المصاريف",   icon: "chart" },
      { href: "/desktop/expenses/recurring",  label: "مصاريف ثابتة",     icon: "calendar" },
      { href: "/desktop/tools/ocr",           label: "قراءة الفواتير",   icon: "camera" },
      { href: "/desktop/tools/ocr/bulk",      label: "رفع متعدد",        icon: "receipt", secondary: true },
      { href: "/desktop/suppliers",           label: "الموردين",         icon: "store", secondary: true },
      { href: "/desktop/checks",              label: "الشيكات",          icon: "receipt", secondary: true },
      { href: "/desktop/debts",               label: "على الحساب",       icon: "money", secondary: true },
    ],
  },
  {
    id: "customers",
    title: "الزبائن",
    icon: "users",
    items: [
      { href: "/desktop/customers", label: "الزبائن", icon: "users" },
    ],
  },
  {
    id: "products",
    title: "المنتجات",
    icon: "box",
    items: [
      { href: "/desktop/products",        label: "المنتجات",      icon: "box" },
      { href: "/desktop/bundles",         label: "الباقات",        icon: "box", secondary: true },
      { href: "/desktop/stock-movements", label: "سجل المخزون",   icon: "truck", secondary: true },
    ],
  },
];

const COLLAPSED_KEY = "tj_sidebar_collapsed_v1";

export function DesktopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, unreadNotifications } = useStore();
  const unread = unreadNotifications();
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Load/save collapsed state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  const isActive = (href: string) => {
    if (href === "/desktop") return pathname === "/desktop";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Auto-expand the section containing the active route
  const activeSection = useMemo(
    () => NAV.find((s) => s.items.some((i) => isActive(i.href)))?.id,
    [pathname] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Filtered nav based on search
  const filteredNav = useMemo(() => {
    const q = search.trim();
    if (!q) return NAV;
    return NAV
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => i.label.includes(q)),
      }))
      .filter((s) => s.items.length > 0);
  }, [search]);

  const toggle = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="flex h-screen bg-bg dark:bg-bg-dark" dir="rtl">
      {/* Sidebar */}
      <aside className="w-[260px] bg-surface dark:bg-surface-dark border-l border-divider dark:border-divider-dark flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-divider dark:border-divider-dark flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-tj bg-primary text-white flex items-center justify-center font-bold text-[15px]">
            ت
          </div>
          <div>
            <div className="text-[15px] font-bold text-text dark:text-text-dark">Tijarti</div>
            <div className="text-[10px] text-muted dark:text-muted-dark">تجارتي</div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-divider dark:border-divider-dark">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark">
            <Ico name="search" size={13} className="text-muted dark:text-muted-dark" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحثي بالقائمة..."
              className="flex-1 bg-transparent text-[12px] text-text dark:text-text-dark outline-none border-0 font-ar"
              dir="rtl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted dark:text-muted-dark hover:text-danger">
                <Ico name="close" size={12} sw={2} />
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-auto py-2">
          {filteredNav.map((section) => {
            const isCollapsed = !!collapsed[section.id] && activeSection !== section.id && !search;
            const visibleItems = search
              ? section.items
              : isCollapsed
                ? section.items.filter((i) => !i.secondary)
                : section.items;
            const hasMore = section.items.some((i) => i.secondary);

            return (
              <div key={section.id} className="mb-1 px-2">
                {/* Section header (clickable) */}
                <button
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-bg dark:hover:bg-bg-dark rounded-tj group"
                >
                  <Ico name={section.icon} size={13} className="text-muted dark:text-muted-dark group-hover:text-primary" sw={1.8} />
                  <span className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider flex-1 text-start group-hover:text-text dark:group-hover:text-text-dark">
                    {section.title}
                  </span>
                  {hasMore && !search && (
                    <Ico
                      name="chevDown"
                      size={11}
                      sw={1.8}
                      className={`text-muted dark:text-muted-dark transition-transform ${
                        isCollapsed ? "" : "rotate-180"
                      }`}
                    />
                  )}
                </button>

                {/* Items */}
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-tj mb-0.5 transition-colors text-[12.5px] ${
                        active
                          ? "bg-primary text-white font-bold"
                          : item.secondary
                            ? "text-muted dark:text-muted-dark hover:bg-bg dark:hover:bg-bg-dark hover:text-text dark:hover:text-text-dark"
                            : "text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
                      }`}
                    >
                      {item.icon && (
                        <Ico
                          name={item.icon}
                          size={item.secondary ? 12 : 14}
                          className={active ? "" : item.secondary ? "text-muted dark:text-muted-dark" : "text-muted dark:text-muted-dark"}
                          sw={1.8}
                        />
                      )}
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}

                {/* "More" hint when collapsed */}
                {hasMore && !search && isCollapsed && section.items.filter((i) => i.secondary).length > 0 && (
                  <button
                    onClick={() => toggle(section.id)}
                    className="text-[10px] text-muted dark:text-muted-dark hover:text-primary px-3 py-1"
                  >
                    + {section.items.filter((i) => i.secondary).length} مزيد
                  </button>
                )}
              </div>
            );
          })}

          {filteredNav.length === 0 && search && (
            <div className="text-[11px] text-muted dark:text-muted-dark text-center py-6">
              لا نتائج لـ &quot;{search}&quot;
            </div>
          )}
        </nav>

        {/* User pill at bottom */}
        <div className="border-t border-divider dark:border-divider-dark p-2">
          <Link
            href="/desktop/settings"
            className="flex items-center gap-2.5 p-2 rounded-tj hover:bg-bg dark:hover:bg-bg-dark transition-colors"
          >
            <Avatar
              name={state.userProfile.full_name}
              initial={state.userProfile.full_name.charAt(0) || "؟"}
              size={32}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-text dark:text-text-dark truncate">
                {state.userProfile.full_name || "—"}
              </div>
              <div className="text-[10px] text-muted dark:text-muted-dark truncate" dir="ltr">
                {state.userProfile.email || "—"}
              </div>
            </div>
            <Ico name="settings" size={14} className="text-muted dark:text-muted-dark" sw={1.8} />
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-surface dark:bg-surface-dark border-b border-divider dark:border-divider-dark h-[60px] flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <div className="text-[10px] text-muted dark:text-muted-dark">
              {state.storeSettings.business_type || "مصلحة"}
            </div>
            <div className="text-[15px] font-bold text-text dark:text-text-dark">
              {state.storeSettings.store_name || "—"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Primary action: New Expense (where camera lives) */}
            <Link
              href="/desktop/expenses/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
              title="مصروف جديد (مع تصوير الفاتورة)"
            >
              <Ico name="plus" size={14} sw={2.2} />
              <span className="hidden md:inline">مصروف جديد</span>
            </Link>
            <button
              onClick={() => setQuickExpenseOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-tj border border-divider dark:border-divider-dark text-[11px] font-bold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
              title="مصروف سريع (Modal)"
            >
              <Ico name="zap" size={13} sw={1.8} />
              <span className="hidden lg:inline">سريع</span>
            </button>
            <CommandPaletteTrigger />
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }))}
              className="w-9 h-9 rounded-tj border border-divider dark:border-divider-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors text-muted dark:text-muted-dark font-bold flex items-center justify-center text-[13px]"
              title="اختصارات لوحة المفاتيح (?)"
              aria-label="اختصارات لوحة المفاتيح"
            >
              ?
            </button>
            <Link
              href="/desktop/notifications"
              className="relative p-2 rounded-tj hover:bg-bg dark:hover:bg-bg-dark transition-colors"
              aria-label="التنبيهات"
            >
              <Ico name="bell" size={20} className="text-text dark:text-text-dark" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center tj-num">
                  {unread}
                </span>
              )}
            </Link>
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[11px] font-semibold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
              aria-label="النسخة الموبايل"
            >
              <Ico name="phone" size={13} sw={1.8} />
              الموبايل
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-bg dark:bg-bg-dark">
          {children}
        </main>
      </div>

      {/* Toast renderer */}
      <Toaster />

      {/* Global command palette (⌘K / Ctrl+K) */}
      <CommandPalette />

      {/* Keyboard shortcuts (N, C, P, etc. + ? for help) */}
      <KeyboardShortcuts />

      {/* Quick expense modal */}
      <QuickExpenseModal open={quickExpenseOpen} onClose={() => setQuickExpenseOpen(false)} />

      {/* Offline / PWA banners */}
      <OfflineBanner />
      <PWAInstallBanner />
    </div>
  );
}

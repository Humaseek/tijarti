"use client";

import { usePathname, useRouter } from "next/navigation";
import { Ico } from "./icon";
import type { IconName } from "@/lib/icons";

interface Tab {
  path: string;
  label: string;
  icon: IconName;
}

const TABS: Tab[] = [
  { path: "/app",           label: "الرئيسية", icon: "home" },
  { path: "/app/invoices",  label: "المبيعات", icon: "receipt" },
  { path: "/app/customers", label: "الزبائن",  icon: "users" },
  { path: "/app/more",      label: "المزيد",   icon: "dots" },
];

/**
 * TabBar — 4 tabs + 56px gap in the middle for the SmartFab.
 * Active state determined by current pathname.
 */
export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const renderTab = (tab: Tab) => {
    // Active if exact match, or if invoice/detail is under a tab root.
    const active =
      tab.path === "/app"
        ? pathname === "/app"
        : pathname === tab.path || pathname.startsWith(tab.path + "/");
    const colorCls = active
      ? "text-primary"
      : "text-muted dark:text-muted-dark";
    return (
      <div
        key={tab.path}
        onClick={() => router.push(tab.path)}
        className={`tj-btn flex-1 flex flex-col items-center gap-1 py-1 ${colorCls}`}
        role="tab"
        aria-selected={active}
        tabIndex={0}
      >
        <Ico name={tab.icon} size={22} sw={active ? 2 : 1.6} />
        <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
      </div>
    );
  };

  return (
    <div
      className="bg-surface dark:bg-surface-dark border-t border-divider dark:border-divider-dark flex items-center justify-around flex-shrink-0 relative"
      style={{ padding: "8px 4px 28px" }}
      role="tablist"
    >
      {TABS.slice(0, 2).map(renderTab)}
      {/* Spacer — SmartFab sits here */}
      <div style={{ width: 56, flexShrink: 0 }} aria-hidden="true" />
      {TABS.slice(2).map(renderTab)}
    </div>
  );
}

"use client";

/**
 * HubTabs — a shared tab strip rendered at the top of multiple pages
 * that belong to the same logical "hub". Each page stays as its own
 * Next.js route, but the shared tab strip makes them feel like one
 * consolidated screen.
 *
 * Active hubs (post-cleanup):
 *   - EXPENSES — expenses + insights + recurring + suppliers + checks + debts
 *   - PRODUCTS — products + bundles + stock-movements
 *
 * Drop `<HubTabs hub="expenses" />` at the top of any participating page.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

export interface HubTab {
  href: string;
  label: string;
  icon: IconName;
}

export const HUBS: Record<string, HubTab[]> = {
  // ─── Expenses Hub ──────────────────────────────────────────────────────
  expenses: [
    { href: "/desktop/expenses",          label: "المصاريف",       icon: "card" },
    { href: "/desktop/expenses/insights", label: "تحليل المصاريف", icon: "chart" },
    { href: "/desktop/expenses/recurring",label: "ثابتة شهرية",    icon: "calendar" },
    { href: "/desktop/suppliers",         label: "الموردين",       icon: "store" },
    { href: "/desktop/checks",            label: "الشيكات",        icon: "receipt" },
    { href: "/desktop/debts",             label: "على الحساب",     icon: "money" },
  ],

  // ─── Products Hub ──────────────────────────────────────────────────────
  products: [
    { href: "/desktop/products",        label: "المنتجات",     icon: "box" },
    { href: "/desktop/bundles",         label: "الباقات",      icon: "box" },
    { href: "/desktop/stock-movements", label: "سجل المخزون",  icon: "truck" },
  ],
};

export function HubTabs({ hub }: { hub: keyof typeof HUBS }) {
  const pathname = usePathname();
  const tabs = HUBS[hub];
  if (!tabs) return null;

  return (
    <div className="border-b border-divider dark:border-divider-dark mb-4 -mt-2 overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/desktop" && pathname.startsWith(tab.href + "/"));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted dark:text-muted-dark hover:text-text dark:hover:text-text-dark"
              }`}
            >
              <Ico name={tab.icon} size={13} sw={1.8} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

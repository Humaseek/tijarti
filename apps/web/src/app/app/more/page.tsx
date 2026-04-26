"use client";

import Link from "next/link";
import { Screen, Card } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

interface MoreItem {
  href: string;
  label: string;
  icon: IconName;
  tint: string;
}

interface MoreSection {
  title: string;
  items: MoreItem[];
}

// Lean menu — only what exists. Mobile is data-entry first, so we expose
// the four core entities + checks/debts/suppliers (expense-related) + the
// inventory bits + settings/notifications.
const sections: MoreSection[] = [
  {
    title: "الدخل",
    items: [
      { href: "/app/sales",    label: "المبيعات",  icon: "tag",     tint: "text-primary" },
      { href: "/app/invoices", label: "الفواتير",  icon: "receipt", tint: "text-success dark:text-success-dark" },
    ],
  },
  {
    title: "المصاريف",
    items: [
      { href: "/app/expenses",           label: "المصاريف",        icon: "card",     tint: "text-warning dark:text-warning-dark" },
      { href: "/app/expenses/recurring", label: "مصاريف ثابتة",    icon: "calendar", tint: "text-primary" },
      { href: "/app/expenses/scan",      label: "تصوير فاتورة",    icon: "camera",   tint: "text-info dark:text-info-dark" },
      { href: "/app/suppliers",          label: "الموردين",        icon: "store",    tint: "text-info dark:text-info-dark" },
      { href: "/app/checks",             label: "الشيكات",         icon: "receipt",  tint: "text-warning dark:text-warning-dark" },
      { href: "/app/debts",              label: "على الحساب",      icon: "money",    tint: "text-warning dark:text-warning-dark" },
    ],
  },
  {
    title: "الزبائن",
    items: [
      { href: "/app/customers", label: "الزبائن", icon: "users", tint: "text-primary" },
    ],
  },
  {
    title: "المنتجات",
    items: [
      { href: "/app/products",        label: "المنتجات",     icon: "box",   tint: "text-info dark:text-info-dark" },
      { href: "/app/bundles",         label: "الباقات",      icon: "box",   tint: "text-primary" },
      { href: "/app/stock-movements", label: "سجل المخزون",  icon: "truck", tint: "text-muted dark:text-muted-dark" },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      { href: "/app/settings",      label: "الإعدادات", icon: "settings", tint: "text-muted dark:text-muted-dark" },
      { href: "/app/notifications", label: "التنبيهات",  icon: "bell",     tint: "text-warning dark:text-warning-dark" },
    ],
  },
];

export default function More() {
  return (
    <Screen>
      <TopBar title="المزيد" noBack />
      <div className="px-4 pb-4 flex-1 overflow-auto">
        {sections.map((section) => (
          <div key={section.title} className="mb-3.5">
            <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider pb-2 px-1">
              {section.title}
            </div>
            <Card>
              {section.items.map((it, i, arr) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${
                    i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center">
                    <Ico name={it.icon} size={15} className={it.tint} />
                  </div>
                  <div className="flex-1 text-[13px] font-semibold text-text dark:text-text-dark">
                    {it.label}
                  </div>
                  <Ico
                    name="chev"
                    size={13}
                    className="text-muted dark:text-muted-dark"
                    style={{ transform: "scaleX(-1)" }}
                  />
                </Link>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </Screen>
  );
}

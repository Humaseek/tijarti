"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Ico } from "@/components/ui/icon";

interface DesktopPageProps {
  /** Parent breadcrumb label (e.g. "الزبائن"). Links to `backHref`. */
  breadcrumb?: string;
  /** URL for the back link / breadcrumb. */
  backHref?: string;
  /** Page title (main heading). */
  title: string;
  /** Optional subtitle under the title. */
  subtitle?: string;
  /** Optional action buttons shown top-right. */
  actions?: ReactNode;
  /** Max width of the content container. Defaults to 1400. */
  maxWidth?: number;
  children: ReactNode;
}

/**
 * Shared desktop page shell — consistent header, breadcrumb, title, actions, content.
 * Use this instead of the mobile <Screen> + <TopBar> on desktop pages.
 */
export function DesktopPage({
  breadcrumb, backHref, title, subtitle, actions, maxWidth = 1400, children,
}: DesktopPageProps) {
  return (
    <div className="p-6 mx-auto" style={{ maxWidth }}>
      {/* Breadcrumb / back */}
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[12px] text-muted dark:text-muted-dark hover:text-primary mb-2"
        >
          <Ico name="chev" size={11} sw={1.8} />
          <span>{breadcrumb ?? "رجوع"}</span>
        </Link>
      )}
      {!backHref && breadcrumb && (
        <div className="text-[12px] text-muted dark:text-muted-dark mb-1">{breadcrumb}</div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark truncate">{title}</h1>
          {subtitle && <p className="text-[12px] text-muted dark:text-muted-dark mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {children}
      <div className="h-6" />
    </div>
  );
}

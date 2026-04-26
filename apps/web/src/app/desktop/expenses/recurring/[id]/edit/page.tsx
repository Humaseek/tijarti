"use client";

import { useParams } from "next/navigation";
import { DesktopRecurringForm } from "@/components/forms/desktop-recurring-form";
import { DesktopPage } from "@/components/shell/desktop-page";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { findRecurring } = useStore();
  const r = findRecurring(params.id);
  if (!r) return (
    <DesktopPage breadcrumb="المصاريف الثابتة" backHref="/desktop/expenses/recurring" title="غير موجود">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">غير موجود</div>
    </DesktopPage>
  );
  return <DesktopRecurringForm initial={r} />;
}

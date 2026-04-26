"use client";

import { useParams } from "next/navigation";
import { DesktopDebtForm } from "@/components/forms/desktop-debt-form";
import { DesktopPage } from "@/components/shell/desktop-page";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { findDebt } = useStore();
  const d = findDebt(params.id);
  if (!d) return (
    <DesktopPage breadcrumb="على الحساب" backHref="/desktop/debts" title="الدَين غير موجود">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">الدَين غير موجود</div>
    </DesktopPage>
  );
  return <DesktopDebtForm initial={d} />;
}

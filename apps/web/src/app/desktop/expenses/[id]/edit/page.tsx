"use client";

import { useParams } from "next/navigation";
import { DesktopExpenseForm } from "@/components/forms/desktop-expense-form";
import { DesktopPage } from "@/components/shell/desktop-page";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { state } = useStore();
  const e = state.expenses.find((x) => x.id === params.id);
  if (!e) return (
    <DesktopPage breadcrumb="المصاريف" backHref="/desktop/expenses" title="المصروف غير موجود">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">المصروف غير موجود</div>
    </DesktopPage>
  );
  return <DesktopExpenseForm initial={e} />;
}

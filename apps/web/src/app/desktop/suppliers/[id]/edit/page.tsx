"use client";

import { useParams } from "next/navigation";
import { DesktopSupplierForm } from "@/components/forms/desktop-supplier-form";
import { DesktopPage } from "@/components/shell/desktop-page";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { findSupplier } = useStore();
  const s = findSupplier(params.id);
  if (!s) return (
    <DesktopPage breadcrumb="الموردين" backHref="/desktop/suppliers" title="المورد غير موجود">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">المورد غير موجود</div>
    </DesktopPage>
  );
  return <DesktopSupplierForm initial={s} />;
}

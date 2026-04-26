"use client";

import { useParams } from "next/navigation";
import { DesktopCustomerForm } from "@/components/forms/desktop-customer-form";
import { DesktopPage } from "@/components/shell/desktop-page";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { findCustomer } = useStore();
  const c = findCustomer(params.id);
  if (!c) {
    return (
      <DesktopPage breadcrumb="الزبائن" backHref="/desktop/customers" title="الزبون غير موجود">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">
          هذا الزبون غير موجود
        </div>
      </DesktopPage>
    );
  }
  return <DesktopCustomerForm initial={c} />;
}

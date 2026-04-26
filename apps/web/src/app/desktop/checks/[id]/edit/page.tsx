"use client";

import { useParams } from "next/navigation";
import { DesktopCheckForm } from "@/components/forms/desktop-check-form";
import { DesktopPage } from "@/components/shell/desktop-page";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { findCheck } = useStore();
  const c = findCheck(params.id);
  if (!c) return (
    <DesktopPage breadcrumb="الشيكات" backHref="/desktop/checks" title="الشيك غير موجود">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">الشيك غير موجود</div>
    </DesktopPage>
  );
  return <DesktopCheckForm initial={c} />;
}

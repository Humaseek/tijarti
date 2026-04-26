"use client";

import { useParams } from "next/navigation";
import { DesktopProductForm } from "@/components/forms/desktop-product-form";
import { DesktopPage } from "@/components/shell/desktop-page";
import { useStore } from "@/lib/store/store-context";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { findProduct } = useStore();
  const p = findProduct(params.id);
  if (!p) return (
    <DesktopPage breadcrumb="المنتجات" backHref="/desktop/products" title="المنتج غير موجود">
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center text-[13px] text-muted dark:text-muted-dark">المنتج غير موجود</div>
    </DesktopPage>
  );
  return <DesktopProductForm initial={p} />;
}

"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { DesktopProductForm } from "@/components/forms/desktop-product-form";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DesktopProductForm />
    </Suspense>
  );
}

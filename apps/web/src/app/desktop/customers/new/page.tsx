"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { DesktopCustomerForm } from "@/components/forms/desktop-customer-form";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DesktopCustomerForm />
    </Suspense>
  );
}

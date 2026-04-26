"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { DesktopDebtForm } from "@/components/forms/desktop-debt-form";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DesktopDebtForm />
    </Suspense>
  );
}

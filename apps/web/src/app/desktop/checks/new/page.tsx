"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { DesktopCheckForm } from "@/components/forms/desktop-check-form";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DesktopCheckForm />
    </Suspense>
  );
}

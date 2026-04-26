"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DebtForm } from "@/components/forms/debt-form";
import type { DebtDirection } from "@/lib/store/types";

function Inner() {
  const params = useSearchParams();
  const dir = (params.get("direction") as DebtDirection) || "incoming";
  return <DebtForm defaultDirection={dir} />;
}

export default function NewDebt() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckForm } from "@/components/forms/check-form";
import type { CheckDirection } from "@/lib/store/types";

function Inner() {
  const params = useSearchParams();
  const dir = (params.get("direction") as CheckDirection) || "incoming";
  return <CheckForm defaultDirection={dir} />;
}

export default function NewCheck() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

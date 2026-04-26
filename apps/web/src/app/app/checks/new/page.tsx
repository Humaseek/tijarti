"use client";

import { useSearchParams } from "next/navigation";
import { CheckForm } from "@/components/forms/check-form";
import type { CheckDirection } from "@/lib/store/types";

export default function NewCheck() {
  const params = useSearchParams();
  const dir = (params.get("direction") as CheckDirection) || "incoming";
  return <CheckForm defaultDirection={dir} />;
}

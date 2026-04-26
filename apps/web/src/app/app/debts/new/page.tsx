"use client";

import { useSearchParams } from "next/navigation";
import { DebtForm } from "@/components/forms/debt-form";
import type { DebtDirection } from "@/lib/store/types";

export default function NewDebt() {
  const params = useSearchParams();
  const dir = (params.get("direction") as DebtDirection) || "incoming";
  return <DebtForm defaultDirection={dir} />;
}

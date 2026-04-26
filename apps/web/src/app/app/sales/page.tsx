"use client";

/**
 * Sales index — quick redirect to the new-sale flow on entry, since the
 * mobile experience is data-entry first. The list of past sales lives in
 * /app/invoices (sales == invoices in the data model).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SalesIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/sales/new");
  }, [router]);
  return null;
}

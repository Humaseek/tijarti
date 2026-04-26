"use client";

/**
 * Desktop Sales index — quick redirect to the new-sale flow. The list of
 * past sales lives in /desktop/invoices (sales == invoices in the data model).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DesktopSalesIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/desktop/sales/new");
  }, [router]);
  return null;
}

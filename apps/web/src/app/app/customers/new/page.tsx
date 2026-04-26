"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { CustomerForm } from "@/components/forms/customer-form";

export default function NewCustomer() {
  return (
    <Suspense fallback={null}>
      <CustomerForm />
    </Suspense>
  );
}

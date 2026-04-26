"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ProductForm } from "@/components/forms/product-form";

export default function NewProduct() {
  return (
    <Suspense fallback={null}>
      <ProductForm />
    </Suspense>
  );
}

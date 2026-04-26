"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/forms/product-form";
import { Screen, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { useStore } from "@/lib/store/store-context";

export default function EditProduct() {
  const params = useParams<{ id: string }>();
  const { findProduct } = useStore();
  const p = findProduct(params.id);
  if (!p) {
    return (
      <Screen>
        <TopBar title="تعديل منتج" />
        <Empty icon="box" title="غير موجود" />
      </Screen>
    );
  }
  return <ProductForm initial={p} />;
}

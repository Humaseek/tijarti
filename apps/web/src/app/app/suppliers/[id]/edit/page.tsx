"use client";

import { useParams } from "next/navigation";
import { SupplierForm } from "@/components/forms/supplier-form";
import { Screen, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { useStore } from "@/lib/store/store-context";

export default function EditSupplier() {
  const params = useParams<{ id: string }>();
  const { findSupplier } = useStore();
  const s = findSupplier(params.id);
  if (!s) {
    return (
      <Screen>
        <TopBar title="تعديل مورد" />
        <Empty icon="store" title="المورد غير موجود" />
      </Screen>
    );
  }
  return <SupplierForm initial={s} />;
}

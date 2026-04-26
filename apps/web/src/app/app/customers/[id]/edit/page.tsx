"use client";

import { useParams } from "next/navigation";
import { CustomerForm } from "@/components/forms/customer-form";
import { Screen, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { useStore } from "@/lib/store/store-context";

export default function EditCustomer() {
  const params = useParams<{ id: string }>();
  const { findCustomer } = useStore();
  const c = findCustomer(params.id);
  if (!c) {
    return (
      <Screen>
        <TopBar title="تعديل زبونة" />
        <Empty icon="users" title="غير موجودة" />
      </Screen>
    );
  }
  return <CustomerForm initial={c} />;
}

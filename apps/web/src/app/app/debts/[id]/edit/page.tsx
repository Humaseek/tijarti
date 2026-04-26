"use client";

import { useParams } from "next/navigation";
import { DebtForm } from "@/components/forms/debt-form";
import { Screen, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { useStore } from "@/lib/store/store-context";

export default function EditDebt() {
  const params = useParams<{ id: string }>();
  const { findDebt } = useStore();
  const d = findDebt(params.id);
  if (!d) {
    return (
      <Screen>
        <TopBar title="تعديل دَين" />
        <Empty icon="money" title="غير موجود" />
      </Screen>
    );
  }
  return <DebtForm initial={d} />;
}

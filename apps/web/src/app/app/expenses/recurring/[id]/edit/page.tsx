"use client";

import { useParams } from "next/navigation";
import { RecurringExpenseForm } from "@/components/forms/recurring-expense-form";
import { Screen, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { useStore } from "@/lib/store/store-context";

export default function EditRecurring() {
  const params = useParams<{ id: string }>();
  const { findRecurring } = useStore();
  const r = findRecurring(params.id);
  if (!r) {
    return (
      <Screen>
        <TopBar title="تعديل مصروف ثابت" />
        <Empty icon="calendar" title="غير موجود" />
      </Screen>
    );
  }
  return <RecurringExpenseForm initial={r} />;
}

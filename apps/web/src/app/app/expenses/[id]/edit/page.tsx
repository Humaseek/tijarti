"use client";

import { useParams } from "next/navigation";
import { ExpenseForm } from "@/components/forms/expense-form";
import { Screen, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { useStore } from "@/lib/store/store-context";

export default function EditExpense() {
  const params = useParams<{ id: string }>();
  const { state } = useStore();
  const exp = state.expenses.find((e) => e.id === params.id);
  if (!exp) {
    return (
      <Screen>
        <TopBar title="تعديل مصروف" />
        <Empty icon="money" title="غير موجود" />
      </Screen>
    );
  }
  return <ExpenseForm initial={exp} />;
}

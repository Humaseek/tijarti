"use client";

import { useParams } from "next/navigation";
import { CheckForm } from "@/components/forms/check-form";
import { Screen, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { useStore } from "@/lib/store/store-context";

export default function EditCheck() {
  const params = useParams<{ id: string }>();
  const { findCheck } = useStore();
  const ch = findCheck(params.id);
  if (!ch) {
    return (
      <Screen>
        <TopBar title="تعديل شيك" />
        <Empty icon="receipt" title="غير موجود" />
      </Screen>
    );
  }
  return <CheckForm initial={ch} />;
}

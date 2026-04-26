"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

export default function PickCustomer() {
  const router = useRouter();
  const { state, setDraftCustomer } = useStore();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const query = q.trim();
    return state.customers.filter((c) => !query || c.name.includes(query));
  }, [state.customers, q]);

  const select = (id: string) => {
    setDraftCustomer(id);
    router.back();
  };

  // On save from customer-form, it returns here and the new customer will be
  // at the top of the list. We pass ?select=1 so the form auto-selects + returns.
  const addHref = "/app/customers/new?select=1";

  return (
    <Screen>
      <TopBar title="اختيار زبونة" />

      <div className="px-4 pb-2">
        <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2.5 gap-2">
          <Ico name="search" size={16} className="text-muted dark:text-muted-dark" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحثي عن اسم..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-text dark:text-text-dark font-ar"
            dir="rtl"
          />
        </Row>
      </div>

      {/* Add-new CTA — prominent, always visible at top */}
      <div className="px-4 pb-2.5">
        <Link
          href={addHref}
          className="tj-btn flex items-center gap-3 px-3.5 py-3 rounded-tj border-2 border-dashed border-primary bg-primary-soft/50"
        >
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
            <Ico name="plus" size={18} sw={2.4} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-primary">إضافة زبونة جديدة</div>
            <div className="text-[10px] text-primary/80 mt-0.5">زبونة ما عندك في القائمة</div>
          </div>
          <Ico name="chev" size={13} className="text-primary" style={{ transform: "scaleX(-1)" }} />
        </Link>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {list.length === 0 ? (
          q.trim() ? (
            // Searched but no match: keep the "add" button above, show empty state for clarity
            <Empty icon="users" title="لا زبونة مطابقة" sub={`جرّبي كلمة ثانية أو أضيفي "${q.trim()}" كزبونة جديدة`} />
          ) : (
            <Empty icon="users" title="لا زبونة بعد" sub="اضغطي الزر فوق لإضافة أول زبونة" />
          )
        ) : (
          <Card>
            {list.map((c, i, arr) => (
              <Row
                key={c.id}
                onClick={() => select(c.id)}
                className={`px-3.5 py-3 gap-3 tj-tap ${
                  i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                }`}
              >
                <Avatar name={c.name} initial={c.initial} size={38} bg={c.avatar_color || undefined} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text dark:text-text-dark">{c.name}</div>
                  <div className="text-[11px] text-subtext dark:text-subtext-dark mt-0.5">
                    <span
                      className={
                        c.tag === "VIP"
                          ? "text-warning dark:text-warning-dark font-bold"
                          : "text-subtext dark:text-subtext-dark"
                      }
                    >
                      {c.tag}
                    </span>{" · "}
                    <Num size={11} className="text-subtext dark:text-subtext-dark" weight={500}>{c.invoices}</Num> فاتورة
                  </div>
                </div>
                {c.debt > 0 && (
                  <Shekel amt={c.debt} size={11} className="text-warning dark:text-warning-dark" weight={700} />
                )}
              </Row>
            ))}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

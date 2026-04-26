"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/controls";
import { useStore } from "@/lib/store/store-context";

type Tab = "الكل" | "مدفوعة" | "غير مكتملة";

export default function InvoicesList() {
  const { state, findCustomer } = useStore();
  const [tab, setTab] = useState<Tab>("الكل");

  const list = useMemo(() => {
    if (tab === "مدفوعة") return state.invoices.filter((i) => i.paid >= i.total);
    if (tab === "غير مكتملة") return state.invoices.filter((i) => i.paid < i.total);
    return state.invoices;
  }, [state.invoices, tab]);

  return (
    <Screen>
      <TopBar title="الفواتير" noBack />

      <div className="px-4 pb-3">
        <Row className="gap-1.5">
          {(["الكل", "مدفوعة", "غير مكتملة"] as Tab[]).map((t) => (
            <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
              {t}
            </Chip>
          ))}
        </Row>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {list.length === 0 ? (
          tab === "الكل" ? (
            <Empty
              icon="receipt"
              title="لا فواتير بعد"
              sub="ابدئي تسجيل مبيعاتك — كل فاتورة بتبني صورة واضحة لأرباحك وزبائنك"
              tip="الـ FAB (+) يفتح فاتورة جديدة من أي صفحة"
              actions={[{ label: "+ فاتورة جديدة", href: "/app/sales/new", primary: true }]}
            />
          ) : (
            <Empty icon="receipt" title="لا فواتير هنا" />
          )
        ) : (
          <Card>
            {list.map((inv, i, arr) => {
              const cust = findCustomer(inv.customerId);
              const debt = inv.total - inv.paid;
              return (
                <Link
                  key={inv.id}
                  href={`/app/invoices/${inv.id}`}
                  className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${
                    i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  }`}
                >
                  <Avatar name={cust?.name} initial={cust?.initial} size={34} bg={cust?.avatar_color || undefined} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text dark:text-text-dark">{cust?.name}</div>
                    <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                      <Num size={11} className="text-muted dark:text-muted-dark" weight={600}>{inv.no}</Num> · {inv.date}
                    </div>
                  </div>
                  <div className="text-end">
                    <Shekel amt={inv.total} size={13} className="text-text dark:text-text-dark" weight={700} />
                    <div className="mt-0.5">
                      <span
                        className={`text-[9px] font-bold px-[7px] py-0.5 rounded-tj ${
                          debt > 0
                            ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                            : "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                        }`}
                      >
                        {debt > 0 ? `${debt.toLocaleString()} ₪ معلّق` : "مدفوعة"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

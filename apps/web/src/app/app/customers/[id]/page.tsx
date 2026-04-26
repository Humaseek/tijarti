"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Screen, Card, Row, Empty, Section } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Btn, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

export default function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, findCustomer, startDraft, setDraftCustomer } = useStore();

  const c = findCustomer(params.id);
  if (!c) {
    return (
      <Screen>
        <TopBar title="زبونة" />
        <Empty icon="users" title="الزبونة غير موجودة" />
      </Screen>
    );
  }

  const invoices = state.invoices.filter((i) => i.customerId === c.id);
  const startNewSale = () => {
    startDraft();
    setDraftCustomer(c.id);
    router.push("/app/sales/new");
  };

  const tagColor =
    c.tag === "VIP"
      ? "text-warning dark:text-warning-dark"
      : c.tag === "جديدة"
      ? "text-info dark:text-info-dark"
      : "text-subtext dark:text-subtext-dark";

  return (
    <Screen>
      <TopBar
        title={c.name}
        trailing={
          <IconButton
            name="edit"
            size={20}
            onClick={() => router.push(`/app/customers/${c.id}/edit`)}
            label="تعديل"
            className="text-primary"
          />
        }
      />

      {/* Hero */}
      <div className="px-4 pb-3.5">
        <Card className="p-[18px] text-center">
          <div className="flex justify-center mb-2.5">
            <Avatar name={c.name} initial={c.initial} size={64} bg={c.avatar_color || undefined} />
          </div>
          <div className="text-base font-bold text-text dark:text-text-dark">{c.name}</div>
          <div className="text-xs text-subtext dark:text-subtext-dark mt-1">
            <span className="tj-num" dir="ltr">{c.phone}</span>{" · "}
            <span className={`font-bold ${tagColor}`}>{c.tag}</span>
          </div>
          <Row className="gap-2 mt-3.5 justify-center">
            <div className="tj-btn p-2.5 rounded-full bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark" role="button" tabIndex={0}>
              <Ico name="phone" size={15} />
            </div>
            <div className="tj-btn p-2.5 rounded-full bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark" role="button" tabIndex={0}>
              <Ico name="whatsapp" size={15} />
            </div>
            <Btn primary onClick={startNewSale}>
              <Ico name="plus" size={14} sw={2.4} />
              فاتورة جديدة
            </Btn>
          </Row>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3.5">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="إنفاق" value={<Shekel amt={c.totalSpent} size={13} className="text-text dark:text-text-dark" weight={700} />} />
          <StatCard label="فواتير" value={<Num size={13} className="text-text dark:text-text-dark" weight={700}>{c.invoices}</Num>} />
          <StatCard
            label="دين"
            value={<Shekel amt={c.debt} size={13} className={c.debt > 0 ? "text-warning dark:text-warning-dark" : "text-text dark:text-text-dark"} weight={700} />}
          />
        </div>
      </div>

      {/* Invoices */}
      <Section title="الفواتير">
        {invoices.length === 0 ? (
          <Card className="py-6">
            <Empty icon="receipt" title="لا فواتير بعد" />
          </Card>
        ) : (
          <Card>
            {invoices.slice(0, 8).map((inv, i, arr) => {
              const debt = inv.total - inv.paid;
              return (
                <Link
                  key={inv.id}
                  href={`/app/invoices/${inv.id}`}
                  className={`flex items-center gap-2.5 px-3.5 py-3 tj-tap ${
                    i < Math.min(arr.length, 8) - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-text dark:text-text-dark">
                      فاتورة <Num size={13} className="text-text dark:text-text-dark" weight={700}>{inv.no}</Num>
                    </div>
                    <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">{inv.date}</div>
                  </div>
                  <Shekel
                    amt={inv.total}
                    size={13}
                    className={debt > 0 ? "text-warning dark:text-warning-dark" : "text-text dark:text-text-dark"}
                    weight={700}
                  />
                </Link>
              );
            })}
          </Card>
        )}
      </Section>

      <div className="h-5" />
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-2.5">
      <div className="text-[10px] text-muted dark:text-muted-dark">{label}</div>
      <div className="mt-1">{value}</div>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Screen, Card, Row, BottomBar, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Btn } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

export default function CustomerDebt() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, findCustomer } = useStore();
  const c = findCustomer(params.id);
  if (!c) {
    return (
      <Screen>
        <TopBar title="دين" />
        <Empty icon="users" title="غير موجودة" />
      </Screen>
    );
  }
  const unpaidInvoices = state.invoices
    .filter((i) => i.customerId === c.id && i.paid < i.total)
    .sort((a, b) => (b.total - b.paid) - (a.total - a.paid));

  const firstUnpaid = unpaidInvoices[0];

  return (
    <Screen>
      <TopBar title="ديون الزبونة" />

      {/* Hero */}
      <div className="px-4 pb-3.5">
        <Card className="p-[18px] text-center border-s-[3px] border-s-warning dark:border-s-warning-dark">
          <div className="flex justify-center mb-2.5">
            <Avatar name={c.name} initial={c.initial} size={60} bg={c.avatar_color || undefined} />
          </div>
          <div className="text-base font-bold text-text dark:text-text-dark">{c.name}</div>
          <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">{c.lastVisit}</div>
          <div className="mt-3 text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
            مجموع الديون
          </div>
          <div className="mt-1">
            <Shekel amt={c.debt} size={28} className="text-warning dark:text-warning-dark" weight={700} />
          </div>
          <Row className="gap-2 mt-3.5 justify-center">
            <div
              className="tj-btn p-2.5 rounded-full bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark"
              role="button"
              tabIndex={0}
            >
              <Ico name="phone" size={15} />
            </div>
            <Link href={`/app/customers/${c.id}`}>
              <Btn>الملف الشخصي</Btn>
            </Link>
          </Row>
        </Card>
      </div>

      {/* Unpaid invoices */}
      <div className="px-4 pb-4">
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
          الفواتير غير المكتملة (<Num size={11} className="text-subtext dark:text-subtext-dark" weight={700}>{unpaidInvoices.length}</Num>)
        </div>
        {unpaidInvoices.length === 0 ? (
          <Empty icon="receipt" title="لا فواتير معلّقة" />
        ) : (
          <Card>
            {unpaidInvoices.map((inv, i, arr) => {
              const debt = inv.total - inv.paid;
              const pct = Math.round((inv.paid / inv.total) * 100);
              return (
                <Link
                  key={inv.id}
                  href={`/app/invoices/${inv.id}`}
                  className={`block px-3.5 py-3 tj-tap ${
                    i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  }`}
                >
                  <Row className="justify-between mb-1.5">
                    <div>
                      <div className="text-[13px] font-semibold text-text dark:text-text-dark">
                        فاتورة <Num size={13} className="text-text dark:text-text-dark" weight={700}>{inv.no}</Num>
                      </div>
                      <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                        {inv.date}{" · "}
                        <span className="text-warning dark:text-warning-dark font-bold">{inv.method}</span>
                      </div>
                    </div>
                    <Shekel amt={debt} size={14} className="text-warning dark:text-warning-dark" weight={700} />
                  </Row>
                  <div className="h-1 bg-surface2 dark:bg-surface2-dark rounded-full overflow-hidden">
                    <div className="h-full bg-success dark:bg-success-dark transition-[width]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-1.5">
                    مدفوع <Shekel amt={inv.paid} size={10} className="text-muted dark:text-muted-dark" weight={500} /> من <Shekel amt={inv.total} size={10} className="text-muted dark:text-muted-dark" weight={500} />
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </div>

      {firstUnpaid && (
        <BottomBar>
          <Btn primary fullWidth onClick={() => router.push(`/app/invoices/${firstUnpaid.id}/payment`)}>
            <Ico name="money" size={15} sw={1.8} />
            تسجيل دفعة — أحدث فاتورة
          </Btn>
        </BottomBar>
      )}
    </Screen>
  );
}

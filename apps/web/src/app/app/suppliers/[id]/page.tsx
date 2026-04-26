"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { formatArDateShort } from "@/lib/dates";

export default function SupplierDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, findSupplier, supplierStats } = useStore();
  const supplier = findSupplier(params.id);

  if (!supplier) {
    return (
      <Screen>
        <TopBar title="مورد" />
        <Empty icon="store" title="المورد غير موجود" />
      </Screen>
    );
  }

  const stats = supplierStats(supplier.id);
  const related = {
    checks: state.checks.filter((c) => c.party_name === supplier.name && c.direction === "outgoing"),
    debts: state.debts.filter((d) => d.party_name === supplier.name && d.direction === "outgoing"),
  };
  const allEvents = [
    ...related.checks.map((c) => ({
      kind: "check" as const, id: c.id, amount: c.amount, date: c.due_date, status: c.status,
      ref: `شيك #${c.number}`,
    })),
    ...related.debts.map((d) => ({
      kind: "debt" as const, id: d.id, amount: d.amount, date: d.due_date || d.issued_date, status: d.status,
      ref: `على الحساب · ${d.description}`,
    })),
  ].sort((a, b) => (a.date && b.date ? (a.date > b.date ? -1 : 1) : 0));

  return (
    <Screen>
      <TopBar
        title="تفاصيل المورد"
        trailing={
          <IconButton
            name="edit"
            onClick={() => router.push(`/app/suppliers/${supplier.id}/edit`)}
            size={20}
            label="تعديل"
          />
        }
      />

      {/* Header card */}
      <div className="px-4 pb-3.5">
        <Card className="p-4">
          <Row className="gap-3 mb-3">
            <Avatar name={supplier.name} initial={supplier.initial} size={56} bg={supplier.avatar_color || undefined} />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-text dark:text-text-dark">{supplier.name}</div>
              {supplier.default_category && (
                <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">{supplier.default_category}</div>
              )}
              {supplier.payment_terms && (
                <div className="text-[10px] text-subtext dark:text-subtext-dark mt-1">🕐 {supplier.payment_terms}</div>
              )}
            </div>
          </Row>
          {(supplier.phone || supplier.email) && (
            <Row className="gap-2 flex-wrap pt-2.5 border-t border-divider dark:border-divider-dark">
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="tj-btn flex items-center gap-1.5 bg-surface2 dark:bg-surface2-dark rounded-tj px-2.5 py-1.5">
                  <Ico name="phone" size={12} className="text-primary" sw={1.8} />
                  <span className="text-[11px] tj-num font-medium text-text dark:text-text-dark" dir="ltr">{supplier.phone}</span>
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="tj-btn flex items-center gap-1.5 bg-surface2 dark:bg-surface2-dark rounded-tj px-2.5 py-1.5">
                  <Ico name="mail" size={12} className="text-primary" sw={1.8} />
                  <span className="text-[11px] font-medium text-text dark:text-text-dark" dir="ltr">{supplier.email}</span>
                </a>
              )}
            </Row>
          )}
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3.5">
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">المدفوع</div>
              <Shekel amt={stats.totalPaid} size={14} className="text-success dark:text-success-dark" weight={700} />
            </div>
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">مستحق عليكِ</div>
              <Shekel amt={stats.outstanding} size={14} className="text-warning dark:text-warning-dark" weight={700} />
            </div>
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">عدد الفواتير</div>
              <Num size={14} className="text-text dark:text-text-dark" weight={700}>{stats.invoiceCount}</Num>
            </div>
          </div>
          {stats.lastPurchaseIso && (
            <div className="text-[10px] text-muted dark:text-muted-dark text-center mt-3 pt-2.5 border-t border-divider dark:border-divider-dark">
              آخر معاملة: {formatArDateShort(stats.lastPurchaseIso)}
            </div>
          )}
        </Card>
      </div>

      {/* History */}
      <div className="px-4 flex-1 overflow-auto">
        <div className="text-[11px] font-bold text-subtext dark:text-subtext-dark tracking-wider pb-2 px-1">
          السجل
        </div>
        {allEvents.length === 0 ? (
          <Card className="p-4 text-center text-[11px] text-muted dark:text-muted-dark">
            لا معاملات مع هذا المورد بعد
          </Card>
        ) : (
          <Card>
            {allEvents.map((ev, i, arr) => (
              <Link
                key={`${ev.kind}:${ev.id}`}
                href={ev.kind === "check" ? `/app/checks/${ev.id}` : `/app/debts/${ev.id}`}
                className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${
                  i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-tj flex items-center justify-center flex-shrink-0 ${
                  ev.status === "cashed" || ev.status === "settled"
                    ? "bg-success-soft dark:bg-success-soft-dark"
                    : "bg-warning-soft dark:bg-warning-soft-dark"
                }`}>
                  <Ico
                    name={ev.kind === "check" ? "receipt" : "money"}
                    size={15}
                    className={ev.status === "cashed" || ev.status === "settled" ? "text-success dark:text-success-dark" : "text-warning dark:text-warning-dark"}
                    sw={1.8}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-text dark:text-text-dark">{ev.ref}</div>
                  {ev.date && (
                    <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">{formatArDateShort(ev.date)}</div>
                  )}
                </div>
                <Shekel amt={ev.amount} size={13} className="text-text dark:text-text-dark" weight={700} />
              </Link>
            ))}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

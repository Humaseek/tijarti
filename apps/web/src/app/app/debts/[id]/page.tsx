"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, Card, Row, BottomBar, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel } from "@/components/ui/num";
import { Btn, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { formatArDate, daysUntil, relativeDue } from "@/lib/dates";

export default function DebtDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { findDebt, setDebtStatus } = useStore();

  const d = findDebt(params.id);
  if (!d) {
    return (
      <Screen>
        <TopBar title="دَين" />
        <Empty icon="money" title="الدَين غير موجود" />
      </Screen>
    );
  }

  const isPending = d.status === "pending";
  const overdue = isPending && d.due_date && daysUntil(d.due_date) < 0;

  const dirLabel = d.direction === "incoming" ? "عليه لي (زبونة لم تدفع)" : "عليّ له (خدمة لم أدفعها)";
  const dirColor =
    d.direction === "incoming"
      ? "text-success dark:text-success-dark"
      : "text-danger dark:text-danger-dark";
  const dirSoft =
    d.direction === "incoming"
      ? "bg-success-soft dark:bg-success-soft-dark"
      : "bg-danger-soft dark:bg-danger-soft-dark";

  const markSettled = () => {
    setDebtStatus(d.id, "settled");
    toast("تم التسديد ✓", "success");
  };
  const markCancelled = () => {
    if (!confirm("إلغاء الدَين؟")) return;
    setDebtStatus(d.id, "cancelled");
    toast("تم الإلغاء", "info");
  };
  const revertPending = () => {
    setDebtStatus(d.id, "pending");
    toast("الدَين الآن مُعلّق", "info");
  };

  const statusBadge = d.status === "settled" ? "✓ مُسدّد"
    : d.status === "cancelled" ? "ملغى"
    : overdue ? `⚠ متأخر ${Math.abs(daysUntil(d.due_date!))} يوم`
    : d.due_date ? `⏳ ${relativeDue(d.due_date)}`
    : "⏳ بدون موعد";
  const statusCls = d.status === "settled" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
    : d.status === "cancelled" ? "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
    : overdue ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
    : "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark";

  return (
    <Screen>
      <TopBar
        title="تفاصيل الدَين"
        trailing={
          <IconButton
            name="edit"
            size={20}
            onClick={() => router.push(`/app/debts/${d.id}/edit`)}
            label="تعديل"
            className="text-primary"
          />
        }
      />

      {/* Hero */}
      <div className="px-4 pb-3.5">
        <Card
          className="p-5 text-center"
          style={{
            borderInlineStartWidth: 3,
            borderInlineStartColor: d.direction === "incoming" ? "rgb(15 110 86)" : "rgb(163 45 45)",
          }}
        >
          <div className={`inline-flex w-14 h-14 rounded-tj ${dirSoft} items-center justify-center mb-3`}>
            <Ico
              name="money"
              size={26}
              className={dirColor}
              sw={1.8}
            />
          </div>
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-1.5">
            {dirLabel}
          </div>
          <Shekel amt={d.amount} size={32} className={dirColor} weight={700} />
          <div className={`mt-3 inline-block px-3 py-[5px] rounded-tj font-bold text-[11px] ${statusCls}`}>
            {statusBadge}
          </div>
        </Card>
      </div>

      {/* Meta */}
      <div className="px-4 pb-3.5">
        <Card>
          <Meta label="الطرف" value={d.party_name} border />
          <Meta label="الوصف" value={d.description} border={!!d.due_date || !!d.notes || !!d.settled_date} />
          {d.due_date && <Meta label="تاريخ الاستحقاق" value={formatArDate(d.due_date)} border={!!d.notes || !!d.settled_date} />}
          <Meta label="تاريخ النشأة" value={formatArDate(d.issued_date)} border={!!d.settled_date || !!d.notes} />
          {d.settled_date && (
            <Meta
              label="تاريخ التسديد"
              value={<span className="text-success dark:text-success-dark">{formatArDate(d.settled_date)}</span>}
              border={!!d.notes}
            />
          )}
          {d.notes && <Meta label="ملاحظات" value={d.notes} />}
        </Card>
      </div>

      {/* Status actions */}
      <div className="px-4 pb-4">
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
          تغيير الحالة
        </div>
        {isPending ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn primary onClick={markSettled}>
              <Ico name="check" size={14} sw={2.4} />
              تأشير كمُسدّد
            </Btn>
            <Btn ghost onClick={markCancelled}>
              <Ico name="close" size={14} sw={2.4} />
              إلغاء
            </Btn>
          </div>
        ) : (
          <Btn ghost fullWidth onClick={revertPending}>
            <Ico name="clock" size={14} sw={1.8} />
            إعادة إلى "مُعلّق"
          </Btn>
        )}
      </div>

      <BottomBar>
        <Btn ghost fullWidth onClick={() => router.push(`/app/debts/${d.id}/edit`)}>
          <Ico name="edit" size={15} sw={1.8} />
          تعديل البيانات
        </Btn>
      </BottomBar>
    </Screen>
  );
}

function Meta({ label, value, border }: { label: string; value: React.ReactNode; border?: boolean }) {
  return (
    <Row
      className={`px-3.5 py-3 justify-between gap-3 ${
        border ? "border-b border-divider dark:border-divider-dark" : ""
      }`}
    >
      <span className="text-xs text-subtext dark:text-subtext-dark font-medium">{label}</span>
      <span className="text-[13px] text-text dark:text-text-dark font-semibold text-end">{value}</span>
    </Row>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, Card, Row, BottomBar, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Btn, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { daysUntil, formatArDate, relativeDue } from "@/lib/dates";

export default function CheckDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { findCheck, setCheckStatus } = useStore();

  const ch = findCheck(params.id);
  if (!ch) {
    return (
      <Screen>
        <TopBar title="شيك" />
        <Empty icon="receipt" title="الشيك غير موجود" />
      </Screen>
    );
  }

  const d = ch.status === "pending" ? daysUntil(ch.due_date) : 0;
  const overdue = ch.status === "pending" && d < 0;
  const isPending = ch.status === "pending";

  const dirColor =
    ch.direction === "incoming"
      ? "text-success dark:text-success-dark"
      : "text-danger dark:text-danger-dark";
  const dirSoft =
    ch.direction === "incoming"
      ? "bg-success-soft dark:bg-success-soft-dark"
      : "bg-danger-soft dark:bg-danger-soft-dark";
  const dirLabel =
    ch.direction === "incoming" ? "شيك وارد (من الزبونة)" : "شيك صادر (لمورد)";

  const markCashed = () => {
    setCheckStatus(ch.id, "cashed");
    toast(ch.direction === "incoming" ? "تم تحصيل الشيك ✓" : "تم صرف الشيك", "success");
  };
  const markBounced = () => {
    if (!confirm("تأشير الشيك كمرتجع؟")) return;
    setCheckStatus(ch.id, "bounced");
    toast("الشيك الآن مرتجع", "warn");
  };
  const markCancelled = () => {
    if (!confirm("إلغاء الشيك؟")) return;
    setCheckStatus(ch.id, "cancelled");
    toast("الشيك ملغى", "info");
  };
  const revertToPending = () => {
    setCheckStatus(ch.id, "pending");
    toast("الشيك الآن مُعلّق", "info");
  };

  const statusMeta = {
    pending: { label: overdue ? "متأخر" : "مُعلّق", soft: overdue ? "bg-warning-soft dark:bg-warning-soft-dark" : "bg-info-soft dark:bg-info-soft-dark", fg: overdue ? "text-warning dark:text-warning-dark" : "text-info dark:text-info-dark" },
    cashed:    { label: "مُحصّل",  soft: "bg-success-soft dark:bg-success-soft-dark", fg: "text-success dark:text-success-dark" },
    bounced:   { label: "مرتجع",   soft: "bg-danger-soft dark:bg-danger-soft-dark",  fg: "text-danger dark:text-danger-dark"  },
    cancelled: { label: "ملغى",    soft: "bg-surface2 dark:bg-surface2-dark",        fg: "text-muted dark:text-muted-dark"    },
  }[ch.status];

  return (
    <Screen>
      <TopBar
        title={`شيك #${ch.number}`}
        trailing={
          <IconButton
            name="edit"
            size={20}
            onClick={() => router.push(`/app/checks/${ch.id}/edit`)}
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
            borderInlineStartColor: ch.direction === "incoming" ? "rgb(15 110 86)" : "rgb(163 45 45)",
          }}
        >
          <div className={`inline-flex w-14 h-14 rounded-tj ${dirSoft} items-center justify-center mb-3`}>
            <Ico
              name="trendUp"
              size={26}
              className={dirColor}
              style={{ transform: ch.direction === "outgoing" ? "scaleY(-1)" : "none" }}
              sw={1.8}
            />
          </div>
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-1.5">{dirLabel}</div>
          <Shekel amt={ch.amount} size={32} className={dirColor} weight={700} />
          <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-[5px] rounded-tj font-bold text-[11px] ${statusMeta.soft} ${statusMeta.fg}`}>
            <span>{ch.status === "cashed" ? "✓" : ch.status === "bounced" ? "✗" : overdue ? "⚠" : "⏳"}</span>
            {statusMeta.label}
            {isPending && <span className="opacity-70">· {relativeDue(ch.due_date)}</span>}
          </div>
        </Card>
      </div>

      {/* Meta */}
      <div className="px-4 pb-3.5">
        <Card>
          <Meta label="المستحقة عليه" value={ch.party_name} border />
          <Meta label="رقم الشيك" value={<Num size={13} className="text-text dark:text-text-dark" weight={600}>{ch.number}</Num>} border />
          <Meta label="تاريخ الاستحقاق" value={formatArDate(ch.due_date)} border />
          <Meta label="تاريخ الإصدار" value={formatArDate(ch.issued_date)} border={!!ch.bank || !!ch.notes || !!ch.cashed_date} />
          {ch.bank && <Meta label="البنك" value={ch.bank} border={!!ch.notes || !!ch.cashed_date} />}
          {ch.cashed_date && (
            <Meta
              label="تاريخ التحصيل"
              value={<span className="text-success dark:text-success-dark">{formatArDate(ch.cashed_date)}</span>}
              border={!!ch.notes}
            />
          )}
          {ch.notes && <Meta label="ملاحظات" value={ch.notes} />}
        </Card>
      </div>

      {/* Status actions */}
      <div className="px-4 pb-4">
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
          تغيير الحالة
        </div>
        {isPending ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn primary onClick={markCashed}>
              <Ico name="check" size={14} sw={2.4} />
              تأشير كمُحصّل
            </Btn>
            <Btn ghost onClick={markBounced}>
              <Ico name="close" size={14} sw={2.4} />
              مرتجع
            </Btn>
          </div>
        ) : (
          <Btn ghost fullWidth onClick={revertToPending}>
            <Ico name="clock" size={14} sw={1.8} />
            إعادة إلى "مُعلّق"
          </Btn>
        )}
        {isPending && (
          <div className="mt-2">
            <Btn ghost fullWidth onClick={markCancelled}>
              <Ico name="trash" size={14} sw={1.8} />
              إلغاء الشيك
            </Btn>
          </div>
        )}
      </div>

      <BottomBar>
        <Btn ghost fullWidth onClick={() => router.push(`/app/checks/${ch.id}/edit`)}>
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

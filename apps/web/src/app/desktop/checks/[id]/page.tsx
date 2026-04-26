"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { formatArDateShort, relativeDue, daysUntil } from "@/lib/dates";

export default function DesktopCheckDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { findCheck, setCheckStatus, deleteCheck } = useStore();
  const c = findCheck(params.id);

  if (!c) {
    return (
      <DesktopPage breadcrumb="الشيكات" backHref="/desktop/checks" title="الشيك غير موجود">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center">
          <div className="text-[13px] text-muted dark:text-muted-dark">هذا الشيك غير موجود</div>
        </div>
      </DesktopPage>
    );
  }

  const overdue = c.status === "pending" && daysUntil(c.due_date) < 0;

  return (
    <DesktopPage
      breadcrumb="الشيكات"
      backHref="/desktop/checks"
      title={`شيك #${c.number}`}
      subtitle={`${c.direction === "incoming" ? "وارد من" : "صادر إلى"} ${c.party_name}`}
      actions={
        <>
          {c.status === "pending" && (
            <>
              <button onClick={() => { setCheckStatus(c.id, "cashed"); toast("تم تحصيل الشيك", "success"); }} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-success dark:bg-success-dark text-white text-[12px] font-bold hover:opacity-90">
                <Ico name="check" size={13} sw={2} />
                تحصيل
              </button>
              <button onClick={() => { if (confirm("تحديد كمرتجع؟")) { setCheckStatus(c.id, "bounced"); toast("تم التحديد كمرتجع", "warn"); } }} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
                مرتجع
              </button>
            </>
          )}
          <Link href={`/desktop/checks/${c.id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
            <Ico name="edit" size={13} sw={1.8} />
            تعديل
          </Link>
        </>
      }
    >
      {/* Status banner + amount */}
      <div className={`bg-surface dark:bg-surface-dark rounded-tj border p-6 mb-5 ${
        c.status === "cashed" ? "border-s-[3px] border-s-success dark:border-s-success-dark"
        : c.status === "bounced" ? "border-s-[3px] border-s-danger dark:border-s-danger-dark"
        : overdue ? "border-s-[3px] border-s-warning dark:border-s-warning-dark"
        : "border-divider dark:border-divider-dark"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-tj ${
            c.direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
          }`}>
            {c.direction === "incoming" ? "⬇ شيك وارد" : "⬆ شيك صادر"}
          </span>
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-tj ${
            c.status === "cashed" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
            : c.status === "bounced" ? "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
            : c.status === "cancelled" ? "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
            : overdue ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
            : "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
          }`}>
            {c.status === "pending" ? (overdue ? "متأخر" : "قيد التحصيل") : c.status === "cashed" ? "✓ محصّل" : c.status === "bounced" ? "⚠ مرتجع" : "ملغى"}
          </span>
        </div>
        <Shekel amt={c.amount} size={38} className="text-text dark:text-text-dark" weight={700} />
        <div className="text-[13px] text-muted dark:text-muted-dark mt-2">
          تاريخ الاستحقاق: <b className="text-text dark:text-text-dark">{formatArDateShort(c.due_date)}</b>
          {c.status === "pending" && <span className={`ms-2 font-bold ${overdue ? "text-warning dark:text-warning-dark" : ""}`}>· {relativeDue(c.due_date)}</span>}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h2 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">معلومات الشيك</h2>
          <div className="space-y-2.5 text-[12px]">
            <Row label="رقم الشيك" value={<span className="tj-num font-bold text-text dark:text-text-dark">#{c.number}</span>} />
            <Row label="الطرف" value={<span className="font-semibold text-text dark:text-text-dark">{c.party_name}</span>} />
            <Row label="البنك" value={<span className="font-semibold text-text dark:text-text-dark">{c.bank || "—"}</span>} />
            <Row label="تاريخ الإصدار" value={<span className="font-semibold text-text dark:text-text-dark">{formatArDateShort(c.issued_date)}</span>} />
            <Row label="تاريخ الاستحقاق" value={<span className="font-semibold text-text dark:text-text-dark">{formatArDateShort(c.due_date)}</span>} />
            {c.cashed_date && <Row label="تاريخ التحصيل" value={<span className="font-semibold text-success dark:text-success-dark">{formatArDateShort(c.cashed_date)}</span>} />}
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h2 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">ملاحظات</h2>
          {c.notes ? (
            <div className="text-[12px] text-text dark:text-text-dark leading-relaxed">{c.notes}</div>
          ) : (
            <div className="text-[12px] text-muted dark:text-muted-dark">لا ملاحظات</div>
          )}
          <div className="mt-5 pt-5 border-t border-divider dark:border-divider-dark">
            <button
              onClick={() => { if (confirm(`حذف الشيك #${c.number}؟`)) { deleteCheck(c.id); toast("تم الحذف", "warn"); history.back(); } }}
              className="text-[11px] text-danger dark:text-danger-dark font-bold hover:underline"
            >
              🗑 حذف الشيك
            </button>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-divider/50 dark:border-divider-dark/50 last:border-0">
      <span className="text-muted dark:text-muted-dark">{label}</span>
      <span>{value}</span>
    </div>
  );
}

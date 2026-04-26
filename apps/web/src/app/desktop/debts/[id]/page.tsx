"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { formatArDateShort, relativeDue, daysUntil } from "@/lib/dates";

export default function DesktopDebtDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { findDebt, setDebtStatus, deleteDebt } = useStore();
  const d = findDebt(params.id);

  if (!d) {
    return (
      <DesktopPage breadcrumb="على الحساب" backHref="/desktop/debts" title="الدَين غير موجود">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center">
          <div className="text-[13px] text-muted dark:text-muted-dark">هذا الدَين غير موجود</div>
        </div>
      </DesktopPage>
    );
  }

  const overdue = d.status === "pending" && d.due_date && daysUntil(d.due_date) < 0;

  const sendWhatsApp = () => {
    const msg = d.direction === "incoming"
      ? `مرحبا ${d.party_name}، تذكير بالمبلغ ${d.amount.toLocaleString()} ₪ (${d.description})${d.due_date ? ` المستحق ${formatArDateShort(d.due_date)}` : ""}. شكراً`
      : `مرحبا، أذكرك بدَيني لك: ${d.amount.toLocaleString()} ₪ — ${d.description}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <DesktopPage
      breadcrumb="على الحساب"
      backHref="/desktop/debts"
      title={d.party_name}
      subtitle={`${d.direction === "incoming" ? "دَين لكِ" : "دَين عليكِ"} · ${d.description}`}
      actions={
        <>
          {d.status === "pending" && d.direction === "incoming" && (
            <button onClick={sendWhatsApp} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-success dark:bg-success-dark text-white text-[12px] font-bold hover:opacity-90">
              <Ico name="whatsapp" size={13} sw={1.8} />
              تذكير واتساب
            </button>
          )}
          {d.status === "pending" && (
            <button onClick={() => { setDebtStatus(d.id, "settled"); toast("تم التسوية", "success"); }} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">
              <Ico name="check" size={13} sw={2} />
              {d.direction === "incoming" ? "استلمت الدفع" : "سدّدت"}
            </button>
          )}
          <Link href={`/desktop/debts/${d.id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
            <Ico name="edit" size={13} sw={1.8} />
            تعديل
          </Link>
        </>
      }
    >
      {/* Status banner */}
      <div className={`bg-surface dark:bg-surface-dark rounded-tj border p-6 mb-5 ${
        d.status === "settled" ? "border-s-[3px] border-s-success dark:border-s-success-dark"
        : overdue ? "border-s-[3px] border-s-warning dark:border-s-warning-dark"
        : "border-divider dark:border-divider-dark"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-tj ${
            d.direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
          }`}>
            {d.direction === "incoming" ? "عليهن (لكِ)" : "عليكِ"}
          </span>
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-tj ${
            d.status === "settled" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
            : d.status === "cancelled" ? "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"
            : overdue ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
            : "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
          }`}>
            {d.status === "pending" ? (overdue ? "متأخر" : "قيد") : d.status === "settled" ? "✓ مسدّد" : "ملغى"}
          </span>
        </div>
        <Shekel amt={d.amount} size={38} className="text-text dark:text-text-dark" weight={700} />
        {d.due_date && (
          <div className="text-[13px] text-muted dark:text-muted-dark mt-2">
            تاريخ الاستحقاق: <b className="text-text dark:text-text-dark">{formatArDateShort(d.due_date)}</b>
            {d.status === "pending" && <span className={`ms-2 font-bold ${overdue ? "text-warning dark:text-warning-dark" : ""}`}>· {relativeDue(d.due_date)}</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h2 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">التفاصيل</h2>
          <div className="space-y-2.5 text-[12px]">
            <Row label="الطرف" value={<span className="font-semibold text-text dark:text-text-dark">{d.party_name}</span>} />
            <Row label="الوصف" value={<span className="font-semibold text-text dark:text-text-dark">{d.description}</span>} />
            <Row label="تاريخ الإنشاء" value={<span className="font-semibold text-text dark:text-text-dark">{formatArDateShort(d.issued_date)}</span>} />
            {d.due_date && <Row label="تاريخ الاستحقاق" value={<span className="font-semibold text-text dark:text-text-dark">{formatArDateShort(d.due_date)}</span>} />}
            {d.settled_date && <Row label="تاريخ التسوية" value={<span className="font-semibold text-success dark:text-success-dark">{formatArDateShort(d.settled_date)}</span>} />}
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h2 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">ملاحظات</h2>
          {d.notes ? (
            <div className="text-[12px] text-text dark:text-text-dark leading-relaxed">{d.notes}</div>
          ) : (
            <div className="text-[12px] text-muted dark:text-muted-dark">لا ملاحظات</div>
          )}
          <div className="mt-5 pt-5 border-t border-divider dark:border-divider-dark">
            <button
              onClick={() => { if (confirm("حذف الدَين؟")) { deleteDebt(d.id); toast("تم الحذف", "warn"); history.back(); } }}
              className="text-[11px] text-danger dark:text-danger-dark font-bold hover:underline"
            >
              🗑 حذف الدَين
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

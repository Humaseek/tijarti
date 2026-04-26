"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { catMeta } from "@/lib/expenses";

export default function DesktopExpenseDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { state, deleteExpense } = useStore();
  const e = state.expenses.find((x) => x.id === params.id);

  if (!e) {
    return (
      <DesktopPage breadcrumb="المصاريف" backHref="/desktop/expenses" title="المصروف غير موجود">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-12 text-center">
          <div className="text-[13px] text-muted dark:text-muted-dark">هذا المصروف غير موجود</div>
        </div>
      </DesktopPage>
    );
  }

  const meta = catMeta(e.category);

  return (
    <DesktopPage
      breadcrumb="المصاريف"
      backHref="/desktop/expenses"
      title={e.description}
      subtitle={`${e.category} · ${e.expense_date}`}
      actions={
        <Link href={`/desktop/expenses/${e.id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">
          <Ico name="edit" size={13} sw={1.8} />
          تعديل
        </Link>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-6 border-s-[3px] border-s-danger dark:border-s-danger-dark">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-tj mb-4 ${meta.soft}`}>
            <Ico name={meta.icon as any} size={14} className={meta.tint} sw={1.8} />
            <span className={`text-[11px] font-bold ${meta.tint}`}>{e.category}</span>
          </div>
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-2">المبلغ</div>
          <Shekel amt={e.amount} size={38} className="text-danger dark:text-danger-dark" weight={700} />
          <div className="text-[14px] text-text dark:text-text-dark mt-3 pt-3 border-t border-divider dark:border-divider-dark">{e.description}</div>
        </div>

        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h2 className="text-[13px] font-bold text-text dark:text-text-dark mb-3">معلومات إضافية</h2>
          <div className="space-y-2.5 text-[12px]">
            <Row label="التاريخ" value={<span className="font-semibold text-text dark:text-text-dark">{e.expense_date}</span>} />
            <Row label="طريقة الدفع" value={<span className="font-semibold text-text dark:text-text-dark">{e.payment_method}</span>} />
            <Row label="التصنيف" value={<span className="font-semibold text-text dark:text-text-dark">{e.category}</span>} />
          </div>
          <div className="mt-5 pt-5 border-t border-divider dark:border-divider-dark">
            <button
              onClick={() => { if (confirm("حذف المصروف؟")) { deleteExpense(e.id); toast("تم الحذف", "warn"); history.back(); } }}
              className="text-[11px] text-danger dark:text-danger-dark font-bold hover:underline"
            >
              🗑 حذف المصروف
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

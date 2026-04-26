"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, Card, Row, BottomBar, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Btn, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { catMeta } from "@/lib/expenses";

export default function ExpenseDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { state, deleteExpense } = useStore();

  const exp = state.expenses.find((e) => e.id === params.id);
  if (!exp) {
    return (
      <Screen>
        <TopBar title="تفاصيل المصروف" />
        <Empty icon="money" title="المصروف غير موجود" />
      </Screen>
    );
  }

  const meta = catMeta(exp.category);

  const remove = () => {
    if (!confirm("حذف هذا المصروف؟")) return;
    deleteExpense(exp.id);
    toast("تم حذف المصروف", "warn");
    router.back();
  };

  return (
    <Screen>
      <TopBar
        title="تفاصيل المصروف"
        trailing={
          <IconButton
            name="edit"
            size={20}
            onClick={() => router.push(`/app/expenses/${exp.id}/edit`)}
            label="تعديل"
            className="text-primary"
          />
        }
      />

      {/* Hero */}
      <div className="px-4 pb-3.5">
        <Card className={`p-[22px] text-center border-s-[3px] ${meta.border}`}>
          <div className={`w-14 h-14 rounded-tj ${meta.soft} inline-flex items-center justify-center mb-3`}>
            <Ico name={meta.icon} size={26} className={meta.tint} sw={1.8} />
          </div>
          <div>
            <Shekel amt={exp.amount} size={32} className="text-text dark:text-text-dark" weight={700} />
          </div>
          <div className={`mt-1.5 text-xs font-bold ${meta.tint}`}>{exp.category}</div>
        </Card>
      </div>

      {/* Meta */}
      <div className="px-4 pb-3.5">
        <Card>
          <MetaRow label="التاريخ"        value={exp.expense_date} border />
          <MetaRow label="طريقة الدفع"    value={exp.payment_method} border />
          <MetaRow label="الوصف"           value={exp.description || "—"} border />
          <MetaRow
            label="رقم المصروف"
            value={<Num size={13} className="text-text dark:text-text-dark" weight={600}>{exp.id.replace("e", "")}</Num>}
          />
        </Card>
      </div>

      {/* Receipt placeholder */}
      <div className="px-4 pb-3.5">
        <Card className="p-5 text-center">
          <Ico name="receipt" size={30} className="text-muted dark:text-muted-dark mx-auto mb-2" sw={1.4} />
          <div className="text-[13px] text-subtext dark:text-subtext-dark font-medium">لا يوجد إيصال مرفق</div>
          <div className="text-[11px] text-muted dark:text-muted-dark mt-1">تستطيعين إرفاق صورة الإيصال عند التعديل</div>
        </Card>
      </div>

      <BottomBar className="flex gap-2.5">
        <Btn ghost fullWidth onClick={() => router.push(`/app/expenses/${exp.id}/edit`)}>
          <Ico name="edit" size={15} sw={1.8} />
          تعديل
        </Btn>
        <Btn danger fullWidth onClick={remove}>
          <Ico name="trash" size={15} sw={1.8} />
          حذف
        </Btn>
      </BottomBar>
    </Screen>
  );
}

function MetaRow({ label, value, border }: { label: string; value: React.ReactNode; border?: boolean }) {
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

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Label, TextInput, ShekelInput, Textarea } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { Debt, DebtDirection } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";

export function DesktopDebtForm({ initial }: { initial?: Debt }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addDebt, updateDebt, deleteDebt } = useStore();
  const editing = !!initial;
  const defaultDir = (searchParams?.get("direction") as DebtDirection) || "incoming";

  const [direction, setDirection] = useState<DebtDirection>(initial?.direction || defaultDir);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [partyName, setPartyName] = useState(initial?.party_name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [dueDate, setDueDate] = useState(initial?.due_date || "");
  const [issuedDate, setIssuedDate] = useState(initial?.issued_date || todayIso());
  const [notes, setNotes] = useState(initial?.notes || "");

  const canSave = Number(amount) > 0 && partyName.trim().length > 0 && description.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const data = {
      direction, amount: Number(amount), party_name: partyName.trim(),
      party_id: initial?.party_id || null, description: description.trim(),
      due_date: dueDate || null, issued_date: issuedDate,
      status: initial?.status || ("pending" as const),
      settled_date: initial?.settled_date || null, notes,
    };
    if (editing && initial) { updateDebt(initial.id, data); toast("تم التحديث", "success"); }
    else { addDebt(data); toast("تم الإضافة", "success"); }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm("حذف الدَين؟")) return;
    deleteDebt(initial.id);
    toast("تم الحذف", "warn");
    router.push("/desktop/debts");
  };

  return (
    <DesktopPage
      breadcrumb="على الحساب"
      backHref="/desktop/debts"
      title={editing ? "تعديل الدَين" : `دَين ${direction === "incoming" ? "لكِ" : "عليكِ"} جديد`}
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={save} disabled={!canSave} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canSave ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>{editing ? "حفظ" : "إضافة"}</button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <Label>اتجاه الدَين</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["incoming", "outgoing"] as DebtDirection[]).map((d) => (
                <button key={d} onClick={() => setDirection(d)} className={`py-3 text-[13px] rounded-tj border font-semibold transition-colors ${direction === d ? (d === "incoming" ? "bg-success dark:bg-success-dark text-white border-transparent" : "bg-danger dark:bg-danger-dark text-white border-transparent") : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark hover:bg-surface2 dark:hover:bg-surface2-dark"}`}>
                  {d === "incoming" ? "عليهن (لكِ)" : "عليكِ"}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">تفاصيل الدَين</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label required>المبلغ</Label><ShekelInput value={amount} onChange={setAmount} /></div>
                <div><Label required>الطرف</Label><TextInput value={partyName} onChange={setPartyName} placeholder={direction === "incoming" ? "اسم الزبون" : "اسم الشخص/الجهة"} /></div>
              </div>
              <div><Label required>الوصف</Label><TextInput value={description} onChange={setDescription} placeholder={direction === "incoming" ? "مثال: فستان بدون فاتورة" : "مثال: تصليح كهربائي"} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>تاريخ النشوء</Label><input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none" /></div>
                <div><Label optional>تاريخ الاستحقاق</Label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none" /></div>
              </div>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <Label optional>ملاحظات</Label>
            <Textarea value={notes} onChange={setNotes} placeholder="مثال: صديقة، ادفعي لما تقدري" />
          </div>

          {editing && (
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-danger dark:border-danger-dark p-5">
              <h3 className="text-[13px] font-bold text-danger dark:text-danger-dark mb-2">منطقة خطرة</h3>
              <button onClick={remove} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
                <Ico name="trash" size={13} sw={1.8} /> حذف الدَين
              </button>
            </div>
          )}
        </div>

        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 h-fit">
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3">معاينة</div>
          <div className="bg-bg dark:bg-bg-dark rounded-tj p-4 border-s-[3px] border-s-primary">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"}`}>
              {direction === "incoming" ? "عليهن (لكِ)" : "عليكِ"}
            </span>
            <div className="text-[22px] font-bold text-text dark:text-text-dark tj-num my-3">{amount ? `${Number(amount).toLocaleString()} ₪` : "— ₪"}</div>
            {partyName && <div className="text-[13px] font-bold text-text dark:text-text-dark">{partyName}</div>}
            {description && <div className="text-[11px] text-muted dark:text-muted-dark mt-1">{description}</div>}
            {dueDate && <div className="text-[11px] text-warning dark:text-warning-dark mt-2 pt-2 border-t border-divider dark:border-divider-dark font-bold">استحقاق: {dueDate}</div>}
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Btn, IconButton, Toggle } from "@/components/ui/controls";
import { Label, TextInput, Textarea } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { Debt, DebtDirection } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";

interface DebtFormProps {
  initial?: Debt;
  defaultDirection?: DebtDirection;
}

export function DebtForm({ initial, defaultDirection = "incoming" }: DebtFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addDebt, updateDebt, deleteDebt } = useStore();
  const editing = !!initial;

  const [direction,   setDirection]   = useState<DebtDirection>(initial?.direction || defaultDirection);
  const [amount,      setAmount]      = useState(initial ? String(initial.amount) : "");
  const [partyName,   setPartyName]   = useState(initial?.party_name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [hasDueDate,  setHasDueDate]  = useState(!!initial?.due_date);
  const [dueDate,     setDueDate]     = useState(initial?.due_date || todayIso());
  const [issuedDate,  setIssuedDate]  = useState(initial?.issued_date || todayIso());
  const [notes,       setNotes]       = useState(initial?.notes || "");

  const canSave = Number(amount) > 0 && partyName.trim().length > 0 && description.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const data = {
      direction,
      amount: Number(amount),
      party_name: partyName.trim(),
      party_id: initial?.party_id || null,
      description: description.trim(),
      due_date: hasDueDate ? dueDate : null,
      issued_date: issuedDate,
      status: initial?.status || ("pending" as const),
      notes,
      settled_date: initial?.settled_date || null,
    };
    if (editing && initial) {
      updateDebt(initial.id, data);
      toast("تم تحديث الدَين", "success");
    } else {
      addDebt(data);
      toast(direction === "incoming" ? "تم تسجيل الدَين علينا" : "تم تسجيل الدَين علينا عليكِ", "success");
    }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm("حذف هذا الدَين؟")) return;
    deleteDebt(initial.id);
    toast("تم الحذف", "warn");
    router.push("/app/debts");
  };

  return (
    <Screen>
      <TopBar
        title={editing ? "تعديل دَين" : "دَين جديد — على الحساب"}
        noBack
        leading={<IconButton name="close" onClick={() => router.back()} size={22} label="إلغاء" />}
        trailing={
          <span
            onClick={save}
            className={`tj-btn text-sm font-bold ${canSave ? "text-primary" : "text-muted dark:text-muted-dark opacity-60"}`}
            role="button"
            tabIndex={canSave ? 0 : -1}
          >
            حفظ
          </span>
        }
      />

      <div className="px-5 pb-5 flex-1">
        {/* Direction */}
        <div className="mb-4">
          <Label required>الاتجاه</Label>
          <Row className="gap-2">
            {(["incoming", "outgoing"] as DebtDirection[]).map((d) => {
              const active = direction === d;
              const label = d === "incoming" ? "عليه لي (زبونة لم تدفع)" : "عليّ له (خدمة لم أدفعها)";
              const activeCls = d === "incoming"
                ? "bg-success dark:bg-success-dark text-white"
                : "bg-danger  dark:bg-danger-dark  text-white";
              return (
                <div
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`tj-btn flex-1 p-3 text-center rounded-tj border ${
                    active ? `${activeCls} font-bold border-transparent` : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark font-medium"
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="text-[12px] leading-tight">{label}</div>
                </div>
              );
            })}
          </Row>
        </div>

        {/* Amount */}
        <Card className="p-5 text-center mb-3.5">
          <div className="text-[11px] text-subtext dark:text-subtext-dark mb-2 tracking-wide">المبلغ</div>
          <Row className="justify-center gap-1.5">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              className="tj-num text-[36px] font-bold text-text dark:text-text-dark text-center bg-transparent border-0 outline-none w-[160px]"
            />
            <span className="tj-num text-[22px] font-medium text-subtext dark:text-subtext-dark self-center">₪</span>
          </Row>
        </Card>

        <div className="mb-3.5">
          <Label required>{direction === "incoming" ? "اسم الشخص / المصلحة" : "اسم الخدمة / المورد"}</Label>
          <TextInput value={partyName} onChange={setPartyName} placeholder={direction === "incoming" ? "مثال: هيا منصور" : "مثال: أحمد الكهربائي"} />
        </div>

        <div className="mb-3.5">
          <Label required>الوصف</Label>
          <TextInput value={description} onChange={setDescription} placeholder={direction === "incoming" ? "مثال: فستان على الحساب" : "مثال: تصليح كهرباء"} />
        </div>

        {/* Optional due date */}
        <Card className="p-3.5 mb-3.5">
          <Row className="justify-between mb-1">
            <div>
              <div className="text-[13px] text-text dark:text-text-dark font-semibold">يوجد تاريخ استحقاق</div>
              <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                {hasDueDate ? "سيظهر في التدفق النقدي حسب التاريخ" : "مفتوح — بدون تاريخ محدّد"}
              </div>
            </div>
            <Toggle on={hasDueDate} onChange={setHasDueDate} />
          </Row>
          {hasDueDate && (
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-muted dark:text-muted-dark mb-1">الاستحقاق</div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm bg-bg dark:bg-bg-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
                />
              </div>
              <div>
                <div className="text-[10px] text-muted dark:text-muted-dark mb-1">تاريخ النشأة</div>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm bg-bg dark:bg-bg-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
                />
              </div>
            </div>
          )}
        </Card>

        <div className="mb-3.5">
          <Label optional>ملاحظات</Label>
          <Textarea value={notes} onChange={setNotes} placeholder="مثال: قال ادفع لما تقدري — صديقة" />
        </div>

        {editing && (
          <div className="mt-2">
            <Btn danger fullWidth onClick={remove}>
              <Ico name="trash" size={15} sw={1.8} />
              حذف الدَين
            </Btn>
          </div>
        )}
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canSave} onClick={save}>
          <Ico name="check" size={15} sw={2.4} />
          {editing ? "حفظ التعديلات" : `تسجيل (${Number(amount || 0).toLocaleString()} ₪)`}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

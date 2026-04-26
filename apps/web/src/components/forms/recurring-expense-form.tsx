"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Btn, IconButton, Toggle } from "@/components/ui/controls";
import { Label, TextInput, NumberInput, ShekelInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type RecurringExpense,
  type RecurringFrequency,
} from "@/lib/store/types";
import { todayIso } from "@/lib/dates";

interface RecurringFormProps {
  initial?: RecurringExpense;
}

export function RecurringExpenseForm({ initial }: RecurringFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addRecurring, updateRecurring, deleteRecurring } = useStore();
  const editing = !!initial;

  const [name,      setName]      = useState(initial?.name || "");
  const [amount,    setAmount]    = useState(initial ? String(initial.amount) : "");
  const [category,  setCategory]  = useState<ExpenseCategory>(initial?.category || "إيجار");
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency || "monthly");
  const [dayOfMonth, setDayOfMonth] = useState(initial?.day_of_month ? String(initial.day_of_month) : "1");
  const [startDate, setStartDate] = useState(initial?.start_date || todayIso());
  const [hasEnd,    setHasEnd]    = useState(!!initial?.end_date);
  const [endDate,   setEndDate]   = useState(initial?.end_date || todayIso());
  const [isActive,  setIsActive]  = useState(initial ? initial.is_active : true);
  const [notes,     setNotes]     = useState(initial?.notes || "");

  const canSave = name.trim().length > 0 && Number(amount) > 0;

  const save = () => {
    if (!canSave) return;
    const data = {
      name: name.trim(),
      amount: Number(amount),
      category,
      frequency,
      day_of_month: frequency === "monthly" ? Math.max(1, Math.min(31, Number(dayOfMonth) || 1)) : undefined,
      start_date: startDate,
      end_date: hasEnd ? endDate : null,
      is_active: isActive,
      notes,
    };
    if (editing && initial) {
      updateRecurring(initial.id, data);
      toast("تم تحديث المصروف الثابت", "success");
    } else {
      addRecurring(data);
      toast("تم إضافة المصروف الثابت", "success");
    }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm(`حذف "${initial.name}"؟`)) return;
    deleteRecurring(initial.id);
    toast("تم الحذف", "warn");
    router.push("/app/expenses/recurring");
  };

  return (
    <Screen>
      <TopBar
        title={editing ? "تعديل مصروف ثابت" : "مصروف ثابت جديد"}
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
        {/* Amount */}
        <Card className="p-5 text-center mb-3.5">
          <div className="text-[11px] text-subtext dark:text-subtext-dark mb-2 tracking-wide">المبلغ الشهري</div>
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
          <Label required>الاسم</Label>
          <TextInput value={name} onChange={setName} placeholder="مثال: إيجار المحل" />
        </div>

        <div className="mb-3.5">
          <Label>التصنيف</Label>
          <Select
            value={category}
            options={EXPENSE_CATEGORIES as readonly string[]}
            onChange={(v) => setCategory(v as ExpenseCategory)}
          />
        </div>

        {/* Frequency + day */}
        <div className="mb-3.5">
          <Label>التكرار</Label>
          <Row className="gap-2 mb-2">
            {(["monthly", "weekly"] as RecurringFrequency[]).map((f) => {
              const active = frequency === f;
              return (
                <div
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`tj-btn flex-1 py-3 text-center text-sm rounded-tj border ${
                    active
                      ? "bg-primary text-white dark:text-bg-dark border-transparent font-bold"
                      : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark font-medium"
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  {f === "monthly" ? "شهري" : "أسبوعي"}
                </div>
              );
            })}
          </Row>
          {frequency === "monthly" && (
            <Card className="p-3">
              <div className="text-[11px] text-subtext dark:text-subtext-dark mb-1.5">
                يوم الشهر (1–31)
              </div>
              <NumberInput value={dayOfMonth} onChange={setDayOfMonth} align="center" />
              <div className="text-[10px] text-muted dark:text-muted-dark mt-1.5">
                إذا الشهر أقصر (مثلاً فبراير) يُستعمل آخر يوم تلقائياً
              </div>
            </Card>
          )}
        </div>

        {/* Start date */}
        <div className="mb-3.5">
          <Label>تاريخ البدء</Label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
          />
        </div>

        {/* Optional end date */}
        <Card className="p-3.5 mb-3.5">
          <Row className="justify-between mb-1">
            <div>
              <div className="text-[13px] text-text dark:text-text-dark font-semibold">تاريخ انتهاء</div>
              <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                {hasEnd ? "يتوقّف تلقائياً بعد التاريخ" : "مستمرّ بلا نهاية (مثلاً إيجار)"}
              </div>
            </div>
            <Toggle on={hasEnd} onChange={setHasEnd} />
          </Row>
          {hasEnd && (
            <div className="mt-2.5">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-[14px] py-3 text-sm bg-bg dark:bg-bg-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
              />
            </div>
          )}
        </Card>

        {/* Active toggle */}
        <Card className="p-3.5 mb-3.5">
          <Row className="justify-between">
            <div>
              <div className="text-[13px] text-text dark:text-text-dark font-semibold">نشط</div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                {isActive ? "يظهر في التوقّع الشهري" : "موقوف مؤقتاً"}
              </div>
            </div>
            <Toggle on={isActive} onChange={setIsActive} />
          </Row>
        </Card>

        <div className="mb-3.5">
          <Label optional>ملاحظات</Label>
          <TextInput value={notes} onChange={setNotes} placeholder="مثال: مالك المحل أبو خالد" />
        </div>

        {editing && (
          <div className="mt-2">
            <Btn danger fullWidth onClick={remove}>
              <Ico name="trash" size={15} sw={1.8} />
              حذف المصروف الثابت
            </Btn>
          </div>
        )}
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canSave} onClick={save}>
          <Ico name="check" size={15} sw={2.4} />
          {editing ? "حفظ التعديلات" : "إضافة"}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

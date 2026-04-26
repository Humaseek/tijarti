"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Label, TextInput, Textarea, ShekelInput, NumberInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, type RecurringExpense, type ExpenseCategory, type RecurringFrequency } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";

export function DesktopRecurringForm({ initial }: { initial?: RecurringExpense }) {
  const router = useRouter();
  const { toast } = useToast();
  const { addRecurring, updateRecurring, deleteRecurring } = useStore();
  const editing = !!initial;

  const [name, setName] = useState(initial?.name || "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category || "إيجار");
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency || "monthly");
  const [dayOfMonth, setDayOfMonth] = useState(initial?.day_of_month ? String(initial.day_of_month) : "1");
  const [dayOfWeek, setDayOfWeek] = useState(initial?.day_of_week ? String(initial.day_of_week) : "0");
  const [startDate, setStartDate] = useState(initial?.start_date || todayIso());
  const [endDate, setEndDate] = useState(initial?.end_date || "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [notes, setNotes] = useState(initial?.notes || "");

  const canSave = name.trim().length > 0 && Number(amount) > 0;

  const save = () => {
    if (!canSave) return;
    const data = {
      name: name.trim(), amount: Number(amount), category, frequency,
      day_of_month: frequency === "monthly" ? Number(dayOfMonth) || 1 : undefined,
      day_of_week: frequency === "weekly" ? Number(dayOfWeek) : undefined,
      start_date: startDate, end_date: endDate || null, is_active: isActive, notes,
    };
    if (editing && initial) { updateRecurring(initial.id, data); toast("تم التحديث", "success"); }
    else { addRecurring(data); toast("تم إضافة مصروف ثابت", "success"); }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm(`حذف "${initial.name}"؟`)) return;
    deleteRecurring(initial.id);
    toast("تم الحذف", "warn");
    router.push("/desktop/expenses/recurring");
  };

  return (
    <DesktopPage
      breadcrumb="المصاريف الثابتة"
      backHref="/desktop/expenses/recurring"
      title={editing ? `تعديل ${initial.name}` : "مصروف ثابت جديد"}
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
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">معلومات أساسية</h3>
            <div className="space-y-3">
              <div><Label required>الاسم</Label><TextInput value={name} onChange={setName} placeholder="مثال: إيجار المحل" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label required>المبلغ</Label><ShekelInput value={amount} onChange={setAmount} /></div>
                <div><Label>التصنيف</Label><Select value={category} options={EXPENSE_CATEGORIES as readonly ExpenseCategory[]} onChange={(v) => setCategory(v as ExpenseCategory)} /></div>
              </div>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">التكرار</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {(["monthly", "weekly"] as RecurringFrequency[]).map((f) => (
                <button key={f} onClick={() => setFrequency(f)} className={`py-3 text-[13px] rounded-tj border font-semibold ${frequency === f ? "bg-primary text-white border-transparent" : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark"}`}>
                  {f === "monthly" ? "شهري" : "أسبوعي"}
                </button>
              ))}
            </div>
            {frequency === "monthly" ? (
              <div><Label>يوم من الشهر (1-31)</Label><NumberInput value={dayOfMonth} onChange={setDayOfMonth} /></div>
            ) : (
              <div>
                <Label>يوم من الأسبوع</Label>
                <Select value={dayOfWeek} options={[{value:"0",label:"الأحد"},{value:"1",label:"الإثنين"},{value:"2",label:"الثلاثاء"},{value:"3",label:"الأربعاء"},{value:"4",label:"الخميس"},{value:"5",label:"الجمعة"},{value:"6",label:"السبت"}] as readonly { value: string; label: string }[]} onChange={(v) => setDayOfWeek(v)} />
              </div>
            )}
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">الفترة</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ البدء</Label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none" /></div>
              <div><Label optional>تاريخ الانتهاء</Label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none" /></div>
            </div>
            <label className="mt-3 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
              <span className="text-[12px] text-text dark:text-text-dark">نشط (يتم تسجيله تلقائياً)</span>
            </label>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <Label optional>ملاحظات</Label>
            <Textarea value={notes} onChange={setNotes} />
          </div>

          {editing && (
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-danger dark:border-danger-dark p-5">
              <button onClick={remove} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
                <Ico name="trash" size={13} sw={1.8} /> حذف
              </button>
            </div>
          )}
        </div>

        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 h-fit">
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3">معاينة</div>
          <div className="bg-bg dark:bg-bg-dark rounded-tj p-4 border-s-[3px] border-s-primary">
            <div className="text-[14px] font-bold text-text dark:text-text-dark">{name || "اسم المصروف"}</div>
            <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">{category}</div>
            <div className="text-[20px] font-bold text-text dark:text-text-dark tj-num mt-3">{amount ? `${Number(amount).toLocaleString()} ₪` : "— ₪"}</div>
            <div className="text-[11px] text-muted dark:text-muted-dark mt-2 pt-2 border-t border-divider dark:border-divider-dark">
              {frequency === "monthly" ? `شهري · يوم ${dayOfMonth}` : "أسبوعي"} {isActive ? "· نشط" : "· موقوف"}
            </div>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

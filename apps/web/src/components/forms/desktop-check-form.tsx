"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Label, TextInput, ShekelInput, Textarea, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { Check, CheckDirection } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";

const BANKS = ["لئومي", "هبوعليم", "ديسكونت", "مركنتيل", "البريد", "أخرى"];

export function DesktopCheckForm({ initial }: { initial?: Check }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addCheck, updateCheck, deleteCheck } = useStore();
  const editing = !!initial;
  const defaultDir = (searchParams?.get("direction") as CheckDirection) || "incoming";

  const [direction, setDirection] = useState<CheckDirection>(initial?.direction || defaultDir);
  const [number, setNumber] = useState(initial?.number || "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [partyName, setPartyName] = useState(initial?.party_name || "");
  const [dueDate, setDueDate] = useState(initial?.due_date || todayIso());
  const [issuedDate, setIssuedDate] = useState(initial?.issued_date || todayIso());
  const [bank, setBank] = useState(initial?.bank || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  const canSave = number.trim().length > 0 && Number(amount) > 0 && partyName.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const data = {
      direction, number: number.trim(), amount: Number(amount), party_name: partyName.trim(),
      party_id: initial?.party_id || null, due_date: dueDate, issued_date: issuedDate, bank,
      status: initial?.status || ("pending" as const), notes,
      cashed_date: initial?.cashed_date || null,
    };
    if (editing && initial) { updateCheck(initial.id, data); toast("تم التحديث", "success"); }
    else { addCheck(data); toast(direction === "incoming" ? "تم تسجيل شيك وارد" : "تم تسجيل شيك صادر", "success"); }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm(`حذف الشيك #${initial.number}؟`)) return;
    deleteCheck(initial.id);
    toast("تم الحذف", "warn");
    router.push("/desktop/checks");
  };

  return (
    <DesktopPage
      breadcrumb="الشيكات"
      backHref="/desktop/checks"
      title={editing ? `تعديل شيك #${initial.number}` : `شيك ${direction === "incoming" ? "وارد" : "صادر"} جديد`}
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={save} disabled={!canSave} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canSave ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>{editing ? "حفظ" : "إضافة"}</button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          {/* Direction */}
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <Label>اتجاه الشيك</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["incoming", "outgoing"] as CheckDirection[]).map((d) => (
                <button key={d} onClick={() => setDirection(d)} className={`py-3 text-[13px] rounded-tj border font-semibold transition-colors ${direction === d ? (d === "incoming" ? "bg-success dark:bg-success-dark text-white border-transparent" : "bg-danger dark:bg-danger-dark text-white border-transparent") : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark hover:bg-surface2 dark:hover:bg-surface2-dark"}`}>
                  {d === "incoming" ? "⬇ وارد (من زبون/طرف)" : "⬆ صادر (لمورد/طرف)"}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">معلومات الشيك</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label required>رقم الشيك</Label><TextInput value={number} onChange={setNumber} placeholder="125443" inputMode="numeric" dir="ltr" /></div>
                <div><Label required>المبلغ</Label><ShekelInput value={amount} onChange={setAmount} /></div>
              </div>
              <div><Label required>الطرف</Label><TextInput value={partyName} onChange={setPartyName} placeholder={direction === "incoming" ? "اسم الزبون" : "اسم المورد"} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>البنك</Label><Select value={bank || "أخرى"} options={BANKS} onChange={(v) => setBank(v === "أخرى" ? "" : v)} /></div>
                <div><Label optional>بنك مخصّص</Label><TextInput value={bank} onChange={setBank} placeholder="اسم البنك" /></div>
              </div>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">التواريخ</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ الإصدار</Label><input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none" /></div>
              <div><Label required>تاريخ الاستحقاق</Label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none" /></div>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <Label optional>ملاحظات</Label>
            <Textarea value={notes} onChange={setNotes} placeholder="مثال: قسط 2 من 4" />
          </div>

          {editing && (
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-danger dark:border-danger-dark p-5">
              <h3 className="text-[13px] font-bold text-danger dark:text-danger-dark mb-2">منطقة خطرة</h3>
              <button onClick={remove} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
                <Ico name="trash" size={13} sw={1.8} />
                حذف الشيك
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 h-fit sticky top-0">
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3">معاينة</div>
          <div className="bg-bg dark:bg-bg-dark rounded-tj p-4 border-s-[3px] border-s-primary">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"}`}>
                {direction === "incoming" ? "⬇ وارد" : "⬆ صادر"}
              </span>
              {number && <span className="text-[10px] tj-num font-bold text-primary">#{number}</span>}
            </div>
            <div className="text-[22px] font-bold text-text dark:text-text-dark tj-num my-3">
              {amount ? `${Number(amount).toLocaleString()} ₪` : "— ₪"}
            </div>
            {partyName && <div className="text-[13px] font-bold text-text dark:text-text-dark">{partyName}</div>}
            {bank && <div className="text-[10px] text-muted dark:text-muted-dark mt-1">{bank}</div>}
            {dueDate && <div className="text-[11px] text-muted dark:text-muted-dark mt-2 pt-2 border-t border-divider dark:border-divider-dark">استحقاق: {dueDate}</div>}
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

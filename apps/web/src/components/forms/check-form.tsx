"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Btn, IconButton } from "@/components/ui/controls";
import { Label, TextInput } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { Check, CheckDirection } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";

const BANKS = ["لئومي", "هبوعليم", "ديسكونت", "مركنتيل", "البريد", "أخرى"];

interface CheckFormProps {
  initial?: Check;
  /** Pre-fill direction when navigating from a typed CTA. */
  defaultDirection?: CheckDirection;
}

export function CheckForm({ initial, defaultDirection = "incoming" }: CheckFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addCheck, updateCheck, deleteCheck } = useStore();
  const editing = !!initial;

  const [direction, setDirection] = useState<CheckDirection>(initial?.direction || defaultDirection);
  const [number,      setNumber]      = useState(initial?.number || "");
  const [amount,      setAmount]      = useState(initial ? String(initial.amount) : "");
  const [partyName,   setPartyName]   = useState(initial?.party_name || "");
  const [dueDate,     setDueDate]     = useState(initial?.due_date || todayIso());
  const [issuedDate,  setIssuedDate]  = useState(initial?.issued_date || todayIso());
  const [bank,        setBank]        = useState(initial?.bank || "");
  const [notes,       setNotes]       = useState(initial?.notes || "");

  const canSave = number.trim().length > 0 && Number(amount) > 0 && partyName.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const data = {
      direction,
      number: number.trim(),
      amount: Number(amount),
      party_name: partyName.trim(),
      party_id: initial?.party_id || null,
      due_date: dueDate,
      issued_date: issuedDate,
      bank,
      status: initial?.status || ("pending" as const),
      notes,
      cashed_date: initial?.cashed_date || null,
    };
    if (editing && initial) {
      updateCheck(initial.id, data);
      toast("تم تحديث الشيك", "success");
    } else {
      addCheck(data);
      toast(direction === "incoming" ? "تم تسجيل الشيك الوارد" : "تم تسجيل الشيك الصادر", "success");
    }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm(`حذف الشيك #${initial.number}؟`)) return;
    deleteCheck(initial.id);
    toast("تم حذف الشيك", "warn");
    router.push("/app/checks");
  };

  return (
    <Screen>
      <TopBar
        title={editing ? "تعديل شيك" : "شيك جديد"}
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
        {/* Direction segmented — primary decision */}
        <div className="mb-4">
          <Label required>نوع الشيك</Label>
          <Row className="gap-2">
            {(["incoming", "outgoing"] as CheckDirection[]).map((d) => {
              const active = direction === d;
              const label = d === "incoming" ? "وارد (فايت)" : "صادر (طالع)";
              const activeCls = d === "incoming"
                ? "bg-success dark:bg-success-dark text-white border-transparent"
                : "bg-danger dark:bg-danger-dark text-white border-transparent";
              return (
                <div
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`tj-btn flex-1 py-3 text-center text-sm rounded-tj border ${
                    active ? `${activeCls} font-bold` : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark font-medium"
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <Row className="justify-center gap-1.5">
                    <Ico
                      name="trendUp"
                      size={14}
                      style={{ transform: d === "outgoing" ? "scaleY(-1)" : "none" }}
                      sw={1.8}
                    />
                    {label}
                  </Row>
                </div>
              );
            })}
          </Row>
          <div className="text-[10px] text-muted dark:text-muted-dark mt-1.5">
            {direction === "incoming"
              ? "شيك من زبونة — تحصّلينه"
              : "شيك أصدرتِه لمورّد — التزام عليكِ"}
          </div>
        </div>

        {/* Amount hero */}
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
          <Label required>رقم الشيك</Label>
          <TextInput value={number} onChange={setNumber} placeholder="مثال: 125443" dir="ltr" inputMode="numeric" />
        </div>

        <div className="mb-3.5">
          <Label required>{direction === "incoming" ? "اسم الزبونة" : "اسم المورد"}</Label>
          <TextInput value={partyName} onChange={setPartyName} placeholder={direction === "incoming" ? "مثال: أم خالد" : "مثال: مورد تركيا أحمد"} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3.5">
          <div>
            <Label>تاريخ الاستحقاق</Label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
            />
          </div>
          <div>
            <Label>تاريخ الإصدار</Label>
            <input
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className="w-full px-3.5 py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
            />
          </div>
        </div>

        <div className="mb-3.5">
          <Label>البنك</Label>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {BANKS.map((b) => {
              const active = bank === b;
              return (
                <div
                  key={b}
                  onClick={() => setBank(active ? "" : b)}
                  className={`tj-btn whitespace-nowrap px-3 py-2 text-[12px] rounded-full border ${
                    active
                      ? "bg-primary text-white dark:text-bg-dark border-transparent font-bold"
                      : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark font-medium"
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  {b}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-3.5">
          <Label optional>ملاحظات</Label>
          <TextInput value={notes} onChange={setNotes} placeholder="قسط #2 من 4، شحنة فساتين، ..." />
        </div>

        {editing && (
          <div className="mt-2">
            <Btn danger fullWidth onClick={remove}>
              <Ico name="trash" size={15} sw={1.8} />
              حذف الشيك
            </Btn>
          </div>
        )}
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canSave} onClick={save}>
          <Ico name="check" size={15} sw={2.4} />
          {editing ? "حفظ التعديلات" : `تسجيل الشيك (${Number(amount || 0).toLocaleString()} ₪)`}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Avatar } from "@/components/ui/avatar";
import { Btn, IconButton, Toggle } from "@/components/ui/controls";
import { Label, TextInput, Textarea } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { Customer, CustomerTag } from "@/lib/store/types";

const AVATAR_PALETTE = [
  { name: "blue",   hex: "#2563A6" },
  { name: "orange", hex: "#BA7517" },
  { name: "green",  hex: "#0F6E56" },
  { name: "purple", hex: "#6B4B8F" },
  { name: "pink",   hex: "#C2185B" },
  { name: "teal",   hex: "#00897B" },
];

interface CustomerFormProps {
  /** If provided, form is in edit mode. Otherwise it's an add flow. */
  initial?: Customer;
}

export function CustomerForm({ initial }: CustomerFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addCustomer, updateCustomer, deleteCustomer, setDraftCustomer } = useStore();
  const editing = !!initial;
  // `?select=1` means: after saving, auto-select this customer in the current
  // draft invoice and return to /app/sales/new. Used by the pick-customer "+" CTA.
  const selectMode = searchParams?.get("select") === "1";

  const [name,     setName]     = useState(initial?.name || "");
  const [phone,    setPhone]    = useState(initial?.phone || "");
  const [waSame,   setWaSame]   = useState(!initial || !initial.whatsapp || initial.whatsapp === initial.phone);
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || "");
  const [address,  setAddress]  = useState(initial?.address || "");
  const [birthday, setBirthday] = useState<string>(initial?.birthday || "");
  const [tag,      setTag]      = useState<CustomerTag>(initial?.tag || "عادية");
  const [notes,    setNotes]    = useState(initial?.notes || "");
  const [colorHex, setColorHex] = useState(initial?.avatar_color || AVATAR_PALETTE[0].hex);

  const initial1 = (name || "؟").charAt(0);
  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const data = {
      name: name.trim(),
      phone,
      whatsapp: waSame ? phone : whatsapp,
      address,
      birthday: birthday || null,
      tag,
      notes,
      avatar_color: colorHex,
      initial: initial1,
    };
    if (editing && initial) {
      updateCustomer(initial.id, data);
      toast("تم تحديث الزبونة", "success");
      router.back();
      return;
    }
    const newId = addCustomer(data as Partial<Customer> & { name: string });
    toast("تم إضافة الزبونة", "success");
    // If we were invoked from pick-customer (select flow), auto-select the new
    // customer into the draft invoice and skip back to sales/new directly.
    if (selectMode) {
      setDraftCustomer(newId);
      router.push("/app/sales/new");
      return;
    }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm(`حذف ${initial.name}؟ لا يمكن التراجع.`)) return;
    deleteCustomer(initial.id);
    toast("تم حذف الزبونة", "warn");
    router.push("/app/customers");
  };

  return (
    <Screen>
      <TopBar
        title={editing ? "تعديل زبونة" : "زبونة جديدة"}
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
        {/* Avatar + color picker */}
        <Card className="p-[22px] text-center mb-4">
          <div className="flex justify-center mb-3.5">
            <Avatar name={name} initial={initial1} size={74} bg={colorHex} />
          </div>
          <div className="text-[11px] text-subtext dark:text-subtext-dark font-semibold mb-2.5 tracking-wide">
            لون الصورة
          </div>
          <Row className="justify-center gap-2.5">
            {AVATAR_PALETTE.map((c) => {
              const active = colorHex === c.hex;
              return (
                <div
                  key={c.name}
                  onClick={() => setColorHex(c.hex)}
                  className="tj-btn w-7 h-7 rounded-full cursor-pointer transition-[border]"
                  style={{
                    background: c.hex,
                    border: active ? "2.5px solid currentColor" : "2px solid rgba(0,0,0,0.1)",
                    color: "var(--tj-primary-border, currentColor)",
                  }}
                  aria-label={c.name}
                />
              );
            })}
          </Row>
        </Card>

        <div className="mb-3.5">
          <Label required>الاسم الكامل</Label>
          <TextInput value={name} onChange={setName} placeholder="مثال: أم خالد" />
        </div>

        <div className="mb-3.5">
          <Label>رقم الهاتف</Label>
          <TextInput value={phone} onChange={setPhone} placeholder="+972 50 123 4567" type="tel" inputMode="tel" dir="ltr" />
        </div>

        {/* WhatsApp toggle */}
        <Card className="p-3.5 mb-3.5">
          <Row className="justify-between">
            <Row className="gap-2.5">
              <div className="w-7 h-7 rounded-tj bg-success-soft dark:bg-success-soft-dark flex items-center justify-center">
                <Ico name="whatsapp" size={14} className="text-success dark:text-success-dark" sw={1.8} />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-text dark:text-text-dark">رقم الواتساب نفسه</div>
                <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                  {waSame ? "سنستخدم نفس الرقم" : "أدخلي رقماً مختلفاً"}
                </div>
              </div>
            </Row>
            <Toggle on={waSame} onChange={setWaSame} />
          </Row>
          {!waSame && (
            <div className="mt-3">
              <TextInput value={whatsapp} onChange={setWhatsapp} placeholder="+972 50 ..." type="tel" inputMode="tel" dir="ltr" />
            </div>
          )}
        </Card>

        <div className="mb-3.5">
          <Label optional>العنوان</Label>
          <Textarea value={address} onChange={setAddress} placeholder="مثال: الناصرة، حي الصفافرة" />
        </div>

        <div className="mb-3.5">
          <Label optional>تاريخ الميلاد</Label>
          <TextInput value={birthday} onChange={setBirthday} placeholder="15 مارس 1988" />
        </div>

        <div className="mb-3.5">
          <Label>التصنيف</Label>
          <Row className="gap-2">
            {(["عادية", "VIP", "جديدة"] as CustomerTag[]).map((t) => {
              const active = tag === t;
              const cls = active
                ? t === "VIP"
                  ? "bg-warning dark:bg-warning-dark text-white border-transparent"
                  : "bg-primary text-white dark:text-bg-dark border-transparent"
                : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark";
              return (
                <div
                  key={t}
                  onClick={() => setTag(t)}
                  className={`tj-btn flex-1 py-3 text-center text-sm rounded-tj border ${cls} ${active ? "font-bold" : "font-medium"}`}
                  role="button"
                  tabIndex={0}
                >
                  {t}
                </div>
              );
            })}
          </Row>
        </div>

        <div className="mb-3.5">
          <Label optional>ملاحظات</Label>
          <Textarea value={notes} onChange={setNotes} placeholder="تفضيلات، تنبيهات، ..." />
        </div>

        {editing && (
          <div className="mt-1.5">
            <Btn danger fullWidth onClick={remove}>
              <Ico name="trash" size={15} sw={1.8} />
              حذف الزبونة
            </Btn>
          </div>
        )}
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canSave} onClick={save}>
          {editing ? "حفظ التعديلات" : "إضافة الزبونة"}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

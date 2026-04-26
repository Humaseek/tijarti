"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Avatar } from "@/components/ui/avatar";
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

/** Native desktop customer form (new + edit). */
export function DesktopCustomerForm({ initial }: { initial?: Customer }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addCustomer, updateCustomer, deleteCustomer, setDraftCustomer } = useStore();
  const editing = !!initial;
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
      name: name.trim(), phone,
      whatsapp: waSame ? phone : whatsapp,
      address, birthday: birthday || null,
      tag, notes, avatar_color: colorHex, initial: initial1,
    };
    if (editing && initial) {
      updateCustomer(initial.id, data);
      toast("تم تحديث الزبونة", "success");
      router.back();
      return;
    }
    const newId = addCustomer(data as Partial<Customer> & { name: string });
    toast("تم إضافة الزبونة", "success");
    if (selectMode) {
      setDraftCustomer(newId);
      router.push("/desktop/sales/new");
      return;
    }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm(`حذف ${initial.name}؟ لا يمكن التراجع.`)) return;
    deleteCustomer(initial.id);
    toast("تم الحذف", "warn");
    router.push("/desktop/customers");
  };

  return (
    <DesktopPage
      breadcrumb="الزبائن"
      backHref="/desktop/customers"
      title={editing ? `تعديل ${initial.name}` : "زبونة جديدة"}
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={save} disabled={!canSave} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canSave ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>
            {editing ? "حفظ التعديلات" : "إضافة الزبونة"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        {/* Avatar + color */}
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-6 text-center">
          <div className="flex justify-center mb-4">
            <Avatar name={name} initial={initial1} size={100} bg={colorHex} />
          </div>
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3 tracking-wide">لون الصورة</div>
          <div className="flex justify-center gap-2">
            {AVATAR_PALETTE.map((c) => (
              <button
                key={c.name}
                onClick={() => setColorHex(c.hex)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c.hex,
                  border: colorHex === c.hex ? "3px solid currentColor" : "2px solid rgba(0,0,0,0.1)",
                }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        {/* Main fields */}
        <div className="col-span-8 space-y-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">المعلومات الأساسية</h3>
            <div className="space-y-3">
              <div>
                <Label required>الاسم الكامل</Label>
                <TextInput value={name} onChange={setName} placeholder="مثال: أم خالد" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>رقم الهاتف</Label>
                  <TextInput value={phone} onChange={setPhone} placeholder="+972 50 123 4567" type="tel" inputMode="tel" dir="ltr" />
                </div>
                <div>
                  <Label optional>تاريخ الميلاد</Label>
                  <TextInput value={birthday} onChange={setBirthday} placeholder="15 مارس 1988" />
                </div>
              </div>
              <div>
                <Label>التصنيف</Label>
                <div className="flex gap-2">
                  {(["عادية", "VIP", "جديدة"] as CustomerTag[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTag(t)}
                      className={`flex-1 py-2.5 text-[12px] rounded-tj border font-semibold transition-colors ${
                        tag === t
                          ? t === "VIP"
                            ? "bg-warning dark:bg-warning-dark text-white border-transparent"
                            : "bg-primary text-white border-transparent"
                          : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark hover:bg-surface2 dark:hover:bg-surface2-dark"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp card */}
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-tj bg-success-soft dark:bg-success-soft-dark flex items-center justify-center">
                  <Ico name="whatsapp" size={15} className="text-success dark:text-success-dark" sw={1.8} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-text dark:text-text-dark">رقم الواتساب</div>
                  <div className="text-[10px] text-muted dark:text-muted-dark">{waSame ? "نفس رقم الهاتف" : "رقم مختلف"}</div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={waSame} onChange={(e) => setWaSame(e.target.checked)} className="w-4 h-4" />
                <span className="text-[12px] text-text dark:text-text-dark">نفس رقم الهاتف</span>
              </label>
            </div>
            {!waSame && <TextInput value={whatsapp} onChange={setWhatsapp} placeholder="+972 50 ..." type="tel" inputMode="tel" dir="ltr" />}
          </div>

          {/* Address + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
              <Label optional>العنوان</Label>
              <Textarea value={address} onChange={setAddress} placeholder="مثال: الناصرة، حي الصفافرة" />
            </div>
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
              <Label optional>ملاحظات</Label>
              <Textarea value={notes} onChange={setNotes} placeholder="تفضيلات، تنبيهات..." />
            </div>
          </div>

          {editing && (
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-danger dark:border-danger-dark p-5">
              <h3 className="text-[13px] font-bold text-danger dark:text-danger-dark mb-2">منطقة خطرة</h3>
              <p className="text-[11px] text-muted dark:text-muted-dark mb-3">حذف الزبونة لا يمكن التراجع عنه.</p>
              <button onClick={remove} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
                <Ico name="trash" size={13} sw={1.8} />
                حذف الزبونة
              </button>
            </div>
          )}
        </div>
      </div>
    </DesktopPage>
  );
}

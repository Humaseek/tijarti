"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Avatar } from "@/components/ui/avatar";
import { Label, TextInput, Textarea, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, type Supplier, type ExpenseCategory } from "@/lib/store/types";

const AVATAR_PALETTE = [
  { name: "blue",   hex: "#2563A6" },
  { name: "orange", hex: "#BA7517" },
  { name: "green",  hex: "#0F6E56" },
  { name: "purple", hex: "#6B4B8F" },
  { name: "pink",   hex: "#C2185B" },
  { name: "teal",   hex: "#00897B" },
];

export function DesktopSupplierForm({ initial }: { initial?: Supplier }) {
  const router = useRouter();
  const { toast } = useToast();
  const { addSupplier, updateSupplier, deleteSupplier } = useStore();
  const editing = !!initial;

  const [name,    setName]    = useState(initial?.name || "");
  const [phone,   setPhone]   = useState(initial?.phone || "");
  const [email,   setEmail]   = useState(initial?.email || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [businessNumber, setBusinessNumber] = useState(initial?.business_number || "");
  const [defaultCategory, setDefaultCategory] = useState<ExpenseCategory>(initial?.default_category || "أخرى");
  const [paymentTerms, setPaymentTerms] = useState(initial?.payment_terms || "");
  const [notes,   setNotes]   = useState(initial?.notes || "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [colorHex, setColorHex] = useState(initial?.avatar_color || AVATAR_PALETTE[0].hex);

  const initial1 = (name || "؟").charAt(0);
  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const data = { name: name.trim(), phone, email, address, business_number: businessNumber, default_category: defaultCategory, payment_terms: paymentTerms, notes, is_active: isActive, avatar_color: colorHex, initial: initial1 };
    if (editing && initial) { updateSupplier(initial.id, data); toast("تم التحديث", "success"); }
    else { addSupplier(data as Partial<Supplier> & { name: string }); toast("تم الإضافة", "success"); }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm(`حذف ${initial.name}؟`)) return;
    deleteSupplier(initial.id);
    toast("تم الحذف", "warn");
    router.push("/desktop/suppliers");
  };

  return (
    <DesktopPage
      breadcrumb="الموردين"
      backHref="/desktop/suppliers"
      title={editing ? `تعديل ${initial.name}` : "مورد جديد"}
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={save} disabled={!canSave} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canSave ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>
            {editing ? "حفظ" : "إضافة"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-6 text-center">
          <div className="flex justify-center mb-4">
            <Avatar name={name} initial={initial1} size={100} bg={colorHex} />
          </div>
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3 tracking-wide">لون الصورة</div>
          <div className="flex justify-center gap-2">
            {AVATAR_PALETTE.map((c) => (
              <button key={c.name} onClick={() => setColorHex(c.hex)} className="w-8 h-8 rounded-full transition-transform hover:scale-110" style={{ background: c.hex, border: colorHex === c.hex ? "3px solid currentColor" : "2px solid rgba(0,0,0,0.1)" }} aria-label={c.name} />
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-divider dark:border-divider-dark flex items-center justify-between">
            <span className="text-[12px] text-text dark:text-text-dark">المورد نشط</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
            </label>
          </div>
        </div>

        <div className="col-span-8 space-y-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">معلومات أساسية</h3>
            <div className="space-y-3">
              <div>
                <Label required>اسم المورد</Label>
                <TextInput value={name} onChange={setName} placeholder="مثال: جملة الشام" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label optional>رقم الهاتف</Label>
                  <TextInput value={phone} onChange={setPhone} placeholder="04-..." type="tel" inputMode="tel" dir="ltr" />
                </div>
                <div>
                  <Label optional>רقم עוסק/ח.פ</Label>
                  <TextInput value={businessNumber} onChange={setBusinessNumber} placeholder="511234567" inputMode="numeric" dir="ltr" />
                </div>
              </div>
              <div>
                <Label optional>البريد الإلكتروني</Label>
                <TextInput value={email} onChange={setEmail} placeholder="supplier@example.com" type="email" inputMode="email" dir="ltr" />
              </div>
              <div>
                <Label optional>العنوان</Label>
                <Textarea value={address} onChange={setAddress} placeholder="المدينة والشارع" />
              </div>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">التسعير والدفع</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التصنيف الافتراضي</Label>
                <Select value={defaultCategory} options={EXPENSE_CATEGORIES as readonly ExpenseCategory[]} onChange={(v) => setDefaultCategory(v as ExpenseCategory)} />
              </div>
              <div>
                <Label optional>شروط الدفع</Label>
                <TextInput value={paymentTerms} onChange={setPaymentTerms} placeholder="شيك 30 يوم / نقدي" />
              </div>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <Label optional>ملاحظات</Label>
            <Textarea value={notes} onChange={setNotes} placeholder="تفاصيل عن المورد، تفضيلات..." />
          </div>

          {editing && (
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-danger dark:border-danger-dark p-5">
              <h3 className="text-[13px] font-bold text-danger dark:text-danger-dark mb-2">منطقة خطرة</h3>
              <button onClick={remove} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
                <Ico name="trash" size={13} sw={1.8} />
                حذف المورد
              </button>
            </div>
          )}
        </div>
      </div>
    </DesktopPage>
  );
}

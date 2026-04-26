"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Avatar } from "@/components/ui/avatar";
import { Btn, IconButton, Toggle } from "@/components/ui/controls";
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

interface SupplierFormProps {
  initial?: Supplier;
}

export function SupplierForm({ initial }: SupplierFormProps) {
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
    const data = {
      name: name.trim(),
      phone,
      email,
      address,
      business_number: businessNumber,
      default_category: defaultCategory,
      payment_terms: paymentTerms,
      notes,
      is_active: isActive,
      avatar_color: colorHex,
      initial: initial1,
    };
    if (editing && initial) {
      updateSupplier(initial.id, data);
      toast("تم تحديث المورد", "success");
    } else {
      addSupplier(data as Partial<Supplier> & { name: string });
      toast("تم إضافة المورد", "success");
    }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm(`حذف ${initial.name}؟`)) return;
    deleteSupplier(initial.id);
    toast("تم الحذف", "warn");
    router.push("/app/suppliers");
  };

  return (
    <Screen>
      <TopBar
        title={editing ? "تعديل مورد" : "مورد جديد"}
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

      <div className="px-5 pb-5 flex-1 overflow-auto">
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
                  className="tj-btn w-7 h-7 rounded-full cursor-pointer"
                  style={{
                    background: c.hex,
                    border: active ? "2.5px solid currentColor" : "2px solid rgba(0,0,0,0.1)",
                  }}
                  aria-label={c.name}
                />
              );
            })}
          </Row>
        </Card>

        <div className="mb-3.5">
          <Label required>اسم المورد</Label>
          <TextInput value={name} onChange={setName} placeholder="مثال: جملة الشام" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="mb-3.5">
            <Label optional>رقم الهاتف</Label>
            <TextInput value={phone} onChange={setPhone} placeholder="04-..." type="tel" inputMode="tel" dir="ltr" />
          </div>
          <div className="mb-3.5">
            <Label optional>רقم עוסק/ח.פ</Label>
            <TextInput value={businessNumber} onChange={setBusinessNumber} placeholder="511234567" inputMode="numeric" dir="ltr" />
          </div>
        </div>

        <div className="mb-3.5">
          <Label optional>البريد الإلكتروني</Label>
          <TextInput value={email} onChange={setEmail} placeholder="supplier@example.com" type="email" inputMode="email" dir="ltr" />
        </div>

        <div className="mb-3.5">
          <Label optional>العنوان</Label>
          <Textarea value={address} onChange={setAddress} placeholder="المدينة والشارع" />
        </div>

        <div className="mb-3.5">
          <Label>التصنيف الافتراضي للفواتير</Label>
          <Select
            value={defaultCategory}
            options={EXPENSE_CATEGORIES as readonly ExpenseCategory[]}
            onChange={(v) => setDefaultCategory(v as ExpenseCategory)}
          />
        </div>

        <div className="mb-3.5">
          <Label optional>شروط الدفع</Label>
          <TextInput value={paymentTerms} onChange={setPaymentTerms} placeholder="مثال: شيك 30 يوم / نقدي" />
        </div>

        <div className="mb-3.5">
          <Label optional>ملاحظات</Label>
          <Textarea value={notes} onChange={setNotes} placeholder="تفاصيل عن المورد، تفضيلات..." />
        </div>

        <Card className="p-3.5 mb-3.5">
          <Row className="justify-between">
            <div>
              <div className="text-[13px] font-semibold text-text dark:text-text-dark">المورد نشط</div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">يظهر في قوائم الاختيار</div>
            </div>
            <Toggle on={isActive} onChange={setIsActive} />
          </Row>
        </Card>

        {editing && (
          <div className="mt-1.5">
            <Btn danger fullWidth onClick={remove}>
              <Ico name="trash" size={15} sw={1.8} />
              حذف المورد
            </Btn>
          </div>
        )}
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canSave} onClick={save}>
          {editing ? "حفظ التعديلات" : "إضافة المورد"}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

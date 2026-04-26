"use client";

import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Label, TextInput, Textarea, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

const BUSINESS_TYPES = ["ملابس نسائية", "ملابس رجالية", "إلكترونيات", "مطعم / كافيه", "سوبرماركت", "صيدلية", "صالون / تجميل", "خدمات", "أخرى"];

export default function Page() {
  const { state, updateStoreSettings } = useStore();
  const { toast } = useToast();
  const ss = state.storeSettings;

  const [name, setName] = useState(ss.store_name);
  const [type, setType] = useState(ss.business_type);
  const [address, setAddress] = useState(ss.store_address);
  const [phone, setPhone] = useState(ss.store_phone);
  const [email, setEmail] = useState(ss.store_email);

  const save = () => {
    updateStoreSettings({ store_name: name, business_type: type, store_address: address, store_phone: phone, store_email: email });
    toast("تم حفظ معلومات المحل", "success");
  };

  return (
    <DesktopPage
      breadcrumb="الإعدادات"
      backHref="/desktop/settings"
      title="معلومات المحل"
      actions={<button onClick={save} className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">حفظ</button>}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <Label optional>شعار المحل</Label>
          <label className="block cursor-pointer mt-2">
            <div className="aspect-square bg-surface2 dark:bg-surface2-dark rounded-tj flex flex-col items-center justify-center gap-2 hover:bg-bg dark:hover:bg-bg-dark border-2 border-dashed border-divider dark:border-divider-dark">
              <div className="w-14 h-14 rounded-tj bg-surface dark:bg-surface-dark flex items-center justify-center">
                <Ico name="store" size={24} className="text-muted dark:text-muted-dark" sw={1.4} />
              </div>
              <div className="text-[12px] font-semibold text-subtext dark:text-subtext-dark">+ رفع شعار</div>
              <div className="text-[10px] text-muted dark:text-muted-dark">PNG أو JPG</div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) toast(`تم اختيار: ${f.name}`, "success"); e.target.value = ""; }} />
          </label>
        </div>

        <div className="col-span-8 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">المعلومات الأساسية</h3>
          <div className="space-y-3">
            <div><Label required>اسم المحل</Label><TextInput value={name} onChange={setName} /></div>
            <div><Label>نوع المصلحة</Label><Select value={type} options={BUSINESS_TYPES} onChange={(v) => setType(v)} /></div>
            <div><Label>العنوان</Label><Textarea value={address} onChange={setAddress} placeholder="المدينة والشارع" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رقم الهاتف</Label><TextInput value={phone} onChange={setPhone} type="tel" inputMode="tel" dir="ltr" /></div>
              <div><Label>البريد الإلكتروني</Label><TextInput value={email} onChange={setEmail} type="email" inputMode="email" dir="ltr" /></div>
            </div>
            <div className="pt-3 border-t border-divider dark:border-divider-dark">
              <Label>وضع الإدخال</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["aggregate", "per_product"] as const).map((m) => {
                  const active = ss.entry_mode === m;
                  return (
                    <button key={m} onClick={() => { updateStoreSettings({ entry_mode: m }); toast(m === "aggregate" ? "تم التبديل لوضع الرقم اليومي" : "تم التبديل لوضع المنتجات", "success"); }} className={`py-3 text-[12px] rounded-tj border font-semibold ${active ? "bg-primary text-white border-transparent" : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark"}`}>
                      {m === "aggregate" ? "رقم يومي إجمالي" : "حسب المنتجات"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

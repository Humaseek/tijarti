"use client";

import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Avatar } from "@/components/ui/avatar";
import { Label, TextInput } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

export default function Page() {
  const { state, updateProfile } = useStore();
  const { toast } = useToast();
  const up = state.userProfile;

  const [name, setName] = useState(up.full_name);
  const [email, setEmail] = useState(up.email);
  const [phone, setPhone] = useState(up.phone);

  const save = () => { updateProfile({ full_name: name, email, phone }); toast("تم حفظ المعلومات", "success"); };

  return (
    <DesktopPage
      breadcrumb="الإعدادات"
      backHref="/desktop/settings"
      title="الحساب الشخصي"
      actions={<button onClick={save} className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">حفظ</button>}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-6 text-center">
          <div className="flex justify-center mb-3"><Avatar name={name} initial={name.charAt(0) || "؟"} size={100} /></div>
          <div className="text-[14px] font-bold text-text dark:text-text-dark">{name || "—"}</div>
          <div className="text-[11px] text-muted dark:text-muted-dark mt-1">{up.role === "owner" ? "صاحب المصلحة" : "موظف"}</div>
          <label className="mt-4 block cursor-pointer">
            <div className="w-full py-2 rounded-tj border border-divider dark:border-divider-dark text-[11px] font-bold text-primary hover:bg-primary-soft">
              تغيير الصورة
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) toast(`تم اختيار: ${f.name}`, "success"); e.target.value = ""; }} />
          </label>
        </div>

        <div className="col-span-8 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">المعلومات الشخصية</h3>
          <div className="space-y-3">
            <div><Label required>الاسم الكامل</Label><TextInput value={name} onChange={setName} /></div>
            <div><Label>البريد الإلكتروني</Label><TextInput value={email} onChange={setEmail} type="email" inputMode="email" dir="ltr" /></div>
            <div><Label>رقم الهاتف</Label><TextInput value={phone} onChange={setPhone} type="tel" inputMode="tel" dir="ltr" /></div>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

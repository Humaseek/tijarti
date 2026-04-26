"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Avatar } from "@/components/ui/avatar";
import { Btn } from "@/components/ui/controls";
import { Label, TextInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

const LANGS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
  { value: "he", label: "עברית" },
] as const;

const TZS = [
  { value: "Asia/Jerusalem", label: "القدس (GMT+3)" },
  { value: "Asia/Amman",     label: "عمّان (GMT+3)" },
  { value: "Asia/Beirut",    label: "بيروت (GMT+3)" },
  { value: "Asia/Dubai",     label: "دبي (GMT+4)" },
] as const;

export default function SettingsAccount() {
  const router = useRouter();
  const { toast } = useToast();
  const { state, updateProfile, updateStoreSettings } = useStore();
  const up = state.userProfile;

  const initial = useRef({
    name: up.full_name,
    email: up.email,
    phone: up.phone,
    language: state.storeSettings.language,
    tz: state.storeSettings.timezone,
  }).current;

  const [name, setName]         = useState(initial.name);
  const [email, setEmail]       = useState(initial.email);
  const [phone, setPhone]       = useState(initial.phone);
  const [language, setLanguage] = useState(initial.language);
  const [tz, setTz]             = useState(initial.tz);

  // "Verified" state = field unchanged since load (demo convention).
  const emailVerified = email === initial.email;
  const phoneVerified = phone === initial.phone;

  const isDirty =
    name !== initial.name ||
    email !== initial.email ||
    phone !== initial.phone ||
    language !== initial.language ||
    tz !== initial.tz;

  const save = () => {
    if (!name.trim()) {
      toast("الاسم مطلوب", "warn");
      return;
    }
    updateProfile({ full_name: name.trim(), email, phone });
    updateStoreSettings({ language, timezone: tz });
    toast("تم حفظ معلومات الحساب", "success");
    router.back();
  };

  return (
    <Screen>
      <TopBar title="الحساب" />

      <div className="px-4 pb-4">
        {/* Avatar */}
        <Card className="p-[18px] text-center mb-3.5">
          <div className="flex justify-center mb-2.5">
            <Avatar name={name} initial={name.charAt(0)} size={72} />
          </div>
          <label className="tj-btn text-xs text-primary font-bold cursor-pointer inline-block">
            تغيير الصورة
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                toast(`تم اختيار: ${f.name} — سيُرفع لما نربط التخزين`, "success");
                e.target.value = "";
              }}
            />
          </label>
        </Card>

        <SectionHeader>المعلومات الشخصية</SectionHeader>
        <Card className="p-3.5 mb-3.5">
          <div className="mb-3">
            <Label required>الاسم الكامل</Label>
            <TextInput value={name} onChange={setName} />
          </div>

          <div className="mb-3">
            <Row className="justify-between mb-1.5">
              <span className="text-[11px] text-subtext dark:text-subtext-dark font-semibold tracking-wide">
                البريد الإلكتروني
              </span>
              <VerifyBadge verified={emailVerified} onVerify={() => toast("تم إرسال رابط التحقق", "info")} />
            </Row>
            <TextInput value={email} onChange={setEmail} type="email" inputMode="email" dir="ltr" />
          </div>

          <div>
            <Row className="justify-between mb-1.5">
              <span className="text-[11px] text-subtext dark:text-subtext-dark font-semibold tracking-wide">
                رقم الهاتف
              </span>
              <VerifyBadge verified={phoneVerified} onVerify={() => toast("تم إرسال رمز التحقق", "info")} />
            </Row>
            <TextInput value={phone} onChange={setPhone} type="tel" inputMode="tel" dir="ltr" />
          </div>
        </Card>

        <SectionHeader>التفضيلات</SectionHeader>
        <Card className="p-3.5">
          <div className="mb-3">
            <Label>اللغة</Label>
            <Select value={language} options={LANGS as unknown as readonly { value: string; label: string }[]} onChange={setLanguage} />
          </div>
          <div>
            <Label>المنطقة الزمنية</Label>
            <Select value={tz} options={TZS as unknown as readonly { value: string; label: string }[]} onChange={setTz} />
          </div>
        </Card>
      </div>

      {isDirty && (
        <BottomBar>
          <Btn primary fullWidth onClick={save}>
            <Ico name="check" size={14} sw={2.4} />
            حفظ التعديلات
          </Btn>
        </BottomBar>
      )}
    </Screen>
  );
}

function VerifyBadge({ verified, onVerify }: { verified: boolean; onVerify: () => void }) {
  if (verified) {
    return (
      <Row className="gap-1 px-2 py-[3px] rounded-tj bg-success-soft dark:bg-success-soft-dark">
        <Ico name="check" size={11} className="text-success dark:text-success-dark" sw={3} />
        <span className="text-[10px] text-success dark:text-success-dark font-bold">موثّق</span>
      </Row>
    );
  }
  return (
    <span
      onClick={onVerify}
      className="tj-btn text-[11px] font-semibold text-warning dark:text-warning-dark px-2 py-[3px] rounded-tj bg-warning-soft dark:bg-warning-soft-dark"
      role="button"
      tabIndex={0}
    >
      تحقّق
    </span>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider pb-2 pt-1 px-1">
      {children}
    </div>
  );
}

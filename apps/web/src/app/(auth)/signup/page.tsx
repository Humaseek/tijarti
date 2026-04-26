"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BrandMark,
  AuthCard,
  AuthField,
  InputBox,
  PasswordInput,
  StrengthBar,
  strengthOf,
} from "@/components/auth/common";
import { Btn } from "@/components/ui/controls";
import { Row } from "@/components/ui/layout";
import { Ico } from "@/components/ui/icon";

export default function Signup() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [pwd,       setPwd]       = useState("");
  const [pwd2,      setPwd2]      = useState("");
  const [agree,     setAgree]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneOk = phone.replace(/\D/g, "").length >= 9;
  const { score } = strengthOf(pwd);
  const pwdOk = score >= 2;
  const matchOk = pwd === pwd2 && pwd2.length > 0;
  const canSubmit = storeName.trim() && ownerName.trim() && emailOk && phoneOk && pwdOk && matchOk && agree;

  const submit = () => {
    setSubmitted(true);
    if (!canSubmit) return;
    // Stash signup data in URL param for OTP page to display (demo)
    router.push(`/verify-otp?phone=${encodeURIComponent(phone)}`);
  };

  return (
    <>
      <Row className="justify-end mb-5 min-h-[24px]">
        <button
          onClick={() => router.push("/app")}
          className="tj-btn text-[11px] font-semibold px-3 py-1 rounded-tj bg-primary-soft text-primary inline-flex items-center gap-1.5"
        >
          تسجيل تجريبي
          <Ico name="forward" size={13} sw={2} style={{ transform: "scaleX(-1)" }} />
        </button>
      </Row>

      <div className="flex justify-center mb-5">
        <BrandMark />
      </div>

      <AuthCard>
        <div className="text-center mb-4">
          <div className="text-[19px] font-bold text-text dark:text-text-dark mb-1">
            ابدأي رحلتكِ مع Tijarti 🚀
          </div>
          <div className="text-xs text-subtext dark:text-subtext-dark">أنشئي حسابكِ في دقيقة واحدة</div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <AuthField label="اسم المحل" error={submitted && !storeName.trim() ? "مطلوب" : null}>
            <InputBox icon="store" value={storeName} onChange={setStoreName} placeholder="بوتيك ليلى" />
          </AuthField>
          <AuthField label="اسم المالك" error={submitted && !ownerName.trim() ? "مطلوب" : null}>
            <InputBox icon="user" value={ownerName} onChange={setOwnerName} placeholder="ليلى حسن" />
          </AuthField>
        </div>

        <AuthField label="البريد الإلكتروني" error={submitted && !emailOk ? "بريد غير صحيح" : null}>
          <InputBox icon="mail" type="email" value={email} onChange={setEmail} placeholder="layla@..." dir="ltr" inputMode="email" />
        </AuthField>

        <AuthField label="رقم الهاتف" error={submitted && !phoneOk ? "رقم غير مكتمل" : null}>
          <InputBox icon="phone" type="tel" value={phone} onChange={setPhone} placeholder="+972 50 ..." dir="ltr" inputMode="tel" />
        </AuthField>

        <AuthField label="كلمة المرور" error={submitted && !pwdOk ? "كلمة المرور ضعيفة جداً" : null}>
          <PasswordInput value={pwd} onChange={setPwd} placeholder="••••••••" />
          <StrengthBar pwd={pwd} />
        </AuthField>

        <AuthField label="تأكيد كلمة المرور" error={submitted && !matchOk ? "لا تتطابق" : null}>
          <PasswordInput value={pwd2} onChange={setPwd2} placeholder="••••••••" />
        </AuthField>

        <button
          onClick={() => setAgree(!agree)}
          className="tj-btn flex items-start gap-2 mb-4 text-start w-full"
        >
          <div
            className={`w-[18px] h-[18px] rounded-tj flex items-center justify-center flex-shrink-0 mt-px border-[1.5px] ${
              agree
                ? "bg-primary border-primary"
                : submitted && !agree
                ? "border-danger dark:border-danger-dark"
                : "border-divider dark:border-divider-dark"
            }`}
          >
            {agree && <Ico name="check" size={12} className="text-white dark:text-bg-dark" sw={3} />}
          </div>
          <span className="text-xs text-text dark:text-text-dark leading-relaxed">
            أوافق على <span className="text-primary font-bold">الشروط والأحكام</span>
            {" "}و{" "}
            <span className="text-primary font-bold">سياسة الخصوصية</span>
          </span>
        </button>

        <Btn primary fullWidth disabled={submitted && !canSubmit} onClick={submit}>
          إنشاء حساب
        </Btn>
      </AuthCard>

      <div className="text-center mt-5 text-[13px] text-subtext dark:text-subtext-dark">
        لديكِ حساب؟{" "}
        <Link href="/login" className="tj-btn font-bold text-primary">تسجيل الدخول</Link>
      </div>
    </>
  );
}

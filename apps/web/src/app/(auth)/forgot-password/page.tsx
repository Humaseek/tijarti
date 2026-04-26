"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark, AuthCard, AuthField, InputBox } from "@/components/auth/common";
import { Btn } from "@/components/ui/controls";
import { Row } from "@/components/ui/layout";
import { Ico } from "@/components/ui/icon";

export default function ForgotPassword() {
  const router = useRouter();
  const [email,     setEmail]     = useState("");
  const [sent,      setSent]      = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = () => {
    setSubmitted(true);
    if (!emailOk) return;
    setSent(true);
  };

  return (
    <>
      <Row className="justify-start mb-3.5">
        <button onClick={() => router.push("/login")} className="tj-btn p-1 text-primary">
          <Ico name="forward" size={22} />
        </button>
      </Row>

      <div className="flex justify-center mb-5">
        <BrandMark />
      </div>

      <AuthCard>
        {!sent ? (
          <>
            <div className="text-center mb-5">
              <div className="inline-flex w-[58px] h-[58px] rounded-tj bg-warning-soft dark:bg-warning-soft-dark items-center justify-center mb-3.5">
                <Ico name="lock" size={26} className="text-warning dark:text-warning-dark" sw={1.6} />
              </div>
              <div className="text-[19px] font-bold text-text dark:text-text-dark mb-1.5">نسيتِ كلمة المرور؟</div>
              <div className="text-xs text-subtext dark:text-subtext-dark leading-relaxed">
                لا مشكلة! أدخلي بريدكِ الإلكتروني
                <br />
                وسنرسل لكِ رابط إعادة التعيين
              </div>
            </div>

            <AuthField label="البريد الإلكتروني" error={submitted && !emailOk ? "أدخلي بريداً صحيحاً" : null}>
              <InputBox icon="mail" type="email" value={email} onChange={setEmail} placeholder="layla@..." dir="ltr" inputMode="email" />
            </AuthField>

            <Btn primary fullWidth disabled={submitted && !emailOk} onClick={submit}>
              إرسال رابط إعادة التعيين
            </Btn>
          </>
        ) : (
          <div className="text-center">
            <div className="inline-flex w-16 h-16 rounded-full bg-success-soft dark:bg-success-soft-dark items-center justify-center mb-3.5">
              <Ico name="check" size={30} className="text-success dark:text-success-dark" sw={3} />
            </div>
            <div className="text-[18px] font-bold text-text dark:text-text-dark mb-1.5">تم إرسال الرابط ✓</div>
            <div className="text-xs text-subtext dark:text-subtext-dark leading-relaxed mb-1">
              أرسلنا لكِ رابط إعادة التعيين إلى
            </div>
            <div className="text-[13px] font-semibold text-text dark:text-text-dark mb-4 tj-num" dir="ltr">
              {email}
            </div>
            <div className="text-[11px] text-muted dark:text-muted-dark mb-5">
              تحققي من البريد الوارد (أو المهملات إذا لم تجديه)
            </div>
            <Btn primary fullWidth onClick={() => router.push("/login")}>
              العودة لتسجيل الدخول
            </Btn>
          </div>
        )}
      </AuthCard>

      {!sent && (
        <div className="text-center mt-5 text-[13px] text-subtext dark:text-subtext-dark">
          تذكّرتِها؟{" "}
          <Link href="/login" className="tj-btn font-bold text-primary">تسجيل الدخول</Link>
        </div>
      )}
    </>
  );
}

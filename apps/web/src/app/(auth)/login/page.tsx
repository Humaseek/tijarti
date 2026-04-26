"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark, AuthCard, AuthField, InputBox, PasswordInput } from "@/components/auth/common";
import { Btn } from "@/components/ui/controls";
import { Row } from "@/components/ui/layout";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwdOk = pwd.length >= 6;
  const canSubmit = emailOk && pwdOk;

  const submit = () => {
    setSubmitted(true);
    if (!canSubmit) return;
    toast(`أهلاً بكِ — مرحباً ${email}`, "success");
    router.push("/app");
  };

  return (
    <>
      {/* Top bar: demo shortcut */}
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
        <BrandMark size="lg" />
      </div>

      <AuthCard>
        <div className="text-center mb-5">
          <div className="text-xl font-bold text-text dark:text-text-dark mb-1">أهلاً بكِ مجدداً 👋</div>
          <div className="text-[13px] text-subtext dark:text-subtext-dark">سجّلي دخولكِ للاستمرار</div>
        </div>

        <AuthField label="البريد الإلكتروني" error={submitted && !emailOk ? "أدخلي بريداً صحيحاً" : null}>
          <InputBox icon="mail" type="email" value={email} onChange={setEmail} placeholder="layla@boutiquelaila.com" dir="ltr" inputMode="email" />
        </AuthField>

        <AuthField label="كلمة المرور" error={submitted && !pwdOk ? "6 أحرف على الأقل" : null}>
          <PasswordInput value={pwd} onChange={setPwd} placeholder="••••••••" />
        </AuthField>

        <Row className="justify-between mb-4">
          <button onClick={() => setRemember(!remember)} className="tj-btn flex items-center gap-2 text-xs text-text dark:text-text-dark">
            <div
              className={`w-4 h-4 rounded-tj flex items-center justify-center border-[1.5px] ${
                remember ? "bg-primary border-primary" : "bg-transparent border-divider dark:border-divider-dark"
              }`}
            >
              {remember && <Ico name="check" size={11} className="text-white dark:text-bg-dark" sw={3} />}
            </div>
            <span className="font-medium">تذكّريني</span>
          </button>
          <Link href="/forgot-password" className="tj-btn text-xs font-semibold text-primary">
            نسيت كلمة المرور؟
          </Link>
        </Row>

        <Btn primary fullWidth disabled={submitted && !canSubmit} onClick={submit}>
          تسجيل الدخول
        </Btn>

        <Row className="my-5 gap-2.5 items-center">
          <div className="flex-1 h-px bg-divider dark:bg-divider-dark" />
          <span className="text-[11px] font-medium text-muted dark:text-muted-dark">أو</span>
          <div className="flex-1 h-px bg-divider dark:bg-divider-dark" />
        </Row>

        <Btn ghost fullWidth onClick={() => {
          // Stub flow: in real app this opens Google OAuth.
          toast("جاري تسجيل الدخول عبر Google...", "info");
          setTimeout(() => router.push("/app"), 800);
        }}>
          <div className="w-4 h-4 rounded-tj bg-white flex items-center justify-center tj-num text-[11px] font-bold" style={{ color: "#4285F4" }}>
            G
          </div>
          المتابعة بـ Google
        </Btn>
      </AuthCard>

      <div className="text-center mt-5 text-[13px] text-subtext dark:text-subtext-dark">
        ليس لديكِ حساب؟{" "}
        <Link href="/signup" className="tj-btn font-bold text-primary">إنشاء حساب</Link>
      </div>
    </>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { Suspense, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark, AuthCard } from "@/components/auth/common";
import { Btn } from "@/components/ui/controls";
import { Num } from "@/components/ui/num";
import { Row } from "@/components/ui/layout";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export default function VerifyOtp() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpInner />
    </Suspense>
  );
}

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const phoneRaw = searchParams.get("phone") || "+972 50 234 1180";
  const masked = phoneRaw.replace(/(\+972 \d{1,2}) ?(\d{0,3}) ?(\d{0,4})/, (_m, a, _b, c) => `${a} ***${c.slice(-4) || "1180"}`);

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(60);
  const [shake, setShake] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Timer countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const next = digits.slice();
    next[i] = v.replace(/\D/g, "").slice(0, 1);
    setDigits(next);
    if (next[i] && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = [...digits];
    for (let k = 0; k < txt.length && i + k < 6; k++) next[i + k] = txt[k];
    setDigits(next);
    const focusIdx = Math.min(i + txt.length, 5);
    refs.current[focusIdx]?.focus();
  };

  const code = digits.join("");
  const complete = code.length === 6;

  const verify = () => {
    if (code === "000000") {
      setShake(true);
      toast("رمز خاطئ — حاولي مرة أخرى", "warn");
      setTimeout(() => setShake(false), 500);
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
      return;
    }
    toast("تم التحقق — هيا نكمل الإعداد", "success");
    // New user → onboarding
    router.push("/app/onboarding/step-1");
  };

  useEffect(() => {
    if (complete) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = () => {
    if (seconds > 0) return;
    setSeconds(60);
    setDigits(["", "", "", "", "", ""]);
    refs.current[0]?.focus();
    toast("تم إرسال رمز جديد", "success");
  };

  return (
    <>
      <Row className="justify-start mb-3.5">
        <button onClick={() => router.push("/signup")} className="tj-btn p-1 text-primary">
          <Ico name="forward" size={22} />
        </button>
      </Row>

      <div className="flex justify-center mb-5">
        <BrandMark />
      </div>

      <AuthCard>
        <div className="text-center mb-5">
          <div className="inline-flex w-[58px] h-[58px] rounded-tj bg-info-soft dark:bg-info-soft-dark items-center justify-center mb-3.5">
            <Ico name="msg" size={26} className="text-info dark:text-info-dark" sw={1.6} />
          </div>
          <div className="text-[19px] font-bold text-text dark:text-text-dark mb-1.5">أدخلي رمز التحقق</div>
          <div className="text-xs text-subtext dark:text-subtext-dark leading-relaxed">أرسلنا رمزاً مكوناً من 6 أرقام إلى</div>
          <div className="text-[13px] font-semibold text-text dark:text-text-dark mt-1 tj-num" dir="ltr">{masked}</div>
        </div>

        {/* 6 OTP boxes */}
        <div
          dir="ltr"
          className={`grid grid-cols-6 gap-2 mb-5 ${shake ? "animate-shake-x" : ""}`}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              onPaste={(e) => handlePaste(i, e)}
              className="w-full py-3.5 text-center text-[22px] font-bold tj-num bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-[1.5px] rounded-tj outline-none transition-colors"
              style={{ borderColor: d ? "rgb(var(--tj-primary))" : "rgb(var(--tj-primary) / 0)" }}
            />
          ))}
        </div>

        <Btn primary fullWidth disabled={!complete} onClick={verify}>
          تحقق
        </Btn>

        <div className="text-center mt-4">
          {seconds > 0 ? (
            <div className="text-xs text-subtext dark:text-subtext-dark">
              أعد الإرسال خلال <Num size={12} className="text-text dark:text-text-dark" weight={700}>{seconds}</Num> ثانية
            </div>
          ) : (
            <button onClick={resend} className="tj-btn text-[13px] font-bold text-primary">
              إعادة إرسال الرمز
            </button>
          )}
        </div>

        <div className="text-center text-[11px] text-muted dark:text-muted-dark mt-3">
          للتجربة: أي رمز يعمل ما عدا <Num size={11} className="text-muted dark:text-muted-dark" weight={600}>000000</Num>
        </div>
      </AuthCard>

      <div className="text-center mt-5 text-[13px] text-subtext dark:text-subtext-dark">
        رقم خاطئ؟{" "}
        <button onClick={() => router.push("/signup")} className="tj-btn font-bold text-primary">تغيير الرقم</button>
      </div>
    </>
  );
}

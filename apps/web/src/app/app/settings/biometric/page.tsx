"use client";

import { useEffect, useState } from "react";
import { Screen, Card, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

const ENABLED_KEY = "tj_biometric_enabled";
const LAST_UNLOCK_KEY = "tj_biometric_last_unlock";

function loadEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  try { return localStorage.getItem(ENABLED_KEY) === "1"; } catch { return false; }
}

function loadLastUnlock(): number | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const v = localStorage.getItem(LAST_UNLOCK_KEY);
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  } catch { return null; }
}

function saveEnabled(v: boolean) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(ENABLED_KEY, v ? "1" : "0"); } catch {}
}

function saveLastUnlock(t: number) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(LAST_UNLOCK_KEY, String(t)); } catch {}
}

export default function MobileBiometricPage() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastUnlock, setLastUnlock] = useState<number | null>(null);

  useEffect(() => {
    setEnabled(loadEnabled());
    setLastUnlock(loadLastUnlock());
    if (typeof window !== "undefined") {
      const has = typeof (window as any).PublicKeyCredential !== "undefined";
      setSupported(has);
    }
  }, []);

  const test = async () => {
    if (!supported) { toast("الجهاز لا يدعم المصادقة البيومترية", "warn"); return; }
    try {
      // Use conditional check on PublicKeyCredential
      if ((window as any).PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
        const avail = await (window as any).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!avail) { toast("ما فيه Face ID / بصمة على هذا الجهاز", "warn"); return; }
      }
      const now = Date.now();
      saveLastUnlock(now);
      setLastUnlock(now);
      toast("تمّ الفحص — البصمة تعمل", "success");
    } catch {
      toast("فشل الفحص — جرّبي مرة أخرى", "warn");
    }
  };

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    saveEnabled(next);
    toast(next ? "تم تفعيل القفل البيومتري" : "تم إيقاف القفل البيومتري", "success");
  };

  return (
    <Screen>
      <TopBar title="القفل البيومتري" />
      <div className="px-4 flex-1 overflow-auto pb-24 space-y-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-text dark:text-text-dark">تفعيل Face ID / البصمة</div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">اقفلي التطبيق وافتحيه بالبصمة</div>
            </div>
            <button
              onClick={toggle}
              className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-surface2 dark:bg-surface2-dark"}`}
              role="switch"
              aria-checked={enabled}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${enabled ? "right-1" : "left-1"}`} />
            </button>
          </div>
        </Card>

        <Card className={`p-4 border-s-[3px] ${supported ? "border-s-info dark:border-s-info-dark" : "border-s-warning dark:border-s-warning-dark"}`}>
          <div className="flex items-start gap-3">
            <Ico name={supported ? "info" : "warn"} size={18} className={supported ? "text-info dark:text-info-dark" : "text-warning dark:text-warning-dark"} sw={1.8} />
            <div className="flex-1">
              <div className="text-[12px] font-bold text-text dark:text-text-dark">
                {supported ? "جهازكِ يدعم WebAuthn" : "جهازكِ ما يدعم WebAuthn"}
              </div>
              <div className="text-[11px] text-muted dark:text-muted-dark leading-relaxed mt-1">
                {supported
                  ? "نستخدم مصادقة نظام التشغيل — بصمتكِ ما تغادر جهازكِ أبداً"
                  : "جرّبي متصفح حديث على هاتف يدعم Face ID أو بصمة"}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-[12px] font-bold text-text dark:text-text-dark mb-2">فوائد الأمان</div>
          <ul className="space-y-2 text-[11px] text-text dark:text-text-dark">
            <li className="flex gap-2"><span className="text-success dark:text-success-dark font-bold">✓</span> حتى لو أخذ الهاتف حدا، ما حدا يقدر يفتح التطبيق بدون بصمتكِ</li>
            <li className="flex gap-2"><span className="text-success dark:text-success-dark font-bold">✓</span> أسرع من كلمة السر — نصف ثانية وأنتِ داخلة</li>
            <li className="flex gap-2"><span className="text-success dark:text-success-dark font-bold">✓</span> البصمة تبقى على جهازكِ — لا نحفظها عندنا</li>
          </ul>
        </Card>

        <Card className="p-4">
          <div className="text-[12px] font-bold text-text dark:text-text-dark mb-1">آخر فتح</div>
          <div className="text-[11px] text-muted dark:text-muted-dark tj-num">
            {lastUnlock ? new Date(lastUnlock).toLocaleString("ar") : "—"}
          </div>
        </Card>
      </div>
      <BottomBar>
        <button
          onClick={test}
          disabled={!supported}
          className="w-full py-3 rounded-tj bg-primary text-white text-[13px] font-bold disabled:opacity-60"
        >
          افحصي Face ID / بصمة
        </button>
      </BottomBar>
    </Screen>
  );
}

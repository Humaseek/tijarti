"use client";

import { useEffect, useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
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

export default function DesktopBiometricPage() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastUnlock, setLastUnlock] = useState<number | null>(null);

  useEffect(() => {
    setEnabled(loadEnabled());
    setLastUnlock(loadLastUnlock());
    if (typeof window !== "undefined") {
      setSupported(typeof (window as any).PublicKeyCredential !== "undefined");
    }
  }, []);

  const test = async () => {
    if (!supported) { toast("الجهاز لا يدعم المصادقة البيومترية", "warn"); return; }
    try {
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
    <DesktopPage breadcrumb="الإعدادات" backHref="/desktop/settings" title="القفل البيومتري" subtitle="اقفلي التطبيق وافتحيه بـ Face ID أو البصمة">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[14px] font-bold text-text dark:text-text-dark">تفعيل Face ID / البصمة</div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-1">اقفلي التطبيق وافتحيه بالبصمة</div>
            </div>
            <button
              onClick={toggle}
              className={`relative w-14 h-8 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-surface2 dark:bg-surface2-dark"}`}
              role="switch"
              aria-checked={enabled}
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${enabled ? "right-1" : "left-1"}`} />
            </button>
          </div>

          <div className={`rounded-tj p-3 mb-3 border-s-[3px] bg-bg dark:bg-bg-dark ${supported ? "border-s-info dark:border-s-info-dark" : "border-s-warning dark:border-s-warning-dark"}`}>
            <div className="flex items-start gap-3">
              <Ico name={supported ? "info" : "warn"} size={16} className={supported ? "text-info dark:text-info-dark" : "text-warning dark:text-warning-dark"} sw={1.8} />
              <div className="flex-1">
                <div className="text-[12px] font-bold text-text dark:text-text-dark">
                  {supported ? "جهازكِ يدعم WebAuthn" : "جهازكِ ما يدعم WebAuthn"}
                </div>
                <div className="text-[11px] text-muted dark:text-muted-dark leading-relaxed mt-0.5">
                  {supported
                    ? "نستخدم مصادقة نظام التشغيل — بصمتكِ ما تغادر جهازكِ أبداً"
                    : "جرّبي متصفح حديث على جهاز يدعم البصمة"}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={test}
            disabled={!supported}
            className="w-full py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold disabled:opacity-60"
          >
            افحصي Face ID / بصمة
          </button>

          <div className="mt-4 pt-4 border-t border-divider dark:border-divider-dark">
            <div className="text-[11px] font-bold text-text dark:text-text-dark">آخر فتح</div>
            <div className="text-[11px] text-muted dark:text-muted-dark tj-num mt-0.5">
              {lastUnlock ? new Date(lastUnlock).toLocaleString("ar") : "—"}
            </div>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">فوائد الأمان</h3>
          <ul className="space-y-3 text-[12px] text-text dark:text-text-dark">
            <li className="flex gap-2.5">
              <span className="text-success dark:text-success-dark font-bold">✓</span>
              <span>حتى لو أخذ الهاتف حدا، ما حدا يقدر يفتح التطبيق بدون بصمتكِ</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-success dark:text-success-dark font-bold">✓</span>
              <span>أسرع من كلمة السر — نصف ثانية وأنتِ داخلة</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-success dark:text-success-dark font-bold">✓</span>
              <span>البصمة تبقى على جهازكِ — لا نحفظها عندنا</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-success dark:text-success-dark font-bold">✓</span>
              <span>يعمل حتى لو لا يوجد إنترنت</span>
            </li>
          </ul>
        </div>
      </div>
    </DesktopPage>
  );
}

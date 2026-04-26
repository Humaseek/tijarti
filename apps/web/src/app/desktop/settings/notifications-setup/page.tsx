"use client";

import { useEffect, useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

const PREFS_KEY = "tj_notif_prefs_v1";

interface Prefs {
  checks: boolean;
  overdue: boolean;
  low_stock: boolean;
  birthdays: boolean;
  daily_summary: boolean;
}

const DEFAULT_PREFS: Prefs = {
  checks: true,
  overdue: true,
  low_stock: true,
  birthdays: false,
  daily_summary: true,
};

function loadPrefs(): Prefs {
  if (typeof localStorage === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) } as Prefs;
  } catch { return DEFAULT_PREFS; }
}

function savePrefs(p: Prefs) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
}

export default function DesktopNotificationsSetupPage() {
  const { toast } = useToast();
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") { setSupported(false); return; }
    setPerm(Notification.permission);
    setPrefs(loadPrefs());
  }, []);

  const request = async () => {
    if (!supported) return;
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === "granted") toast("تم تفعيل التنبيهات", "success");
      else if (result === "denied") toast("تم رفض التنبيهات — يمكنكِ تفعيلها من إعدادات المتصفح", "warn");
    } catch { toast("خطأ في طلب الإذن", "warn"); }
  };

  const toggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs(next);
  };

  const sendTest = () => {
    if (!supported || perm !== "granted") { toast("فعّلي التنبيهات أولاً", "warn"); return; }
    try {
      new Notification("اختبار", { body: "هذه تجربة للتنبيهات من تجارتي", icon: "/favicon.ico" });
      toast("تم إرسال تنبيه تجريبي", "success");
    } catch { toast("لم نتمكن من إرسال التنبيه", "warn"); }
  };

  const items: { key: keyof Prefs; title: string; sub: string; icon: string }[] = [
    { key: "checks", title: "شيكات مستحقة", sub: "قبل ٣ أيام من موعد الاستحقاق", icon: "receipt" },
    { key: "overdue", title: "زبائن متأخرون", sub: "لمّا تتجاوز المدة المحدّدة", icon: "users" },
    { key: "low_stock", title: "مخزون منخفض", sub: "قبل نفاد المنتج", icon: "box" },
    { key: "birthdays", title: "أعياد ميلاد", sub: "صباح اليوم", icon: "star" },
    { key: "daily_summary", title: "ملخّص يومي", sub: "نهاية كل يوم — مبيعات ومصاريف", icon: "chart" },
  ];

  return (
    <DesktopPage breadcrumb="الإعدادات" backHref="/desktop/settings" title="إعدادات التنبيهات" subtitle="اختاري الأنواع التي تهمّكِ">
      <div className="grid grid-cols-[1fr_1.2fr] gap-4">
        <div className={`bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 border-s-[3px] ${perm === "granted" ? "border-s-success dark:border-s-success-dark" : "border-s-warning dark:border-s-warning-dark"}`}>
          <div className="flex items-start gap-3 mb-3">
            <Ico name="bell" size={22} className={perm === "granted" ? "text-success dark:text-success-dark" : "text-warning dark:text-warning-dark"} sw={1.8} />
            <div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark">
                {!supported ? "المتصفح لا يدعم التنبيهات" :
                 perm === "granted" ? "التنبيهات مفعّلة" :
                 perm === "denied" ? "التنبيهات مرفوضة" : "التنبيهات غير مفعّلة"}
              </div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5 leading-relaxed">
                {perm === "granted" ? "سنرسل تنبيهات حسب اختياراتك"
                  : perm === "denied" ? "افتحي إعدادات المتصفح لتفعيلها"
                  : "اطلبي الإذن من المتصفح للبدء"}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {perm !== "granted" && supported && (
              <button
                onClick={request}
                className="flex-1 py-2 rounded-tj bg-primary text-white text-[12px] font-bold"
              >
                اطلبي الإذن
              </button>
            )}
            <button
              onClick={sendTest}
              disabled={perm !== "granted"}
              className="flex-1 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark disabled:opacity-60"
            >
              تنبيه تجريبي
            </button>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-3">أنواع التنبيهات</h3>
          <div className="space-y-2.5">
            {items.map((it) => (
              <div key={it.key} className="flex items-center gap-3 p-2 rounded-tj hover:bg-bg dark:hover:bg-bg-dark">
                <div className="w-9 h-9 rounded-tj bg-bg dark:bg-bg-dark flex items-center justify-center flex-shrink-0">
                  <Ico name={it.icon as any} size={16} className="text-muted dark:text-muted-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-text dark:text-text-dark">{it.title}</div>
                  <div className="text-[10px] text-muted dark:text-muted-dark">{it.sub}</div>
                </div>
                <button
                  onClick={() => toggle(it.key)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${prefs[it.key] ? "bg-primary" : "bg-surface2 dark:bg-surface2-dark"}`}
                  role="switch"
                  aria-checked={prefs[it.key]}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${prefs[it.key] ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Screen, Card, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
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

export default function MobileNotificationsSetupPage() {
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
    } catch {
      toast("خطأ في طلب الإذن", "warn");
    }
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
    } catch {
      toast("لم نتمكن من إرسال التنبيه", "warn");
    }
  };

  const items: { key: keyof Prefs; title: string; sub: string; icon: string }[] = [
    { key: "checks", title: "شيكات مستحقة", sub: "قبل ٣ أيام من موعد الاستحقاق", icon: "receipt" },
    { key: "overdue", title: "زبائن متأخرون", sub: "لمّا تتجاوز المدة المحدّدة", icon: "users" },
    { key: "low_stock", title: "مخزون منخفض", sub: "قبل نفاد المنتج", icon: "box" },
    { key: "birthdays", title: "أعياد ميلاد", sub: "صباح اليوم", icon: "star" },
    { key: "daily_summary", title: "ملخّص يومي", sub: "نهاية كل يوم — مبيعات ومصاريف", icon: "chart" },
  ];

  return (
    <Screen>
      <TopBar title="إعدادات التنبيهات" />
      <div className="px-4 flex-1 overflow-auto pb-24 space-y-3">
        <Card className={`p-4 border-s-[3px] ${perm === "granted" ? "border-s-success dark:border-s-success-dark" : "border-s-warning dark:border-s-warning-dark"}`}>
          <div className="flex items-start gap-3">
            <Ico name="bell" size={20} className={perm === "granted" ? "text-success dark:text-success-dark" : "text-warning dark:text-warning-dark"} sw={1.8} />
            <div className="flex-1">
              <div className="text-[13px] font-bold text-text dark:text-text-dark">
                {!supported ? "المتصفح لا يدعم التنبيهات" :
                 perm === "granted" ? "التنبيهات مفعّلة" :
                 perm === "denied" ? "التنبيهات مرفوضة" : "التنبيهات غير مفعّلة"}
              </div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5 leading-relaxed">
                {perm === "granted" ? "بنرسلّك تنبيهات حسب اختياراتك أدناه"
                  : perm === "denied" ? "افتحي إعدادات المتصفح ثم فعّلي التنبيهات"
                  : "اضغطي الزر لنطلب إذن التنبيهات"}
              </div>
            </div>
            {perm !== "granted" && supported && (
              <button
                onClick={request}
                className="px-3 py-1.5 rounded-tj bg-primary text-white text-[11px] font-bold"
              >
                فعّلي
              </button>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-[12px] font-bold text-text dark:text-text-dark mb-3">أنواع التنبيهات</div>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-tj bg-bg dark:bg-bg-dark flex items-center justify-center flex-shrink-0">
                  <Ico name={it.icon as any} size={14} className="text-muted dark:text-muted-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-text dark:text-text-dark truncate">{it.title}</div>
                  <div className="text-[10px] text-muted dark:text-muted-dark truncate">{it.sub}</div>
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
        </Card>
      </div>
      <BottomBar>
        <button
          onClick={sendTest}
          disabled={perm !== "granted"}
          className="w-full py-3 rounded-tj bg-primary text-white text-[13px] font-bold disabled:opacity-60"
        >
          أرسلي تنبيه تجريبي
        </button>
      </BottomBar>
    </Screen>
  );
}

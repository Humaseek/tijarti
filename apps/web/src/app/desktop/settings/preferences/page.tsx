"use client";

import { useEffect, useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Toggle } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { fireCelebration } from "@/components/ui/confetti";
import { useToast } from "@/components/ui/toast";
import { lsRead, lsWrite } from "@/lib/local-storage";

interface Prefs {
  sound: boolean;
  haptic: boolean;
  animations: boolean;
  dailyTip: boolean;
}

const DEFAULTS: Prefs = {
  sound: true,
  haptic: true,
  animations: true,
  dailyTip: true,
};

const KEY = "tj_preferences_v1";

export default function DesktopPreferences() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPrefs({ ...DEFAULTS, ...lsRead<Partial<Prefs>>(KEY, {}) });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) lsWrite(KEY, prefs);
  }, [prefs, loaded]);

  const update = (patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch }));

  const testSound = () => {
    try {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        toast("الصوت غير مدعوم بهذا المتصفح", "warn");
        return;
      }
      const ctx = new AC();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch {
      toast("تعذّر تشغيل الصوت", "warn");
    }
  };

  const testHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50);
      toast("تم الاهتزاز");
    } else {
      toast("الاهتزاز غير مدعوم بهذا الجهاز", "warn");
    }
  };

  const testCelebration = () => fireCelebration();

  return (
    <DesktopPage
      breadcrumb="الإعدادات"
      backHref="/desktop/settings"
      title="التفضيلات"
      subtitle="تحكمي بالصوت والاهتزاز والحركات"
    >
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        <PrefRow
          icon="bell"
          label="تأثيرات الصوت"
          sub="صوت احتفال عند تحقيق هدف أو إنجاز"
          on={prefs.sound}
          onChange={(v) => update({ sound: v })}
          test={{ label: "تجربة صوت", onClick: testSound }}
        />
        <PrefRow
          icon="zap"
          label="الاهتزاز"
          sub="ردود لمسية على الأجهزة المتوافقة"
          on={prefs.haptic}
          onChange={(v) => update({ haptic: v })}
          test={{ label: "تجربة اهتزاز", onClick: testHaptic }}
        />
        <PrefRow
          icon="star"
          label="الحركات والاحتفال"
          sub="أنيميشن واحتفالات القصاصات عند الإنجازات"
          on={prefs.animations}
          onChange={(v) => update({ animations: v })}
          test={{ label: "تجربة احتفال", onClick: testCelebration }}
        />
        <PrefRow
          icon="lightbulb"
          label="نصيحة اليوم"
          sub="بطاقة نصيحة على لوحة البيانات"
          on={prefs.dailyTip}
          onChange={(v) => update({ dailyTip: v })}
        />
      </div>
    </DesktopPage>
  );
}

interface RowProps {
  icon: React.ComponentProps<typeof Ico>["name"];
  label: string;
  sub: string;
  on: boolean;
  onChange: (v: boolean) => void;
  test?: { label: string; onClick: () => void };
}

function PrefRow({ icon, label, sub, on, onChange, test }: RowProps) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-divider dark:border-divider-dark last:border-0">
      <div className="w-10 h-10 rounded-tj bg-primary-soft flex items-center justify-center flex-shrink-0">
        <Ico name={icon} size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-text dark:text-text-dark">{label}</div>
        <div className="text-[11px] text-muted dark:text-muted-dark">{sub}</div>
      </div>
      {test && (
        <button
          onClick={test.onClick}
          className="px-3 py-1.5 rounded-tj border border-divider dark:border-divider-dark text-[11px] font-bold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
        >
          {test.label}
        </button>
      )}
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

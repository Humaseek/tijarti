"use client";

import { useEffect, useState } from "react";
import { Screen, Card, Row } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
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

const DEFAULTS: Prefs = { sound: true, haptic: true, animations: true, dailyTip: true };
const KEY = "tj_preferences_v1";

export default function MobilePreferences() {
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

  const update = (p: Partial<Prefs>) => setPrefs((x) => ({ ...x, ...p }));

  const testSound = () => {
    try {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) { toast("الصوت غير مدعوم", "warn"); return; }
      const ctx = new AC();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch { /* ignore */ }
  };

  return (
    <Screen>
      <TopBar title="التفضيلات" />

      <div className="px-4 pb-5 flex-1 overflow-auto">
        <Card>
          <PrefRow icon="bell" label="تأثيرات الصوت" on={prefs.sound} onChange={(v) => update({ sound: v })} test={testSound} />
          <PrefRow icon="zap" label="الاهتزاز" on={prefs.haptic} onChange={(v) => update({ haptic: v })} />
          <PrefRow icon="star" label="الحركات" on={prefs.animations} onChange={(v) => update({ animations: v })} test={fireCelebration} />
          <PrefRow icon="lightbulb" label="نصيحة اليوم" on={prefs.dailyTip} onChange={(v) => update({ dailyTip: v })} last />
        </Card>
      </div>
    </Screen>
  );
}

function PrefRow({
  icon, label, on, onChange, test, last,
}: {
  icon: React.ComponentProps<typeof Ico>["name"];
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  test?: () => void;
  last?: boolean;
}) {
  return (
    <Row className={`px-3.5 py-3 gap-3 ${last ? "" : "border-b border-divider dark:border-divider-dark"}`}>
      <div className="w-8 h-8 rounded-tj bg-primary-soft flex items-center justify-center">
        <Ico name={icon} size={14} className="text-primary" />
      </div>
      <div className="flex-1 text-[12px] font-bold text-text dark:text-text-dark">{label}</div>
      {test && (
        <button onClick={test} className="px-2 py-1 rounded-tj text-[10px] bg-surface2 dark:bg-surface2-dark text-text dark:text-text-dark">
          تجربة
        </button>
      )}
      <Toggle on={on} onChange={onChange} />
    </Row>
  );
}

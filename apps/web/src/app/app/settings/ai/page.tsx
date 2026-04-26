"use client";

import { useEffect, useState } from "react";
import { Screen, Card, Row } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Toggle } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { lsRead, lsWrite } from "@/lib/local-storage";

interface AiPrefs {
  chat: boolean; voice: boolean; predictive: boolean; narratives: boolean; smartCategorization: boolean;
}

const DEFAULTS: AiPrefs = { chat: true, voice: true, predictive: true, narratives: true, smartCategorization: true };
const KEY = "tj_ai_prefs_v1";

export default function MobileAiSettings() {
  const [prefs, setPrefs] = useState<AiPrefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setPrefs({ ...DEFAULTS, ...lsRead<Partial<AiPrefs>>(KEY, {}) }); setLoaded(true); }, []);
  useEffect(() => { if (loaded) lsWrite(KEY, prefs); }, [prefs, loaded]);

  const update = (p: Partial<AiPrefs>) => setPrefs((x) => ({ ...x, ...p }));

  const FEATURES: Array<{ key: keyof AiPrefs; icon: React.ComponentProps<typeof Ico>["name"]; label: string }> = [
    { key: "chat", icon: "ai", label: "المساعد النصي" },
    { key: "voice", icon: "mic", label: "الاستعلام الصوتي" },
    { key: "predictive", icon: "zap", label: "الإكمال الذكي" },
    { key: "narratives", icon: "info", label: "التقارير السردية" },
    { key: "smartCategorization", icon: "tag", label: "التصنيف التلقائي" },
  ];

  return (
    <Screen>
      <TopBar title="الذكاء" />

      <div className="px-4 pb-5 flex-1 overflow-auto">
        <Card className="mb-3">
          {FEATURES.map((f, i) => (
            <Row
              key={f.key}
              className={`px-3 py-3 gap-2.5 ${i < FEATURES.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
            >
              <div className="w-8 h-8 rounded-tj bg-primary-soft flex items-center justify-center">
                <Ico name={f.icon} size={14} className="text-primary" />
              </div>
              <div className="flex-1 text-[12px] font-bold text-text dark:text-text-dark">{f.label}</div>
              <Toggle on={prefs[f.key]} onChange={(v) => update({ [f.key]: v })} />
            </Row>
          ))}
        </Card>

        <Card className="p-3 bg-success-soft dark:bg-success-soft-dark">
          <div className="flex items-start gap-2">
            <Ico name="shield" size={14} className="text-success dark:text-success-dark flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-success dark:text-success-dark mb-1">خصوصيتك محمية</div>
              <div className="text-[10px] text-text dark:text-text-dark leading-relaxed">
                كل المعالجة محلية على جهازك. ما في أي بيانات تُرسل لخوادم خارجية.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Screen>
  );
}

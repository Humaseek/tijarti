"use client";

import { useEffect, useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Toggle } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { lsRead, lsWrite } from "@/lib/local-storage";

interface AiPrefs {
  chat: boolean;
  voice: boolean;
  predictive: boolean;
  narratives: boolean;
  smartCategorization: boolean;
}

const DEFAULTS: AiPrefs = {
  chat: true, voice: true, predictive: true, narratives: true, smartCategorization: true,
};

const KEY = "tj_ai_prefs_v1";

export default function DesktopAiSettings() {
  const [prefs, setPrefs] = useState<AiPrefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setPrefs({ ...DEFAULTS, ...lsRead<Partial<AiPrefs>>(KEY, {}) }); setLoaded(true); }, []);
  useEffect(() => { if (loaded) lsWrite(KEY, prefs); }, [prefs, loaded]);

  const update = (p: Partial<AiPrefs>) => setPrefs((x) => ({ ...x, ...p }));

  const FEATURES: Array<{ key: keyof AiPrefs; icon: React.ComponentProps<typeof Ico>["name"]; label: string; sub: string }> = [
    { key: "chat", icon: "ai", label: "المساعد النصي", sub: "اسألي أسئلة بلغة طبيعية" },
    { key: "voice", icon: "mic", label: "الاستعلام الصوتي", sub: "تحدثي بدل الكتابة" },
    { key: "predictive", icon: "zap", label: "الإكمال التلقائي الذكي", sub: "اقتراحات من بيانات سابقة" },
    { key: "narratives", icon: "info", label: "التقارير السردية", sub: "قصص بدل أرقام" },
    { key: "smartCategorization", icon: "tag", label: "التصنيف التلقائي", sub: "تصنيف المصاريف حسب الوصف" },
  ];

  return (
    <DesktopPage
      breadcrumb="الإعدادات"
      backHref="/desktop/settings"
      title="الذكاء الاصطناعي"
      subtitle="تحكمي بميزات الذكاء الاصطناعي — كلّها محلية على جهازك"
    >
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden mb-5">
        {FEATURES.map((f, i) => (
          <div
            key={f.key}
            className={`flex items-center gap-4 p-4 ${i < FEATURES.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
          >
            <div className="w-10 h-10 rounded-tj bg-primary-soft flex items-center justify-center">
              <Ico name={f.icon} size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-text dark:text-text-dark">{f.label}</div>
              <div className="text-[11px] text-muted dark:text-muted-dark">{f.sub}</div>
            </div>
            <Toggle on={prefs[f.key]} onChange={(v) => update({ [f.key]: v })} />
          </div>
        ))}
      </div>

      {/* Privacy assurance */}
      <div className="bg-success-soft dark:bg-success-soft-dark rounded-tj border border-success/30 p-5 mb-5">
        <div className="flex items-start gap-3">
          <Ico name="shield" size={20} className="text-success dark:text-success-dark flex-shrink-0" />
          <div>
            <div className="text-[13px] font-bold text-success dark:text-success-dark mb-2">
              خصوصيتك محمية
            </div>
            <ul className="text-[12px] text-text dark:text-text-dark space-y-1 list-disc pr-4 leading-relaxed">
              <li>كل معالجات الذكاء الاصطناعي تتم محليًا على جهازك.</li>
              <li>ما في أي بيانات تُرسل لخوادم خارجية.</li>
              <li>بياناتك مخزّنة على جهازك فقط.</li>
              <li>لا متطلبات إنترنت لاستخدام الميزات الذكية.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Training data explanation */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
        <div className="flex items-start gap-3">
          <Ico name="info" size={20} className="text-primary flex-shrink-0" />
          <div>
            <div className="text-[13px] font-bold text-text dark:text-text-dark mb-2">بيانات التدريب</div>
            <p className="text-[12px] text-text dark:text-text-dark leading-relaxed mb-2">
              الميزات الذكية ما بتستخدم تدريب نموذج على بياناتك. بدلها:
            </p>
            <ul className="text-[12px] text-muted dark:text-muted-dark space-y-1 list-disc pr-4 leading-relaxed">
              <li><b>المساعد:</b> يُحلّل استعلامك بقواعد عربية ثابتة ويجاوبك من بياناتك.</li>
              <li><b>الإكمال التلقائي:</b> يسحب قيمًا مكرّرة من بياناتك السابقة ويعرضها.</li>
              <li><b>السردية:</b> قوالب نصية تُملأ بأرقام محسوبة من بياناتك.</li>
              <li><b>التصنيف التلقائي:</b> مطابقة كلمات دلالية بسيطة مع التصنيفات.</li>
            </ul>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

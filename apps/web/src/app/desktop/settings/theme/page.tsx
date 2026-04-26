"use client";

import { useEffect, useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

const PRESETS: Array<{ name: string; rgb: string; preview: string }> = [
  { name: "أخضر برّاند", rgb: "15 110 86", preview: "#0F6E56" },
  { name: "أزرق هادئ", rgb: "37 99 235", preview: "#2563EB" },
  { name: "بنفسجي ملكي", rgb: "126 58 242", preview: "#7E3AF2" },
  { name: "وردي فاتح", rgb: "236 72 153", preview: "#EC4899" },
  { name: "برتقالي دافئ", rgb: "234 88 12", preview: "#EA580C" },
  { name: "أحمر داكن", rgb: "163 45 45", preview: "#A32D2D" },
];

const TEMPLATES = [
  { id: "modern", name: "حديث", preview: "linear-gradient(135deg, rgb(var(--tj-primary)), rgba(var(--tj-primary), 0.6))" },
  { id: "classic", name: "كلاسيكي", preview: "linear-gradient(180deg, white 50%, rgba(var(--tj-primary), 0.1) 100%)" },
  { id: "minimal", name: "بسيط", preview: "white" },
];

const KEY = "tj_theme_v1";

export default function DesktopThemePage() {
  const { toast } = useToast();
  const [primary, setPrimary] = useState("15 110 86");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [template, setTemplate] = useState("modern");

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj.primary) { setPrimary(obj.primary); applyPrimary(obj.primary); }
        if (obj.template) setTemplate(obj.template);
      }
    } catch { /* ignore */ }
  }, []);

  const applyPrimary = (rgb: string) => {
    if (typeof document !== "undefined") document.documentElement.style.setProperty("--tj-primary", rgb);
  };

  const pickColor = (rgb: string) => {
    setPrimary(rgb); applyPrimary(rgb);
  };

  const save = () => {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify({ primary, template }));
    toast("تم حفظ الهوية", "success");
  };

  return (
    <DesktopPage breadcrumb="الإعدادات" title="الهوية والتصميم" subtitle="اختاري لون البراند والقالب — يطبّق فوراً"
      actions={<button onClick={save} className="flex items-center gap-2 px-4 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold"><Ico name="check" size={16} sw={2.4} /> حفظ</button>}
    >
      {/* Primary color */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mb-5">
        <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-4">اللون الأساسي</h3>
        <div className="grid grid-cols-6 gap-3 mb-4">
          {PRESETS.map((c) => (
            <button key={c.rgb} onClick={() => pickColor(c.rgb)}
              className={`h-20 rounded-tj border-2 flex flex-col items-center justify-center transition-all ${primary === c.rgb ? "border-text dark:border-text-dark scale-105" : "border-divider dark:border-divider-dark hover:scale-105"}`}
              style={{ background: c.preview }}>
              <span className="text-white text-[11px] font-bold drop-shadow">{c.name}</span>
              {primary === c.rgb && <Ico name="check" size={14} className="text-white mt-1" sw={3} />}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="bg-bg dark:bg-bg-dark p-4 rounded-tj">
          <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-3">معاينة مباشرة</div>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="px-4 py-2 rounded-tj bg-primary text-white text-[13px] font-bold">زر أساسي</button>
            <button className="px-4 py-2 rounded-tj border border-primary text-primary text-[13px] font-bold">زر ثانوي</button>
            <span className="text-[12px] font-bold px-2.5 py-1 rounded-tj bg-primary-soft text-primary">شارة</span>
            <span className="text-primary text-[14px] font-bold">نص ملوّن</span>
            <div className="w-3 h-3 rounded-full bg-primary"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Logo upload */}
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-4">الشعار</h3>
          <label className={`block border-2 border-dashed rounded-tj p-8 text-center cursor-pointer transition-colors ${logoLoaded ? "border-success dark:border-success-dark bg-success-soft/20" : "border-divider dark:border-divider-dark hover:border-primary"}`}>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) { setLogoLoaded(true); toast("تم رفع الشعار (تجريبي)", "success"); } }} />
            <div className="text-[40px] mb-2">{logoLoaded ? "✅" : "📁"}</div>
            <div className="text-[13px] font-bold text-text dark:text-text-dark">{logoLoaded ? "تم الرفع" : "ارفعي شعارك"}</div>
            <div className="text-[11px] text-muted dark:text-muted-dark mt-1">PNG, JPG, SVG (حتى 2 MB)</div>
          </label>
        </div>

        {/* Invoice template */}
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-4">قالب الفاتورة</h3>
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={`w-full p-3 rounded-tj border-2 transition-all flex items-center gap-3 ${template === t.id ? "border-primary" : "border-divider dark:border-divider-dark hover:border-primary/60"}`}>
                <div className="w-16 h-16 rounded-tj border border-divider dark:border-divider-dark" style={{ background: t.preview }} />
                <div className="text-start flex-1">
                  <div className="text-[13px] font-bold text-text dark:text-text-dark">{t.name}</div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">قالب فاتورة {t.name}</div>
                </div>
                {template === t.id && <Ico name="check" size={18} className="text-primary" sw={2.4} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

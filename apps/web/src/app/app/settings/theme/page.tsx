"use client";

import { useEffect, useState } from "react";
import { Screen, Card } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

const PRESETS = [
  { name: "أخضر", rgb: "15 110 86", hex: "#0F6E56" },
  { name: "أزرق", rgb: "37 99 235", hex: "#2563EB" },
  { name: "بنفسجي", rgb: "126 58 242", hex: "#7E3AF2" },
  { name: "وردي", rgb: "236 72 153", hex: "#EC4899" },
  { name: "برتقالي", rgb: "234 88 12", hex: "#EA580C" },
  { name: "أحمر", rgb: "163 45 45", hex: "#A32D2D" },
];

const KEY = "tj_theme_v1";

export default function MobileThemePage() {
  const { toast } = useToast();
  const [primary, setPrimary] = useState("15 110 86");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [template, setTemplate] = useState("modern");

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o.primary) { setPrimary(o.primary); document.documentElement.style.setProperty("--tj-primary", o.primary); } if (o.template) setTemplate(o.template); } } catch { /* ignore */ }
  }, []);

  const pick = (rgb: string) => { setPrimary(rgb); if (typeof document !== "undefined") document.documentElement.style.setProperty("--tj-primary", rgb); };

  const save = () => {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify({ primary, template }));
    toast("تم الحفظ", "success");
  };

  return (
    <Screen>
      <TopBar title="الهوية والتصميم" />
      <div className="px-4 pb-6 space-y-3">
        <Card className="p-3">
          <div className="text-[12px] font-bold text-text dark:text-text-dark mb-3">اللون الأساسي</div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((c) => (
              <button key={c.rgb} onClick={() => pick(c.rgb)}
                className={`h-16 rounded-tj border-2 flex items-center justify-center ${primary === c.rgb ? "border-text dark:border-text-dark" : "border-divider dark:border-divider-dark"}`}
                style={{ background: c.hex }}>
                <span className="text-white text-[10px] font-bold drop-shadow">{c.name}</span>
                {primary === c.rgb && <Ico name="check" size={14} className="text-white absolute" sw={3} />}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-[11px] font-bold text-muted dark:text-muted-dark mb-2">معاينة</div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="px-3 py-1.5 rounded-tj bg-primary text-white text-[12px] font-bold">زر</button>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-tj bg-primary-soft text-primary">شارة</span>
            <span className="text-primary text-[12px] font-bold">نص</span>
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-[12px] font-bold text-text dark:text-text-dark mb-2">الشعار</div>
          <label className={`block border-2 border-dashed rounded-tj p-4 text-center cursor-pointer ${logoLoaded ? "border-success dark:border-success-dark" : "border-divider dark:border-divider-dark"}`}>
            <input type="file" accept="image/*" className="hidden" onChange={() => { setLogoLoaded(true); toast("تم", "success"); }} />
            <div className="text-[28px]">{logoLoaded ? "✅" : "📁"}</div>
            <div className="text-[11px] mt-1">{logoLoaded ? "تم الرفع" : "ارفعي شعار"}</div>
          </label>
        </Card>

        <Card className="p-3">
          <div className="text-[12px] font-bold text-text dark:text-text-dark mb-2">قالب الفاتورة</div>
          <div className="grid grid-cols-3 gap-2">
            {["modern", "classic", "minimal"].map((id) => (
              <button key={id} onClick={() => setTemplate(id)}
                className={`p-2 rounded-tj border-2 ${template === id ? "border-primary" : "border-divider dark:border-divider-dark"}`}>
                <div className="h-12 rounded-tj bg-bg dark:bg-bg-dark mb-1" />
                <div className="text-[10px] font-bold">{id === "modern" ? "حديث" : id === "classic" ? "كلاسيكي" : "بسيط"}</div>
              </button>
            ))}
          </div>
        </Card>

        <button onClick={save} className="w-full py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold flex items-center justify-center gap-2">
          <Ico name="check" size={14} sw={2.4} /> حفظ
        </button>
      </div>
    </Screen>
  );
}

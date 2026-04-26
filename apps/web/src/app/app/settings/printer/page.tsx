"use client";

import { useEffect, useState } from "react";
import { Screen, Card, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Toggle } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

const KEY = "tj_printer_v1";
type PrinterType = "thermal_80" | "a4";
interface PrinterConfig { type: PrinterType; showLogo: boolean; footerText: string; autoCut: boolean; }
const DEFAULT: PrinterConfig = { type: "thermal_80", showLogo: true, footerText: "شكراً لزيارتكم!", autoCut: true };

export default function MobilePrinterPage() {
  const { state } = useStore();
  const { toast } = useToast();
  const [cfg, setCfg] = useState<PrinterConfig>(DEFAULT);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try { const raw = localStorage.getItem(KEY); if (raw) setCfg({ ...DEFAULT, ...JSON.parse(raw) }); } catch {/* ignore */}
  }, []);

  const save = (next: PrinterConfig) => {
    setCfg(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {/* ignore */}
  };

  const printTest = () => {
    if (typeof window === "undefined") return;
    const w = window.open("", "_blank");
    if (!w) { toast("لم يُفتح النافذة", "warn"); return; }
    const styles = cfg.type === "thermal_80"
      ? `@page { size: 80mm auto; margin: 0; } body { width: 72mm; font-family: monospace; font-size: 11px; padding: 4mm; }`
      : `@page { size: A4; margin: 15mm; } body { font-family: sans-serif; font-size: 13px; }`;
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>${styles}</style></head><body>
      ${cfg.showLogo ? `<div style="text-align:center;font-weight:bold">${state.storeSettings.store_name}</div>` : ""}
      <div>إيصال تجريبي</div>
      <div style="text-align:center;margin-top:10px">${cfg.footerText}</div>
      <script>window.onload=()=>setTimeout(()=>window.print(),200)</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Screen>
      <TopBar title="إعدادات الطابعة" />
      <div className="px-4 pb-28 space-y-3">
        <Card className="p-3">
          <div className="text-[11px] font-bold text-muted dark:text-muted-dark mb-2">نوع الطابعة</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => save({ ...cfg, type: "thermal_80" })}
              className={`py-3 rounded-tj text-[12px] font-bold ${cfg.type === "thermal_80" ? "bg-primary text-white" : "bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark"}`}>
              حراريّة 80مم
            </button>
            <button onClick={() => save({ ...cfg, type: "a4" })}
              className={`py-3 rounded-tj text-[12px] font-bold ${cfg.type === "a4" ? "bg-primary text-white" : "bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark"}`}>
              A4
            </button>
          </div>
        </Card>

        <Card className="p-3 flex items-center justify-between">
          <span className="text-[12px] font-bold text-text dark:text-text-dark">إظهار الشعار</span>
          <Toggle on={cfg.showLogo} onChange={(v) => save({ ...cfg, showLogo: v })} />
        </Card>
        <Card className="p-3 flex items-center justify-between">
          <span className="text-[12px] font-bold text-text dark:text-text-dark">قصّ تلقائي</span>
          <Toggle on={cfg.autoCut} onChange={(v) => save({ ...cfg, autoCut: v })} />
        </Card>

        <Card className="p-3">
          <div className="text-[11px] font-bold text-muted dark:text-muted-dark mb-1">نص التذييل</div>
          <input value={cfg.footerText} onChange={(e) => save({ ...cfg, footerText: e.target.value })}
            className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[12px] font-ar" />
        </Card>

        <Card className="p-3">
          <div className="text-[11px] font-bold text-muted dark:text-muted-dark mb-2">معاينة</div>
          <div className="bg-white text-black rounded-tj p-3 mx-auto max-w-[240px] font-mono text-[10px] shadow-inner">
            {cfg.showLogo && <div className="text-center font-bold mb-1">{state.storeSettings.store_name}</div>}
            <div className="border-t border-dashed border-black my-1" />
            <div>إيصال تجريبي</div>
            <div className="flex justify-between mt-1"><span>عطر عود</span><span>340</span></div>
            <div className="border-t border-dashed border-black my-1" />
            <div className="text-center mt-1">{cfg.footerText}</div>
          </div>
        </Card>
      </div>
      <BottomBar>
        <button onClick={printTest} className="w-full py-3 bg-primary text-white rounded-tj text-[14px] font-bold inline-flex items-center justify-center gap-2">
          <Ico name="download" size={14} sw={2} /> طباعة تجريبيّة
        </button>
      </BottomBar>
    </Screen>
  );
}

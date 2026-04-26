"use client";

import { useEffect, useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

const KEY = "tj_printer_v1";

type PrinterType = "thermal_80" | "a4";

interface PrinterConfig {
  type: PrinterType;
  showLogo: boolean;
  footerText: string;
  autoCut: boolean;
}

const DEFAULT: PrinterConfig = {
  type: "thermal_80",
  showLogo: true,
  footerText: "شكراً لزيارتكم!",
  autoCut: true,
};

export default function DesktopPrinterPage() {
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
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>إيصال تجريبي</title><style>${styles} h1{margin:0;font-size:14px} .row{display:flex;justify-content:space-between;margin:4px 0} .total{border-top:1px dashed #000;padding-top:6px;margin-top:8px;font-weight:bold} .footer{text-align:center;margin-top:12px;font-size:10px}</style></head><body>
      ${cfg.showLogo ? `<div style="text-align:center;font-weight:bold;font-size:15px">${state.storeSettings.store_name}</div>` : ""}
      <div style="text-align:center;font-size:10px">${state.storeSettings.store_address || ""}</div>
      <div style="text-align:center;font-size:10px">${state.storeSettings.store_phone || ""}</div>
      <hr style="border-top:1px dashed #000" />
      <div>إيصال تجريبي</div>
      <div style="font-size:10px">${new Date().toLocaleString("ar")}</div>
      <hr style="border-top:1px dashed #000" />
      <div class="row"><span>عطر عود × 1</span><span>340 ₪</span></div>
      <div class="row"><span>حجاب حرير × 2</span><span>360 ₪</span></div>
      <div class="row total"><span>الإجمالي:</span><span>700 ₪</span></div>
      <div class="footer">${cfg.footerText}</div>
      <script>window.onload=()=>setTimeout(()=>window.print(),200)</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <DesktopPage breadcrumb="الإعدادات" backHref="/desktop/settings" title="إعدادات الطابعة" subtitle="اضبطي نوع الطابعة وشكل الإيصال">
      <div className="grid grid-cols-2 gap-5">
        {/* Config */}
        <div className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-5 space-y-4">
          <div>
            <label className="text-[12px] font-bold text-muted dark:text-muted-dark mb-2 block">نوع الطابعة</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: "thermal_80" as PrinterType, l: "حراريّة 80مم" },
                { v: "a4" as PrinterType, l: "A4 عادية" },
              ]).map((o) => (
                <button key={o.v} onClick={() => save({ ...cfg, type: o.v })}
                  className={`py-3 rounded-tj text-[13px] font-bold ${cfg.type === o.v ? "bg-primary text-white" : "bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark"}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[12px] font-bold text-text dark:text-text-dark">إظهار شعار المحل في الرأس</span>
            <input type="checkbox" checked={cfg.showLogo} onChange={(e) => save({ ...cfg, showLogo: e.target.checked })} className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[12px] font-bold text-text dark:text-text-dark">قصّ تلقائي بعد الطباعة</span>
            <input type="checkbox" checked={cfg.autoCut} onChange={(e) => save({ ...cfg, autoCut: e.target.checked })} className="w-5 h-5" />
          </label>

          <div>
            <label className="text-[11px] font-bold text-muted dark:text-muted-dark mb-1 block">نص التذييل</label>
            <input value={cfg.footerText} onChange={(e) => save({ ...cfg, footerText: e.target.value })}
              className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] font-ar" />
          </div>

          <button onClick={printTest} className="w-full py-3 rounded-tj bg-primary text-white text-[13px] font-bold inline-flex items-center justify-center gap-2">
            <Ico name="download" size={14} sw={2} /> طباعة إيصال تجريبي
          </button>
        </div>

        {/* Preview */}
        <div className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-5">
          <div className="text-[12px] font-bold text-muted dark:text-muted-dark mb-3">معاينة</div>
          <div className={`mx-auto bg-white text-black rounded-tj p-4 shadow-inner ${cfg.type === "thermal_80" ? "max-w-[260px] font-mono text-[11px]" : "max-w-full text-[13px]"}`} style={{ fontFamily: cfg.type === "thermal_80" ? "monospace" : undefined }}>
            {cfg.showLogo && <div className="text-center font-bold text-[14px] mb-1">{state.storeSettings.store_name}</div>}
            {state.storeSettings.store_address && <div className="text-center text-[10px]">{state.storeSettings.store_address}</div>}
            {state.storeSettings.store_phone && <div className="text-center text-[10px]">{state.storeSettings.store_phone}</div>}
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-[10px]">إيصال تجريبي · {new Date().toLocaleDateString("ar")}</div>
            <div className="border-t border-dashed border-black my-2" />
            <div className="flex justify-between"><span>عطر عود × 1</span><span>340 ₪</span></div>
            <div className="flex justify-between"><span>حجاب حرير × 2</span><span>360 ₪</span></div>
            <div className="border-t border-dashed border-black my-2" />
            <div className="flex justify-between font-bold"><span>الإجمالي:</span><Shekel amt={700} size={13} weight={700} /></div>
            <div className="text-center text-[10px] mt-3">{cfg.footerText}</div>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

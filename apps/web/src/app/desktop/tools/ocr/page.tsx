"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, type ExpenseCategory, type PaymentMethod } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";
import { extractInvoiceFromPdf } from "@/lib/pdf-extract";

type Phase = "upload" | "reading" | "confirm";

interface Extracted {
  amount: number;
  vendor: string;
  date: string;
  category: ExpenseCategory;
}

function synthExtracted(): Extracted {
  const vendors = ["سوبرماركت النور", "محل القطن", "حسان للكهرباء", "مطعم الشام", "محطة دلك"];
  const amount = 50 + Math.round(Math.random() * 450);
  const vendor = vendors[Math.floor(Math.random() * vendors.length)];
  const category = EXPENSE_CATEGORIES[Math.floor(Math.random() * EXPENSE_CATEGORIES.length)];
  return { amount, vendor, date: todayIso(), category };
}

export default function DesktopOcrPage() {
  const router = useRouter();
  const { addExpense } = useStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "pdf" | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [data, setData] = useState<Extracted | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [source, setSource] = useState<string>("");
  const [extras, setExtras] = useState<{ fuel?: { liters?: number; pricePerLiter?: number; fuelType?: string }; restaurant?: { tip?: number; diners?: number; serviceType?: string } } | null>(null);

  const onFile = async (f: File | null) => {
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    const isImage = f.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast("النوع غير مدعوم — صورة أو PDF فقط", "warn");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setFileKind(isPdf ? "pdf" : "image");
    setFileName(f.name);
    setPhase("reading");

    if (isPdf) {
      // REAL extraction via pdfjs-dist
      try {
        const extracted = await extractInvoiceFromPdf(f);
        setData({
          amount: extracted.amount,
          vendor: extracted.vendor,
          date: extracted.date,
          category: extracted.category,
        });
        setRawText(extracted.rawText);
        setSource(extracted.source || "heuristic");
        setExtras(extracted.extras || null);
        setPhase("confirm");
        if (extracted.source && extracted.source !== "heuristic") {
          toast(`تم التعرّف: ${extracted.source}`, "success");
        } else if (extracted.amount === 0) {
          toast("ما لقينا مبلغ واضح في الفاتورة — راجعي يدوياً", "warn");
        }
      } catch (err) {
        console.error("PDF extract failed:", err);
        const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        toast(`فشلت قراءة الـ PDF — ${errMsg.slice(0, 80)}`, "warn");
        setData({ amount: 0, vendor: f.name.replace(/\.pdf$/i, ""), date: todayIso(), category: "أخرى" as ExpenseCategory });
        setRawText(`❌ ERROR: ${errMsg}\n\nStack:\n${err instanceof Error ? err.stack : ""}`);
        setPhase("confirm");
      }
    } else {
      // For image OCR we'd need Tesseract.js — fall back to synthetic for now
      setTimeout(() => {
        setData(synthExtracted());
        setPhase("confirm");
        toast("الصور تحتاج OCR لاحقاً — املئي الحقول يدوياً", "info");
      }, 1200);
    }
  };

  const save = () => {
    if (!data) return;
    addExpense({
      amount: data.amount,
      category: data.category,
      description: `فاتورة من ${data.vendor}`,
      payment_method: "نقدي" as PaymentMethod,
      expense_date: data.date,
      receipt_url: preview,
    });
    toast("تمّ حفظ المصروف من الفاتورة", "success");
    router.push("/desktop/expenses");
  };

  return (
    <DesktopPage
      breadcrumb="الأدوات"
      title="قراءة الفواتير"
      subtitle="ارفعي ملف فاتورة (صورة أو PDF) وحوّليه لمصروف تلقائياً"
      actions={
        <a
          href="/desktop/tools/ocr/bulk"
          className="flex items-center gap-1.5 px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark"
        >
          <Ico name="receipt" size={13} sw={1.8} />
          رفع متعدد
        </a>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Upload / preview pane */}
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          {phase === "upload" && (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center mx-auto mb-4">
                <Ico name="receipt" size={36} className="text-primary" sw={1.6} />
              </div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark mb-2">ارفعي ملف الفاتورة</div>
              <div className="text-[12px] text-muted dark:text-muted-dark leading-relaxed max-w-sm mx-auto mb-2">
                سنستخرج المبلغ، التاريخ، المورّد، والتصنيف تلقائياً
              </div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-5">
                صور (JPG, PNG, HEIC) أو PDF
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="px-5 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90"
              >
                اختاري ملف
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}
          {(phase === "reading" || phase === "confirm") && preview && (
            <div className="space-y-3">
              {fileKind === "pdf" ? (
                <object
                  data={preview}
                  type="application/pdf"
                  className="w-full h-[340px] rounded-tj bg-bg dark:bg-bg-dark"
                >
                  <div className="w-full h-[340px] flex flex-col items-center justify-center gap-2 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark">
                    <Ico name="receipt" size={32} className="text-primary" sw={1.4} />
                    <div className="text-[12px] font-bold text-text dark:text-text-dark truncate max-w-[80%]">{fileName || "ملف PDF"}</div>
                    <a
                      href={preview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary font-bold hover:underline"
                    >
                      فتح في تاب جديد
                    </a>
                  </div>
                </object>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={preview} alt="receipt" className="w-full h-[340px] object-contain rounded-tj bg-bg dark:bg-bg-dark" />
              )}
              {fileName && (
                <div className="text-[10px] text-muted dark:text-muted-dark text-center truncate">
                  {fileKind === "pdf" ? "📄" : "🖼️"} {fileName}
                </div>
              )}
              {phase === "reading" && (
                <div className="flex items-center justify-center gap-2 py-2 text-[13px] font-bold text-primary">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  نحن نقرأ الفاتورة...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form pane */}
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-1">الحقول المستخرجة</h3>
          <p className="text-[11px] text-muted dark:text-muted-dark mb-4">راجعيها وعدّلي إذا لزم</p>
          {!data ? (
            <div className="text-center py-16 text-[12px] text-muted dark:text-muted-dark">
              ارفعي صورة أولاً
            </div>
          ) : (
            <div className="space-y-3">
              {/* Template badge */}
              {source && (
                <div className={`text-[10px] font-bold px-2.5 py-1 rounded-tj inline-flex items-center gap-1.5 ${
                  source === "heuristic"
                    ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                    : "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                }`}>
                  {source === "heuristic" ? "⚠️ تحليل عام" : `✓ ${source}`}
                </div>
              )}

              {/* Fuel-specific extras */}
              {extras?.fuel && (
                <div className="bg-info-soft/40 dark:bg-info-soft-dark/40 border border-info/30 dark:border-info-dark/30 rounded-tj p-3 text-[11px] space-y-1">
                  <div className="font-bold text-info dark:text-info-dark mb-1">⛽ تفاصيل التزود بالوقود</div>
                  {extras.fuel.fuelType && <div>نوع الوقود: <span className="font-bold">{extras.fuel.fuelType}</span></div>}
                  {extras.fuel.liters && <div>الكمية: <span className="font-bold tj-num">{extras.fuel.liters}</span> لتر</div>}
                  {extras.fuel.pricePerLiter && <div>السعر للتر: <span className="font-bold tj-num">{extras.fuel.pricePerLiter} ₪</span></div>}
                </div>
              )}

              {/* Restaurant-specific extras */}
              {extras?.restaurant && (
                <div className="bg-warning-soft/40 dark:bg-warning-soft-dark/40 border border-warning/30 dark:border-warning-dark/30 rounded-tj p-3 text-[11px] space-y-1">
                  <div className="font-bold text-warning dark:text-warning-dark mb-1">🍽️ تفاصيل المطعم</div>
                  {extras.restaurant.serviceType && (
                    <div>نوع الخدمة: <span className="font-bold">
                      {extras.restaurant.serviceType === "delivery" ? "توصيل" :
                       extras.restaurant.serviceType === "takeaway" ? "Take-away" : "في المكان"}
                    </span></div>
                  )}
                  {extras.restaurant.tip !== undefined && <div>إكرامية: <span className="font-bold tj-num">{extras.restaurant.tip} ₪</span></div>}
                  {extras.restaurant.diners !== undefined && <div>عدد الضيوف: <span className="font-bold tj-num">{extras.restaurant.diners}</span></div>}
                </div>
              )}
              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">المبلغ</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={data.amount}
                    onChange={(e) => setData({ ...data, amount: Math.max(0, Number(e.target.value) || 0) })}
                    className="flex-1 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] tj-num text-end"
                  />
                  <span className="text-[12px] text-muted dark:text-muted-dark">₪</span>
                </div>
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">المورّد</div>
                <input
                  type="text"
                  value={data.vendor}
                  onChange={(e) => setData({ ...data, vendor: e.target.value })}
                  className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px]"
                />
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">التاريخ</div>
                <input
                  type="date"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] tj-num"
                />
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">التصنيف</div>
                <select
                  value={data.category}
                  onChange={(e) => setData({ ...data, category: e.target.value as ExpenseCategory })}
                  className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px]"
                >
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => {
                    if (preview) URL.revokeObjectURL(preview);
                    setPhase("upload"); setData(null); setPreview(null); setFileKind(null); setFileName(""); setRawText(""); setSource(""); setExtras(null);
                  }}
                  className="flex-1 py-2.5 rounded-tj border border-divider dark:border-divider-dark text-[13px] font-bold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
                >
                  إلغاء
                </button>
                <button
                  onClick={save}
                  className="flex-1 py-2.5 rounded-tj bg-primary text-white text-[13px] font-bold hover:opacity-90"
                >
                  حفظ كمصروف
                </button>
              </div>

              {/* Debug: show extracted raw text */}
              {rawText && (
                <div className="pt-3 border-t border-divider dark:border-divider-dark mt-3">
                  <button
                    onClick={() => setShowRaw((v) => !v)}
                    className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    {showRaw ? "▼" : "◀"} {showRaw ? "إخفاء" : "عرض"} النص المستخرج (debug)
                  </button>
                  {showRaw && (
                    <div className="mt-2 p-3 bg-bg dark:bg-bg-dark rounded-tj border border-divider dark:border-divider-dark max-h-[300px] overflow-auto">
                      <pre className="text-[10px] text-text dark:text-text-dark whitespace-pre-wrap leading-relaxed font-mono">
                        {rawText}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DesktopPage>
  );
}

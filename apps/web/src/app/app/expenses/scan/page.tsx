"use client";

/**
 * Mobile receipt scanner — uses the device camera to snap a paper receipt
 * (or pick from gallery / upload PDF), then lets the user fill the fields.
 *
 * Behaviour:
 *   - PDF → real text extraction via pdfjs (same as desktop OCR)
 *   - Image (camera/gallery) → preserved as receipt_url, fields filled manually
 *
 * The `<input capture="environment">` attribute opens the rear camera
 * directly on iOS / Android — no permission dialogs, no Web Camera API hassles.
 * Falls back to a regular file picker on desktop browsers.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, type ExpenseCategory, type PaymentMethod } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";
import { extractInvoiceFromPdf } from "@/lib/pdf-extract";

type Phase = "idle" | "reading" | "confirm";

interface Extracted {
  amount: number;
  vendor: string;
  date: string;
  category: ExpenseCategory;
}

export default function MobileScan() {
  const router = useRouter();
  const { addExpense } = useStore();
  const { toast } = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "pdf" | null>(null);
  const [data, setData] = useState<Extracted | null>(null);
  const [source, setSource] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("نقدي");

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
    setPhase("reading");

    if (isPdf) {
      try {
        const ext = await extractInvoiceFromPdf(f);
        setData({
          amount: ext.amount,
          vendor: ext.vendor,
          date: ext.date,
          category: ext.category,
        });
        setSource(ext.source || "heuristic");
        setPhase("confirm");
        if (ext.source && ext.source !== "heuristic") {
          toast(`تم التعرّف: ${ext.source}`, "success");
        }
      } catch (err) {
        toast("فشلت قراءة الـ PDF — املئي يدويًا", "warn");
        setData({ amount: 0, vendor: f.name.replace(/\.pdf$/i, ""), date: todayIso(), category: "أخرى" as ExpenseCategory });
        setPhase("confirm");
      }
    } else {
      // Image: store the photo, user fills fields manually (OCR for images
      // would need Tesseract.js — coming in a future iteration).
      setData({ amount: 0, vendor: "", date: todayIso(), category: "أخرى" as ExpenseCategory });
      setSource("photo");
      setPhase("confirm");
      toast("التقطنا الصورة — املئي الحقول يدويًا", "info");
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPhase("idle");
    setPreview(null);
    setFileKind(null);
    setData(null);
    setSource("");
  };

  const save = () => {
    if (!data) return;
    if (data.amount <= 0) {
      toast("ادخلي مبلغ المصروف", "warn");
      return;
    }
    if (!data.vendor.trim()) {
      toast("ادخلي اسم المورّد", "warn");
      return;
    }
    addExpense({
      amount: data.amount,
      category: data.category,
      description: `فاتورة من ${data.vendor.trim()}`,
      payment_method: paymentMethod,
      expense_date: data.date,
      receipt_url: preview,
    });
    toast("تم حفظ المصروف", "success");
    router.push("/app/expenses");
  };

  return (
    <Screen>
      <TopBar title="تصوير فاتورة" />

      {phase === "idle" && (
        <div className="px-4 pb-6 flex-1 flex flex-col">
          {/* Big camera button — primary CTA */}
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full bg-primary text-white rounded-tj p-6 flex flex-col items-center gap-3 hover:opacity-90 active:scale-[0.99] transition-all"
          >
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Ico name="receipt" size={40} className="text-white" sw={1.5} />
            </div>
            <div className="text-[16px] font-bold">صوّري الفاتورة</div>
            <div className="text-[11px] opacity-80">افتحي الكاميرا والتقطي صورة الفاتورة الورقية</div>
          </button>

          {/* Secondary options */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => galleryRef.current?.click()}
              className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-4 flex flex-col items-center gap-2 hover:bg-bg dark:hover:bg-bg-dark active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-info-soft dark:bg-info-soft-dark flex items-center justify-center">
                <Ico name="image" size={22} className="text-info dark:text-info-dark" sw={1.6} />
              </div>
              <div className="text-[12px] font-bold text-text dark:text-text-dark">من المعرض</div>
            </button>
            <button
              onClick={() => pdfRef.current?.click()}
              className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-4 flex flex-col items-center gap-2 hover:bg-bg dark:hover:bg-bg-dark active:scale-[0.99] transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-success-soft dark:bg-success-soft-dark flex items-center justify-center">
                <Ico name="receipt" size={22} className="text-success dark:text-success-dark" sw={1.6} />
              </div>
              <div className="text-[12px] font-bold text-text dark:text-text-dark">PDF</div>
              <div className="text-[9px] text-muted dark:text-muted-dark text-center">قراءة تلقائية</div>
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={pdfRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />

          {/* Tip */}
          <div className="mt-auto pt-6">
            <div className="bg-warning-soft/40 dark:bg-warning-soft-dark/40 border border-warning/30 dark:border-warning-dark/30 rounded-tj p-3 text-[11px]">
              <div className="font-bold text-warning dark:text-warning-dark mb-1">💡 نصيحة</div>
              <div className="text-text dark:text-text-dark leading-relaxed">
                الـ PDF بنقرأه تلقائيًا (المبلغ + المورّد + التاريخ).
                الصور بتنحفظ مع المصروف وبتعبّي الحقول يدويًا.
              </div>
            </div>
          </div>
        </div>
      )}

      {(phase === "reading" || phase === "confirm") && preview && (
        <div className="px-4 pb-6">
          {/* Preview */}
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-3 mb-3">
            {fileKind === "pdf" ? (
              <div className="w-full aspect-[3/4] bg-bg dark:bg-bg-dark rounded flex flex-col items-center justify-center gap-2">
                <Ico name="receipt" size={36} className="text-primary" sw={1.4} />
                <div className="text-[12px] font-bold text-text dark:text-text-dark">ملف PDF</div>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={preview} alt="receipt" className="w-full max-h-[280px] object-contain rounded" />
            )}
          </div>

          {phase === "reading" && (
            <div className="flex items-center justify-center gap-2 py-6 text-[13px] font-bold text-primary">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
              نحن نقرأ الفاتورة...
            </div>
          )}

          {phase === "confirm" && data && (
            <div className="space-y-3">
              {source && (
                <div className={`text-[10px] font-bold px-2.5 py-1 rounded-tj inline-flex items-center gap-1.5 ${
                  source === "heuristic" || source === "photo"
                    ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
                    : "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                }`}>
                  {source === "photo" ? "📷 صورة" : source === "heuristic" ? "⚠️ تحليل عام" : `✓ ${source}`}
                </div>
              )}

              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">المبلغ *</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={data.amount || ""}
                    onChange={(e) => setData({ ...data, amount: Math.max(0, Number(e.target.value) || 0) })}
                    className="flex-1 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-3 text-[15px] tj-num text-end font-bold"
                    placeholder="0.00"
                  />
                  <span className="text-[14px] font-bold text-muted dark:text-muted-dark">₪</span>
                </div>
              </label>

              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">المورّد *</div>
                <input
                  type="text"
                  value={data.vendor}
                  onChange={(e) => setData({ ...data, vendor: e.target.value })}
                  className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-3 text-[14px]"
                  placeholder="اسم المحل / المورّد"
                />
              </label>

              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">التاريخ</div>
                <input
                  type="date"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-3 text-[14px] tj-num"
                />
              </label>

              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">التصنيف</div>
                <select
                  value={data.category}
                  onChange={(e) => setData({ ...data, category: e.target.value as ExpenseCategory })}
                  className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-3 text-[14px]"
                >
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="block">
                <div className="text-[10px] font-bold text-muted dark:text-muted-dark mb-1">طريقة الدفع</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["نقدي", "بطاقة", "تحويل"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2.5 rounded-tj text-[12px] font-bold border ${
                        paymentMethod === m
                          ? "bg-primary text-white border-primary"
                          : "bg-bg dark:bg-bg-dark border-divider dark:border-divider-dark text-text dark:text-text-dark"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </label>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={reset}
                  className="flex-1 py-3 rounded-tj border border-divider dark:border-divider-dark text-[13px] font-bold text-text dark:text-text-dark"
                >
                  إعادة
                </button>
                <button
                  onClick={save}
                  className="flex-1 py-3 rounded-tj bg-primary text-white text-[13px] font-bold"
                >
                  حفظ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}

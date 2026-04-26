"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Label, TextInput, Textarea, ShekelInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type PaymentMethod } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";
import { extractInvoiceFromPdf } from "@/lib/pdf-extract";

const METHODS: PaymentMethod[] = ["نقدي", "بطاقة", "تحويل", "شيك"];

export function DesktopExpenseForm({ initial }: { initial?: Expense }) {
  const router = useRouter();
  const { toast } = useToast();
  const { addExpense, updateExpense, deleteExpense } = useStore();
  const editing = !!initial;

  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category || "إيجار");
  const [description, setDescription] = useState(initial?.description || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.payment_method || "نقدي");
  const [expenseDate, setExpenseDate] = useState(initial?.expense_date || todayIso());
  const [scanning, setScanning] = useState(false);
  const [scannedFrom, setScannedFrom] = useState<string>("");

  /** Reads a PDF (or image), extracts the invoice fields, and prefills the form. */
  const handleScan = async (file: File | null) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast("النوع غير مدعوم — صورة أو PDF", "warn");
      return;
    }
    setScanning(true);
    try {
      if (isPdf) {
        const ext = await extractInvoiceFromPdf(file);
        setAmount(String(ext.amount || ""));
        setCategory(ext.category as ExpenseCategory);
        setDescription(`فاتورة من ${ext.vendor}`);
        setExpenseDate(ext.date);
        setScannedFrom(ext.source || "heuristic");
        if (ext.source && ext.source !== "heuristic") {
          toast(`تم التعرّف: ${ext.source}`, "success");
        } else if (ext.amount === 0) {
          toast("ما لقينا مبلغ — راجعي يدوياً", "warn");
        } else {
          toast("تمت قراءة الفاتورة — راجعي الحقول", "success");
        }
      } else {
        // Image: just store note, user fills manually
        setScannedFrom("photo");
        toast("الصور تتطلب OCR للنصوص — املئي الحقول يدوياً", "info");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(`فشلت قراءة الملف — ${msg.slice(0, 60)}`, "warn");
    } finally {
      setScanning(false);
    }
  };

  const canSave = Number(amount) > 0 && description.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const data = { amount: Number(amount), category, description: description.trim(), payment_method: paymentMethod, expense_date: expenseDate, receipt_url: initial?.receipt_url || null };
    if (editing && initial) { updateExpense(initial.id, data); toast("تم التحديث", "success"); }
    else { addExpense(data); toast("تم تسجيل المصروف", "success"); }
    router.back();
  };

  const remove = () => {
    if (!initial) return;
    if (!confirm("حذف المصروف؟")) return;
    deleteExpense(initial.id);
    toast("تم الحذف", "warn");
    router.push("/desktop/expenses");
  };

  return (
    <DesktopPage
      breadcrumb="المصاريف"
      backHref="/desktop/expenses"
      title={editing ? "تعديل مصروف" : "مصروف جديد"}
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={save} disabled={!canSave} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canSave ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>{editing ? "حفظ" : "إضافة"}</button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          {/* OCR upload — wired to real PDF extraction */}
          {!editing && (
            <label className="cursor-pointer block">
              <div className={`rounded-tj border-2 border-dashed p-5 flex items-center gap-3 transition-all ${
                scanning
                  ? "bg-primary-soft border-primary opacity-60 cursor-wait"
                  : scannedFrom
                    ? "bg-success-soft dark:bg-success-soft-dark border-success dark:border-success-dark hover:opacity-90"
                    : "bg-primary-soft border-primary hover:opacity-90"
              }`}>
                <div className={`w-12 h-12 rounded-tj text-white flex items-center justify-center flex-shrink-0 ${
                  scannedFrom && !scanning ? "bg-success dark:bg-success-dark" : "bg-primary"
                }`}>
                  {scanning ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : scannedFrom ? (
                    <Ico name="check" size={24} sw={2.4} />
                  ) : (
                    <Ico name="camera" size={22} sw={1.6} />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-[13px] font-bold ${scannedFrom && !scanning ? "text-success dark:text-success-dark" : "text-primary"}`}>
                    {scanning ? "جاري قراءة الفاتورة..." : scannedFrom ? `تمت القراءة (${scannedFrom}) — راجعي الحقول أدناه` : "صوّري أو ارفعي الفاتورة"}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${scannedFrom && !scanning ? "text-success/80 dark:text-success-dark/80" : "text-primary/80"}`}>
                    {scannedFrom ? "أعيدي الرفع لاستبدال البيانات" : "PDF بنقرأه تلقائياً (المبلغ + المورّد + التاريخ + التصنيف)"}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-primary bg-white dark:bg-surface-dark px-2 py-1 rounded-tj">📄 PDF / 🖼️ صورة</span>
              </div>
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                disabled={scanning}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  void handleScan(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">تفاصيل المصروف</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label required>المبلغ</Label><ShekelInput value={amount} onChange={setAmount} /></div>
                <div><Label required>التصنيف</Label><Select value={category} options={EXPENSE_CATEGORIES as readonly ExpenseCategory[]} onChange={(v) => setCategory(v as ExpenseCategory)} /></div>
              </div>
              <div><Label required>الوصف</Label><TextInput value={description} onChange={setDescription} placeholder="مثال: إيجار المحل — أبريل" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>التاريخ</Label><input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none" /></div>
                <div>
                  <Label>طريقة الدفع</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {METHODS.map((m) => (
                      <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 text-[11px] rounded-tj border font-semibold ${paymentMethod === m ? "bg-primary text-white border-transparent" : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {editing && (
            <div className="bg-surface dark:bg-surface-dark rounded-tj border border-danger dark:border-danger-dark p-5">
              <h3 className="text-[13px] font-bold text-danger dark:text-danger-dark mb-2">منطقة خطرة</h3>
              <button onClick={remove} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
                <Ico name="trash" size={13} sw={1.8} /> حذف المصروف
              </button>
            </div>
          )}
        </div>

        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 h-fit">
          <div className="text-[11px] text-muted dark:text-muted-dark font-semibold mb-3">معاينة</div>
          <div className="bg-bg dark:bg-bg-dark rounded-tj p-4 border-s-[3px] border-s-danger dark:border-s-danger-dark">
            <div className="text-[10px] font-bold px-2 py-1 rounded-tj bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark inline-block">{category}</div>
            <div className="text-[22px] font-bold text-danger dark:text-danger-dark tj-num my-3">{amount ? `${Number(amount).toLocaleString()} ₪` : "— ₪"}</div>
            {description && <div className="text-[12px] font-semibold text-text dark:text-text-dark">{description}</div>}
            <div className="text-[10px] text-muted dark:text-muted-dark mt-2 pt-2 border-t border-divider dark:border-divider-dark">{expenseDate} · {paymentMethod}</div>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

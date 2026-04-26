"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel } from "@/components/ui/num";
import { Btn, IconButton } from "@/components/ui/controls";
import { Label, TextInput } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import {
  type Expense,
  type ExpenseCategory,
  type PaymentMethod,
} from "@/lib/store/types";
import { todayIso, addDays } from "@/lib/dates";
import { extractInvoiceFromPdf } from "@/lib/pdf-extract";
import { CategoryCombobox } from "@/components/ui/category-combobox";

const METHODS: PaymentMethod[] = ["نقدي", "بطاقة", "تحويل", "شيك"];

interface ExpenseFormProps {
  initial?: Expense;
}

export function ExpenseForm({ initial }: ExpenseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addExpense, updateExpense, addCheck } = useStore();
  const editing = !!initial;

  const [amount,      setAmount]      = useState(initial ? String(initial.amount) : "");
  // Empty by default — the user must actively pick a category before saving.
  const [category,    setCategory]    = useState<ExpenseCategory | "">(initial?.category || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [date,        setDate]        = useState(initial?.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(initial.expense_date) ? initial.expense_date : todayIso());
  const [method,      setMethod]      = useState<PaymentMethod>(initial?.payment_method || "نقدي");
  // Check sub-fields — appear only when method === "شيك"
  const [checkNumber, setCheckNumber] = useState("");
  const [checkDueDate, setCheckDueDate] = useState(addDays(todayIso(), 30));
  // Optional vendor name — used as the party on the check record
  const [vendor,      setVendor]      = useState("");
  // Receipt scan state — when set, fields below were prefilled from the file
  const [receiptUrl,  setReceiptUrl]  = useState<string | null>(initial?.receipt_url ?? null);
  const [scanning,    setScanning]    = useState(false);
  const [scannedFrom, setScannedFrom] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  /** Inline scan: PDF → extract + prefill all fields. Image → store as receipt
   *  attachment, user fills manually. No page navigation. */
  const handleScan = async (file: File | null) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast("النوع غير مدعوم — صورة أو PDF فقط", "warn");
      return;
    }
    const url = URL.createObjectURL(file);
    setReceiptUrl(url);
    setScanning(true);
    try {
      if (isPdf) {
        const ext = await extractInvoiceFromPdf(file);
        if (ext.amount > 0) setAmount(String(ext.amount));
        if (ext.vendor && ext.vendor !== "—") setVendor(ext.vendor);
        if (ext.category) setCategory(ext.category);
        if (ext.date) setDate(ext.date);
        setScannedFrom(ext.source || "heuristic");
        if (ext.source && ext.source !== "heuristic") {
          toast(`تم التعرّف: ${ext.source} — راجعي الحقول`, "success");
        } else if (ext.amount === 0) {
          toast("ما لقينا مبلغ — راجعي يدوياً", "warn");
        } else {
          toast("تمت قراءة الفاتورة — راجعي الحقول", "success");
        }
      } else {
        // Image: just attach. (Image OCR via Tesseract.js is a future feature.)
        setScannedFrom("photo");
        toast("التُقطت الصورة — املئي الحقول يدوياً", "info");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(`فشلت قراءة الملف — ${msg.slice(0, 60)}`, "warn");
    } finally {
      setScanning(false);
    }
  };

  const checkOK = method !== "شيك" || checkDueDate.length >= 8;
  const canSave = Number(amount) > 0 && category.length > 0 && checkOK;

  const save = () => {
    if (!canSave) return;
    const data = {
      amount: Number(amount),
      category: category as ExpenseCategory,
      description: description.trim() || (vendor.trim() ? `فاتورة من ${vendor.trim()}` : category),
      payment_method: method,
      expense_date: date,
      receipt_url: receiptUrl ?? initial?.receipt_url ?? null,
    };
    if (editing && initial) {
      updateExpense(initial.id, data);
      toast("تم تحديث المصروف", "success");
    } else {
      addExpense(data);
      // Paid by check? Auto-create the matching outgoing-check obligation
      // so it shows up in the upcoming-checks list.
      if (method === "شيك") {
        addCheck({
          direction: "outgoing",
          number: checkNumber.trim() || "—",
          amount: Number(amount),
          party_name: vendor.trim() || description.trim() || "—",
          party_id: null,
          due_date: checkDueDate,
          issued_date: todayIso(),
          status: "pending",
        });
        toast("تم إضافة المصروف + شيك صادر", "success");
      } else {
        toast("تم إضافة المصروف", "success");
      }
    }
    router.back();
  };

  return (
    <Screen>
      <TopBar
        title={editing ? "تعديل مصروف" : "مصروف جديد"}
        noBack
        leading={<IconButton name="close" onClick={() => router.back()} size={22} label="إلغاء" />}
        trailing={
          <span
            onClick={save}
            className={`tj-btn text-sm font-bold ${canSave ? "text-primary" : "text-muted dark:text-muted-dark opacity-60"}`}
            role="button"
            tabIndex={canSave ? 0 : -1}
          >
            حفظ
          </span>
        }
      />

      <div className="px-5 pb-5 flex-1">
        {/* Inline scan CTA — runs OCR right here without leaving the page.
            PDF → fields auto-fill. Image → kept as receipt attachment. */}
        {!editing && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              className={`w-full block mb-3.5 p-3 rounded-tj flex items-center gap-3 transition-all active:scale-[0.99] ${
                scanning
                  ? "bg-primary text-white opacity-60 cursor-wait"
                  : scannedFrom
                    ? "bg-success text-white"
                    : "bg-primary text-white hover:opacity-95"
              }`}
            >
              <div className="w-10 h-10 rounded-tj bg-white/20 flex items-center justify-center flex-shrink-0">
                {scanning ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : scannedFrom ? (
                  <Ico name="check" size={22} className="text-white" sw={2.4} />
                ) : (
                  <Ico name="camera" size={20} className="text-white" sw={1.6} />
                )}
              </div>
              <div className="flex-1 min-w-0 text-start">
                <div className="text-[13px] font-bold">
                  {scanning
                    ? "جاري قراءة الفاتورة..."
                    : scannedFrom
                      ? `تمت القراءة (${scannedFrom}) — راجعي الحقول`
                      : "📷 صوّري الفاتورة بدل الكتابة"}
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">
                  {scannedFrom
                    ? "اضغطي لاستبدال الفاتورة"
                    : "PDF نقرأه تلقائياً، الصورة تُحفظ مع المصروف"}
                </div>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                void handleScan(f);
                e.target.value = "";
              }}
            />
          </>
        )}

        {/* OR divider */}
        {!editing && (
          <div className="flex items-center gap-2 mb-3.5">
            <div className="flex-1 h-px bg-divider dark:bg-divider-dark" />
            <span className="text-[10px] text-muted dark:text-muted-dark font-bold tracking-wider">أو املئي يدوياً</span>
            <div className="flex-1 h-px bg-divider dark:bg-divider-dark" />
          </div>
        )}

        {/* Amount big input */}
        <Card className="p-[22px] text-center mb-3.5">
          <div className="text-[11px] text-subtext dark:text-subtext-dark mb-2.5 tracking-wide">
            المبلغ
          </div>
          <Row className="justify-center gap-1.5">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              className="tj-num text-[36px] font-bold text-text dark:text-text-dark text-center bg-transparent border-0 outline-none w-[160px]"
            />
            <span className="tj-num text-[22px] font-medium text-subtext dark:text-subtext-dark self-center">₪</span>
          </Row>
        </Card>

        {/* Category combobox — searchable dropdown with inline edit/delete
            on each custom category. Type to filter, "+ إضافة" creates a new
            custom on the spot with auto-suggested icon + color. */}
        <div className="mb-4">
          <Label>التصنيف</Label>
          <CategoryCombobox
            value={category}
            onChange={(v) => setCategory(v as ExpenseCategory)}
          />
        </div>

        <div className="mb-3.5">
          <Label>المورّد (اختياري)</Label>
          <TextInput value={vendor} onChange={setVendor} placeholder="مثلاً: محل بشير لقطع الغيار" />
        </div>

        <div className="mb-3.5">
          <Label>وصف إضافي (اختياري)</Label>
          <TextInput value={description} onChange={setDescription} placeholder="وصف المصروف" />
        </div>

        <div className="mb-3.5">
          <Label>التاريخ</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
          />
        </div>

        <div className="mb-3.5">
          <Label>طريقة الدفع</Label>
          <Row className="gap-1.5">
            {METHODS.map((m) => {
              const active = method === m;
              return (
                <div
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`tj-btn flex-1 py-3 text-center text-xs rounded-tj border ${
                    active
                      ? "bg-primary text-white dark:text-bg-dark border-transparent font-bold"
                      : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark font-medium"
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  {m}
                </div>
              );
            })}
          </Row>

          {/* Check sub-fields — appear inline when method is "شيك". On save
              we auto-create an outgoing-check record so the user sees the
              obligation in the upcoming-checks list. */}
          {method === "شيك" && (
            <div className="grid grid-cols-2 gap-2 mt-2.5 p-3 bg-warning-soft/30 dark:bg-warning-soft-dark/20 border border-warning/30 dark:border-warning-dark/30 rounded-tj">
              <div>
                <Label>رقم الشيك</Label>
                <input
                  type="text"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2.5 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
                  dir="ltr"
                />
              </div>
              <div>
                <Label required>تاريخ الاستحقاق</Label>
                <input
                  type="date"
                  value={checkDueDate}
                  onChange={(e) => setCheckDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num"
                />
              </div>
              <div className="col-span-2 text-[10px] text-warning dark:text-warning-dark font-semibold flex items-center gap-1">
                <Ico name="info" size={10} sw={1.8} />
                سننشئ سجل شيك صادر تلقائياً في صفحة الشيكات
              </div>
            </div>
          )}
        </div>

      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canSave} onClick={save}>
          <Ico name="check" size={15} sw={2.4} />
          {editing ? "حفظ التعديلات" : `إضافة المصروف (${Number(amount).toLocaleString()} ₪)`}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

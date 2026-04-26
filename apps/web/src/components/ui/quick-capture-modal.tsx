"use client";

/**
 * Universal Quick Capture — the heart of mobile data entry.
 *
 * One modal, four entry types. Each type is reachable in 3 taps from
 * anywhere in the app:
 *   1. Tap the FAB (+ button)
 *   2. Tap the type icon (مصروف / بيعة / دفعة / دَين)
 *   3. Type the amount → Save (Enter)
 *
 * Design principles:
 *   - Amount field is the hero — autofocused, big numeric keyboard
 *   - Smart defaults: today's date, last-used method, walk-in customer
 *   - Inline party picker (search + create-on-the-fly, no page change)
 *   - Photo/PDF capture EMBEDDED inside expense entry (not a separate button)
 *   - Check is a PAYMENT METHOD, not a separate type — when chosen, the
 *     check fields appear inline AND a Check record is auto-created on save
 *   - Color-coded by type so the user always knows where they are
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Ico } from "./icon";
import type { IconName } from "@/lib/icons";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "./toast";
import { suggestCategory } from "@/lib/auto-category";
import { todayIso, addDays } from "@/lib/dates";
import { extractInvoiceFromPdf } from "@/lib/pdf-extract";
import {
  type ExpenseCategory,
  type PaymentMethod,
  type Customer,
  type Supplier,
} from "@/lib/store/types";

export type CaptureType = "expense" | "sale" | "payment-in" | "debt-in" | "debt-out";

interface QuickCaptureProps {
  open: boolean;
  type: CaptureType;
  onClose: () => void;
}

interface TypeConfig {
  title: string;
  hint: string;
  saveLabel: string;
  icon: IconName;
  color: string;
  partyLabel: string;
  partyKind: "customer" | "supplier";
  needsParty: boolean;
  /** If true, payment method picker appears (with check sub-fields). */
  hasPaymentMethod: boolean;
  /** If true, the photo/PDF capture button appears (auto-fills fields from receipt). */
  hasPhotoCapture: boolean;
}

const TYPES: Record<CaptureType, TypeConfig> = {
  expense:      { title: "مصروف",          hint: "اللي دفعتيه اليوم",     saveLabel: "حفظ المصروف",   icon: "card",    color: "#8B5CF6", partyLabel: "المورّد",  partyKind: "supplier", needsParty: false, hasPaymentMethod: true,  hasPhotoCapture: true  },
  sale:         { title: "بيعة",            hint: "اللي قبضتيه الآن",     saveLabel: "تسجيل البيعة",  icon: "tag",     color: "#2563A6", partyLabel: "الزبونة",  partyKind: "customer", needsParty: false, hasPaymentMethod: true,  hasPhotoCapture: false },
  "payment-in": { title: "دفعة من زبونة",   hint: "تسديد دَين على زبونة",  saveLabel: "تأكيد الاستلام",icon: "money",   color: "#0F6E56", partyLabel: "الزبونة",  partyKind: "customer", needsParty: true,  hasPaymentMethod: true,  hasPhotoCapture: false },
  "debt-in":    { title: "دَين على زبونة",  hint: "بعت بدون فاتورة",       saveLabel: "تسجيل الدَّين",  icon: "money",   color: "#BA7517", partyLabel: "الزبونة",  partyKind: "customer", needsParty: true,  hasPaymentMethod: false, hasPhotoCapture: false },
  "debt-out":   { title: "دَين عليّ",       hint: "أخذت خدمة ولم أدفع",    saveLabel: "تسجيل الدَّين",  icon: "money",   color: "#BA7517", partyLabel: "لمن",     partyKind: "supplier", needsParty: true,  hasPaymentMethod: false, hasPhotoCapture: false },
};

const QUICK_EXPENSE_CATEGORIES: Array<{ label: ExpenseCategory; icon: IconName }> = [
  { label: "إيجار",           icon: "store"   },
  { label: "كهرباء",          icon: "zap"     },
  { label: "اتصالات",         icon: "phone"   },
  { label: "وقود",            icon: "truck"   },
  { label: "بضاعة ومشتريات",  icon: "box"     },
  { label: "مواصلات",         icon: "truck"   },
  { label: "طعام ومطاعم",     icon: "store"   },
  { label: "صيانة",           icon: "tool"    },
  { label: "رواتب",           icon: "users"   },
  { label: "أخرى",            icon: "card"    },
];

const PAYMENT_METHODS: PaymentMethod[] = ["نقدي", "بطاقة", "تحويل", "شيك"];

const LAST_METHOD_KEY = "tj_last_payment_method";

export function QuickCaptureModal({ open, type, onClose }: QuickCaptureProps) {
  const cfg = TYPES[type];
  const { state, addExpense, addCustomer, addCheck, addDebt } = useStore();
  const { toast } = useToast();

  // Common fields
  const [amount, setAmount] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [showPartyPicker, setShowPartyPicker] = useState(false);

  // Expense-specific
  const [category, setCategory] = useState<ExpenseCategory>("بضاعة ومشتريات");
  const [description, setDescription] = useState("");
  const [autoSuggested, setAutoSuggested] = useState<ExpenseCategory | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedFrom, setScannedFrom] = useState<string>("");

  // Payment method (sale + expense + payment-in)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("نقدي");
  // Check sub-fields — appear when paymentMethod === "شيك"
  const [checkNumber, setCheckNumber] = useState("");
  const [dueDate, setDueDate] = useState(addDays(todayIso(), 30));

  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset all fields whenever the modal opens or the type changes
  useEffect(() => {
    if (!open) return;
    setAmount("");
    setDescription("");
    setPartyName("");
    setPartyId(null);
    setShowPartyPicker(false);
    setAutoSuggested(null);
    setReceiptUrl(null);
    setScanning(false);
    setScannedFrom("");
    setCheckNumber("");
    setDueDate(addDays(todayIso(), 30));
    try {
      const last = localStorage.getItem(LAST_METHOD_KEY) as PaymentMethod | null;
      if (last && PAYMENT_METHODS.includes(last)) setPaymentMethod(last);
      else setPaymentMethod("نقدي");
    } catch { setPaymentMethod("نقدي"); }
    setCategory(type === "expense" ? "بضاعة ومشتريات" : "أخرى");
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [open, type]);

  // ESC closes (the FAB stays open in the background)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Party search results — narrow as user types
  const partyMatches = useMemo(() => {
    if (!showPartyPicker) return [];
    const list: Array<Customer | Supplier> =
      cfg.partyKind === "customer" ? state.customers : state.suppliers;
    const q = partyName.trim().toLowerCase();
    if (!q) return list.slice(0, 6);
    return list
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (("phone" in p && p.phone) ? p.phone.includes(q) : false)
      )
      .slice(0, 6);
  }, [showPartyPicker, partyName, cfg.partyKind, state.customers, state.suppliers]);

  if (!open) return null;

  const numeric = parseFloat(amount) || 0;
  const partyOK = !cfg.needsParty || partyName.trim().length >= 2;
  const checkOK = paymentMethod !== "شيك" || dueDate.length >= 8; // require due date for checks
  const canSave = numeric > 0 && partyOK && checkOK;

  const pickParty = (p: Customer | Supplier) => {
    setPartyName(p.name);
    setPartyId(p.id);
    setShowPartyPicker(false);
  };

  const createParty = () => {
    const name = partyName.trim();
    if (name.length < 2) return;
    if (cfg.partyKind === "customer") {
      const id = addCustomer({ name, initial: name.charAt(0), tag: "جديدة" });
      setPartyId(id);
    }
    // Suppliers can't be created via the modal yet — name is stored on the
    // record, the dedicated /app/suppliers page handles full CRUD.
    setShowPartyPicker(false);
  };

  // ─── Photo / PDF capture (expense only) ──────────────────────────────────
  const onScanFile = async (file: File | null) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast("النوع غير مدعوم — صورة أو PDF", "warn");
      return;
    }
    // Always store a preview URL so the receipt is attached to the expense
    const url = URL.createObjectURL(file);
    setReceiptUrl(url);
    setScanning(true);
    try {
      if (isPdf) {
        const ext = await extractInvoiceFromPdf(file);
        if (ext.amount > 0) setAmount(String(ext.amount));
        if (ext.vendor && ext.vendor !== "—") {
          setPartyName(ext.vendor);
          setDescription(`فاتورة من ${ext.vendor}`);
        }
        if (ext.category) setCategory(ext.category);
        setScannedFrom(ext.source || "heuristic");
        if (ext.source && ext.source !== "heuristic") {
          toast(`تم التعرّف: ${ext.source} — راجعي الحقول`, "success");
        } else if (ext.amount === 0) {
          toast("ما لقينا مبلغ — املئي يدوياً", "warn");
        } else {
          toast("تمت قراءة الفاتورة — راجعي الحقول", "success");
        }
      } else {
        // Image: just attach as receipt, fields stay for manual entry
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

  // ─── Save ────────────────────────────────────────────────────────────────
  const save = () => {
    if (!canSave) return;
    try {
      localStorage.setItem(LAST_METHOD_KEY, paymentMethod);
    } catch {}

    switch (type) {
      case "expense": {
        addExpense({
          amount: numeric,
          category,
          description: description.trim() || (partyName ? `فاتورة من ${partyName.trim()}` : category),
          payment_method: paymentMethod,
          expense_date: todayIso(),
          receipt_url: receiptUrl,
        });
        // If paid by check, ALSO create an outgoing check record so the
        // user sees it in the upcoming-obligations list.
        if (paymentMethod === "شيك") {
          addCheck({
            direction: "outgoing",
            number: checkNumber.trim() || "—",
            amount: numeric,
            party_name: partyName.trim() || "—",
            party_id: null,
            due_date: dueDate,
            issued_date: todayIso(),
            status: "pending",
          });
          toast(`تم تسجيل مصروف ${numeric.toLocaleString()} ₪ + شيك صادر`, "success");
        } else {
          toast(`تم تسجيل مصروف ${numeric.toLocaleString()} ₪`, "success");
        }
        break;
      }

      case "sale": {
        // Sales currently log as "income marker" expenses (negative). Full
        // multi-item invoices remain on /app/sales/new. If paid by check,
        // create an incoming check too.
        addExpense({
          amount: -numeric,
          category: "أخرى",
          description: `بيعة${partyName ? ` لـ ${partyName.trim()}` : " — كاش عابر"}`,
          payment_method: paymentMethod,
          expense_date: todayIso(),
          receipt_url: null,
        });
        if (paymentMethod === "شيك") {
          addCheck({
            direction: "incoming",
            number: checkNumber.trim() || "—",
            amount: numeric,
            party_name: partyName.trim() || "—",
            party_id: partyId,
            due_date: dueDate,
            issued_date: todayIso(),
            status: "pending",
          });
          toast(`تم تسجيل بيعة ${numeric.toLocaleString()} ₪ + شيك وارد`, "success");
        } else {
          toast(`تم تسجيل بيعة ${numeric.toLocaleString()} ₪`, "success");
        }
        break;
      }

      case "payment-in": {
        addDebt({
          direction: "incoming",
          amount: numeric,
          party_name: partyName.trim(),
          party_id: partyId,
          description: description.trim() || "دفعة مستلمة",
          issued_date: todayIso(),
          status: "settled",
          settled_date: todayIso(),
        });
        if (paymentMethod === "شيك") {
          addCheck({
            direction: "incoming",
            number: checkNumber.trim() || "—",
            amount: numeric,
            party_name: partyName.trim(),
            party_id: partyId,
            due_date: dueDate,
            issued_date: todayIso(),
            status: "pending",
          });
          toast(`تم تسجيل دفعة شيك ${numeric.toLocaleString()} ₪ من ${partyName}`, "success");
        } else {
          toast(`تم تسجيل دفعة ${numeric.toLocaleString()} ₪ من ${partyName}`, "success");
        }
        break;
      }

      case "debt-in":
      case "debt-out":
        addDebt({
          direction: type === "debt-in" ? "incoming" : "outgoing",
          amount: numeric,
          party_name: partyName.trim(),
          party_id: type === "debt-in" ? partyId : null,
          description: description.trim() || (type === "debt-in" ? "دَين على زبونة" : "دَين عليّ"),
          issued_date: todayIso(),
          status: "pending",
        });
        toast(`تم تسجيل دَين ${numeric.toLocaleString()} ₪`, "success");
        break;
    }
    onClose();
  };

  return (
    <div
      // `absolute` (not `fixed`) so the modal stays inside the iPhone-shaped
      // device frame on desktop. On a real mobile browser the device frame
      // fills the viewport, so the visual result is the same.
      className="absolute inset-0 z-[80] flex items-end justify-center bg-black/55 backdrop-blur-sm tj-slide-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[88%] overflow-y-auto bg-surface dark:bg-surface-dark rounded-t-[24px] border-t border-divider dark:border-divider-dark shadow-2xl"
      >
        {/* Bottom-sheet grip handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-divider dark:bg-divider-dark" />
        </div>

        {/* Header — color-coded by type */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-divider dark:border-divider-dark"
          style={{ borderInlineEndColor: cfg.color, borderInlineEndWidth: 4, borderInlineEndStyle: "solid", borderInlineStartWidth: 0 }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-tj flex items-center justify-center text-white"
              style={{ background: cfg.color }}
            >
              <Ico name={cfg.icon} size={18} sw={1.8} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-text dark:text-text-dark">{cfg.title}</h2>
              <p className="text-[10px] text-muted dark:text-muted-dark">{cfg.hint}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="w-8 h-8 rounded-tj hover:bg-bg dark:hover:bg-bg-dark flex items-center justify-center text-muted dark:text-muted-dark"
          >
            <Ico name="close" size={14} sw={1.8} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ─── Photo / PDF capture (embedded in expense entry) ─────────── */}
          {cfg.hasPhotoCapture && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              className={`w-full flex items-center gap-3 p-3 rounded-tj border-2 border-dashed transition-all ${
                scanning
                  ? "bg-primary-soft border-primary opacity-60"
                  : scannedFrom
                    ? "bg-success-soft dark:bg-success-soft-dark border-success dark:border-success-dark"
                    : "bg-primary-soft/40 dark:bg-primary-soft/10 border-primary hover:bg-primary-soft"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-tj flex items-center justify-center text-white flex-shrink-0 ${
                  scannedFrom && !scanning ? "bg-success dark:bg-success-dark" : "bg-primary"
                }`}
              >
                {scanning ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : scannedFrom ? (
                  <Ico name="check" size={18} sw={2.4} />
                ) : (
                  <Ico name="camera" size={18} sw={1.8} />
                )}
              </div>
              <div className="flex-1 text-start">
                <div className={`text-[12px] font-bold ${scannedFrom && !scanning ? "text-success dark:text-success-dark" : "text-primary"}`}>
                  {scanning ? "جاري قراءة الفاتورة..." : scannedFrom ? `تمت القراءة — راجعي الحقول` : "📷 صوّري الفاتورة (اختياري)"}
                </div>
                <div className="text-[10px] text-muted dark:text-muted-dark">
                  {scannedFrom ? "اضغطي مرة ثانية للاستبدال" : "PDF نقرأه تلقائياً، الصورة بنحفظها مع المصروف"}
                </div>
              </div>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              void onScanFile(f);
              e.target.value = "";
            }}
          />

          {/* Amount — hero input (centered, no flex-1 stretching) */}
          <div className="text-center">
            <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">
              المبلغ *
            </label>
            <div className="flex items-baseline justify-center gap-2 mt-2">
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSave && save()}
                placeholder="0"
                // Width is fixed + text-center so the digits stay in the
                // center of the modal, with ₪ sitting next to them. RTL flex
                // would otherwise push the input to one side.
                className="w-[180px] bg-transparent text-[42px] font-bold text-text dark:text-text-dark outline-none tj-num text-center"
                style={{ color: numeric > 0 ? cfg.color : undefined }}
                dir="ltr"
              />
              <span className="text-[24px] font-bold text-muted dark:text-muted-dark self-center">₪</span>
            </div>
            <div
              className="h-[2px] rounded-full mt-1 mx-auto"
              style={{ background: numeric > 0 ? cfg.color : "rgb(var(--tj-divider))", width: 220 }}
            />
          </div>

          {/* Party (customer/supplier) — for types that need it */}
          {(cfg.needsParty || type === "sale" || type === "expense") && (
            <div>
              <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">
                {cfg.partyLabel} {cfg.needsParty ? "*" : "(اختياري)"}
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => {
                    setPartyName(e.target.value);
                    setPartyId(null);
                    setShowPartyPicker(true);
                  }}
                  onFocus={() => setShowPartyPicker(true)}
                  placeholder={`اسم ${cfg.partyLabel}...`}
                  className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2.5 text-[14px] text-text dark:text-text-dark outline-none focus:border-primary"
                />
                {showPartyPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj shadow-lg z-10 max-h-[180px] overflow-y-auto">
                    {partyMatches.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => pickParty(p)}
                        className="w-full text-start px-3 py-2 hover:bg-bg dark:hover:bg-bg-dark text-[12px] text-text dark:text-text-dark border-b border-divider/40 dark:border-divider-dark/40 last:border-0 flex items-center justify-between"
                      >
                        <span className="font-bold">{p.name}</span>
                        {"phone" in p && p.phone && <span className="text-[10px] text-muted dark:text-muted-dark" dir="ltr">{p.phone}</span>}
                      </button>
                    ))}
                    {partyName.trim().length >= 2 && !partyMatches.some((p) => p.name === partyName.trim()) && (
                      <button
                        onClick={createParty}
                        className="w-full text-start px-3 py-2 bg-primary-soft dark:bg-primary-soft/30 hover:bg-primary-soft text-[12px] text-primary font-bold flex items-center gap-1.5"
                      >
                        <Ico name="plus" size={11} sw={2.2} />
                        إنشاء جديد: &quot;{partyName.trim()}&quot;
                      </button>
                    )}
                    {partyMatches.length === 0 && partyName.trim().length < 2 && (
                      <div className="px-3 py-2 text-[11px] text-muted dark:text-muted-dark">اكتبي اسم للبحث...</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expense category chips */}
          {type === "expense" && (
            <div>
              <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">التصنيف</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {QUICK_EXPENSE_CATEGORIES.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setCategory(c.label)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-tj text-[11px] font-bold transition-colors ${
                      category === c.label
                        ? "bg-primary text-white"
                        : "bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark text-text dark:text-text-dark"
                    }`}
                  >
                    <Ico name={c.icon} size={11} sw={1.8} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment method chips — for sale + expense + payment-in */}
          {cfg.hasPaymentMethod && (
            <div>
              <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">طريقة الدفع</label>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-tj text-[11px] font-bold border transition-colors ${
                      paymentMethod === m
                        ? "bg-primary text-white border-primary"
                        : "bg-bg dark:bg-bg-dark border-divider dark:border-divider-dark text-text dark:text-text-dark"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {/* Check sub-fields appear inline when method == "شيك" */}
              {paymentMethod === "شيك" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">رقم الشيك</label>
                    <input
                      type="text"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      placeholder="—"
                      className="mt-1 w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] tj-num outline-none"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">تاريخ الاستحقاق *</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] tj-num outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description (optional) — expense + debt only */}
          {(type === "expense" || type === "debt-in" || type === "debt-out") && (
            <div>
              <label className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider">ملاحظة (اختياري)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  const v = e.target.value;
                  setDescription(v);
                  if (type === "expense") {
                    const s = suggestCategory(v) as ExpenseCategory | null;
                    if (s && s !== category) setAutoSuggested(s);
                    else setAutoSuggested(null);
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && canSave && save()}
                placeholder={type === "expense" ? "مثلاً: فاتورة كهرباء — أبريل" : "تفاصيل قصيرة..."}
                className="mt-1.5 w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
              {autoSuggested && (
                <button
                  onClick={() => { setCategory(autoSuggested); setAutoSuggested(null); }}
                  className="mt-1.5 flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
                >
                  <Ico name="ai" size={11} sw={1.8} />
                  اقتراح: استخدمي تصنيف &quot;{autoSuggested}&quot;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-tj border border-divider dark:border-divider-dark text-[13px] font-bold text-text dark:text-text-dark"
          >
            إلغاء
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className="flex-1 px-4 py-3 rounded-tj text-white text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canSave ? cfg.color : undefined }}
          >
            {cfg.saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

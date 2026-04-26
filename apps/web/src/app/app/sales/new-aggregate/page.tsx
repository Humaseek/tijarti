"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Btn, IconButton } from "@/components/ui/controls";
import { Label, ShekelInput, Textarea } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

// ═══════════════════════════════════════════════════════════════════════════
// Aggregate sale mode (Layer 1) — one number for the whole day's revenue.
// This is the fast path for businesses that don't track per-product sales:
// restaurants, small markets, barbershops, etc. (أبو محمد, يوسف)
//
// Per spec section 4.2: this entire flow should complete in <15 seconds.
// ═══════════════════════════════════════════════════════════════════════════

type PaymentSplit = "simple" | "detailed";

export default function NewAggregateSale() {
  const router = useRouter();
  const { toast } = useToast();
  const { state } = useStore();

  const [total,   setTotal]   = useState("");
  const [cash,    setCash]    = useState("");
  const [card,    setCard]    = useState("");
  const [transfer,setTransfer]= useState("");
  const [notes,   setNotes]   = useState("");
  const [split,   setSplit]   = useState<PaymentSplit>("simple");

  const totalN = Number(total) || 0;
  const sumDetailed = (Number(cash) || 0) + (Number(card) || 0) + (Number(transfer) || 0);
  const canSave = totalN > 0;

  const save = () => {
    if (!canSave) return;
    // In real impl this dispatches a day-level revenue entry.
    // For now, toast and navigate home.
    toast(`تم تسجيل دخل اليوم: ${totalN.toLocaleString()} ₪`, "success");
    router.push("/app");
  };

  // Default fast-path (single amount)
  return (
    <Screen>
      <TopBar
        title="بيع / دخل اليوم"
        noBack
        leading={<IconButton name="close" onClick={() => router.back()} size={22} />}
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

      <div className="px-5 pb-5 flex-1 overflow-auto">
        {/* Hero amount input */}
        <Card className="p-5 mb-4">
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2 text-center">
            كم ربحتِ اليوم؟
          </div>
          <div className="max-w-[280px] mx-auto">
            <ShekelInput value={total} onChange={setTotal} placeholder="0" />
          </div>
          <div className="text-[10px] text-muted dark:text-muted-dark text-center mt-3">
            رقم إجمالي ليوم {new Date().toLocaleDateString("ar-EG", { weekday: "long" })}
          </div>
        </Card>

        {/* Split toggle */}
        <div className="mb-3.5">
          <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-0.5">
            <div
              onClick={() => setSplit("simple")}
              role="button"
              tabIndex={0}
              className={`tj-btn flex-1 py-2 text-center text-[12px] rounded-tj ${
                split === "simple" ? "bg-primary text-white dark:text-bg-dark font-bold" : "text-text dark:text-text-dark font-medium"
              }`}
            >
              رقم واحد
            </div>
            <div
              onClick={() => setSplit("detailed")}
              role="button"
              tabIndex={0}
              className={`tj-btn flex-1 py-2 text-center text-[12px] rounded-tj ${
                split === "detailed" ? "bg-primary text-white dark:text-bg-dark font-bold" : "text-text dark:text-text-dark font-medium"
              }`}
            >
              تقسيم (اختياري)
            </div>
          </Row>
        </div>

        {/* Detailed split */}
        {split === "detailed" && (
          <Card className="p-4 mb-3.5">
            <div className="text-[11px] font-bold text-subtext dark:text-subtext-dark tracking-wider mb-3">
              توزيع حسب طريقة الدفع
            </div>
            <div className="mb-3">
              <Label>نقدي</Label>
              <ShekelInput value={cash} onChange={setCash} />
            </div>
            <div className="mb-3">
              <Label>بطاقة</Label>
              <ShekelInput value={card} onChange={setCard} />
            </div>
            <div className="mb-3">
              <Label>تحويل</Label>
              <ShekelInput value={transfer} onChange={setTransfer} />
            </div>
            {sumDetailed > 0 && sumDetailed !== totalN && (
              <div className="text-[11px] text-warning dark:text-warning-dark font-semibold bg-warning-soft dark:bg-warning-soft-dark rounded-tj px-3 py-2 mt-2">
                مجموع التوزيع ({sumDetailed.toLocaleString()} ₪) مش مساوي للإجمالي ({totalN.toLocaleString()} ₪)
              </div>
            )}
          </Card>
        )}

        {/* Notes */}
        <div className="mb-3.5">
          <Label optional>ملاحظة (اختياري)</Label>
          <Textarea value={notes} onChange={setNotes} placeholder="مثال: يوم الجمعة - مزدحم، أو كنت مسافر..." />
        </div>

        {/* Context hint */}
        <Card className="p-3.5 bg-info-soft/50 dark:bg-info-soft-dark/50">
          <Row className="gap-2 mb-1">
            <Ico name="info" size={14} className="text-info dark:text-info-dark" sw={1.8} />
            <span className="text-[11px] font-bold text-info dark:text-info-dark">وضع الرقم اليومي</span>
          </Row>
          <div className="text-[11px] text-text dark:text-text-dark leading-relaxed">
            هاد الوضع الأسرع — مناسب للمطاعم والسوبرماركت اللي ما بتسجّل كل بيعة لحالها. لو بدك تسجيل تفصيلي بالمنتجات، بدّلي من{" "}
            <span className="text-primary font-bold">الإعدادات → معلومات المحل</span>.
          </div>
        </Card>

        {/* Current entry mode indicator */}
        <div className="text-[10px] text-muted dark:text-muted-dark text-center mt-3">
          وضعك الحالي: {state.storeSettings.entry_mode === "aggregate" ? "✓ رقم يومي" : "حسب المنتجات (هذه تجربة الوضع الآخر)"}
        </div>
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canSave} onClick={save}>
          حفظ دخل اليوم
          {totalN > 0 && ` (${totalN.toLocaleString()} ₪)`}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

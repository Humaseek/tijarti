"use client";

import { useState, type ReactNode } from "react";
import { Ico } from "@/components/ui/icon";

/**
 * Definition tooltip — an info icon next to a term that reveals an
 * Arabic explanation on hover / tap. Optimized for teaching accounting
 * concepts without cluttering the UI.
 *
 * Usage:
 *   <Term def="كم شهر تقدري تستمري بالنقد الحالي">
 *     Runway
 *   </Term>
 */

interface TermProps {
  children: ReactNode;
  def: string;
  side?: "top" | "bottom";
}

export function Term({ children, def, side = "top" }: TermProps) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex items-center gap-1 relative">
      <span>{children}</span>
      <button
        type="button"
        aria-label="شرح"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex-shrink-0"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
      >
        <Ico name="info" size={10} sw={2} />
      </button>
      {open && (
        <span
          className={`absolute z-[70] px-3 py-2 rounded-tj bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark shadow-lg text-[11px] font-normal text-text dark:text-text-dark leading-relaxed whitespace-normal pointer-events-none ${
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{
            minWidth: 200,
            maxWidth: 280,
            insetInlineStart: "50%",
            transform: "translateX(50%)",
          }}
          role="tooltip"
        >
          {def}
        </span>
      )}
    </span>
  );
}

/** Preset definitions for common accounting/finance terms. */
export const DEFINITIONS = {
  runway: "كم شهر تقدري تستمري بالشغل بنقدك الحالي لو توقّف الدخل — مؤشر أساسي على صحة المحل.",
  margin: "نسبة الربح من المبيعات — كم ₪ ربح تحصّلي من كل 100 ₪ مبيعات.",
  cogs: "Cost of Goods Sold — تكلفة البضاعة المباعة (الثمن اللي اشتريتيها فيه، مش السعر اللي بعتيها فيه).",
  cashIn: "النقد الفعلي اللي دخل الصندوق/البنك — مش كل المبيعات، لأن فيه فواتير آجلة.",
  revenue: "الإيراد = كل المبيعات المسجّلة حتى لو الفلوس ما دخلت بعد (accrual basis).",
  receivables: "الفلوس اللي لكِ عند الناس — ديون الزبائن والفواتير الآجلة.",
  payables: "الفلوس اللي عليكِ تدفعيها للناس — ديونك للموردين والشيكات الصادرة.",
  burn: "كم بتصرفي شهرياً من المصاريف الثابتة + المتغيّرة — عشان نعرف كم تستمري.",
  netProfit: "صافي الربح = الإيرادات - كل المصاريف (بما فيها تكلفة البضاعة والمصاريف الثابتة).",
  rfm: "تصنيف الزبائن حسب: آخر زيارة (Recency)، عدد الشراء (Frequency)، والمبلغ (Monetary). كل ما علا الترتيب، كان الزبون أولوية.",
  aging: "تحليل ديون الزبائن حسب عمرها — كم من الديون مضى عليها 30 / 60 / 90 يوم.",
  deadStock: "منتجات ما باعت من فترة طويلة — رأس مال نائم، فكّري في خصم أو تصفية.",
  cashFlow: "حركة النقد — كم فلوس داخلة وكم خارجة. لازم الداخل ≥ الخارج لتستمري.",
  grossProfit: "الربح الإجمالي = الإيرادات - تكلفة البضاعة المباعة (قبل المصاريف الثابتة).",
  workingCapital: "رأس المال العامل = الأصول المتداولة - الخصوم المتداولة. كم فلوس متاحة لتشغيل اليومي.",
  breakEven: "نقطة التعادل — كم لازم تبيعي شهرياً عشان تغطّي مصاريفك (لا ربح ولا خسارة).",
  inventoryTurnover: "دوران المخزون — كم مرّة بتبيعي مخزونك بالسنة. كل ما زاد كان أحسن.",
  ltv: "Lifetime Value — متوسّط ما ينفقه الزبون عندك على مدى علاقتك معه.",
  fixedCost: "مصاريف ثابتة بتدفعيها كل شهر بغض النظر عن المبيعات (إيجار، رواتب، اشتراكات).",
  variableCost: "مصاريف بتتغيّر مع حجم المبيعات (تكلفة البضاعة، عمولات، شحن).",
  grossMargin: "هامش الربح الإجمالي = (الإيرادات - تكلفة البضاعة) ÷ الإيرادات × 100. مؤشر سعرك مقابل تكلفتك.",
  quote: "عرض سعر — وثيقة بترسليها للزبون بأسعار مقترحة قبل ما يقرّر يشتري. مش فاتورة.",
};

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { Btn } from "@/components/ui/controls";
import { Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { EntryMode } from "@/lib/store/types";

interface ModeOption {
  id: EntryMode;
  title: string;
  sub: string;
  examples: string[];
  icon: "chart" | "tag";
  recommended: boolean;
}

const OPTIONS: ModeOption[] = [
  {
    id: "aggregate",
    title: "رقم إجمالي لليوم",
    sub: "سريع وسهل — بتسجّلي كم ربحتي اليوم بشكل إجمالي",
    examples: ["مطاعم", "سوبرماركت", "محلات سريعة"],
    icon: "chart",
    recommended: true,
  },
  {
    id: "per_product",
    title: "حسب المنتجات",
    sub: "تفصيلي — بتسجّلي كل بيعة لحالها مع المنتج والزبون",
    examples: ["بوتيك", "كافيه", "صالون"],
    icon: "tag",
    recommended: false,
  },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const { toast } = useToast();
  const { state, updateStoreSettings } = useStore();
  const [mode, setMode] = useState<EntryMode>(state.storeSettings.entry_mode ?? "aggregate");

  const save = () => {
    updateStoreSettings({ entry_mode: mode });
    toast(mode === "aggregate" ? "تم الاختيار — رقم يومي" : "تم الاختيار — حسب المنتجات", "success");
    router.push("/app");
  };

  return (
    <Screen>
      {/* Header without a TopBar to feel like a real onboarding step */}
      <div className="px-5 pt-8 pb-5">
        <div className="text-[11px] text-primary font-bold tracking-wider mb-1">
          <Num size={11} className="text-primary" weight={700}>3</Num>/3
        </div>
        <h1 className="text-[22px] font-bold text-text dark:text-text-dark leading-tight mb-2">
          كيف حابّة تسجّلي الدخل؟
        </h1>
        <p className="text-[12px] text-subtext dark:text-subtext-dark leading-relaxed">
          في طريقتين — اختاري اللي يناسبك. <b>بتقدري تبدّلي لاحقاً</b> من الإعدادات بدون فقدان بيانات.
        </p>
      </div>

      <div className="px-5 pb-4 flex-1 overflow-auto">
        {OPTIONS.map((opt) => {
          const active = mode === opt.id;
          return (
            <Card
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`p-4 mb-3 cursor-pointer transition-all ${
                active
                  ? "border-[2px] border-primary bg-primary-soft"
                  : "border border-divider dark:border-divider-dark"
              }`}
            >
              <Row className="gap-3 mb-2">
                <div className={`w-11 h-11 rounded-tj flex items-center justify-center ${
                  active ? "bg-primary text-white" : "bg-surface2 dark:bg-surface2-dark"
                }`}>
                  <Ico name={opt.icon} size={20} className={active ? "" : "text-muted dark:text-muted-dark"} sw={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <Row className="gap-1.5">
                    <div className="text-[15px] font-bold text-text dark:text-text-dark">{opt.title}</div>
                    {opt.recommended && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-tj bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark">
                        الأسرع
                      </span>
                    )}
                  </Row>
                  <div className="text-[11px] text-subtext dark:text-subtext-dark mt-0.5 leading-relaxed">
                    {opt.sub}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  active ? "border-primary bg-primary" : "border-divider dark:border-divider-dark"
                }`}>
                  {active && <Ico name="check" size={11} className="text-white" sw={3} />}
                </div>
              </Row>
              <Row className="gap-1.5 flex-wrap mt-2 pt-2 border-t border-divider dark:border-divider-dark">
                <span className="text-[10px] text-muted dark:text-muted-dark">مناسب لـ:</span>
                {opt.examples.map((ex) => (
                  <span
                    key={ex}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-tj bg-surface2 dark:bg-surface2-dark text-subtext dark:text-subtext-dark"
                  >
                    {ex}
                  </span>
                ))}
              </Row>
            </Card>
          );
        })}

        {/* Explainer */}
        <Card className="p-3.5 bg-info-soft/50 dark:bg-info-soft-dark/50 mt-2">
          <Row className="gap-2 mb-1.5">
            <Ico name="info" size={14} className="text-info dark:text-info-dark" sw={1.8} />
            <div className="text-[11px] font-bold text-info dark:text-info-dark">شو الفرق العملي؟</div>
          </Row>
          <div className="text-[11px] text-text dark:text-text-dark leading-relaxed space-y-1.5">
            {mode === "aggregate" ? (
              <>
                <div><b>رقم يومي:</b> في نهاية اليوم، بتفتحي التطبيق وبتكتبي "اليوم ربحت 3,500 ₪". انتهى.</div>
                <div className="text-muted dark:text-muted-dark">💡 ما رح تقدري تشوفي "أي منتج بيع أكثر" أو "أفضل زبائن".</div>
              </>
            ) : (
              <>
                <div><b>حسب المنتجات:</b> كل بيعة = فاتورة فيها المنتج + الكمية + الزبون.</div>
                <div className="text-muted dark:text-muted-dark">💡 بتعرفي أي منتج يبيع وأي زبون يشتري أكثر.</div>
              </>
            )}
          </div>
        </Card>
      </div>

      <BottomBar>
        <Btn primary fullWidth onClick={save}>
          يلا نبلش
        </Btn>
      </BottomBar>
    </Screen>
  );
}

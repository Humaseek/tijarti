"use client";

import { useEffect, useState } from "react";
import { Ico } from "@/components/ui/icon";
import { lsRead, lsWrite } from "@/lib/local-storage";

const TIPS: string[] = [
  "سجلي كل فاتورة يوميًا — حتى الصغيرة — عشان تعرفي وين فلوسك رايحة.",
  "راجعي زبائنك VIP مرة بالشهر، قلّة مهتمة ترجع بقوة.",
  "إذا هامش الربح أقل من 20%، إعادي النظر بالتسعير.",
  "تابعي الشيكات المستحقة أسبوعيًا — الشيك المنسي خسارة مؤكدة.",
  "احفظي نسخة احتياطية من البيانات أسبوعيًا.",
  "استخدمي الأرقام مش الأحاسيس — القرارات القوية تبني على أرقام.",
  "اسألي زبائنك ليش ما رجعوا — ممكن الجواب يغيّر مصلحتك.",
  "المنتج البطيء بمخزن هو فلوس نايمة — اعمليلو تخفيض أو bundle.",
  "راجعي المصاريف الثابتة كل 3 شهور — في دايمًا فرصة توفير.",
  "الربح الصافي مش إيرادات — ما تخلطي بينهم بقراراتك.",
  "ابعثي رسالة شكر للزبونة بعد كل شرا — بتشتغل عجايب.",
  "احسبي نقطة التعادل — أقل مبلغ بيعات لازم تغطي مصاريفك.",
  "المواسم بتتكرر — راجعي نفس الشهر من السنة الماضية قبل ما تقرري.",
  "عقد مكتوب مع كل مورد رئيسي — حتى لو معرفة شخصية.",
  "العرض الخاص بيشتغل أكثر لما يكون محدود بالوقت.",
  "ركّزي على أكثر 20% من منتجاتك بتجيب 80% من المبيعات.",
  "السيولة أهم من الربح على المدى القصير — راقبي كاش فلو.",
  "الأسعار المنافسة ما لازم تكون أرخص — لازم تكون أوضح.",
  "زبونة راضية بتجيب 3 زبائن، وزبونة مش راضية بتوقف 10.",
  "خزّني أرقام هواتف الزبائن بتصنيف — أيام رمضان مش مثل العيد.",
  "السوشيال ميديا مش بديل للعلاقة الشخصية — هي مكمّلة.",
  "راجعي السعر كل 6 شهور — التكاليف ما بتقف.",
  "فوترة واضحة = ثقة أكبر = مبيعات أكثر.",
  "العلامة التجارية هي ذاكرة الزبونة عنك — اختاريها بعناية.",
  "لا ترهني المحل بدين شخصي — افصلي بين الحساب الشخصي والتجاري.",
  "علامة النجاح ليست بالحجم — بالاستمرارية.",
  "كل خطأ بإدارة المحل فرصة تعلم — ما تدفنيه، وثّقيه.",
  "القرار السريع أفضل من القرار المثالي المتأخر.",
  "ما بتقدري تحسّني إشي ما بتقيسيه — قيسي كل شي مهم.",
  "ابدأي صغير، اختبري، كبّري — ما تقفزي لعرض كبير بدون تجربة.",
];

/** Deterministic pick by date — same tip all day, rotates daily. */
function pickTip(): { text: string; index: number } {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + (d.getMonth() + 1) * 50 + d.getDate();
  const index = seed % TIPS.length;
  return { text: TIPS[index], index };
}

interface Props {
  /** Compact style for mobile. */
  compact?: boolean;
}

export function DailyTip({ compact }: Props) {
  const [hidden, setHidden] = useState<boolean>(true);
  const [tip, setTip] = useState<{ text: string; index: number } | null>(null);

  useEffect(() => {
    const prefs = lsRead<{ dailyTip?: boolean }>("tj_preferences_v1", {});
    if (prefs.dailyTip === false) {
      setHidden(true);
      return;
    }
    const hiddenDate = lsRead<string>("tj_daily_tip_hidden_v1", "");
    const todayStr = new Date().toISOString().slice(0, 10);
    if (hiddenDate === todayStr) {
      setHidden(true);
      return;
    }
    setTip(pickTip());
    setHidden(false);
  }, []);

  const hideForToday = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    lsWrite("tj_daily_tip_hidden_v1", todayStr);
    setHidden(true);
  };

  if (hidden || !tip) return null;

  return (
    <div
      className={`bg-primary-soft dark:bg-primary-soft/20 border border-primary/20 rounded-tj ${
        compact ? "p-3 mx-4 mb-3" : "p-4 mb-5"
      } flex items-start gap-3`}
    >
      <div className="w-9 h-9 rounded-tj bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Ico name="lightbulb" size={18} className="text-primary" sw={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-primary mb-1">نصيحة اليوم</div>
        <div className={`${compact ? "text-[12px]" : "text-[13px]"} leading-relaxed text-text dark:text-text-dark`}>
          {tip.text}
        </div>
        <button
          onClick={hideForToday}
          className="mt-2 text-[10px] text-muted dark:text-muted-dark hover:text-primary"
        >
          لا تظهريها اليوم
        </button>
      </div>
    </div>
  );
}

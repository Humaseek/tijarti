"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { Btn, Toggle } from "@/components/ui/controls";
import { Num } from "@/components/ui/num";
import { Label, TextInput, Textarea, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

const BUSINESS_TYPES = [
  "ملابس نسائية",
  "ملابس رجالية",
  "إلكترونيات",
  "مطعم / كافيه",
  "سوبرماركت",
  "صيدلية",
  "صالون / تجميل",
  "أخرى",
];

export default function OnboardingStep1() {
  const router = useRouter();
  const { toast } = useToast();
  const { state, updateStoreSettings } = useStore();
  const ss = state.storeSettings;

  const [name,    setName]    = useState(ss.store_name);
  const [addr,    setAddr]    = useState(ss.store_address);
  const [btype,   setBtype]   = useState(ss.business_type);
  const [sameHrs, setSameHrs] = useState(true);
  const [from,    setFrom]    = useState(ss.working_hours?.from || "09:00");
  const [to,      setTo]      = useState(ss.working_hours?.to || "21:00");

  const canContinue = name.trim().length > 0 && btype.length > 0;

  const skip = () => {
    toast("تم تخطي الإعداد — تقدري تكمّلي من الإعدادات", "info");
    router.push("/app");
  };

  const next = () => {
    if (!canContinue) return;
    updateStoreSettings({
      store_name: name.trim(),
      store_address: addr.trim(),
      business_type: btype,
      working_hours: { ...ss.working_hours, from, to },
    });
    router.push("/app/onboarding/step-2");
  };

  return (
    <Screen style={{ paddingTop: 54 }}>
      {/* Header: skip link + dots */}
      <Row className="justify-between px-4 pt-1 pb-3.5 min-h-[36px]">
        <div style={{ width: 44 }} />
        <Row className="gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-primary transition-colors" />
          <div className="w-2 h-2 rounded-full bg-surface2 dark:bg-surface2-dark transition-colors" />
          <span className="text-[11px] text-subtext dark:text-subtext-dark font-medium ms-1">
            الخطوة <Num size={11} className="text-subtext dark:text-subtext-dark" weight={700}>1</Num> من <Num size={11} className="text-subtext dark:text-subtext-dark" weight={700}>2</Num>
          </span>
        </Row>
        <button onClick={skip} className="tj-btn text-xs text-subtext dark:text-subtext-dark font-medium px-2 py-1">
          تخطي
        </button>
      </Row>

      <div className="px-5 pb-5 flex-1 animate-fade-in">
        {/* Hero icon */}
        <div className="flex justify-center my-3">
          <div className="w-20 h-20 rounded-tj bg-primary-soft flex items-center justify-center">
            <Ico name="store" size={38} className="text-primary" sw={1.6} />
          </div>
        </div>

        <div className="text-center mb-5">
          <div className="text-xl font-bold text-text dark:text-text-dark mb-1.5">أهلاً بكِ في Tijarti! 👋</div>
          <div className="text-[13px] text-subtext dark:text-subtext-dark">خلّينا نعرف محلكِ أكثر</div>
        </div>

        <div className="mb-3.5">
          <Label required>اسم المحل</Label>
          <TextInput value={name} onChange={setName} placeholder="مثال: بوتيك ليلى" />
        </div>

        <div className="mb-3.5">
          <Label>العنوان</Label>
          <Textarea value={addr} onChange={setAddr} placeholder="الناصرة، شارع..." />
        </div>

        <div className="mb-3.5">
          <Label required>نوع النشاط</Label>
          <Select value={btype} options={BUSINESS_TYPES} onChange={setBtype} />
        </div>

        <div className="mb-3.5">
          <Label>ساعات العمل</Label>
          <Card className="p-3.5">
            <Row className={`justify-between ${sameHrs ? "mb-3.5" : "mb-1.5"}`}>
              <div>
                <div className="text-[13px] text-text dark:text-text-dark font-semibold">نفس الساعات كل يوم</div>
                <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                  {sameHrs ? "بسيط وواحد لكل الأيام" : "جدول مخصّص لكل يوم"}
                </div>
              </div>
              <Toggle on={sameHrs} onChange={setSameHrs} />
            </Row>
            {sameHrs && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mb-1">من</div>
                  <input
                    type="time"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full px-3.5 py-3 text-sm bg-bg dark:bg-bg-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num text-center"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mb-1">إلى</div>
                  <input
                    type="time"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full px-3.5 py-3 text-sm bg-bg dark:bg-bg-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num text-center"
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canContinue} onClick={next}>
          التالي
        </Btn>
      </BottomBar>
    </Screen>
  );
}

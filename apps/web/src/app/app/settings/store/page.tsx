"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Btn, Toggle } from "@/components/ui/controls";
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

export default function SettingsStore() {
  const router = useRouter();
  const { toast } = useToast();
  const { state, updateStoreSettings } = useStore();
  const ss = state.storeSettings;

  const initial = useRef({
    name:  ss.store_name,
    addr:  ss.store_address,
    phone: ss.store_phone,
    email: ss.store_email,
    btype: ss.business_type,
    vip:   ss.vip_discount_rate,
    from:  ss.working_hours?.from || "09:00",
    to:    ss.working_hours?.to   || "21:00",
    sameHrs: true,
  }).current;

  const [name,    setName]    = useState(initial.name);
  const [addr,    setAddr]    = useState(initial.addr);
  const [phone,   setPhone]   = useState(initial.phone);
  const [email,   setEmail]   = useState(initial.email);
  const [btype,   setBtype]   = useState(initial.btype);
  const [vip,     setVip]     = useState(String(initial.vip));
  const [from,    setFrom]    = useState(initial.from);
  const [to,      setTo]      = useState(initial.to);
  const [sameHrs, setSameHrs] = useState(initial.sameHrs);

  const isDirty =
    name !== initial.name ||
    addr !== initial.addr ||
    phone !== initial.phone ||
    email !== initial.email ||
    btype !== initial.btype ||
    String(initial.vip) !== vip ||
    from !== initial.from ||
    to !== initial.to ||
    sameHrs !== initial.sameHrs;

  const save = () => {
    if (!name.trim()) {
      toast("اسم المحل مطلوب", "warn");
      return;
    }
    updateStoreSettings({
      store_name: name.trim(),
      store_address: addr.trim(),
      store_phone: phone,
      store_email: email,
      business_type: btype,
      vip_discount_rate: Number(vip) || 0,
      working_hours: { ...ss.working_hours, from, to },
    });
    toast("تم حفظ معلومات المحل", "success");
    router.back();
  };

  return (
    <Screen>
      <TopBar title="معلومات المحل" />

      <div className="px-4 pb-4">
        {/* Logo placeholder */}
        <SectionHeader>اللوجو</SectionHeader>
        <Card className="p-4 flex items-center gap-3.5 mb-3.5">
          <div className="w-14 h-14 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center flex-shrink-0">
            <Ico name="store" size={24} className="text-muted dark:text-muted-dark" sw={1.4} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-text dark:text-text-dark">شعار المحل</div>
            <label className="text-[11px] text-primary mt-0.5 font-bold cursor-pointer inline-block">
              اختاري صورة
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) toast(`تم اختيار: ${f.name}`, "success");
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <span className="text-[11px] font-bold text-primary">تغيير</span>
        </Card>

        <SectionHeader>المعلومات الأساسية</SectionHeader>
        <Card className="p-3.5 mb-3.5">
          <div className="mb-3">
            <Label required>اسم المحل</Label>
            <TextInput value={name} onChange={setName} placeholder="بوتيك ليلى" />
          </div>
          <div className="mb-3">
            <Label>العنوان</Label>
            <Textarea value={addr} onChange={setAddr} placeholder="الناصرة، شارع..." />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <Label>الهاتف</Label>
              <TextInput value={phone} onChange={setPhone} type="tel" inputMode="tel" dir="ltr" />
            </div>
            <div>
              <Label>البريد</Label>
              <TextInput value={email} onChange={setEmail} type="email" inputMode="email" dir="ltr" />
            </div>
          </div>
          <div>
            <Label>نوع النشاط</Label>
            <Select value={btype} options={BUSINESS_TYPES} onChange={setBtype} />
          </div>
        </Card>

        <SectionHeader>ساعات العمل</SectionHeader>
        <Card className="p-3.5 mb-3.5">
          <Row className={`justify-between ${sameHrs ? "mb-3.5" : "mb-2"}`}>
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
                  type="time" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num text-center"
                />
              </div>
              <div>
                <div className="text-[10px] text-muted dark:text-muted-dark mb-1">إلى</div>
                <input
                  type="time" value={to} onChange={(e) => setTo(e.target.value)}
                  className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num text-center"
                />
              </div>
            </div>
          )}
        </Card>

        <SectionHeader>إعدادات البيع</SectionHeader>
        <Card className="p-3.5 mb-3.5">
          <Label>نسبة خصم زبونة VIP</Label>
          <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-[14px] py-3 gap-1.5">
            <input
              type="text" inputMode="decimal" value={vip}
              onChange={(e) => setVip(e.target.value.replace(/[^\d.]/g, ""))}
              className="flex-1 bg-transparent border-0 outline-none tj-num text-sm font-semibold text-text dark:text-text-dark"
            />
            <span className="tj-num text-xs text-subtext dark:text-subtext-dark font-medium">%</span>
          </Row>
          <div className="text-[10px] text-muted dark:text-muted-dark mt-1.5">
            تطبق تلقائياً على زبونات VIP عند إضافتهن لفاتورة
          </div>
        </Card>

        {/* No VAT — philosophy note */}
        <Card className="p-3 bg-info-soft dark:bg-info-soft-dark border border-info dark:border-info-dark">
          <Row className="gap-2 items-start">
            <Ico name="info" size={16} className="text-info dark:text-info-dark flex-shrink-0 mt-0.5" sw={1.8} />
            <div className="flex-1 text-[11px] text-text dark:text-text-dark leading-relaxed">
              <span className="font-bold">Tijarti لا يحسب الضرائب.</span> الهدف أن تسجّلي دخلكِ ومصاريفكِ بوضوح، والمحاسب يتولّى الرسميات. سجّلي ضرائبكِ المدفوعة كمصروف في تصنيف{" "}
              <span className="font-bold text-warning dark:text-warning-dark">"ضرائب ورسوم"</span>.
            </div>
          </Row>
        </Card>
      </div>

      {isDirty && (
        <BottomBar>
          <Btn primary fullWidth onClick={save}>
            <Ico name="check" size={14} sw={2.4} />
            حفظ التعديلات
          </Btn>
        </BottomBar>
      )}
    </Screen>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider pb-2 pt-1 px-1">
      {children}
    </div>
  );
}

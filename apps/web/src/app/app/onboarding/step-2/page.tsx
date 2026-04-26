"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { Btn } from "@/components/ui/controls";
import { Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

interface Row0 {
  name: string;
  price: string;
  stock: string;
}

const DEFAULTS: Row0[] = [
  { name: "فستان أحمر صيفي", price: "280", stock: "12" },
  { name: "بلوزة قطن",        price: "145", stock: "8" },
  { name: "",                 price: "",    stock: ""   },
];

const COLORS = [
  "text-danger  dark:text-danger-dark",
  "text-warning dark:text-warning-dark",
  "text-success dark:text-success-dark",
  "text-info    dark:text-info-dark",
  "text-chart   dark:text-chart-dark",
  "text-primary",
];
const SOFTS = [
  "bg-danger-soft  dark:bg-danger-soft-dark",
  "bg-warning-soft dark:bg-warning-soft-dark",
  "bg-success-soft dark:bg-success-soft-dark",
  "bg-info-soft    dark:bg-info-soft-dark",
  "bg-warning-soft dark:bg-warning-soft-dark",
  "bg-primary-soft",
];

export default function OnboardingStep2() {
  const router = useRouter();
  const { toast } = useToast();
  const { addProduct } = useStore();
  const [rows, setRows] = useState<Row0[]>(DEFAULTS);

  const updateRow = (i: number, field: keyof Row0, value: string) => {
    const next = rows.slice();
    next[i] = { ...next[i], [field]: value };
    setRows(next);
  };

  const addRow = () => {
    if (rows.length >= 6) return;
    setRows([...rows, { name: "", price: "", stock: "" }]);
  };

  const skip = () => {
    toast("تم تخطي إضافة المنتجات — تقدري تضيفيهن لاحقاً", "info");
    router.push("/app");
  };

  const finish = () => {
    const valid = rows.filter((r) => r.name.trim() && Number(r.price) > 0);
    for (const r of valid) {
      const price = Number(r.price);
      addProduct({
        name: r.name.trim(),
        price,
        cost: Math.round(price * 0.45),
        stock: Number(r.stock) || 0,
        category: "أخرى",
        sku: "",
      });
    }
    const msg =
      valid.length > 0
        ? `✓ تم إعداد حسابكِ بنجاح! (${valid.length} منتج${valid.length > 1 ? "" : " واحد"})`
        : "✓ تم إعداد حسابكِ بنجاح!";
    toast(msg, "success");
    router.push("/app");
  };

  return (
    <Screen style={{ paddingTop: 54 }}>
      {/* Header */}
      <Row className="justify-between px-4 pt-1 pb-3.5 min-h-[36px]">
        <button onClick={() => router.back()} className="tj-btn p-1 text-primary">
          <Ico name="forward" size={22} />
        </button>
        <Row className="gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[11px] text-subtext dark:text-subtext-dark font-medium ms-1">
            الخطوة <Num size={11} className="text-subtext dark:text-subtext-dark" weight={700}>2</Num> من <Num size={11} className="text-subtext dark:text-subtext-dark" weight={700}>2</Num>
          </span>
        </Row>
        <button onClick={skip} className="tj-btn text-xs text-subtext dark:text-subtext-dark font-medium px-2 py-1">
          تخطي
        </button>
      </Row>

      <div className="px-5 pb-5 flex-1 animate-fade-in">
        <div className="flex justify-center my-3">
          <div className="w-20 h-20 rounded-tj bg-info-soft dark:bg-info-soft-dark flex items-center justify-center">
            <Ico name="box" size={38} className="text-info dark:text-info-dark" sw={1.6} />
          </div>
        </div>

        <div className="text-center mb-5">
          <div className="text-[19px] font-bold text-text dark:text-text-dark mb-1.5">
            ممتاز! الآن نضيف بعض المنتجات
          </div>
          <div className="text-[13px] text-subtext dark:text-subtext-dark">
            يمكنكِ إضافة منتجات الآن <span className="text-muted dark:text-muted-dark">(اختياري)</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mb-3.5">
          {rows.map((r, i) => (
            <Card key={i} className="p-3 flex gap-2.5">
              <div
                className={`w-8 h-8 rounded-tj flex items-center justify-center flex-shrink-0 ${SOFTS[i % SOFTS.length]}`}
              >
                <Num size={13} className={COLORS[i % COLORS.length]} weight={700}>{i + 1}</Num>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  type="text"
                  value={r.name}
                  onChange={(e) => updateRow(i, "name", e.target.value)}
                  placeholder="اسم المنتج"
                  className="w-full px-2.5 py-2 text-[13px] font-semibold bg-transparent text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none font-ar"
                  dir="rtl"
                />
                <Row className="gap-1.5">
                  <Row className="flex-1 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-2.5 py-1.5 gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={r.price}
                      onChange={(e) => updateRow(i, "price", e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder="السعر"
                      className="flex-1 bg-transparent border-0 outline-none tj-num text-[13px] font-semibold text-text dark:text-text-dark"
                    />
                    <span className="text-[11px] text-subtext dark:text-subtext-dark">₪</span>
                  </Row>
                  <Row className="flex-1 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded-tj px-2.5 py-1.5 gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={r.stock}
                      onChange={(e) => updateRow(i, "stock", e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="الكمية"
                      className="flex-1 bg-transparent border-0 outline-none tj-num text-[13px] font-semibold text-text dark:text-text-dark"
                    />
                    <span className="text-[10px] text-muted dark:text-muted-dark">قطعة</span>
                  </Row>
                </Row>
              </div>
            </Card>
          ))}
        </div>

        {rows.length < 6 && (
          <button
            onClick={addRow}
            className="tj-btn w-full py-3 text-center text-xs font-semibold text-primary bg-transparent border border-dashed border-primary rounded-tj"
          >
            + إضافة منتج آخر
          </button>
        )}
      </div>

      <BottomBar className="flex gap-2.5">
        <Btn ghost fullWidth onClick={skip}>
          تخطي
        </Btn>
        <Btn primary fullWidth onClick={finish}>
          إنهاء الإعداد
          <Ico name="check" size={14} sw={2.4} />
        </Btn>
      </BottomBar>
    </Screen>
  );
}

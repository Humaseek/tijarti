"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Shekel, Num } from "@/components/ui/num";
import { Label, TextInput, Textarea, ShekelInput, NumberInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/store/types";

export function DesktopProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { state, addProduct, updateProduct, calculateMargin, addDraftItem } = useStore();
  const editing = !!initial;
  const returnToPick = searchParams?.get("returnTo") === "pick";

  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.category || "فساتين");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [cost, setCost] = useState(initial ? String(initial.cost) : "");

  // Price suggestion — compute suggested price from category average margin
  const suggestedPrice = (() => {
    if (editing) return null;
    const costN = Number(cost);
    if (costN <= 0) return null;
    const sameCategory = state.products.filter((p) => p.category === category && p.cost > 0 && p.price > 0);
    if (sameCategory.length < 2) {
      // Not enough data — default to 50% margin suggestion
      return Math.round(costN * 1.5);
    }
    const avgMargin = sameCategory.reduce((s, p) => s + (p.price - p.cost) / p.price, 0) / sameCategory.length;
    return Math.round(costN / (1 - avgMargin));
  })();
  const priceIsDifferent = suggestedPrice !== null && Math.abs(Number(price) - suggestedPrice) > 1;
  const [stock, setStock] = useState(initial ? String(initial.stock) : "0");
  const [threshold, setThreshold] = useState(initial ? String(initial.low_stock_threshold || 5) : "5");
  const [barcode, setBarcode] = useState(initial?.barcode || "");
  const [active, setActive] = useState(initial ? initial.is_active !== false : true);

  const margin = calculateMargin(Number(price), Number(cost));
  const priceGTcost = Number(price) > Number(cost);
  const canSave = name.trim().length > 0 && Number(price) > 0 && priceGTcost;

  const save = () => {
    if (!canSave) return;
    const data = { name: name.trim(), description, category, price: Number(price), cost: Number(cost), stock: Number(stock) || 0, low_stock_threshold: Number(threshold) || 5, barcode, is_active: active, sku: initial?.sku || "" };
    if (editing && initial) {
      updateProduct(initial.id, data);
      toast("تم التحديث", "success");
      router.back();
      return;
    }
    const newId = addProduct(data);
    toast("تم الإضافة", "success");
    if (returnToPick) {
      addDraftItem(newId, 1);
      router.push("/desktop/sales/new/pick-product");
      return;
    }
    router.back();
  };

  return (
    <DesktopPage
      breadcrumb="المنتجات"
      backHref="/desktop/products"
      title={editing ? `تعديل ${initial.name}` : "منتج جديد"}
      actions={
        <>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark">إلغاء</button>
          <button onClick={save} disabled={!canSave} className={`px-4 py-2 rounded-tj text-[12px] font-bold ${canSave ? "bg-primary text-white hover:opacity-90" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark cursor-not-allowed"}`}>
            {editing ? "حفظ" : "إضافة"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        {/* Image */}
        <div className="col-span-4 bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <Label optional>صورة المنتج</Label>
          <label className="block cursor-pointer">
            <div className="aspect-square bg-surface2 dark:bg-surface2-dark rounded-tj flex flex-col items-center justify-center gap-2 hover:bg-bg dark:hover:bg-bg-dark transition-colors border-2 border-dashed border-divider dark:border-divider-dark">
              <div className="w-12 h-12 rounded-tj bg-surface dark:bg-surface-dark flex items-center justify-center">
                <Ico name="camera" size={24} className="text-muted dark:text-muted-dark" sw={1.4} />
              </div>
              <div className="text-[12px] font-semibold text-subtext dark:text-subtext-dark">+ إضافة صورة</div>
              <div className="text-[10px] text-muted dark:text-muted-dark">اضغطي لاختيار</div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) toast(`تم اختيار: ${f.name}`, "success");
              e.target.value = "";
            }} />
          </label>

          {/* Live margin card */}
          <div className="mt-4 p-3 rounded-tj border-s-[3px] bg-bg dark:bg-bg-dark"
            style={{ borderInlineStartColor: priceGTcost || !price ? "rgb(15 110 86)" : "rgb(163 45 45)" }}>
            <div className="text-[10px] text-muted dark:text-muted-dark mb-1 font-semibold">هامش الربح</div>
            <Num size={22} className={priceGTcost ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"} weight={700}>{margin}</Num>
            <span className="text-[13px] tj-num">%</span>
            {price && cost && (
              <div className="text-[10px] text-muted dark:text-muted-dark mt-1">
                ربح/قطعة: <Shekel amt={Number(price) - Number(cost)} size={10} className="text-muted dark:text-muted-dark" weight={600} />
              </div>
            )}
            {!priceGTcost && price && cost && (
              <div className="text-[10px] text-danger dark:text-danger-dark mt-1.5 font-medium">⚠ السعر &lt; التكلفة</div>
            )}
          </div>
        </div>

        {/* Main fields */}
        <div className="col-span-8 space-y-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">المعلومات الأساسية</h3>
            <div className="space-y-3">
              <div>
                <Label required>اسم المنتج</Label>
                <TextInput value={name} onChange={setName} placeholder="مثال: فستان أحمر صيفي" />
              </div>
              <div>
                <Label optional>الوصف</Label>
                <Textarea value={description} onChange={setDescription} placeholder="تفاصيل إضافية (اختياري)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الفئة</Label>
                  <Select value={category} options={PRODUCT_CATEGORIES as readonly string[]} onChange={(v) => setCategory(v as string)} />
                </div>
                <div>
                  <Label optional>الباركود</Label>
                  <TextInput value={barcode} onChange={setBarcode} placeholder="1234567890" dir="ltr" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">التسعير</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>سعر البيع</Label>
                <ShekelInput value={price} onChange={setPrice} />
                {suggestedPrice !== null && priceIsDifferent && (
                  <button
                    type="button"
                    onClick={() => setPrice(String(suggestedPrice))}
                    className="mt-2 flex items-center gap-1.5 text-[11px] text-primary font-bold hover:underline"
                    title={`مبني على متوسط هامش تصنيف "${category}"`}
                  >
                    <Ico name="ai" size={11} sw={1.8} />
                    اقتراح ذكي: {suggestedPrice.toLocaleString()} ₪
                  </button>
                )}
              </div>
              <div>
                <Label>التكلفة</Label>
                <ShekelInput value={cost} onChange={setCost} />
              </div>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">المخزون</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الكمية الحالية</Label>
                <NumberInput value={stock} onChange={setStock} />
              </div>
              <div>
                <Label>تنبيه المخزون المنخفض</Label>
                <NumberInput value={threshold} onChange={setThreshold} />
              </div>
            </div>
            <label className="mt-4 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4" />
              <span className="text-[12px] text-text dark:text-text-dark">المنتج نشط (يظهر في قائمة البيع)</span>
            </label>
          </div>
        </div>
      </div>
    </DesktopPage>
  );
}

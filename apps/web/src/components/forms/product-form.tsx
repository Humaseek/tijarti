"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Btn, IconButton, Toggle } from "@/components/ui/controls";
import { Label, TextInput, Textarea, ShekelInput, NumberInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/store/types";

interface ProductFormProps {
  initial?: Product;
}

export function ProductForm({ initial }: ProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addProduct, updateProduct, calculateMargin, addDraftItem } = useStore();
  const editing = !!initial;
  // `?returnTo=pick` means: came from pick-product. After save, add the new
  // product to the draft + navigate back to pick-product for more shopping.
  const returnToPick = searchParams?.get("returnTo") === "pick";

  const [name,        setName]        = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category,    setCategory]    = useState(initial?.category || "فساتين");
  const [price,       setPrice]       = useState(initial ? String(initial.price) : "");
  const [cost,        setCost]        = useState(initial ? String(initial.cost) : "");
  const [stock,       setStock]       = useState(initial ? String(initial.stock) : "0");
  const [threshold,   setThreshold]   = useState(initial ? String(initial.low_stock_threshold || 5) : "5");
  const [barcode,     setBarcode]     = useState(initial?.barcode || "");
  const [active,      setActive]      = useState(initial ? initial.is_active !== false : true);

  const margin = calculateMargin(Number(price), Number(cost));
  const priceGTcost = Number(price) > Number(cost);
  const canSave = name.trim().length > 0 && Number(price) > 0 && priceGTcost;

  const save = () => {
    if (!canSave) return;
    const data = {
      name: name.trim(),
      description,
      category,
      price: Number(price),
      cost: Number(cost),
      stock: Number(stock) || 0,
      low_stock_threshold: Number(threshold) || 5,
      barcode,
      is_active: active,
      sku: initial?.sku || "",
    };
    if (editing && initial) {
      updateProduct(initial.id, data);
      toast("تم تحديث المنتج", "success");
      router.back();
      return;
    }
    const newId = addProduct(data);
    toast("تم إضافة المنتج", "success");
    // If came from pick-product: auto-add to the current draft and return.
    if (returnToPick) {
      addDraftItem(newId, 1);
      router.push("/app/sales/new/pick-product");
      return;
    }
    router.back();
  };

  return (
    <Screen>
      <TopBar
        title={editing ? "تعديل منتج" : "منتج جديد"}
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
        {/* Image upload */}
        <Label optional>صورة المنتج</Label>
        <label className="block cursor-pointer mb-3.5">
          <Card className="p-5 h-[180px] flex flex-col items-center justify-center gap-2">
            <div className="w-[46px] h-[46px] rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center">
              <Ico name="camera" size={22} className="text-muted dark:text-muted-dark" sw={1.4} />
            </div>
            <div className="text-xs text-subtext dark:text-subtext-dark font-semibold">+ إضافة صورة</div>
            <div className="text-[10px] text-muted dark:text-muted-dark">اضغطي لاختيار صورة من جهازك</div>
          </Card>
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

        <div className="mb-3.5">
          <Label required>اسم المنتج</Label>
          <TextInput value={name} onChange={setName} placeholder="مثال: فستان أحمر صيفي" />
        </div>

        <div className="mb-3.5">
          <Label optional>الوصف</Label>
          <Textarea value={description} onChange={setDescription} placeholder="تفاصيل إضافية (اختياري)" />
        </div>

        <div className="mb-3.5">
          <Label>الفئة</Label>
          <Select value={category} options={PRODUCT_CATEGORIES as readonly string[]} onChange={(v) => setCategory(v as string)} />
        </div>

        {/* Price + cost */}
        <div className="grid grid-cols-2 gap-2.5 mb-1">
          <div className="mb-3.5">
            <Label>سعر البيع</Label>
            <ShekelInput value={price} onChange={setPrice} />
          </div>
          <div className="mb-3.5">
            <Label>التكلفة</Label>
            <ShekelInput value={cost} onChange={setCost} />
          </div>
        </div>

        {/* Live margin card */}
        <Card
          className="p-3.5 mb-3.5"
          style={{
            borderInlineStartWidth: 3,
            borderInlineStartColor: priceGTcost || !price ? "rgb(15 110 86)" : "rgb(163 45 45)",
          }}
        >
          <Row className="justify-between">
            <div>
              <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wide font-semibold">هامش الربح</div>
              <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                {price && cost ? (
                  <>
                    ربح / قطعة:{" "}
                    <Shekel amt={Number(price) - Number(cost)} size={10} className="text-muted dark:text-muted-dark" weight={500} />
                  </>
                ) : (
                  "أدخلي السعر والتكلفة"
                )}
              </div>
            </div>
            <Num
              size={22}
              className={priceGTcost ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}
              weight={700}
              bump
            >
              {margin}%
            </Num>
          </Row>
          {!priceGTcost && price && cost && (
            <div className="text-[11px] text-danger dark:text-danger-dark mt-2 font-medium">
              ⚠ السعر يجب أن يكون أعلى من التكلفة
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="mb-3.5">
            <Label>الكمية الحالية</Label>
            <NumberInput value={stock} onChange={setStock} />
          </div>
          <div className="mb-3.5">
            <Label>تنبيه المخزون</Label>
            <NumberInput value={threshold} onChange={setThreshold} />
          </div>
        </div>

        <div className="mb-3.5">
          <Label optional>الباركود</Label>
          <TextInput value={barcode} onChange={setBarcode} placeholder="1234567890" dir="ltr" />
        </div>

        <Card className="p-3.5">
          <Row className="justify-between">
            <div>
              <div className="text-[13px] font-semibold text-text dark:text-text-dark">المنتج نشط</div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">يظهر في قائمة البيع</div>
            </div>
            <Toggle on={active} onChange={setActive} />
          </Row>
        </Card>
      </div>

      <BottomBar>
        <Btn primary fullWidth disabled={!canSave} onClick={save}>
          {editing ? "حفظ التعديلات" : "إضافة المنتج"}
        </Btn>
      </BottomBar>
    </Screen>
  );
}

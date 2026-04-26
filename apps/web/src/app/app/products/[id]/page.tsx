"use client";

import { useParams, useRouter } from "next/navigation";
import { Screen, Card, Row, BottomBar, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Btn, IconButton, Toggle } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, toastWithAction } = useToast();
  const { findProduct, calculateMargin, getProductStats, updateProduct, deleteProduct, addProduct } = useStore();

  const p = findProduct(params.id);
  if (!p) {
    return (
      <Screen>
        <TopBar title="منتج" />
        <Empty icon="box" title="المنتج غير موجود" />
      </Screen>
    );
  }

  const margin = calculateMargin(p.price, p.cost);
  const stats = getProductStats(p.id);
  const threshold = p.low_stock_threshold || 5;
  const lowStock = p.stock < threshold;
  const outOfStock = p.stock === 0;
  const isActive = p.is_active !== false;

  const toggleActive = () => {
    updateProduct(p.id, { is_active: !isActive });
    toast(isActive ? "تم إخفاء المنتج" : "تم تفعيل المنتج", "info");
  };

  const remove = () => {
    if (!confirm(`حذف "${p.name}"؟`)) return;
    // Snapshot before delete so Undo can restore
    const snapshot = { ...p };
    deleteProduct(p.id);
    router.push("/app/products");
    toastWithAction(
      `تم حذف "${snapshot.name}"`,
      {
        label: "تراجع",
        onClick: () => {
          addProduct(snapshot);
          toast("تم استرجاع المنتج", "success");
        },
      },
      { type: "warn", duration: 6000 }
    );
  };

  return (
    <Screen>
      <TopBar
        title={p.name}
        trailing={
          <IconButton
            name="edit"
            size={20}
            onClick={() => router.push(`/app/products/${p.id}/edit`)}
            label="تعديل"
            className="text-primary"
          />
        }
      />

      {/* Hero */}
      <div className="px-4 pb-3.5">
        <Card className="p-[18px]">
          <div className="relative h-[150px] bg-surface2 dark:bg-surface2-dark rounded-tj flex items-center justify-center mb-3.5">
            <Ico name="camera" size={32} className="text-muted dark:text-muted-dark" sw={1.2} />
            {!isActive && (
              <span
                className="absolute top-2 text-[10px] font-bold px-2 py-[3px] rounded-tj bg-surface dark:bg-surface-dark text-muted dark:text-muted-dark border border-divider dark:border-divider-dark"
                style={{ insetInlineStart: 8 }}
              >
                غير نشط
              </span>
            )}
            {outOfStock && (
              <span
                className="absolute top-2 text-[10px] font-bold px-2 py-[3px] rounded-tj bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
                style={{ insetInlineEnd: 8 }}
              >
                نفذ من المخزون
              </span>
            )}
          </div>
          <div className="text-base font-bold text-text dark:text-text-dark">{p.name}</div>
          <Row className="gap-1.5 mt-1">
            <span className="text-[10px] px-[7px] py-0.5 rounded-tj bg-surface2 dark:bg-surface2-dark text-subtext dark:text-subtext-dark font-semibold">
              {p.category}
            </span>
            <span className="text-xs text-subtext dark:text-subtext-dark">·</span>
            <span className="text-[11px] text-subtext dark:text-subtext-dark">
              SKU <Num size={11} className="text-subtext dark:text-subtext-dark" weight={600}>{p.sku}</Num>
            </span>
          </Row>
          {p.description && (
            <div className="text-xs text-subtext dark:text-subtext-dark mt-2.5 leading-relaxed">{p.description}</div>
          )}
        </Card>
      </div>

      {/* Price / Cost / Margin */}
      <div className="px-4 pb-3.5">
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark tracking-wide font-semibold">السعر</div>
            <div className="mt-1.5">
              <Shekel amt={p.price} size={15} className="text-text dark:text-text-dark" weight={700} />
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark tracking-wide font-semibold">التكلفة</div>
            <div className="mt-1.5">
              <Shekel amt={p.cost} size={15} className="text-subtext dark:text-subtext-dark" weight={700} />
            </div>
          </Card>
          <Card className="p-3 bg-success-soft dark:bg-success-soft-dark border-success dark:border-success-dark">
            <div className="text-[10px] text-success dark:text-success-dark tracking-wide font-semibold">الهامش</div>
            <div className="mt-1.5">
              <Num size={15} className="text-success dark:text-success-dark" weight={700}>{margin}%</Num>
            </div>
          </Card>
        </div>
      </div>

      {/* Stock */}
      <div className="px-4 pb-3.5">
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wide font-semibold mb-2">
          المخزون
        </div>
        <Card>
          <Row className="px-3.5 py-3 justify-between border-b border-divider dark:border-divider-dark">
            <div>
              <div className="text-[13px] text-text dark:text-text-dark font-semibold">الكمية الحالية</div>
              <div
                className={`text-[11px] mt-0.5 ${
                  outOfStock
                    ? "text-danger dark:text-danger-dark font-bold"
                    : lowStock
                    ? "text-warning dark:text-warning-dark font-bold"
                    : "text-muted dark:text-muted-dark font-medium"
                }`}
              >
                {outOfStock ? "نفذ! أعيدي الطلب" : lowStock ? "مخزون منخفض" : "ضمن المستوى الطبيعي"}
              </div>
            </div>
            <Num
              size={22}
              className={
                outOfStock
                  ? "text-danger dark:text-danger-dark"
                  : lowStock
                  ? "text-warning dark:text-warning-dark"
                  : "text-text dark:text-text-dark"
              }
              weight={700}
            >
              {p.stock}
            </Num>
          </Row>
          <Row className="px-3.5 py-3 justify-between border-b border-divider dark:border-divider-dark">
            <div className="text-[13px] text-subtext dark:text-subtext-dark font-medium">تنبيه عند</div>
            <Num size={13} className="text-text dark:text-text-dark" weight={600}>{threshold}</Num>
          </Row>
          <Row className="px-3.5 py-3 justify-between">
            <div>
              <div className="text-[13px] text-text dark:text-text-dark font-semibold">الحالة</div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                {isActive ? "يظهر في البيع" : "مخفي من البيع"}
              </div>
            </div>
            <Toggle on={isActive} onChange={toggleActive} />
          </Row>
        </Card>
      </div>

      {/* Sell stats */}
      <div className="px-4 pb-3.5">
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wide font-semibold mb-2">
          إحصائيات البيع
        </div>
        <Card>
          <Row className="px-3.5 py-3 justify-between border-b border-divider dark:border-divider-dark">
            <span className="text-xs text-subtext dark:text-subtext-dark font-medium">باع هذا الشهر</span>
            <Num size={14} className="text-text dark:text-text-dark" weight={700}>{stats.soldQty}</Num>
          </Row>
          <Row className="px-3.5 py-3 justify-between border-b border-divider dark:border-divider-dark">
            <span className="text-xs text-subtext dark:text-subtext-dark font-medium">الإيرادات</span>
            <Shekel amt={stats.revenue} size={13} className="text-text dark:text-text-dark" weight={700} />
          </Row>
          <Row className="px-3.5 py-3 justify-between">
            <span className="text-xs text-subtext dark:text-subtext-dark font-medium">الربح الصافي</span>
            <Shekel amt={stats.profit} size={13} className="text-success dark:text-success-dark" weight={700} />
          </Row>
        </Card>
      </div>

      <BottomBar className="flex gap-2.5">
        <Btn ghost fullWidth onClick={() => router.push(`/app/products/${p.id}/edit`)}>
          <Ico name="edit" size={15} sw={1.8} />
          تعديل
        </Btn>
        <Btn danger fullWidth onClick={remove}>
          <Ico name="trash" size={15} sw={1.8} />
          حذف
        </Btn>
      </BottomBar>
    </Screen>
  );
}

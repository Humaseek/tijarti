"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Screen, Card, Row, BottomBar } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Btn, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

export default function NewSale() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    state,
    findCustomer,
    findProduct,
    draftTotal,
    startDraft,
    clearDraft,
    updateDraftItemQty,
    removeDraftItem,
  } = useStore();

  // Auto-start a draft on mount if none exists.
  useEffect(() => {
    if (!state.draft) startDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draft = state.draft;
  const customer = draft?.customerId ? findCustomer(draft.customerId) : null;
  const total = draftTotal();
  const canContinue = !!customer && !!draft && draft.items.length > 0;

  const cancel = () => {
    clearDraft();
    router.push("/app");
  };

  return (
    <Screen>
      <TopBar
        title="فاتورة جديدة"
        noBack
        leading={
          <IconButton name="close" onClick={cancel} size={22} label="إلغاء" />
        }
      />

      <div className="px-4 pb-4 flex-1">
        {/* Customer card */}
        <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">
          الزبونة
        </div>
        <Card
          onClick={() => router.push("/app/sales/new/pick-customer")}
          className="p-3.5 mb-4 flex items-center gap-3"
        >
          {customer ? (
            <>
              <Avatar name={customer.name} initial={customer.initial} size={38} bg={customer.avatar_color || undefined} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-text dark:text-text-dark">{customer.name}</div>
                <div className="text-[11px] text-muted dark:text-muted-dark tj-num" dir="ltr">{customer.phone}</div>
              </div>
              <span className="text-[10px] text-primary font-bold tj-btn">تبديل</span>
            </>
          ) : (
            <>
              <div className="w-[38px] h-[38px] rounded-full bg-surface2 dark:bg-surface2-dark flex items-center justify-center text-subtext dark:text-subtext-dark">
                <Ico name="users" size={18} sw={1.6} />
              </div>
              <div className="flex-1 text-sm font-semibold text-subtext dark:text-subtext-dark">اختاري زبونة ←</div>
              <Ico name="chev" size={14} className="text-muted dark:text-muted-dark" style={{ transform: "scaleX(-1)" }} />
            </>
          )}
        </Card>

        {/* Items */}
        <Row className="justify-between mb-2">
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
            المنتجات {draft && draft.items.length > 0 && <Num size={11} className="text-subtext dark:text-subtext-dark" weight={700}>{`(${draft.items.length})`}</Num>}
          </div>
          <span
            onClick={() => router.push("/app/sales/new/pick-product")}
            className="text-xs text-primary font-bold tj-btn flex items-center gap-1"
          >
            <Ico name="plus" size={12} sw={2.4} />
            إضافة
          </span>
        </Row>

        {draft && draft.items.length > 0 ? (
          <Card>
            {draft.items.map((it, i, arr) => {
              const p = findProduct(it.pid);
              return (
                <Row
                  key={it.pid}
                  className={`px-3.5 py-3 gap-3 ${
                    i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text dark:text-text-dark">{p?.name}</div>
                    <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                      <Shekel amt={it.price} size={10} className="text-muted dark:text-muted-dark" weight={500} /> × <Num size={10} className="text-muted dark:text-muted-dark" weight={500}>{it.qty}</Num>
                    </div>
                  </div>
                  <Row className="gap-2.5">
                    <button
                      onClick={() => updateDraftItemQty(it.pid, it.qty - 1)}
                      className="tj-btn w-7 h-7 rounded-full bg-surface2 dark:bg-surface2-dark flex items-center justify-center text-text dark:text-text-dark"
                      aria-label="إنقاص"
                    >
                      <Ico name="minus" size={12} sw={2.4} />
                    </button>
                    <Num size={14} className="text-text dark:text-text-dark w-6 text-center" weight={700}>{it.qty}</Num>
                    <button
                      onClick={() => updateDraftItemQty(it.pid, it.qty + 1)}
                      className="tj-btn w-7 h-7 rounded-full bg-primary-soft flex items-center justify-center text-primary"
                      aria-label="زيادة"
                    >
                      <Ico name="plus" size={12} sw={2.4} />
                    </button>
                  </Row>
                  <Shekel amt={it.qty * it.price} size={13} className="text-text dark:text-text-dark w-20 text-end" weight={700} />
                  <button
                    onClick={() => removeDraftItem(it.pid)}
                    className="tj-btn text-muted dark:text-muted-dark"
                    aria-label="حذف"
                  >
                    <Ico name="trash" size={15} sw={1.6} />
                  </button>
                </Row>
              );
            })}
          </Card>
        ) : (
          <Card
            onClick={() => router.push("/app/sales/new/pick-product")}
            className="p-8 text-center"
          >
            <Ico name="box" size={36} className="text-muted dark:text-muted-dark mx-auto mb-2" sw={1.4} />
            <div className="text-xs text-subtext dark:text-subtext-dark font-semibold">
              ما زلت ما أضفت منتج
            </div>
            <div className="text-[10px] text-muted dark:text-muted-dark mt-1">اضغطي هنا لإضافة أول منتج</div>
          </Card>
        )}

        {/* Total */}
        {draft && draft.items.length > 0 && (
          <Card className="p-3.5 mt-4 border-s-[3px] border-s-success dark:border-s-success-dark">
            <Row className="justify-between">
              <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
                الإجمالي
              </div>
              <Shekel amt={total} size={22} className="text-text dark:text-text-dark" weight={700} />
            </Row>
          </Card>
        )}
      </div>

      <BottomBar>
        <Btn
          primary
          fullWidth
          disabled={!canContinue}
          onClick={() => {
            if (!canContinue) {
              toast("اختاري زبونة وأضيفي منتج واحد على الأقل", "warn");
              return;
            }
            router.push("/app/sales/new/payment");
          }}
        >
          متابعة للدفع
          <Ico name="chev" size={14} sw={2.4} style={{ transform: "scaleX(-1)" }} />
        </Btn>
      </BottomBar>
    </Screen>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";

export default function SuppliersList() {
  const router = useRouter();
  const { state, supplierStats } = useStore();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const query = q.trim();
    return state.suppliers
      .filter((s) => s.is_active)
      .filter((s) => !query || s.name.includes(query))
      .map((s) => ({ supplier: s, stats: supplierStats(s.id) }))
      .sort((a, b) => b.stats.outstanding - a.stats.outstanding);
  }, [state.suppliers, q, supplierStats]);

  const totals = useMemo(() => {
    const paid = rows.reduce((s, r) => s + r.stats.totalPaid, 0);
    const outstanding = rows.reduce((s, r) => s + r.stats.outstanding, 0);
    return { paid, outstanding };
  }, [rows]);

  return (
    <Screen>
      <TopBar
        title="الموردين"
        noBack
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => router.push("/app/suppliers/new")}
            label="مورد جديد"
            className="text-primary"
          />
        }
      />

      {/* Totals */}
      <div className="px-4 pb-3.5">
        <Card className="p-4">
          <Row className="justify-between">
            <div className="flex-1">
              <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
                إجمالي المدفوع
              </div>
              <div className="mt-1">
                <Shekel amt={totals.paid} size={18} className="text-success dark:text-success-dark" weight={700} />
              </div>
            </div>
            <div className="w-px self-stretch bg-divider dark:bg-divider-dark mx-2" />
            <div className="flex-1">
              <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
                مستحق عليكِ
              </div>
              <div className="mt-1">
                <Shekel amt={totals.outstanding} size={18} className="text-warning dark:text-warning-dark" weight={700} />
              </div>
            </div>
          </Row>
          <Row className="gap-2.5 mt-3 text-[11px] text-muted dark:text-muted-dark">
            <Num size={11} className="text-muted dark:text-muted-dark" weight={600}>
              {state.suppliers.filter((s) => s.is_active).length}
            </Num>
            <span>مورد نشط</span>
          </Row>
        </Card>
      </div>

      {/* Search */}
      {state.suppliers.length > 0 && (
        <div className="px-4 pb-2.5">
          <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2.5 gap-2">
            <Ico name="search" size={16} className="text-muted dark:text-muted-dark" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحثي باسم المورد..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-text dark:text-text-dark font-ar"
              dir="rtl"
            />
          </Row>
        </div>
      )}

      <div className="px-4 flex-1 overflow-auto">
        {state.suppliers.length === 0 ? (
          <Empty
            icon="store"
            title="لا موردين بعد"
            sub="سجّلي المورّدين اللي بتشتري منهم — وبنتبّع لكِ المصاريف والشيكات الصادرة تلقائياً"
            actions={[{ label: "+ مورّد جديد", href: "/app/suppliers/new", primary: true }]}
          />
        ) : rows.length === 0 ? (
          <Empty icon="search" title="لا مورد مطابق" sub="جرّبي كلمة ثانية" />
        ) : (
          <Card>
            {rows.map(({ supplier: s, stats }, i, arr) => (
              <Link
                key={s.id}
                href={`/app/suppliers/${s.id}`}
                className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${
                  i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                }`}
              >
                <Avatar name={s.name} initial={s.initial} size={40} bg={s.avatar_color || undefined} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text dark:text-text-dark truncate">{s.name}</div>
                  <Row className="gap-1.5 mt-0.5 text-[10px] text-muted dark:text-muted-dark">
                    <Num size={10} className="text-muted dark:text-muted-dark" weight={500}>{stats.invoiceCount}</Num>
                    <span>فاتورة</span>
                    {s.default_category && (
                      <>
                        <span>·</span>
                        <span>{s.default_category}</span>
                      </>
                    )}
                  </Row>
                </div>
                <div className="text-end">
                  <Shekel amt={stats.totalPaid} size={13} className="text-text dark:text-text-dark" weight={700} />
                  {stats.outstanding > 0 && (
                    <div className="text-[9px] mt-0.5 bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark font-bold px-1.5 py-0.5 rounded-tj inline-block">
                      مستحق {stats.outstanding.toLocaleString()} ₪
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

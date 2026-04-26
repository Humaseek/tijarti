"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Chip, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/store/types";
import { catMeta } from "@/lib/expenses";

type Filter = "الكل" | ExpenseCategory;

// Rough previous-month baseline for comparison display (mock — in real life
// this is computed from last month's expenses in the DB).
const LAST_MONTH_MOCK = 8640;

export default function ExpensesList() {
  const router = useRouter();
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("الكل");

  const monthTotal = state.expenses.reduce((s, e) => s + e.amount, 0);
  const diff = monthTotal - LAST_MONTH_MOCK;
  const diffPct = LAST_MONTH_MOCK > 0 ? Math.round((diff / LAST_MONTH_MOCK) * 100) : 0;

  const list = useMemo(() => {
    const query = q.trim();
    return state.expenses.filter((e) => {
      if (filter !== "الكل" && e.category !== filter) return false;
      if (query && !`${e.description} ${e.category}`.includes(query)) return false;
      return true;
    });
  }, [state.expenses, q, filter]);

  return (
    <Screen>
      <TopBar
        title="المصاريف"
        noBack
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => router.push("/app/expenses/new")}
            label="مصروف جديد"
            className="text-primary"
          />
        }
      />

      {/* Quick actions: scan receipt + recurring */}
      <div className="px-4 pb-2.5 grid grid-cols-2 gap-2">
        <Link
          href="/app/expenses/scan"
          className="tj-tap flex items-center gap-2 p-3 rounded-tj bg-primary text-white"
        >
          <div className="w-9 h-9 rounded-tj bg-white/20 flex items-center justify-center flex-shrink-0">
            <Ico name="receipt" size={16} className="text-white" sw={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold">📷 صوّري فاتورة</div>
            <div className="text-[9px] opacity-80 truncate">كاميرا أو PDF</div>
          </div>
        </Link>
        <Link
          href="/app/expenses/recurring"
          className="tj-tap flex items-center gap-2 p-3 rounded-tj bg-primary-soft"
        >
          <div className="w-9 h-9 rounded-tj bg-surface dark:bg-surface-dark flex items-center justify-center flex-shrink-0">
            <Ico name="calendar" size={16} className="text-primary" sw={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-primary">ثابتة شهرية</div>
            <div className="text-[9px] text-subtext dark:text-subtext-dark truncate">إيجار، رواتب...</div>
          </div>
          <Ico name="chev" size={13} className="text-primary" style={{ transform: "scaleX(-1)" }} />
        </Link>
      </div>

      {/* Summary */}
      <div className="px-4 pb-3.5">
        <Card className="p-[18px] border-s-[3px] border-s-warning dark:border-s-warning-dark">
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
            مصاريف الشهر
          </div>
          <div className="mt-1.5">
            <Shekel amt={monthTotal} size={28} className="text-text dark:text-text-dark" weight={700} />
          </div>
          <Row className="mt-2.5 gap-1.5 items-center flex-wrap">
            <span
              className={`text-[10px] font-bold px-[7px] py-[3px] rounded-tj ${
                diff > 0
                  ? "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
                  : "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
              }`}
            >
              {diff > 0 ? "▲" : "▼"}{" "}
              <Num
                size={10}
                className={diff > 0 ? "text-danger dark:text-danger-dark" : "text-success dark:text-success-dark"}
                weight={700}
              >
                {Math.abs(diffPct)}%
              </Num>
            </span>
            <span className="text-[11px] text-subtext dark:text-subtext-dark">
              مقارنة بالشهر السابق (<Shekel amt={LAST_MONTH_MOCK} size={11} className="text-subtext dark:text-subtext-dark" weight={500} />)
            </span>
          </Row>
        </Card>
      </div>

      {/* Search */}
      <div className="px-4 pb-2.5">
        <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2.5 gap-2">
          <Ico name="search" size={16} className="text-muted dark:text-muted-dark" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحثي في المصاريف..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-text dark:text-text-dark font-ar"
            dir="rtl"
          />
        </Row>
      </div>

      {/* Category chips */}
      <div className="px-4 pb-3.5">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["الكل", ...EXPENSE_CATEGORIES] as Filter[]).map((c) => (
            <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 flex-1 overflow-auto">
        {list.length === 0 ? (
          state.expenses.length === 0 ? (
            <Empty
              icon="card"
              title="لا مصاريف مسجّلة"
              sub="سجّلي كل مصاريفك — بدون هالمعلومة ما في طريقة نحسب صافي ربحك الحقيقي"
              tip="صوّري فاتورة المصروف وخلّي OCR يقرأها تلقائياً"
              actions={[{ label: "+ مصروف جديد", href: "/app/expenses/new", primary: true }]}
            />
          ) : (
            <Empty icon="money" title="لا مصاريف مطابقة" sub="جرّبي فلتر أو كلمة ثانية" />
          )
        ) : (
          <Card>
            {list.map((e, i, arr) => {
              const meta = catMeta(e.category);
              return (
                <Link
                  key={e.id}
                  href={`/app/expenses/${e.id}`}
                  className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${
                    i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  }`}
                >
                  <div className={`w-9 h-9 rounded-tj flex items-center justify-center flex-shrink-0 ${meta.soft}`}>
                    <Ico name={meta.icon} size={17} className={meta.tint} sw={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text dark:text-text-dark truncate">
                      {e.description || e.category}
                    </div>
                    <Row className="gap-1.5 mt-0.5 text-[10px]">
                      <span className={`${meta.tint} font-semibold`}>{e.category}</span>
                      <span className="text-muted dark:text-muted-dark">·</span>
                      <span className="text-muted dark:text-muted-dark">{e.expense_date}</span>
                    </Row>
                  </div>
                  <Shekel amt={e.amount} size={14} className="text-text dark:text-text-dark" weight={700} />
                </Link>
              );
            })}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

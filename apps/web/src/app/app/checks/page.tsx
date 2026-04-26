"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Chip, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { daysUntil, formatArDateShort, relativeDue } from "@/lib/dates";
import type { Check, CheckDirection, CheckStatus } from "@/lib/store/types";

type Tab = "incoming" | "outgoing";
type Filter = "upcoming" | "overdue" | "cashed" | "all";

export default function ChecksHub() {
  const router = useRouter();
  const { state, cashFlow, overdueAmounts } = useStore();
  const [tab, setTab] = useState<Tab>("incoming");
  const [filter, setFilter] = useState<Filter>("upcoming");

  const cf7 = cashFlow(7);
  const cf30 = cashFlow(30);
  const overdue = overdueAmounts();

  const list = useMemo<Check[]>(() => {
    const direction: CheckDirection = tab;
    return state.checks
      .filter((c) => c.direction === direction)
      .filter((c) => {
        if (filter === "all") return true;
        if (filter === "cashed") return c.status === "cashed";
        if (filter === "overdue") return c.status === "pending" && daysUntil(c.due_date) < 0;
        // upcoming = pending that's today or future
        return c.status === "pending" && daysUntil(c.due_date) >= 0;
      })
      .sort((a, b) => {
        // Sort upcoming ascending, overdue ascending (most overdue first)
        if (a.status === "pending" && b.status === "pending") {
          return a.due_date.localeCompare(b.due_date);
        }
        return b.created_at.localeCompare(a.created_at);
      });
  }, [state.checks, tab, filter]);

  return (
    <Screen>
      <TopBar
        title="الشيكات"
        noBack
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => router.push("/app/checks/new")}
            label="شيك جديد"
            className="text-primary"
          />
        }
      />

      {/* Cash flow projection — the star of the show */}
      <div className="px-4 pb-3.5">
        <Card
          className="p-[16px]"
          style={{
            borderInlineStartWidth: 3,
            borderInlineStartColor: cf7.net >= 0 ? "rgb(15 110 86)" : "rgb(163 45 45)",
          }}
        >
          <Row className="justify-between mb-2.5">
            <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
              التدفق النقدي — 7 أيام
            </div>
            <span
              className={`text-[10px] px-2 py-[3px] rounded-tj font-bold ${
                cf7.net >= 0
                  ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
                  : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
              }`}
            >
              {cf7.net >= 0 ? "✓ إيجابي" : "⚠ عجز"}
            </span>
          </Row>

          <div className="grid grid-cols-3 gap-2.5 mb-2.5">
            <CashCol
              label="داخل"
              value={cf7.incoming}
              count={cf7.incomingCount}
              tintCls="text-success dark:text-success-dark"
              arrow="↓"
            />
            <CashCol
              label="خارج"
              value={cf7.outgoing}
              count={cf7.outgoingCount}
              tintCls="text-danger dark:text-danger-dark"
              arrow="↑"
            />
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark font-medium mb-1">صافي</div>
              <Shekel
                amt={Math.abs(cf7.net)}
                size={14}
                className={cf7.net >= 0 ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}
                weight={700}
              />
              <div className="text-[9px] text-muted dark:text-muted-dark mt-0.5 tj-num" dir="ltr">
                {cf7.net >= 0 ? "+" : "−"}
              </div>
            </div>
          </div>

          {/* 30-day outlook — compact */}
          <div className="pt-2.5 border-t border-divider dark:border-divider-dark">
            <Row className="justify-between">
              <span className="text-[11px] text-subtext dark:text-subtext-dark">توقّع 30 يوم</span>
              <Row className="gap-2 items-baseline">
                <span className={`text-[10px] font-semibold ${cf30.net >= 0 ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}`}>
                  صافي
                </span>
                <Shekel
                  amt={cf30.net}
                  size={12}
                  className={cf30.net >= 0 ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}
                  weight={700}
                />
              </Row>
            </Row>
          </div>
        </Card>
      </div>

      {/* Overdue alert — very important for Arab-Israeli SMBs */}
      {(overdue.incoming > 0 || overdue.outgoing > 0) && (
        <div className="px-4 pb-3.5">
          <Card className="p-3 bg-warning-soft dark:bg-warning-soft-dark border border-warning dark:border-warning-dark">
            <Row className="gap-2 items-start">
              <Ico name="warn" size={16} className="text-warning dark:text-warning-dark flex-shrink-0 mt-0.5" sw={1.8} />
              <div className="flex-1 text-[11px] text-text dark:text-text-dark leading-relaxed">
                <span className="font-bold">شيكات متأخّرة!</span>{" "}
                {overdue.incoming > 0 && (
                  <>
                    عليكِ تحصيل{" "}
                    <Shekel amt={overdue.incoming} size={11} className="text-success dark:text-success-dark" weight={700} />
                    {" "}(<Num size={11} className="text-subtext dark:text-subtext-dark" weight={600}>{overdue.incomingCount}</Num> شيكات)
                    {overdue.outgoing > 0 && " · "}
                  </>
                )}
                {overdue.outgoing > 0 && (
                  <>
                    لم تصرف{" "}
                    <Shekel amt={overdue.outgoing} size={11} className="text-danger dark:text-danger-dark" weight={700} />
                    {" "}(<Num size={11} className="text-subtext dark:text-subtext-dark" weight={600}>{overdue.outgoingCount}</Num>)
                  </>
                )}
              </div>
            </Row>
          </Card>
        </div>
      )}

      {/* Direction tabs */}
      <div className="px-4 pb-2.5">
        <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-0.5">
          {(["incoming", "outgoing"] as Tab[]).map((t) => {
            const active = tab === t;
            const label = t === "incoming" ? "واردة (فايتة)" : "صادرة (طالعة)";
            return (
              <div
                key={t}
                onClick={() => setTab(t)}
                className={`tj-btn flex-1 py-2 text-center text-[13px] rounded-tj ${
                  active
                    ? "bg-primary text-white dark:text-bg-dark font-bold"
                    : "text-text dark:text-text-dark font-medium"
                }`}
                role="tab"
                tabIndex={0}
              >
                {label}
              </div>
            );
          })}
        </Row>
      </div>

      {/* Status filters */}
      <div className="px-4 pb-3">
        <Row className="gap-1.5 overflow-x-auto">
          {(["upcoming", "overdue", "cashed", "all"] as Filter[]).map((f) => {
            const label =
              f === "upcoming" ? "قادمة"
              : f === "overdue" ? "متأخّرة"
              : f === "cashed" ? "مُحصّلة"
              : "الكل";
            return (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {label}
              </Chip>
            );
          })}
        </Row>
      </div>

      {/* List */}
      <div className="px-4 flex-1 overflow-auto">
        {list.length === 0 ? (
          state.checks.length === 0 ? (
            <Empty
              icon="receipt"
              title="لا شيكات مسجّلة"
              sub="سجّلي الشيكات الواردة والصادرة — وبننبّهك قبل الاستحقاق حتى لا يرتد أي شيك"
              tip="الشيك المرتجع يضر بالسمعة التجارية — التنبيه المبكر بيحميكِ"
              actions={[{ label: "+ شيك جديد", href: "/app/checks/new", primary: true }]}
            />
          ) : (
            <Empty icon="receipt" title="لا شيكات هنا" sub="جرّبي فلتر مختلف" />
          )
        ) : (
          <Card>
            {list.map((c, i, arr) => (
              <CheckRow key={c.id} check={c} last={i === arr.length - 1} />
            ))}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

function CashCol({
  label,
  value,
  count,
  tintCls,
  arrow,
}: {
  label: string;
  value: number;
  count: number;
  tintCls: string;
  arrow: string;
}) {
  return (
    <div>
      <div className="text-[10px] text-muted dark:text-muted-dark font-medium mb-1">
        {label} <span className={`tj-num ${tintCls}`}>{arrow}</span>
      </div>
      <Shekel amt={value} size={14} className={tintCls} weight={700} />
      <div className="text-[9px] text-muted dark:text-muted-dark mt-0.5">
        <Num size={9} className="text-muted dark:text-muted-dark" weight={600}>{count}</Num> شيك
      </div>
    </div>
  );
}

function CheckRow({ check, last }: { check: Check; last: boolean }) {
  const d = check.status === "pending" ? daysUntil(check.due_date) : 0;
  const overdue = check.status === "pending" && d < 0;
  const dueToday = check.status === "pending" && d === 0;
  const bounced = check.status === "bounced";
  const cashed = check.status === "cashed";

  const statusCls = bounced
    ? "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
    : cashed
    ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
    : overdue
    ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
    : dueToday
    ? "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark"
    : "bg-surface2 dark:bg-surface2-dark text-subtext dark:text-subtext-dark";

  const statusLabel = bounced
    ? "مرتجع"
    : cashed
    ? "مُحصّل"
    : overdue
    ? `متأخر ${Math.abs(d)} يوم`
    : dueToday
    ? "اليوم"
    : relativeDue(check.due_date);

  const amtColor =
    check.direction === "incoming"
      ? "text-success dark:text-success-dark"
      : "text-danger dark:text-danger-dark";

  return (
    <Link
      href={`/app/checks/${check.id}`}
      className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${
        last ? "" : "border-b border-divider dark:border-divider-dark"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-tj flex items-center justify-center flex-shrink-0 ${
          check.direction === "incoming"
            ? "bg-success-soft dark:bg-success-soft-dark"
            : "bg-danger-soft dark:bg-danger-soft-dark"
        }`}
      >
        <Ico
          name="trendUp"
          size={16}
          className={amtColor}
          style={{ transform: check.direction === "outgoing" ? "scaleY(-1)" : "none" }}
          sw={1.8}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-text dark:text-text-dark truncate">
          {check.party_name}
        </div>
        <Row className="gap-1.5 mt-0.5 text-[10px] text-muted dark:text-muted-dark">
          <span>
            #<Num size={10} className="text-muted dark:text-muted-dark" weight={600}>{check.number}</Num>
          </span>
          <span>·</span>
          <span>{formatArDateShort(check.due_date)}</span>
          {check.bank && (
            <>
              <span>·</span>
              <span>{check.bank}</span>
            </>
          )}
        </Row>
      </div>
      <div className="text-end">
        <Shekel
          amt={check.amount}
          size={13}
          className={bounced || cashed ? "text-subtext dark:text-subtext-dark" : amtColor}
          weight={700}
        />
        <div className={`text-[9px] font-bold px-[7px] py-0.5 rounded-tj mt-0.5 inline-block ${statusCls}`}>
          {statusLabel}
        </div>
      </div>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import type { DebtDirection, DebtStatus } from "@/lib/store/types";
import { formatArDateShort, relativeDue, daysUntil } from "@/lib/dates";

type DirFilter = "all" | DebtDirection;
type StatusFilter = "all" | DebtStatus;

export default function DebtsList() {
  const router = useRouter();
  const { state } = useStore();
  const [dirF, setDirF] = useState<DirFilter>("all");
  const [statusF, setStatusF] = useState<StatusFilter>("pending");

  const rows = useMemo(() => {
    return state.debts
      .filter((d) => {
        if (dirF !== "all" && d.direction !== dirF) return false;
        if (statusF !== "all" && d.status !== statusF) return false;
        return true;
      })
      .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
  }, [state.debts, dirF, statusF]);

  const totals = useMemo(() => {
    const pendingIn = state.debts.filter((d) => d.status === "pending" && d.direction === "incoming").reduce((s, d) => s + d.amount, 0);
    const pendingOut = state.debts.filter((d) => d.status === "pending" && d.direction === "outgoing").reduce((s, d) => s + d.amount, 0);
    return { pendingIn, pendingOut, net: pendingIn - pendingOut };
  }, [state.debts]);

  return (
    <Screen>
      <TopBar
        title="على الحساب"
        noBack
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => router.push("/app/debts/new?direction=incoming")}
            label="دَين جديد"
            className="text-primary"
          />
        }
      />

      {/* Summary */}
      <div className="px-4 pb-3.5">
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">عليهن (لكِ)</div>
              <Shekel amt={totals.pendingIn} size={14} className="text-success dark:text-success-dark" weight={700} />
            </div>
            <div className="border-s border-divider dark:border-divider-dark border-e">
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">عليكِ</div>
              <Shekel amt={totals.pendingOut} size={14} className="text-danger dark:text-danger-dark" weight={700} />
            </div>
            <div>
              <div className="text-[10px] text-muted dark:text-muted-dark mb-1">الصافي</div>
              <Shekel
                amt={Math.abs(totals.net)}
                size={14}
                className={totals.net >= 0 ? "text-success dark:text-success-dark" : "text-warning dark:text-warning-dark"}
                weight={700}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="px-4 pb-2.5">
        <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-0.5 mb-2">
          {(["all", "incoming", "outgoing"] as DirFilter[]).map((d) => {
            const label = d === "all" ? "الكل" : d === "incoming" ? "عليهن" : "عليّ";
            const active = dirF === d;
            return (
              <div
                key={d}
                onClick={() => setDirF(d)}
                role="tab"
                tabIndex={0}
                className={`tj-btn flex-1 py-1.5 text-center text-[12px] rounded-tj ${
                  active ? "bg-primary text-white dark:text-bg-dark font-bold" : "text-text dark:text-text-dark font-medium"
                }`}
              >
                {label}
              </div>
            );
          })}
        </Row>
        <Row className="gap-1.5 overflow-x-auto pb-1">
          {(["pending", "settled", "all"] as StatusFilter[]).map((s) => {
            const label = s === "pending" ? "قيد" : s === "settled" ? "مسدّد" : "الكل";
            const active = statusF === s;
            return (
              <div
                key={s}
                onClick={() => setStatusF(s)}
                role="tab"
                tabIndex={0}
                className={`tj-btn whitespace-nowrap px-3 py-1.5 text-[11px] rounded-tj border ${
                  active
                    ? "bg-primary text-white dark:text-bg-dark border-transparent font-bold"
                    : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark"
                }`}
              >
                {label}
              </div>
            );
          })}
        </Row>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {rows.length === 0 ? (
          state.debts.length === 0 ? (
            <Empty
              icon="money"
              title="لا ذمم على الحساب"
              sub="سجّلي الذمم (ما لك أو ما عليك للناس) — وتابعي التحصيل والسداد بشكل واضح"
              actions={[{ label: "+ ذمّة جديدة", href: "/app/debts/new", primary: true }]}
            />
          ) : (
            <Empty icon="money" title="لا ذمم مطابقة" sub="جرّبي فلتر مختلف" />
          )
        ) : (
          <Card>
            {rows.map((d, i, arr) => {
              const overdue = d.status === "pending" && d.due_date && daysUntil(d.due_date) < 0;
              return (
                <Link
                  key={d.id}
                  href={`/app/debts/${d.id}`}
                  className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-tj flex items-center justify-center flex-shrink-0 ${
                    d.direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark" : "bg-danger-soft dark:bg-danger-soft-dark"
                  }`}>
                    <Ico name="money" size={16} className={d.direction === "incoming" ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"} sw={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Row className="gap-1.5">
                      <div className="text-[13px] font-bold text-text dark:text-text-dark truncate">{d.party_name}</div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-tj flex-shrink-0 ${
                        d.direction === "incoming" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
                      }`}>
                        {d.direction === "incoming" ? "عليهن" : "عليّ"}
                      </span>
                    </Row>
                    <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5 truncate">{d.description}</div>
                    {d.status === "pending" && d.due_date && (
                      <div className={`text-[9px] mt-0.5 ${overdue ? "text-warning dark:text-warning-dark font-bold" : "text-muted dark:text-muted-dark"}`}>
                        {formatArDateShort(d.due_date)} · {relativeDue(d.due_date)}
                      </div>
                    )}
                  </div>
                  <div className="text-end">
                    <Shekel amt={d.amount} size={13} className={
                      d.status === "settled" ? "text-subtext dark:text-subtext-dark line-through"
                      : d.direction === "incoming" ? "text-success dark:text-success-dark"
                      : "text-danger dark:text-danger-dark"
                    } weight={700} />
                    {d.status === "settled" && (
                      <div className="text-[9px] font-bold text-success dark:text-success-dark mt-0.5">✓ مسدّد</div>
                    )}
                  </div>
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

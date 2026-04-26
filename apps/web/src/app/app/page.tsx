"use client";

/**
 * Mobile home — data-entry first.
 *
 * The mobile experience is built around the FAB (the central + button)
 * which logs every transaction in 3 taps. The home page only needs to:
 *   1. Greet the user + show notifications shortcut
 *   2. Show today's headline numbers (income vs expenses)
 *   3. Provide quick links to the four core entities
 *
 * Anything analytical (forecasts, liquidity, KPIs) lives on the desktop.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Screen, Card, Row } from "@/components/ui/layout";
import { Shekel, Num } from "@/components/ui/num";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { useDark } from "@/app/providers";
import { useStore } from "@/lib/store/store-context";
import { todayIso } from "@/lib/dates";

export default function Home() {
  const { dark, toggle } = useDark();
  const { state } = useStore();
  const router = useRouter();

  const stats = state.stats;
  const monthExpenses = state.expenses.reduce((s, e) => s + Math.max(0, e.amount), 0);
  const todayExpenses = state.expenses
    .filter((e) => e.expense_date === todayIso())
    .reduce((s, e) => s + Math.max(0, e.amount), 0);
  const unreadNotifs = state.appNotifications.filter((n) => !n.is_read).length;
  const pendingChecks = state.checks.filter((c) => c.status === "pending").length;

  return (
    <Screen>
      {/* Header */}
      <Row className="justify-between px-5 pt-1 pb-3.5">
        <div>
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider">
            أهلاً {state.userProfile.full_name?.split(" ")[0] || "—"}
          </div>
          <div className="text-lg font-bold text-text dark:text-text-dark mt-0.5">
            {state.storeSettings.store_name || "—"}
          </div>
        </div>
        <Row className="gap-3">
          <Link
            href="/app/notifications"
            className="tj-btn relative text-text dark:text-text-dark"
            aria-label="التنبيهات"
          >
            <Ico name="bell" size={22} />
            {unreadNotifs > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-lg bg-danger dark:bg-danger-dark text-white text-[9px] font-bold flex items-center justify-center tj-num">
                {unreadNotifs}
              </span>
            )}
          </Link>
          <div onClick={toggle} className="tj-btn text-text dark:text-text-dark" role="button" tabIndex={0}>
            <Ico name={dark ? "lightbulb" : "settings"} size={22} />
          </div>
        </Row>
      </Row>

      {/* Today snapshot — income vs expenses */}
      <div className="px-5 pb-3.5 grid grid-cols-2 gap-2.5">
        <Card className="p-3.5 border-s-[3px] border-s-success dark:border-s-success-dark">
          <div className="text-[10px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">دخل اليوم</div>
          <div className="mt-1.5">
            <Shekel amt={stats.todayRevenue} size={20} className="text-success dark:text-success-dark" weight={700} />
          </div>
        </Card>
        <Card className="p-3.5 border-s-[3px] border-s-danger dark:border-s-danger-dark">
          <div className="text-[10px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">مصروف اليوم</div>
          <div className="mt-1.5">
            <Shekel amt={todayExpenses} size={20} className="text-danger dark:text-danger-dark" weight={700} />
          </div>
        </Card>
      </div>

      {/* This-month summary */}
      <div className="px-5 pb-3.5">
        <Card className="p-4">
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold mb-2">هذا الشهر</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[9px] text-muted dark:text-muted-dark mb-1">دخل</div>
              <Shekel amt={stats.monthRevenue} size={14} className="text-success dark:text-success-dark" weight={700} />
            </div>
            <div>
              <div className="text-[9px] text-muted dark:text-muted-dark mb-1">مصاريف</div>
              <Shekel amt={monthExpenses} size={14} className="text-danger dark:text-danger-dark" weight={700} />
            </div>
            <div>
              <div className="text-[9px] text-muted dark:text-muted-dark mb-1">صافي</div>
              <Shekel
                amt={Math.max(0, stats.monthRevenue - monthExpenses)}
                size={14}
                className={stats.monthRevenue >= monthExpenses ? "text-success dark:text-success-dark" : "text-danger dark:text-danger-dark"}
                weight={700}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick tiles — the 4 entities */}
      <div className="px-5 pb-3.5">
        <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider pb-2">إدارة</div>
        <div className="grid grid-cols-2 gap-2.5">
          <Tile
            label="المبيعات"
            iconName="tag"
            tintCls="text-info dark:text-info-dark"
            softCls="bg-info-soft dark:bg-info-soft-dark"
            value={<Num size={16} className="text-text dark:text-text-dark" weight={700}>{state.invoices.length}</Num>}
            sub="فاتورة هذا الشهر"
            onClick={() => router.push("/app/invoices")}
          />
          <Tile
            label="المصاريف"
            iconName="card"
            tintCls="text-warning dark:text-warning-dark"
            softCls="bg-warning-soft dark:bg-warning-soft-dark"
            value={<Num size={16} className="text-text dark:text-text-dark" weight={700}>{state.expenses.length}</Num>}
            sub="مصروف مسجّل"
            onClick={() => router.push("/app/expenses")}
          />
          <Tile
            label="الزبائن"
            iconName="users"
            tintCls="text-primary"
            softCls="bg-primary-soft"
            value={<Num size={16} className="text-text dark:text-text-dark" weight={700}>{state.customers.length}</Num>}
            sub={`${state.customers.filter((c) => c.tag === "VIP").length} VIP`}
            onClick={() => router.push("/app/customers")}
          />
          <Tile
            label="المنتجات"
            iconName="box"
            tintCls="text-success dark:text-success-dark"
            softCls="bg-success-soft dark:bg-success-soft-dark"
            value={<Num size={16} className="text-text dark:text-text-dark" weight={700}>{state.products.length}</Num>}
            sub="منتج"
            onClick={() => router.push("/app/products")}
          />
        </div>
      </div>

      {/* Money-flow shortcuts */}
      {(pendingChecks > 0 || state.debts.filter((d) => d.status === "pending").length > 0) && (
        <div className="px-5 pb-4">
          <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider pb-2">قيد المتابعة</div>
          <Card>
            <Link href="/app/checks" className="flex items-center gap-3 px-3.5 py-3 border-b border-divider dark:border-divider-dark tj-tap">
              <div className="w-8 h-8 rounded-tj bg-warning-soft dark:bg-warning-soft-dark flex items-center justify-center">
                <Ico name="receipt" size={15} className="text-warning dark:text-warning-dark" />
              </div>
              <div className="flex-1 text-[12.5px] font-semibold text-text dark:text-text-dark">الشيكات</div>
              <span className="text-[11px] tj-num font-bold text-warning dark:text-warning-dark">{pendingChecks}</span>
              <Ico name="chev" size={12} className="text-muted dark:text-muted-dark" style={{ transform: "scaleX(-1)" }} />
            </Link>
            <Link href="/app/debts" className="flex items-center gap-3 px-3.5 py-3 tj-tap">
              <div className="w-8 h-8 rounded-tj bg-warning-soft dark:bg-warning-soft-dark flex items-center justify-center">
                <Ico name="money" size={15} className="text-warning dark:text-warning-dark" />
              </div>
              <div className="flex-1 text-[12.5px] font-semibold text-text dark:text-text-dark">على الحساب</div>
              <span className="text-[11px] tj-num font-bold text-warning dark:text-warning-dark">
                {state.debts.filter((d) => d.status === "pending").length}
              </span>
              <Ico name="chev" size={12} className="text-muted dark:text-muted-dark" style={{ transform: "scaleX(-1)" }} />
            </Link>
          </Card>
        </div>
      )}
    </Screen>
  );
}

interface TileProps {
  label: string;
  iconName: IconName;
  tintCls: string;
  softCls: string;
  value: React.ReactNode;
  sub: string;
  onClick: () => void;
}

function Tile({ label, iconName, tintCls, softCls, value, sub, onClick }: TileProps) {
  return (
    <Card onClick={onClick} className="p-3.5">
      <Row className="justify-between items-start">
        <div className={`w-9 h-9 rounded-tj ${softCls} flex items-center justify-center`}>
          <Ico name={iconName} size={16} className={tintCls} sw={1.8} />
        </div>
        {value}
      </Row>
      <div className="mt-2">
        <div className="text-[12px] font-bold text-text dark:text-text-dark">{label}</div>
        <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">{sub}</div>
      </div>
    </Card>
  );
}

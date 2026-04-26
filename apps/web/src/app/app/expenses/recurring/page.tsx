"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { catMeta } from "@/lib/expenses";
import { formatArDateShort } from "@/lib/dates";

export default function RecurringList() {
  const router = useRouter();
  const { state } = useStore();

  const items = state.recurringExpenses;
  const active = items.filter((r) => r.is_active);
  const monthlyTotal = active
    .filter((r) => r.frequency === "monthly")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <Screen>
      <TopBar
        title="المصاريف الثابتة"
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => router.push("/app/expenses/recurring/new")}
            label="مصروف ثابت جديد"
            className="text-primary"
          />
        }
      />

      {/* Summary */}
      <div className="px-4 pb-3.5">
        <Card className="p-4 border-s-[3px] border-s-primary">
          <div className="text-[11px] text-subtext dark:text-subtext-dark tracking-wider font-semibold">
            إجمالي المصاريف الشهرية الثابتة
          </div>
          <div className="mt-1.5">
            <Shekel amt={monthlyTotal} size={24} className="text-text dark:text-text-dark" weight={700} />
          </div>
          <Row className="gap-3 mt-2 text-[11px] text-subtext dark:text-subtext-dark">
            <span>
              <Num size={11} className="text-subtext dark:text-subtext-dark" weight={700}>{active.length}</Num> نشط
            </span>
            {items.length - active.length > 0 && (
              <>
                <span>·</span>
                <span>
                  <Num size={11} className="text-muted dark:text-muted-dark" weight={500}>{items.length - active.length}</Num> موقوف
                </span>
              </>
            )}
          </Row>
        </Card>
      </div>

      {items.length === 0 ? (
        <div className="px-4">
          <Empty
            icon="calendar"
            title="لا مصاريف ثابتة"
            sub="أضيفي مصاريفك الثابتة (إيجار، كهرباء، إنترنت) — وبنحسبها تلقائياً في المدى النقدي والتوقعات"
            tip="كل شيكل مصروف ثابت لازم تعرفيه قبل ما تربحي منه"
            actions={[{ label: "+ مصروف ثابت", href: "/app/expenses/recurring/new", primary: true }]}
          />
        </div>
      ) : (
        <div className="px-4 pb-4">
          <Card>
            {items.map((r, i, arr) => {
              const meta = catMeta(r.category);
              const freqLabel = r.frequency === "monthly"
                ? `شهري · يوم ${r.day_of_month || 1}`
                : "أسبوعي";
              return (
                <Link
                  key={r.id}
                  href={`/app/expenses/recurring/${r.id}/edit`}
                  className={`flex items-center gap-3 px-3.5 py-3 tj-tap ${
                    i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                  } ${!r.is_active ? "opacity-55" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-tj flex items-center justify-center ${meta.soft}`}>
                    <Ico name={meta.icon} size={17} className={meta.tint} sw={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Row className="gap-1.5">
                      <div className="text-[13px] font-semibold text-text dark:text-text-dark truncate">
                        {r.name}
                      </div>
                      {!r.is_active && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-tj bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark">
                          موقوف
                        </span>
                      )}
                    </Row>
                    <Row className="gap-1.5 mt-0.5 text-[10px] text-muted dark:text-muted-dark">
                      <span className={meta.tint}>{r.category}</span>
                      <span>·</span>
                      <span>{freqLabel}</span>
                      {r.end_date && (
                        <>
                          <span>·</span>
                          <span>حتى {formatArDateShort(r.end_date)}</span>
                        </>
                      )}
                    </Row>
                  </div>
                  <Shekel amt={r.amount} size={13} className="text-text dark:text-text-dark" weight={700} />
                </Link>
              );
            })}
          </Card>
        </div>
      )}

    </Screen>
  );
}

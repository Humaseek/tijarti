"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Shekel, Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Chip, IconButton } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { SwipeableRow } from "@/components/ui/swipeable-row";
import { whatsappUrl, whatsappUrlNoContact, paymentReminderMessage } from "@/lib/whatsapp";

type Tab = "الكل" | "VIP" | "عادية" | "جديدة";

export default function CustomersList() {
  const router = useRouter();
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("الكل");

  const list = useMemo(() => {
    const query = q.trim();
    return state.customers.filter((c) => {
      if (tab !== "الكل" && c.tag !== tab) return false;
      if (query && !c.name.includes(query)) return false;
      return true;
    });
  }, [state.customers, q, tab]);

  return (
    <Screen>
      <TopBar
        title="الزبائن"
        noBack
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => router.push("/app/customers/new")}
            label="زبونة جديدة"
            className="text-primary"
          />
        }
      />

      <div className="px-4 pb-2">
        <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-3 py-2.5 gap-2">
          <Ico name="search" size={16} className="text-muted dark:text-muted-dark" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحثي عن اسم..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-text dark:text-text-dark font-ar"
            dir="rtl"
          />
        </Row>
      </div>

      <div className="px-4 pb-3">
        <Row className="gap-1.5 overflow-x-auto">
          {(["الكل", "VIP", "عادية", "جديدة"] as Tab[]).map((t) => (
            <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
              {t}
            </Chip>
          ))}
        </Row>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {list.length === 0 ? (
          <Empty
            icon="users"
            title="لا زبائن بعد"
            sub="ابدأي ببناء قاعدة زبائنك — كل زبون بيعطيكِ سجل مشتريات وتحليل ولاء"
            tip="الزبائن الأكثر ولاءً غالباً بيجوا من التوصيات"
            actions={[{ label: "+ زبون جديد", href: "/app/customers/new", primary: true }]}
          />
        ) : (
          <Card>
            {list.map((c, i, arr) => {
              const actions = [
                ...(c.phone ? [{
                  icon: "phone" as const,
                  label: "اتصل",
                  bg: "bg-info dark:bg-info-dark",
                  onClick: () => { window.location.href = `tel:${c.phone}`; },
                }] : []),
                {
                  icon: "whatsapp" as const,
                  label: c.debt > 0 ? "تذكير" : "رسالة",
                  bg: "bg-success dark:bg-success-dark",
                  onClick: () => {
                    const msg = c.debt > 0
                      ? paymentReminderMessage({
                          storeName: state.storeSettings.store_name || "محلّنا",
                          customerName: c.name,
                          invoiceNo: "",
                          remaining: c.debt,
                        })
                      : `مرحباً ${c.name} 👋\n— ${state.storeSettings.store_name || "محلّنا"}`;
                    const url = whatsappUrl(c.whatsapp || c.phone, msg) || whatsappUrlNoContact(msg);
                    window.open(url, "_blank", "noopener,noreferrer");
                  },
                },
              ];
              return (
                <SwipeableRow
                  key={c.id}
                  actions={actions}
                  className={i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}
                >
                  <Link
                    href={`/app/customers/${c.id}`}
                    className="flex items-center gap-3 px-3.5 py-3 tj-tap"
                  >
                    <Avatar name={c.name} initial={c.initial} size={38} bg={c.avatar_color || undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-text dark:text-text-dark">{c.name}</div>
                      <div className="text-[11px] text-subtext dark:text-subtext-dark mt-0.5">
                        <span className={c.tag === "VIP" ? "text-warning dark:text-warning-dark font-bold" : ""}>
                          {c.tag}
                        </span>
                        {" · "}
                        <Num size={11} className="text-subtext dark:text-subtext-dark" weight={500}>{c.invoices}</Num> فاتورة
                      </div>
                    </div>
                    <div className="text-end">
                      <Shekel amt={c.totalSpent} size={12} className="text-text dark:text-text-dark" weight={700} />
                      {c.debt > 0 && (
                        <div className="mt-0.5">
                          <Shekel amt={c.debt} size={10} className="text-warning dark:text-warning-dark" weight={600} />
                        </div>
                      )}
                    </div>
                  </Link>
                </SwipeableRow>
              );
            })}
          </Card>
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

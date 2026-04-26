"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { useStore } from "@/lib/store/store-context";
import type { AppNotification, NotificationType } from "@/lib/store/types";

type Tab = "all" | "unread";

const TYPE_ICON: Record<NotificationType, { icon: IconName; tint: string; soft: string }> = {
  daily_reminder:     { icon: "bell",     tint: "text-primary",                          soft: "bg-primary-soft" },
  weekly_summary:     { icon: "chart",    tint: "text-primary",                          soft: "bg-primary-soft" },
  unusual_spending:   { icon: "warn",     tint: "text-danger dark:text-danger-dark",     soft: "bg-danger-soft dark:bg-danger-soft-dark" },
  debt_due:           { icon: "receipt",  tint: "text-warning dark:text-warning-dark",   soft: "bg-warning-soft dark:bg-warning-soft-dark" },
  goal_progress:      { icon: "target",   tint: "text-primary",                          soft: "bg-primary-soft" },
  recurring_expense:  { icon: "calendar", tint: "text-info dark:text-info-dark",         soft: "bg-info-soft dark:bg-info-soft-dark" },
  check_due:          { icon: "receipt",  tint: "text-warning dark:text-warning-dark",   soft: "bg-warning-soft dark:bg-warning-soft-dark" },
  system:             { icon: "info",     tint: "text-muted dark:text-muted-dark",       soft: "bg-surface2 dark:bg-surface2-dark" },
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const days = Math.floor(h / 24);
  if (days < 30) return `قبل ${days} يوم`;
  return d.toISOString().slice(0, 10);
}

export default function NotificationsCenter() {
  const { state, markNotificationRead, markAllNotificationsRead, deleteNotification } = useStore();
  const [tab, setTab] = useState<Tab>("all");

  const items = useMemo(() => {
    const list = tab === "unread"
      ? state.appNotifications.filter((n) => !n.is_read)
      : state.appNotifications;
    return list.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [state.appNotifications, tab]);

  const unreadCount = state.appNotifications.filter((n) => !n.is_read).length;

  return (
    <Screen>
      <TopBar
        title="التنبيهات"
        trailing={
          unreadCount > 0 ? (
            <div
              role="button"
              tabIndex={0}
              className="tj-btn text-primary text-[12px] font-bold"
              onClick={markAllNotificationsRead}
            >
              تعليم الكل
            </div>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="px-4 pb-2.5">
        <Row className="bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj p-0.5">
          {(["all", "unread"] as Tab[]).map((t) => {
            const label = t === "all" ? "الكل" : `غير مقروءة${unreadCount ? ` (${unreadCount})` : ""}`;
            const active = tab === t;
            return (
              <div
                key={t}
                onClick={() => setTab(t)}
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
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {items.length === 0 ? (
          <Empty
            icon="bell"
            title={tab === "unread" ? "كلّك محدّثة" : "لا تنبيهات جديدة"}
            sub={tab === "unread" ? "ما في تنبيهات غير مقروءة حالياً" : "لما يصير إشي مهم — شيك قرب يستحق، زبون تأخّر — رح يظهر هون"}
          />
        ) : (
          items.map((n) => <NotificationRow key={n.id} n={n} onMarkRead={markNotificationRead} onDelete={deleteNotification} />)
        )}
      </div>
      <div className="h-4" />
    </Screen>
  );
}

function NotificationRow({
  n,
  onMarkRead,
  onDelete,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { icon, tint, soft } = TYPE_ICON[n.type];
  const inner = (
    <div className={`flex gap-3 px-3.5 py-3 tj-tap ${!n.is_read ? "bg-primary-soft/30" : ""}`}>
      <div className={`w-9 h-9 rounded-tj flex items-center justify-center flex-shrink-0 ${soft}`}>
        <Ico name={icon} size={16} className={tint} sw={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <Row className="gap-2 mb-0.5">
          <div className={`flex-1 text-[12px] truncate ${!n.is_read ? "font-bold text-text dark:text-text-dark" : "font-semibold text-text dark:text-text-dark"}`}>
            {n.title}
          </div>
          {!n.is_read && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" aria-label="غير مقروء" />
          )}
        </Row>
        <div className="text-[11px] text-subtext dark:text-subtext-dark leading-snug">{n.body}</div>
        <Row className="gap-2 mt-1.5 text-[10px] text-muted dark:text-muted-dark">
          <span>{timeAgo(n.created_at)}</span>
          <span>·</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("حذف التنبيه؟")) onDelete(n.id);
            }}
            className="tj-btn text-danger dark:text-danger-dark font-medium"
          >
            حذف
          </span>
        </Row>
      </div>
    </div>
  );

  return n.link ? (
    <Link
      href={n.link}
      onClick={() => !n.is_read && onMarkRead(n.id)}
      className="block border-b border-divider dark:border-divider-dark last:border-0"
    >
      {inner}
    </Link>
  ) : (
    <div
      onClick={() => !n.is_read && onMarkRead(n.id)}
      role="button"
      tabIndex={0}
      className="block border-b border-divider dark:border-divider-dark last:border-0"
    >
      {inner}
    </div>
  );
}

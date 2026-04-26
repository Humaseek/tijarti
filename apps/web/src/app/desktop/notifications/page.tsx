"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { useStore } from "@/lib/store/store-context";
import type { AppNotification, NotificationType } from "@/lib/store/types";

type Tab = "all" | "unread";

const TYPE_ICON: Record<NotificationType, { icon: IconName; tint: string; soft: string; label: string }> = {
  daily_reminder:    { icon: "bell",     tint: "text-primary",                          soft: "bg-primary-soft",                          label: "تذكير يومي" },
  weekly_summary:    { icon: "chart",    tint: "text-primary",                          soft: "bg-primary-soft",                          label: "ملخص أسبوعي" },
  unusual_spending:  { icon: "warn",     tint: "text-danger dark:text-danger-dark",     soft: "bg-danger-soft dark:bg-danger-soft-dark",   label: "صرف غير اعتيادي" },
  debt_due:          { icon: "receipt",  tint: "text-warning dark:text-warning-dark",   soft: "bg-warning-soft dark:bg-warning-soft-dark", label: "دَين مستحق" },
  goal_progress:     { icon: "target",   tint: "text-primary",                          soft: "bg-primary-soft",                          label: "تقدّم هدف" },
  recurring_expense: { icon: "calendar", tint: "text-info dark:text-info-dark",         soft: "bg-info-soft dark:bg-info-soft-dark",       label: "مصروف ثابت" },
  check_due:         { icon: "receipt",  tint: "text-warning dark:text-warning-dark",   soft: "bg-warning-soft dark:bg-warning-soft-dark", label: "شيك مستحق" },
  system:            { icon: "info",     tint: "text-muted dark:text-muted-dark",       soft: "bg-surface2 dark:bg-surface2-dark",         label: "نظام" },
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const days = Math.floor(h / 24);
  if (days < 30) return `قبل ${days} يوم`;
  return d.toISOString().slice(0, 10);
}

export default function DesktopNotifications() {
  const { state, markNotificationRead, markAllNotificationsRead, deleteNotification } = useStore();
  const [tab, setTab] = useState<Tab>("all");

  const items = useMemo(() => {
    const list = tab === "unread" ? state.appNotifications.filter((n) => !n.is_read) : state.appNotifications;
    return list.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [state.appNotifications, tab]);

  const unreadCount = state.appNotifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">الإدارة</div>
          <h1 className="text-[24px] font-bold text-text dark:text-text-dark">التنبيهات</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-surface dark:hover:bg-surface-dark"
          >
            تعليم الكل كمقروءة
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface dark:bg-surface-dark rounded-tj p-1 border border-divider dark:border-divider-dark w-fit">
        {(["all", "unread"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-tj text-[12px] font-bold transition-colors ${
              tab === t ? "bg-primary text-white" : "text-text dark:text-text-dark hover:bg-surface2 dark:hover:bg-surface2-dark"
            }`}
          >
            {t === "all" ? "الكل" : `غير مقروءة${unreadCount ? ` (${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {items.length === 0 ? (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark py-14 text-center px-8">
          <div className="mb-3 flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center">
              <Ico name="bell" size={26} sw={1.6} className="text-primary" />
            </div>
          </div>
          <div className="text-[15px] font-bold text-text dark:text-text-dark mb-1">
            {tab === "unread" ? "كلّك محدّثة" : "لا تنبيهات جديدة"}
          </div>
          <div className="text-xs text-muted dark:text-muted-dark leading-relaxed max-w-[380px] mx-auto">
            {tab === "unread" ? "ما في تنبيهات غير مقروءة حالياً" : "لما يصير إشي مهم — شيك قرب يستحق، زبون تأخّر — رح يظهر هون"}
          </div>
        </div>
      ) : (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
          {items.map((n) => <NotifRow key={n.id} n={n} onRead={markNotificationRead} onDelete={deleteNotification} />)}
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}

function NotifRow({ n, onRead, onDelete }: { n: AppNotification; onRead: (id: string) => void; onDelete: (id: string) => void }) {
  const info = TYPE_ICON[n.type];
  const inner = (
    <div className={`flex items-start gap-4 p-4 border-b border-divider dark:border-divider-dark last:border-0 transition-colors ${
      !n.is_read ? "bg-primary-soft/20 hover:bg-primary-soft/30" : "hover:bg-bg dark:hover:bg-bg-dark"
    }`}>
      <div className={`w-10 h-10 rounded-tj ${info.soft} flex items-center justify-center flex-shrink-0`}>
        <Ico name={info.icon} size={17} className={info.tint} sw={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`text-[13px] ${!n.is_read ? "font-bold" : "font-semibold"} text-text dark:text-text-dark`}>{n.title}</div>
            <div className="text-[11px] text-subtext dark:text-subtext-dark mt-1 leading-relaxed">{n.body}</div>
          </div>
          {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" aria-label="غير مقروء" />}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-semibold text-muted dark:text-muted-dark">{info.label}</span>
          <span className="text-[10px] text-muted dark:text-muted-dark">·</span>
          <span className="text-[10px] text-muted dark:text-muted-dark">{timeAgo(n.created_at)}</span>
          <span className="flex-1" />
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("حذف التنبيه؟")) onDelete(n.id);
            }}
            className="text-[10px] text-danger dark:text-danger-dark font-medium hover:underline"
          >
            حذف
          </span>
        </div>
      </div>
    </div>
  );

  return n.link ? (
    <Link href={n.link} onClick={() => !n.is_read && onRead(n.id)} className="block">
      {inner}
    </Link>
  ) : (
    <div onClick={() => !n.is_read && onRead(n.id)}>{inner}</div>
  );
}

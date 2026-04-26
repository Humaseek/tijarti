"use client";

import { Screen, Card, Row } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Toggle } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { useStore } from "@/lib/store/store-context";

export default function SettingsNotifications() {
  const { state, updateNotificationSettings } = useStore();
  const ns = state.notificationSettings;

  const alertItems: { key: keyof typeof ns.alerts; label: string; sub: string }[] = [
    { key: "debt",     label: "تنبيهات الديون",  sub: "تذكير بالديون المستحقة" },
    { key: "stock",    label: "انخفاض المخزون", sub: "عند وصول منتج لحد التنبيه" },
    { key: "goals",    label: "أهداف المبيعات",  sub: "تقدّمكِ نحو الهدف الشهري" },
    { key: "payments", label: "دفعات جديدة",     sub: "عند استلام دفعة من زبونة" },
  ];

  const channelItems: { key: keyof typeof ns.channels; label: string; icon: IconName; sub: string }[] = [
    { key: "inapp",    label: "داخل التطبيق",      icon: "bell",     sub: "إشعارات مباشرة على الشاشة" },
    { key: "email",    label: "البريد الإلكتروني",  icon: "mail",     sub: state.userProfile.email },
    { key: "sms",      label: "رسائل SMS",          icon: "msg",      sub: state.userProfile.phone },
    { key: "whatsapp", label: "واتساب",             icon: "whatsapp", sub: "على نفس رقم الهاتف" },
  ];

  return (
    <Screen>
      <TopBar title="الإشعارات" />

      <div className="px-4 pb-5">
        <SectionHeader>التنبيهات</SectionHeader>
        <Card>
          {alertItems.map((it, i, arr) => (
            <Row
              key={it.key}
              className={`px-3.5 py-3 justify-between gap-3 ${
                i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-text dark:text-text-dark">{it.label}</div>
                <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">{it.sub}</div>
              </div>
              <Toggle
                on={ns.alerts[it.key]}
                onChange={(v) => updateNotificationSettings({ alerts: { [it.key]: v } as never })}
              />
            </Row>
          ))}
        </Card>

        <SectionHeader className="mt-4">القنوات</SectionHeader>
        <Card>
          {channelItems.map((it, i, arr) => {
            const active = ns.channels[it.key];
            return (
              <Row
                key={it.key}
                className={`px-3.5 py-3 justify-between gap-3 ${
                  i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
                }`}
              >
                <div className="w-[30px] h-[30px] rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center">
                  <Ico
                    name={it.icon}
                    size={14}
                    className={active ? "text-primary" : "text-muted dark:text-muted-dark"}
                    sw={1.6}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text dark:text-text-dark">{it.label}</div>
                  {it.sub && (
                    <div
                      className={`text-[11px] text-muted dark:text-muted-dark mt-0.5 ${
                        it.key === "email" || it.key === "sms" ? "tj-num" : ""
                      }`}
                      dir={it.key === "email" || it.key === "sms" ? "ltr" : "rtl"}
                    >
                      {it.sub}
                    </div>
                  )}
                </div>
                <Toggle
                  on={active}
                  onChange={(v) => updateNotificationSettings({ channels: { [it.key]: v } as never })}
                />
              </Row>
            );
          })}
        </Card>

        <SectionHeader className="mt-4">ساعات الهدوء</SectionHeader>
        <Card className="p-3.5">
          <Row className={`justify-between ${ns.quiet_hours.enabled ? "mb-3.5" : ""}`}>
            <div>
              <div className="text-[13px] text-text dark:text-text-dark font-semibold">تفعيل ساعات الهدوء</div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                {ns.quiet_hours.enabled ? `من ${ns.quiet_hours.from} إلى ${ns.quiet_hours.to}` : "الإشعارات تُرسل دائماً"}
              </div>
            </div>
            <Toggle
              on={ns.quiet_hours.enabled}
              onChange={(v) => updateNotificationSettings({ quiet_hours: { enabled: v } as never })}
            />
          </Row>

          {ns.quiet_hours.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3.5">
                <div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mb-1">من</div>
                  <input
                    type="time"
                    value={ns.quiet_hours.from}
                    onChange={(e) => updateNotificationSettings({ quiet_hours: { from: e.target.value } as never })}
                    className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num text-center"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mb-1">إلى</div>
                  <input
                    type="time"
                    value={ns.quiet_hours.to}
                    onChange={(e) => updateNotificationSettings({ quiet_hours: { to: e.target.value } as never })}
                    className="w-full px-[14px] py-3 text-sm bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-divider dark:border-divider-dark rounded-tj outline-none tj-num text-center"
                  />
                </div>
              </div>
              <Row className="justify-between">
                <div>
                  <div className="text-[13px] text-text dark:text-text-dark font-semibold">أيام الأسبوع فقط</div>
                  <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">السبت والأحد بلا قيود</div>
                </div>
                <Toggle
                  on={ns.quiet_hours.weekdays_only}
                  onChange={(v) => updateNotificationSettings({ quiet_hours: { weekdays_only: v } as never })}
                />
              </Row>
            </>
          )}
        </Card>

        <div className="text-[11px] text-muted dark:text-muted-dark mt-3 text-center">
          التغييرات تُحفظ تلقائياً
        </div>
      </div>
    </Screen>
  );
}

function SectionHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider pb-2 pt-1 px-1 ${className ?? ""}`}>
      {children}
    </div>
  );
}

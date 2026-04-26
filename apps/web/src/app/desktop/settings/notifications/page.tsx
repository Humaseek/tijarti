"use client";

import { DesktopPage } from "@/components/shell/desktop-page";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

const ALERTS = [
  { k: "debt",      label: "تنبيهات الذمم",    sub: "استحقاقات الشيكات والديون" },
  { k: "stock",     label: "تنبيهات المخزون",  sub: "منتجات قاربت النفاد" },
  { k: "goals",     label: "تقدّم الأهداف",     sub: "إنجاز 25% / 50% / 75%" },
  { k: "payments",  label: "الدفعات",          sub: "استلام دفعة أو تسجيلها" },
] as const;

const CHANNELS = [
  { k: "inapp",    label: "داخل التطبيق", icon: "bell" as const },
  { k: "email",    label: "البريد الإلكتروني", icon: "mail" as const },
  { k: "sms",      label: "رسائل SMS", icon: "phone" as const },
  { k: "whatsapp", label: "واتساب", icon: "whatsapp" as const },
] as const;

export default function Page() {
  const { state, updateNotificationSettings } = useStore();
  const { toast } = useToast();
  const ns = state.notificationSettings;

  const toggleAlert = (k: typeof ALERTS[number]["k"]) => {
    updateNotificationSettings({ alerts: { ...ns.alerts, [k]: !ns.alerts[k] } });
    toast("تم التحديث", "success");
  };
  const toggleChannel = (k: typeof CHANNELS[number]["k"]) => {
    updateNotificationSettings({ channels: { ...ns.channels, [k]: !ns.channels[k] } });
  };
  const toggleQuiet = () => {
    updateNotificationSettings({ quiet_hours: { ...ns.quiet_hours, enabled: !ns.quiet_hours.enabled } });
  };

  return (
    <DesktopPage breadcrumb="الإعدادات" backHref="/desktop/settings" title="الإشعارات" subtitle="تحكّمي في متى وكيف يصلك التنبيه">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">أنواع التنبيهات</h3>
          <div className="space-y-1">
            {ALERTS.map((a) => (
              <label key={a.k} className="flex items-center justify-between py-2.5 px-2 rounded-tj hover:bg-bg dark:hover:bg-bg-dark cursor-pointer">
                <div>
                  <div className="text-[12px] font-bold text-text dark:text-text-dark">{a.label}</div>
                  <div className="text-[10px] text-muted dark:text-muted-dark">{a.sub}</div>
                </div>
                <input type="checkbox" checked={ns.alerts[a.k]} onChange={() => toggleAlert(a.k)} className="w-4 h-4" />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[13px] font-bold text-text dark:text-text-dark mb-4">قنوات التوصيل</h3>
          <div className="space-y-1">
            {CHANNELS.map((c) => (
              <label key={c.k} className="flex items-center gap-3 py-2.5 px-2 rounded-tj hover:bg-bg dark:hover:bg-bg-dark cursor-pointer">
                <div className="w-8 h-8 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center">
                  <Ico name={c.icon} size={14} className="text-muted dark:text-muted-dark" sw={1.8} />
                </div>
                <div className="flex-1 text-[12px] font-bold text-text dark:text-text-dark">{c.label}</div>
                <input type="checkbox" checked={ns.channels[c.k]} onChange={() => toggleChannel(c.k)} className="w-4 h-4" />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-text dark:text-text-dark">ساعات الهدوء</h3>
            <p className="text-[11px] text-muted dark:text-muted-dark mt-1">من {ns.quiet_hours.from} إلى {ns.quiet_hours.to} — لا تنبيهات خلال هذه الساعات</p>
          </div>
          <input type="checkbox" checked={ns.quiet_hours.enabled} onChange={toggleQuiet} className="w-4 h-4" />
        </div>
      </div>
    </DesktopPage>
  );
}

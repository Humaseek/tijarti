"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Screen, Card, Row } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Num } from "@/components/ui/num";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

interface HubItem {
  href?: string;
  label: string;
  sub: string;
  icon: IconName;
  tintCls: string;
  onClick?: () => void;
}

export default function SettingsHub() {
  const { state, resetStore } = useStore();
  const { toast } = useToast();
  const router = useRouter();

  const ss = state.storeSettings;
  const up = state.userProfile;
  const ns = state.notificationSettings;
  const sec = state.securitySettings;

  // Heuristic: we consider the app "empty" when all the primary collections are empty.
  const isEmpty =
    state.customers.length === 0 &&
    state.products.length === 0 &&
    state.invoices.length === 0 &&
    state.expenses.length === 0 &&
    state.checks.length === 0 &&
    state.debts.length === 0 &&
    state.recurringExpenses.length === 0;

  const alertsOn = Object.values(ns.alerts).filter(Boolean).length;
  const chanOn = Object.values(ns.channels).filter(Boolean).length;
  const secSub = sec.two_fa_enabled
    ? `2FA مفعّل عبر ${sec.two_fa_method === "sms" ? "SMS" : sec.two_fa_method === "email" ? "البريد" : "تطبيق"}`
    : "2FA معطّل";

  const group1: HubItem[] = [
    {
      href: "/app/settings/store",
      label: "معلومات المحل",
      sub: `${ss.store_name} · ${(ss.store_address || "").split("،")[0] || "—"}`,
      icon: "store",
      tintCls: "text-primary",
    },
    {
      href: "/app/settings/users",
      label: "المستخدمين والصلاحيات",
      sub: "دعوة موظفين ومحاسب",
      icon: "users",
      tintCls: "text-primary",
    },
    {
      href: "/app/settings/categories",
      label: "التصنيفات",
      sub: "تصنيفات المصاريف والمنتجات",
      icon: "tag",
      tintCls: "text-warning dark:text-warning-dark",
    },
    {
      href: "/app/settings/custom-fields",
      label: "الحقول الديناميكية",
      sub: "حقول مخصصة حسب مصلحتك",
      icon: "settings",
      tintCls: "text-info dark:text-info-dark",
    },
    {
      label: "تصدير البيانات",
      sub: "تحميل JSON بكل البيانات",
      icon: "download",
      tintCls: "text-info dark:text-info-dark",
      onClick: () => {
        const data = {
          exportedAt: new Date().toISOString(),
          business: state.storeSettings,
          customers: state.customers,
          suppliers: state.suppliers,
          products: state.products,
          invoices: state.invoices,
          expenses: state.expenses,
          checks: state.checks,
          debts: state.debts,
          recurringExpenses: state.recurringExpenses,
          goals: state.goals,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tijarti-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast("تم تنزيل ملف البيانات بنجاح", "success");
      },
    },
  ];

  const group2: HubItem[] = [
    {
      href: "/app/settings/account",
      label: "الحساب",
      sub: `${up.full_name} · ${up.email}`,
      icon: "user",
      tintCls: "text-info dark:text-info-dark",
    },
    {
      href: "/app/settings/notifications",
      label: "الإشعارات",
      sub: `${alertsOn + chanOn} مفعّل من 8`,
      icon: "bell",
      tintCls: "text-warning dark:text-warning-dark",
    },
    {
      href: "/app/settings/subscription",
      label: "الاشتراك والفوترة",
      sub: "الخطة الحالية + الفواتير",
      icon: "card",
      tintCls: "text-primary",
    },
    {
      href: "/app/settings/security",
      label: "الأمان",
      sub: secSub,
      icon: "shield",
      tintCls: sec.two_fa_enabled ? "text-success dark:text-success-dark" : "text-muted dark:text-muted-dark",
    },
  ];

  const group3: HubItem[] = [];

  const renderItem = (it: HubItem, i: number, arr: HubItem[]) => {
    const content = (
      <Row className={`px-3.5 py-3.5 gap-3 ${i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""} tj-tap`}>
        <div className="w-8 h-8 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center">
          <Ico name={it.icon} size={14} className={it.tintCls} sw={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text dark:text-text-dark">{it.label}</div>
          <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5 truncate">{it.sub}</div>
        </div>
        <Ico name="chev" size={13} className="text-muted dark:text-muted-dark" style={{ transform: "scaleX(-1)" }} />
      </Row>
    );
    return it.href ? (
      <Link key={i} href={it.href}>
        {content}
      </Link>
    ) : (
      <div key={i} onClick={it.onClick} role="button" tabIndex={0}>
        {content}
      </div>
    );
  };

  return (
    <Screen>
      <TopBar title="الإعدادات" noBack />

      {/* Profile header */}
      <div className="px-4 pb-4">
        <Card className="p-4 flex items-center gap-3">
          <Avatar name={up.full_name} initial={up.full_name.charAt(0)} size={46} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-text dark:text-text-dark">{up.full_name}</div>
            <div className="text-[11px] text-subtext dark:text-subtext-dark mt-0.5 tj-num truncate" dir="ltr">{up.email}</div>
            <div className="text-[10px] text-muted dark:text-muted-dark mt-1">{ss.store_name}</div>
          </div>
        </Card>
      </div>

      <div className="px-4">
        <SectionHeader>المحل</SectionHeader>
        <Card>{group1.map(renderItem)}</Card>
      </div>

      <div className="px-4 mt-3.5">
        <SectionHeader>الحساب والأمان</SectionHeader>
        <Card>{group2.map(renderItem)}</Card>
      </div>

      <div className="px-4 mt-3.5">
        <SectionHeader>المساعدة</SectionHeader>
        <Card>{group3.map(renderItem)}</Card>
      </div>

      {/* Data mode: demo vs empty */}
      <div className="px-4 mt-3.5">
        <SectionHeader>البيانات التجريبية</SectionHeader>
        <Card className="p-3.5">
          <div className="text-[12px] text-subtext dark:text-subtext-dark leading-relaxed mb-3">
            {isEmpty
              ? "التطبيق فاضي الآن. ممكن تستعيدي البيانات التجريبية (بوتيك ليلى) لتجربة المزايا."
              : "تطبيقك فيه بيانات تجريبية الآن. ممكن تمسحي كل شي وتبدأي من الصفر لتشوفي التطبيق نظيف."}
          </div>
          {isEmpty ? (
            <button
              onClick={() => {
                if (!confirm("استعادة البيانات التجريبية؟ هذا رح يستبدل كل اللي موجود حالياً.")) return;
                resetStore("demo");
                toast("تم استعادة البيانات التجريبية", "success");
              }}
              className="w-full tj-btn py-2.5 rounded-tj bg-primary text-white text-[12px] font-semibold"
            >
              استعادة البيانات التجريبية
            </button>
          ) : (
            <button
              onClick={() => {
                if (!confirm("مسح كل البيانات والبدء من الصفر؟ هذا الإجراء لا يمكن التراجع عنه.")) return;
                resetStore("empty");
                toast("تم المسح — التطبيق الآن فاضي", "info");
              }}
              className="w-full tj-btn py-2.5 rounded-tj bg-surface2 dark:bg-surface2-dark text-danger dark:text-danger-dark text-[12px] font-semibold border border-divider dark:border-divider-dark"
            >
              ابدأ من الصفر (مسح كل البيانات)
            </button>
          )}
        </Card>
      </div>

      {/* Logout (danger) */}
      <div className="px-4 mt-3.5 pb-5">
        <SectionHeader>منطقة خطرة</SectionHeader>
        <Card
          onClick={() => {
            if (!confirm("تسجيل الخروج؟")) return;
            toast("تم تسجيل الخروج — إلى اللقاء!", "info");
            router.push("/login");
          }}
          className="p-3.5 flex items-center gap-3"
        >
          <div className="w-[30px] h-[30px] rounded-tj bg-danger-soft dark:bg-danger-soft-dark flex items-center justify-center">
            <Ico name="logout" size={14} className="text-danger dark:text-danger-dark" sw={1.6} />
          </div>
          <div className="flex-1 text-[13px] font-semibold text-danger dark:text-danger-dark">تسجيل الخروج</div>
        </Card>
      </div>

      {/* Version footer */}
      <div className="text-center text-[10px] text-muted dark:text-muted-dark pb-5">
        Tijarti · الإصدار <Num size={10} className="text-muted dark:text-muted-dark" weight={600}>1.0.0</Num>
      </div>
    </Screen>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-wider pb-2 px-1">
      {children}
    </div>
  );
}

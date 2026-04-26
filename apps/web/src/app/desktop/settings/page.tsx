"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { Shekel, Num } from "@/components/ui/num";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { seedAllExtensions, resetAllExtensions } from "@/lib/seed-extensions";
import { downloadBackup, readBackupFile, backupSummary } from "@/lib/store/backup";
import type { StoreState } from "@/lib/store/types";
import { useRef } from "react";

type Section =
  | "profile" | "business" | "users" | "categories" | "custom-fields"
  | "notifications" | "security" | "subscription" | "data";

interface SectionDef {
  id: Section;
  label: string;
  icon: IconName;
  description: string;
}

const SECTIONS: SectionDef[] = [
  { id: "profile",       label: "الحساب الشخصي",     icon: "user",     description: "الاسم، البريد، الهاتف" },
  { id: "business",      label: "معلومات المحل",     icon: "store",    description: "الاسم، العنوان، الشعار" },
  { id: "users",         label: "المستخدمين",        icon: "users",    description: "دعوة موظفين ومحاسب" },
  { id: "categories",    label: "التصنيفات",         icon: "tag",      description: "تصنيفات المصاريف والمنتجات" },
  { id: "custom-fields", label: "الحقول الديناميكية", icon: "settings", description: "حقول مخصصة حسب مصلحتك" },
  { id: "notifications", label: "الإشعارات",         icon: "bell",     description: "أوقات وقنوات التنبيهات" },
  { id: "security",      label: "الأمان",             icon: "shield",   description: "كلمة السر و 2FA والأجهزة" },
  { id: "subscription",  label: "الاشتراك والفوترة", icon: "card",     description: "الخطة والفواتير" },
  { id: "data",          label: "البيانات",           icon: "download", description: "تصدير واستيراد" },
];

export default function DesktopSettings() {
  const { state, resetStore, replaceStore } = useStore();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("profile");

  return (
    <div className="flex h-full">
      {/* Left panel — section list */}
      <aside className="w-[280px] border-l border-divider dark:border-divider-dark bg-surface dark:bg-surface-dark flex-shrink-0 overflow-auto">
        <div className="p-5 border-b border-divider dark:border-divider-dark">
          <div className="text-[12px] text-muted dark:text-muted-dark mb-1">الإدارة</div>
          <h1 className="text-[18px] font-bold text-text dark:text-text-dark">الإعدادات</h1>
        </div>
        <nav className="p-3">
          {SECTIONS.map((s) => {
            const active = s.id === section;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-tj mb-1 text-start transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
                }`}
              >
                <Ico name={s.icon} size={16} className={active ? "" : "text-muted dark:text-muted-dark"} sw={1.8} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold">{s.label}</div>
                  <div className={`text-[10px] ${active ? "opacity-80" : "text-muted dark:text-muted-dark"} truncate`}>
                    {s.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right panel — content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-[800px]">
          {section === "profile" && <ProfileSection />}
          {section === "business" && <BusinessSection />}
          {section === "users" && <UsersSection />}
          {section === "categories" && <CategoriesSection />}
          {section === "custom-fields" && <CustomFieldsSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "security" && <SecuritySection />}
          {section === "subscription" && <SubscriptionSection />}
          {section === "data" && <DataSection state={state} resetStore={resetStore} replaceStore={replaceStore} toast={toast} />}
        </div>
      </main>
    </div>
  );
}

// ─── Section components (each is a simple info card + link to mobile for full flow) ───
function SectionShell({ title, children, actionLink }: { title: string; children: React.ReactNode; actionLink?: { href: string; label: string } }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold text-text dark:text-text-dark">{title}</h2>
        {actionLink && (
          <Link href={actionLink.href} className="flex items-center gap-2 px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90">
            {actionLink.label}
            <Ico name="chev" size={12} sw={2} style={{ transform: "scaleX(-1)" }} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function ProfileSection() {
  const { state } = useStore();
  const p = state.userProfile;
  return (
    <SectionShell title="الحساب الشخصي" actionLink={{ href: "/desktop/settings/account", label: "تعديل" }}>
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-divider dark:border-divider-dark">
          <Avatar name={p.full_name} initial={p.full_name.charAt(0) || "؟"} size={64} />
          <div>
            <div className="text-[16px] font-bold text-text dark:text-text-dark">{p.full_name || "—"}</div>
            <div className="text-[12px] text-muted dark:text-muted-dark mt-0.5">{p.role === "owner" ? "صاحب المصلحة" : "موظف"}</div>
          </div>
        </div>
        <Field label="البريد الإلكتروني" value={p.email || "—"} />
        <Field label="رقم الهاتف" value={p.phone || "—"} />
      </div>
    </SectionShell>
  );
}

function BusinessSection() {
  const { state } = useStore();
  const s = state.storeSettings;
  return (
    <SectionShell title="معلومات المحل" actionLink={{ href: "/desktop/settings/store", label: "تعديل" }}>
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
        <Field label="اسم المحل" value={s.store_name} />
        <Field label="نوع المصلحة" value={s.business_type} />
        <Field label="العنوان" value={s.store_address || "—"} />
        <Field label="الهاتف" value={s.store_phone || "—"} />
        <Field label="البريد" value={s.store_email || "—"} />
        <Field label="العملة" value={`${s.currency} (${s.currency_symbol})`} />
        <Field label="وضع الإدخال" value={s.entry_mode === "aggregate" ? "رقم يومي إجمالي" : "حسب المنتجات"} />
      </div>
    </SectionShell>
  );
}

function UsersSection() {
  return (
    <SectionShell title="المستخدمين والصلاحيات" actionLink={{ href: "/desktop/settings/users", label: "إدارة كاملة" }}>
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
        <p className="text-[13px] text-text dark:text-text-dark leading-relaxed mb-4">
          دعوة موظفين ومدراء ومحاسبين. كل دور له صلاحيات مختلفة:
        </p>
        <div className="space-y-3">
          <RoleInfo role="صاحب" desc="صلاحيات كاملة + حذف المصلحة + الفوترة" tint="primary" />
          <RoleInfo role="مدير" desc="كل الصلاحيات عدا الحذف والفوترة" tint="info" />
          <RoleInfo role="موظف" desc="إدخال بيانات فقط — لا داشبورد ولا تقارير" tint="muted" />
          <RoleInfo role="محاسب" desc="قراءة + تصدير التقارير فقط" tint="warning" />
        </div>
      </div>
    </SectionShell>
  );
}

function RoleInfo({ role, desc, tint }: { role: string; desc: string; tint: "primary" | "info" | "muted" | "warning" }) {
  const colors = {
    primary: "bg-primary-soft text-primary",
    info: "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark",
    muted: "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark",
    warning: "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark",
  };
  return (
    <div className="flex items-start gap-3">
      <span className={`text-[10px] font-bold px-2 py-1 rounded-tj flex-shrink-0 ${colors[tint]}`}>{role}</span>
      <span className="text-[12px] text-subtext dark:text-subtext-dark">{desc}</span>
    </div>
  );
}

function CategoriesSection() {
  return (
    <SectionShell title="التصنيفات" actionLink={{ href: "/desktop/settings/categories", label: "إدارة" }}>
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
        <p className="text-[13px] text-text dark:text-text-dark leading-relaxed">
          إدارة تصنيفات المصاريف والمنتجات. التصنيفات الافتراضية جاهزة، ويمكن إضافة تصنيفات مخصصة.
        </p>
      </div>
    </SectionShell>
  );
}

function CustomFieldsSection() {
  const { state } = useStore();
  const activeCount = state.customFields.filter((f) => f.is_active).length;
  return (
    <SectionShell title="الحقول الديناميكية" actionLink={{ href: "/desktop/settings/custom-fields", label: "إدارة" }}>
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-tj bg-primary-soft flex items-center justify-center">
            <Ico name="tag" size={22} className="text-primary" sw={1.6} />
          </div>
          <div>
            <div className="text-[15px] font-bold text-text dark:text-text-dark">
              <Num size={15} className="text-text dark:text-text-dark" weight={700}>{activeCount}</Num> حقل نشط
            </div>
            <div className="text-[11px] text-muted dark:text-muted-dark">مخصصة حسب طبيعة مصلحتك</div>
          </div>
        </div>
        <p className="text-[12px] text-text dark:text-text-dark leading-relaxed">
          حقول إضافية تضيفيها حسب طبيعة مصلحتك — مثلاً بوتيك: اللون والمقاس، كراج: رقم السيارة، صيدلية: تاريخ الانتهاء.
        </p>
      </div>
    </SectionShell>
  );
}

function NotificationsSection() {
  return (
    <SectionShell title="إعدادات التنبيهات" actionLink={{ href: "/desktop/settings/notifications", label: "تعديل" }}>
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
        <p className="text-[13px] text-text dark:text-text-dark leading-relaxed">
          تحكّمي في التنبيهات — داخل التطبيق، إيميل، واتساب — مع ساعات هدوء وأوقات مخصصة.
        </p>
      </div>
    </SectionShell>
  );
}

function SecuritySection() {
  const { state } = useStore();
  const sec = state.securitySettings;
  return (
    <SectionShell title="الأمان" actionLink={{ href: "/desktop/settings/security", label: "إدارة" }}>
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
        <Field label="المصادقة الثنائية (2FA)" value={sec.two_fa_enabled ? "مفعّلة" : "غير مفعّلة"} />
        <Field label="الأجهزة المسجّلة" value={`${sec.sessions.length} جهاز`} />
      </div>
    </SectionShell>
  );
}

function SubscriptionSection() {
  return (
    <SectionShell title="الاشتراك والفوترة" actionLink={{ href: "/desktop/settings/subscription", label: "تفاصيل" }}>
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark border-s-[3px] border-s-primary p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] text-muted dark:text-muted-dark mb-1">الخطة الحالية</div>
            <div className="text-[16px] font-bold text-text dark:text-text-dark">اشتراك شهري</div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-tj bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark">نشط</span>
        </div>
        <div className="flex items-baseline gap-2 pt-3 border-t border-divider dark:border-divider-dark">
          <Shekel amt={300} size={24} className="text-primary" weight={700} />
          <span className="text-[12px] text-muted dark:text-muted-dark">/ شهر</span>
        </div>
        <div className="text-[11px] text-muted dark:text-muted-dark mt-2">التجديد: 2026-05-01</div>
      </div>
    </SectionShell>
  );
}

function DataSection({
  state,
  resetStore,
  replaceStore,
  toast,
}: {
  state: StoreState;
  resetStore: (m: "demo" | "empty") => void;
  replaceStore: (s: StoreState) => void;
  toast: (msg: string, type?: any) => void;
}) {
  const isEmpty =
    state.customers.length === 0 && state.products.length === 0 && state.invoices.length === 0 &&
    state.expenses.length === 0 && state.checks.length === 0 && state.debts.length === 0;

  const importRef = useRef<HTMLInputElement>(null);
  const summary = backupSummary(state);

  const handleImport = async (file: File | null) => {
    if (!file) return;
    const result = await readBackupFile(file);
    if (!result.ok) {
      toast(result.error, "warn");
      return;
    }
    const incoming = backupSummary(result.state);
    const date = result.meta.createdAt
      ? new Date(result.meta.createdAt).toLocaleDateString("ar-IL")
      : "—";
    const msg =
      `استيراد نسخة احتياطية بتاريخ ${date}؟\n\n` +
      `سيستبدل البيانات الحالية بـ:\n` +
      `• ${incoming.expenses} مصروف\n` +
      `• ${incoming.customers} زبون\n` +
      `• ${incoming.products} منتج\n` +
      `• ${incoming.invoices} فاتورة\n` +
      `• ${incoming.checks} شيك\n` +
      `• ${incoming.suppliers} مورّد\n\n` +
      `هذا الإجراء لا يمكن التراجع عنه.`;
    if (!confirm(msg)) return;
    replaceStore(result.state);
    toast("تم الاستيراد بنجاح — سيتم تحديث الصفحة", "success");
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <SectionShell title="البيانات">
      <div className="space-y-4">
        {/* ─── Backup (Export) ─────────────────────────────────────────── */}
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-1">نسخة احتياطية (Export)</h3>
          <p className="text-[12px] text-muted dark:text-muted-dark mb-3">
            احفظي كل بياناتك كملف JSON واحد على جهازك. ينصح بعمل نسخة احتياطية أسبوعيًا.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="bg-bg dark:bg-bg-dark rounded-tj p-2">
              <div className="text-[10px] text-muted dark:text-muted-dark">مصاريف</div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark tj-num">{summary.expenses}</div>
            </div>
            <div className="bg-bg dark:bg-bg-dark rounded-tj p-2">
              <div className="text-[10px] text-muted dark:text-muted-dark">زبائن</div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark tj-num">{summary.customers}</div>
            </div>
            <div className="bg-bg dark:bg-bg-dark rounded-tj p-2">
              <div className="text-[10px] text-muted dark:text-muted-dark">منتجات</div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark tj-num">{summary.products}</div>
            </div>
            <div className="bg-bg dark:bg-bg-dark rounded-tj p-2">
              <div className="text-[10px] text-muted dark:text-muted-dark">فواتير</div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark tj-num">{summary.invoices}</div>
            </div>
            <div className="bg-bg dark:bg-bg-dark rounded-tj p-2">
              <div className="text-[10px] text-muted dark:text-muted-dark">شيكات</div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark tj-num">{summary.checks}</div>
            </div>
            <div className="bg-bg dark:bg-bg-dark rounded-tj p-2">
              <div className="text-[10px] text-muted dark:text-muted-dark">موردين</div>
              <div className="text-[15px] font-bold text-text dark:text-text-dark tj-num">{summary.suppliers}</div>
            </div>
          </div>
          <button
            onClick={() => {
              downloadBackup(state);
              toast("تم تنزيل النسخة الاحتياطية", "success");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
          >
            <Ico name="download" size={14} sw={1.8} />
            تنزيل نسخة احتياطية الآن
          </button>
        </div>

        {/* ─── Restore (Import) ────────────────────────────────────────── */}
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-1">استعادة من نسخة احتياطية (Import)</h3>
          <p className="text-[12px] text-muted dark:text-muted-dark mb-3">
            ⚠️ سيستبدل كل البيانات الحالية بالبيانات من الملف. اعملي نسخة احتياطية قبل!
          </p>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
          >
            <Ico name="upload" size={14} sw={1.8} />
            استعادة من ملف JSON
          </button>
        </div>

        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-2">البيانات التجريبية</h3>
          <p className="text-[12px] text-muted dark:text-muted-dark mb-3">
            {isEmpty ? "التطبيق فاضي — استعيدي البيانات التجريبية لتجربة المزايا." : "امسحي كل شي وابدأي من الصفر لتشوفي التطبيق نظيف."}
          </p>
          {isEmpty ? (
            <button
              onClick={() => {
                if (!confirm("استعادة البيانات التجريبية؟")) return;
                resetStore("demo");
                toast("تم استعادة البيانات", "success");
              }}
              className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
            >
              استعادة البيانات التجريبية
            </button>
          ) : (
            <button
              onClick={() => {
                if (!confirm("مسح كل البيانات والبدء من الصفر؟ لا يمكن التراجع.")) return;
                resetStore("empty");
                resetAllExtensions();
                toast("تم المسح", "info");
              }}
              className="px-4 py-2 rounded-tj border border-danger dark:border-danger-dark text-[12px] font-bold text-danger dark:text-danger-dark hover:bg-danger-soft dark:hover:bg-danger-soft-dark"
            >
              ابدأ من الصفر
            </button>
          )}
        </div>

        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-2">بيانات الميزات الإضافية</h3>
          <p className="text-[12px] text-muted dark:text-muted-dark mb-3">
            عبّي البيانات التجريبية لكل المزايا الإضافية (عروض الأسعار، قسائم، طلبيات شراء، مرتجعات، مهام، عقود، ...) — لتجربة كاملة.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const result = seedAllExtensions(state, true);
                const total = Object.values(result.counts).reduce((s, n) => s + n, 0);
                toast(`تم تعبئة ${total} عنصر تجريبي عبر ${Object.keys(result.counts).length} ميزة`, "success");
                setTimeout(() => window.location.reload(), 1200);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
            >
              <Ico name="zap" size={13} sw={1.8} />
              عبّي البيانات الإضافية
            </button>
            <button
              onClick={() => {
                if (!confirm("مسح كل بيانات الميزات الإضافية؟")) return;
                resetAllExtensions();
                toast("تم مسح بيانات المزايا الإضافية", "info");
                setTimeout(() => window.location.reload(), 800);
              }}
              className="px-4 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark"
            >
              مسح البيانات الإضافية
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-divider/50 dark:border-divider-dark/50 last:border-0">
      <span className="text-[12px] text-muted dark:text-muted-dark">{label}</span>
      <span className="text-[12px] font-semibold text-text dark:text-text-dark">{value}</span>
    </div>
  );
}

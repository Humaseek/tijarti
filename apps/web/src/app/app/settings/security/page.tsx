"use client";

import { Screen, Card, Row } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Num } from "@/components/ui/num";
import { Btn, Toggle } from "@/components/ui/controls";
import { Ico } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { TwoFaMethod } from "@/lib/store/types";

const METHOD_LABELS: { value: Exclude<TwoFaMethod, null>; label: string; icon: IconName }[] = [
  { value: "sms",   label: "SMS",             icon: "msg"    },
  { value: "email", label: "البريد الإلكتروني", icon: "mail"   },
  { value: "app",   label: "تطبيق المصادقة",   icon: "shield" },
];

export default function SettingsSecurity() {
  const { state, updateSecuritySettings, endSession, endAllOtherSessions } = useStore();
  const { toast } = useToast();
  const sec = state.securitySettings;

  const toggle2FA = () => {
    if (sec.two_fa_enabled) {
      if (!confirm("إيقاف التحقق بخطوتين؟ هذا يقلل أمان حسابكِ.")) return;
      updateSecuritySettings({ two_fa_enabled: false, two_fa_method: null });
      toast("تم إيقاف التحقق بخطوتين", "warn");
    } else {
      updateSecuritySettings({ two_fa_enabled: true, two_fa_method: "sms" });
      toast("تم تفعيل التحقق بخطوتين عبر SMS", "success");
    }
  };

  const setMethod = (m: Exclude<TwoFaMethod, null>) => updateSecuritySettings({ two_fa_method: m });

  const endOne = (id: string, device: string) => {
    if (!confirm(`إنهاء جلسة ${device}؟`)) return;
    endSession(id);
    toast("تم إنهاء الجلسة", "info");
  };

  const endAll = () => {
    const other = sec.sessions.filter((s) => !s.current).length;
    if (other === 0) return;
    if (!confirm(`إنهاء ${other} جلسة أخرى؟`)) return;
    endAllOtherSessions();
    toast("تم إنهاء كل الجلسات الأخرى", "info");
  };

  const deleteAccount = () => {
    if (!confirm("⚠ تحذير: سيتم حذف كل بياناتكِ نهائياً. هل أنتِ متأكدة؟")) return;
    if (!confirm("هذه العملية لا يمكن التراجع عنها. تأكيد أخير؟")) return;
    toast("تم تسجيل طلب الحذف — بيتم التنفيذ بعد 30 يوم (فترة سماح)", "warn");
  };

  const otherCount = sec.sessions.filter((s) => !s.current).length;

  return (
    <Screen>
      <TopBar title="الأمان" />

      <div className="px-4 pb-4">
        <SectionHeader>كلمة المرور</SectionHeader>
        <Card
          onClick={() => toast("رح يصلك إيميل فيه رابط لتغيير كلمة المرور", "success")}
          className="p-3.5 flex items-center gap-3"
        >
          <div className="w-[30px] h-[30px] rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center">
            <Ico name="lock" size={14} className="text-muted dark:text-muted-dark" sw={1.6} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-text dark:text-text-dark">تغيير كلمة المرور</div>
            <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
              آخر تغيير: {sec.password_last_changed}
            </div>
          </div>
          <Ico name="chev" size={13} className="text-muted dark:text-muted-dark" style={{ transform: "scaleX(-1)" }} />
        </Card>

        <SectionHeader className="mt-4">التحقق بخطوتين</SectionHeader>
        <Card>
          <Row
            className={`px-3.5 py-3 justify-between gap-3 ${
              sec.two_fa_enabled ? "border-b border-divider dark:border-divider-dark" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-text dark:text-text-dark">تفعيل 2FA</div>
              <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                {sec.two_fa_enabled
                  ? "مفعّل — يطلب رمز إضافي عند الدخول"
                  : "معطّل — ننصح بتفعيله لأمان أعلى"}
              </div>
            </div>
            <Toggle on={sec.two_fa_enabled} onChange={toggle2FA} />
          </Row>

          {sec.two_fa_enabled && (
            <div className="px-3.5 py-3">
              <div className="text-[11px] text-subtext dark:text-subtext-dark font-semibold tracking-wide mb-2">
                طريقة التحقق
              </div>
              <Row className="gap-1.5">
                {METHOD_LABELS.map((m) => {
                  const active = sec.two_fa_method === m.value;
                  return (
                    <div
                      key={m.value}
                      onClick={() => setMethod(m.value)}
                      className={`tj-btn flex-1 py-2.5 px-1.5 rounded-tj border text-center flex flex-col items-center gap-1 ${
                        active
                          ? "bg-primary text-white dark:text-bg-dark border-transparent font-bold"
                          : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark font-medium"
                      }`}
                      role="button"
                      tabIndex={0}
                    >
                      <Ico name={m.icon} size={13} sw={1.8} />
                      <span className="text-[11px]">{m.label}</span>
                    </div>
                  );
                })}
              </Row>
            </div>
          )}
        </Card>

        <SectionHeader className="mt-4">الجلسات النشطة</SectionHeader>
        <Card>
          {sec.sessions.map((s, i, arr) => (
            <Row
              key={s.id}
              className={`px-3.5 py-3 gap-3 ${
                i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""
              }`}
            >
              <div
                className={`w-[30px] h-[30px] rounded-tj flex items-center justify-center ${
                  s.current ? "bg-success-soft dark:bg-success-soft-dark" : "bg-surface2 dark:bg-surface2-dark"
                }`}
              >
                <Ico
                  name="user"
                  size={14}
                  className={s.current ? "text-success dark:text-success-dark" : "text-muted dark:text-muted-dark"}
                  sw={1.6}
                />
              </div>
              <div className="flex-1 min-w-0">
                <Row className="gap-1.5">
                  <div className="text-[13px] font-semibold text-text dark:text-text-dark">{s.device}</div>
                  {s.current && (
                    <span className="text-[9px] px-1.5 py-[2px] rounded-tj bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark font-bold">
                      الحالي
                    </span>
                  )}
                </Row>
                <div className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                  {s.location} · {s.last_active}
                </div>
              </div>
              {!s.current && (
                <span
                  onClick={() => endOne(s.id, s.device)}
                  className="tj-btn text-[11px] text-danger dark:text-danger-dark font-semibold px-2 py-1"
                  role="button"
                  tabIndex={0}
                >
                  إنهاء
                </span>
              )}
            </Row>
          ))}
        </Card>

        {otherCount > 0 && (
          <div className="pt-2.5">
            <Btn ghost fullWidth onClick={endAll}>
              <Ico name="logout" size={14} sw={1.8} />
              إنهاء كل الجلسات الأخرى (<Num size={12} className="text-primary" weight={700}>{otherCount}</Num>)
            </Btn>
          </div>
        )}

        {/* Danger zone */}
        <div className="h-4" />
        <SectionHeader>منطقة خطرة</SectionHeader>
        <Card className="p-3.5 border border-danger dark:border-danger-dark bg-danger-soft dark:bg-danger-soft-dark">
          <Row className="gap-2.5 items-start mb-3">
            <Ico name="warn" size={18} className="text-danger dark:text-danger-dark flex-shrink-0" sw={1.8} />
            <div className="flex-1">
              <div className="text-[13px] font-bold text-danger dark:text-danger-dark">حذف الحساب</div>
              <div className="text-[11px] text-text dark:text-text-dark mt-1 leading-relaxed">
                سيتم حذف كل بياناتكِ (فواتير، زبائن، منتجات، مصاريف) نهائياً ولا يمكن التراجع.
              </div>
            </div>
          </Row>
          <Btn danger fullWidth onClick={deleteAccount}>
            <Ico name="trash" size={14} sw={1.8} />
            حذف الحساب نهائياً
          </Btn>
        </Card>
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

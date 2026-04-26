"use client";

import { DesktopPage } from "@/components/shell/desktop-page";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";

export default function Page() {
  const { state, updateSecuritySettings, endSession, endAllOtherSessions } = useStore();
  const { toast } = useToast();
  const sec = state.securitySettings;

  const toggle2FA = () => {
    updateSecuritySettings({ two_fa_enabled: !sec.two_fa_enabled });
    toast(sec.two_fa_enabled ? "تم إيقاف 2FA" : "تم تفعيل 2FA", "success");
  };

  const deleteAccount = () => {
    if (!confirm("⚠ حذف الحساب نهائياً؟")) return;
    if (!confirm("هذه العملية لا يمكن التراجع عنها")) return;
    toast("تم تسجيل طلب الحذف — فترة سماح 30 يوم", "warn");
  };

  const otherCount = sec.sessions.filter((s) => !s.current).length;

  return (
    <DesktopPage breadcrumb="الإعدادات" backHref="/desktop/settings" title="الأمان">
      <div className="grid grid-cols-2 gap-4">
        {/* Password */}
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center"><Ico name="shield" size={18} className="text-muted dark:text-muted-dark" sw={1.8} /></div>
            <div>
              <h3 className="text-[14px] font-bold text-text dark:text-text-dark">كلمة المرور</h3>
              <div className="text-[10px] text-muted dark:text-muted-dark">{sec.password_last_changed}</div>
            </div>
          </div>
          <button onClick={() => toast("رح يصلك إيميل فيه رابط التغيير", "success")} className="w-full py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark">تغيير كلمة المرور</button>
        </div>

        {/* 2FA */}
        <div className={`bg-surface dark:bg-surface-dark rounded-tj border p-5 ${sec.two_fa_enabled ? "border-success dark:border-success-dark" : "border-divider dark:border-divider-dark"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-tj flex items-center justify-center ${sec.two_fa_enabled ? "bg-success-soft dark:bg-success-soft-dark" : "bg-surface2 dark:bg-surface2-dark"}`}><Ico name="shield" size={18} className={sec.two_fa_enabled ? "text-success dark:text-success-dark" : "text-muted dark:text-muted-dark"} sw={1.8} /></div>
              <div>
                <h3 className="text-[14px] font-bold text-text dark:text-text-dark">المصادقة الثنائية (2FA)</h3>
                <div className="text-[10px] text-muted dark:text-muted-dark">{sec.two_fa_enabled ? "مفعّلة — طبقة حماية إضافية" : "غير مفعّلة"}</div>
              </div>
            </div>
            <input type="checkbox" checked={sec.two_fa_enabled} onChange={toggle2FA} className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden mt-4">
        <div className="px-5 py-3 border-b border-divider dark:border-divider-dark flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-text dark:text-text-dark">الأجهزة المسجّلة ({sec.sessions.length})</h3>
          {otherCount > 0 && <button onClick={() => { endAllOtherSessions(); toast(`تم إنهاء ${otherCount} جلسة`, "success"); }} className="text-[11px] text-danger dark:text-danger-dark font-bold hover:underline">إنهاء كل الجلسات الأخرى</button>}
        </div>
        {sec.sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-b border-divider/50 dark:border-divider-dark/50 last:border-0">
            <div className="w-8 h-8 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center"><Ico name="phone" size={14} className="text-muted dark:text-muted-dark" sw={1.8} /></div>
            <div className="flex-1">
              <div className="text-[12px] font-bold text-text dark:text-text-dark">{s.device}{s.current && <span className="text-[9px] text-success dark:text-success-dark ms-2">· هذا الجهاز</span>}</div>
              <div className="text-[10px] text-muted dark:text-muted-dark">{s.location} · {s.last_active}</div>
            </div>
            {!s.current && <button onClick={() => { endSession(s.id); toast("تم إنهاء الجلسة", "info"); }} className="text-[11px] text-danger dark:text-danger-dark font-bold hover:underline">إنهاء</button>}
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-danger dark:border-danger-dark p-5 mt-4">
        <h3 className="text-[13px] font-bold text-danger dark:text-danger-dark mb-2">منطقة خطرة</h3>
        <p className="text-[11px] text-muted dark:text-muted-dark mb-3">حذف الحساب نهائياً وكل البيانات المرتبطة. هناك فترة سماح 30 يوم قبل التنفيذ.</p>
        <button onClick={deleteAccount} className="flex items-center gap-1.5 px-3 py-2 rounded-tj bg-danger dark:bg-danger-dark text-white text-[12px] font-bold hover:opacity-90">
          <Ico name="trash" size={13} sw={1.8} />
          حذف الحساب
        </button>
      </div>
    </DesktopPage>
  );
}

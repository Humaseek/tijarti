"use client";

import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Avatar } from "@/components/ui/avatar";
import { Label, TextInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

type Role = "owner" | "manager" | "employee" | "accountant";

const ROLE_LABEL: Record<Role, string> = { owner: "صاحب", manager: "مدير", employee: "موظف", accountant: "محاسب" };
const ROLE_DESC: Record<Role, string> = {
  owner: "صلاحيات كاملة + حذف المصلحة + الفوترة",
  manager: "كل الصلاحيات عدا الحذف والفوترة",
  employee: "إدخال بيانات فقط — لا داشبورد ولا تقارير",
  accountant: "قراءة + تصدير التقارير فقط",
};
const ROLE_COLOR: Record<Role, string> = {
  owner: "bg-primary-soft text-primary",
  manager: "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark",
  employee: "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark",
  accountant: "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark",
};

interface Member { id: string; name: string; email: string; role: Role; status: "active" | "invited"; avatar_color?: string }

const INITIAL: Member[] = [
  { id: "u1", name: "ليلى حسن", email: "layla@tijarti.app", role: "owner", status: "active", avatar_color: "#0F6E56" },
  { id: "u2", name: "سناء — الموظفة", email: "sanaa.helper@gmail.com", role: "employee", status: "active", avatar_color: "#BA7517" },
];

export default function Page() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>(INITIAL);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("manager");

  const send = () => {
    if (!email.trim()) return;
    setMembers([...members, { id: `u${Date.now()}`, name: email.split("@")[0], email: email.trim(), role, status: "invited", avatar_color: "#2563A6" }]);
    toast(`تم إرسال الدعوة إلى ${email}`, "success");
    setEmail(""); setShowInvite(false);
  };

  const remove = (id: string) => {
    const m = members.find((x) => x.id === id);
    if (!m) return;
    if (m.role === "owner") { toast("ما بتقدري تحذفي الصاحب", "warn"); return; }
    if (!confirm(`إزالة ${m.name}؟`)) return;
    setMembers(members.filter((x) => x.id !== id));
  };

  return (
    <DesktopPage
      breadcrumb="الإعدادات"
      backHref="/desktop/settings"
      title="المستخدمين والصلاحيات"
      actions={<button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"><Ico name="plus" size={13} sw={2.4} />دعوة مستخدم</button>}
    >
      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-divider dark:border-divider-dark"><h3 className="text-[13px] font-bold text-text dark:text-text-dark">المستخدمين ({members.length})</h3></div>
        <table className="w-full">
          <thead>
            <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
              <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاسم</th>
              <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">البريد</th>
              <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الدور</th>
              <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الحالة</th>
              <th className="text-end px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark">
                <td className="px-5 py-3"><div className="flex items-center gap-2.5"><Avatar name={m.name} initial={m.name.charAt(0)} size={32} bg={m.avatar_color} /><span className="text-[12px] font-bold text-text dark:text-text-dark">{m.name}</span></div></td>
                <td className="px-5 py-3 text-[11px] text-muted dark:text-muted-dark" dir="ltr">{m.email}</td>
                <td className="px-5 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${ROLE_COLOR[m.role]}`}>{ROLE_LABEL[m.role]}</span></td>
                <td className="px-5 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-tj ${m.status === "active" ? "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark" : "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"}`}>{m.status === "active" ? "نشط" : "معلّق"}</span></td>
                <td className="px-5 py-3 text-end">
                  {m.role !== "owner" && <button onClick={() => remove(m.id)} className="text-[11px] text-danger dark:text-danger-dark font-bold hover:underline">إزالة</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-info-soft/40 dark:bg-info-soft-dark/40 border-s-[3px] border-s-info dark:border-s-info-dark rounded-tj p-4">
        <div className="flex items-center gap-2 mb-2"><Ico name="info" size={14} className="text-info dark:text-info-dark" sw={1.8} /><div className="text-[12px] font-bold text-info dark:text-info-dark">أنواع الصلاحيات</div></div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <div key={r} className="flex items-start gap-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-tj ${ROLE_COLOR[r]} flex-shrink-0`}>{ROLE_LABEL[r]}</span><span className="text-subtext dark:text-subtext-dark">{ROLE_DESC[r]}</span></div>
          ))}
        </div>
      </div>

      {showInvite && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowInvite(false)} />
          <div className="fixed top-1/2 start-1/2 z-50 w-[420px] bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5" style={{ transform: "translate(50%, -50%)" }}>
            <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-4">دعوة مستخدم جديد</h3>
            <div className="space-y-3 mb-4">
              <div><Label required>البريد الإلكتروني</Label><TextInput value={email} onChange={setEmail} placeholder="user@example.com" type="email" inputMode="email" dir="ltr" /></div>
              <div>
                <Label>الدور</Label>
                <Select value={role} options={[{value:"manager" as Role,label:ROLE_LABEL.manager},{value:"employee" as Role,label:ROLE_LABEL.employee},{value:"accountant" as Role,label:ROLE_LABEL.accountant}]} onChange={(v) => setRole(v as Role)} />
                <div className="text-[10px] text-muted dark:text-muted-dark mt-1.5">{ROLE_DESC[role]}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInvite(false)} className="flex-1 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark">إلغاء</button>
              <button onClick={send} disabled={!email.trim()} className={`flex-1 py-2 rounded-tj text-[12px] font-bold ${email.trim() ? "bg-primary text-white" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"}`}>إرسال الدعوة</button>
            </div>
          </div>
        </>
      )}
    </DesktopPage>
  );
}

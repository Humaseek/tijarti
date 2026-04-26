"use client";

import { useState } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Avatar } from "@/components/ui/avatar";
import { Btn, IconButton } from "@/components/ui/controls";
import { Label, TextInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

type Role = "owner" | "manager" | "employee" | "accountant";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
  invited_at?: string;
  avatar_color?: string;
}

const ROLE_LABEL: Record<Role, string> = {
  owner:      "صاحب",
  manager:    "مدير",
  employee:   "موظف",
  accountant: "محاسب",
};

const ROLE_DESC: Record<Role, string> = {
  owner:      "صلاحيات كاملة + حذف المصلحة + الفوترة",
  manager:    "كل الصلاحيات عدا الحذف والفوترة",
  employee:   "إدخال بيانات فقط — لا داشبورد ولا تقارير",
  accountant: "قراءة + تصدير التقارير فقط — لا تعديل",
};

const ROLE_COLOR: Record<Role, string> = {
  owner:      "bg-primary-soft text-primary",
  manager:    "bg-info-soft dark:bg-info-soft-dark text-info dark:text-info-dark",
  employee:   "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark",
  accountant: "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark",
};

// Mock members for the prototype
const INITIAL_MEMBERS: Member[] = [
  { id: "u1", name: "ليلى حسن",     email: "layla@tijarti.app",       role: "owner",      status: "active",  avatar_color: "#0F6E56" },
  { id: "u2", name: "سناء — الموظفة", email: "sanaa.helper@gmail.com",  role: "employee",   status: "active",  avatar_color: "#BA7517" },
];

export default function UsersManagement() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("manager");

  const active = members.filter((m) => m.status === "active");
  const invited = members.filter((m) => m.status === "invited");

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    const newMember: Member = {
      id: `u${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "invited",
      invited_at: new Date().toISOString(),
      avatar_color: "#2563A6",
    };
    setMembers([...members, newMember]);
    setInviteEmail("");
    setShowInvite(false);
    toast(`تم إرسال الدعوة إلى ${newMember.email}`, "success");
  };

  const remove = (id: string) => {
    const m = members.find((x) => x.id === id);
    if (!m) return;
    if (m.role === "owner") {
      toast("ما بتقدري تحذفي الصاحب", "warn");
      return;
    }
    if (!confirm(`إزالة ${m.name}؟`)) return;
    setMembers(members.filter((x) => x.id !== id));
    toast("تم الإزالة", "info");
  };

  const resendInvite = (id: string) => {
    toast("تم إعادة إرسال الدعوة", "success");
  };

  return (
    <Screen>
      <TopBar
        title="المستخدمين"
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => setShowInvite(true)}
            label="دعوة مستخدم"
            className="text-primary"
          />
        }
      />

      <div className="px-4 flex-1 overflow-auto">
        {/* Active members */}
        <div className="text-[11px] font-bold text-subtext dark:text-subtext-dark tracking-wider pb-2 px-1">
          نشطين ({active.length})
        </div>
        <Card className="mb-3.5">
          {active.map((m, i, arr) => (
            <Row
              key={m.id}
              className={`px-3.5 py-3 gap-3 ${i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
            >
              <Avatar name={m.name} initial={m.name.charAt(0)} size={40} bg={m.avatar_color} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-text dark:text-text-dark truncate">{m.name}</div>
                <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5 truncate" dir="ltr">{m.email}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[9px] font-bold px-2 py-[3px] rounded-tj ${ROLE_COLOR[m.role]}`}>
                  {ROLE_LABEL[m.role]}
                </span>
                {m.role !== "owner" && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => remove(m.id)}
                    className="tj-btn text-[10px] text-danger dark:text-danger-dark font-medium"
                  >
                    إزالة
                  </div>
                )}
              </div>
            </Row>
          ))}
        </Card>

        {/* Pending invitations */}
        {invited.length > 0 && (
          <>
            <div className="text-[11px] font-bold text-subtext dark:text-subtext-dark tracking-wider pb-2 px-1">
              دعوات معلّقة ({invited.length})
            </div>
            <Card className="mb-3.5">
              {invited.map((m, i, arr) => (
                <Row
                  key={m.id}
                  className={`px-3.5 py-3 gap-3 ${i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
                >
                  <div className="w-10 h-10 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center flex-shrink-0">
                    <Ico name="mail" size={16} className="text-muted dark:text-muted-dark" sw={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-text dark:text-text-dark truncate" dir="ltr">{m.email}</div>
                    <Row className="gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-tj ${ROLE_COLOR[m.role]}`}>
                        {ROLE_LABEL[m.role]}
                      </span>
                      <span className="text-[10px] text-muted dark:text-muted-dark">معلّقة</span>
                    </Row>
                  </div>
                  <Row className="gap-2">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => resendInvite(m.id)}
                      className="tj-btn text-[11px] text-primary font-medium"
                    >
                      إعادة
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => remove(m.id)}
                      className="tj-btn text-[11px] text-danger dark:text-danger-dark font-medium"
                    >
                      إلغاء
                    </div>
                  </Row>
                </Row>
              ))}
            </Card>
          </>
        )}

        {/* Role reference */}
        <Card className="p-3.5 bg-info-soft/50 dark:bg-info-soft-dark/50">
          <Row className="gap-2 mb-2">
            <Ico name="info" size={14} className="text-info dark:text-info-dark" sw={1.8} />
            <div className="text-[11px] font-bold text-info dark:text-info-dark">أنواع الصلاحيات</div>
          </Row>
          <div className="space-y-1.5 text-[11px] text-text dark:text-text-dark">
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <div key={r}>
                <b>{ROLE_LABEL[r]}:</b> <span className="text-subtext dark:text-subtext-dark">{ROLE_DESC[r]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowInvite(false)}
          />
          <div className="fixed inset-x-4 bottom-4 top-auto z-50 max-w-[360px] mx-auto">
            <Card className="p-4">
              <div className="text-[14px] font-bold text-text dark:text-text-dark mb-3">
                دعوة مستخدم جديد
              </div>
              <div className="mb-3">
                <Label required>البريد الإلكتروني</Label>
                <TextInput
                  value={inviteEmail}
                  onChange={setInviteEmail}
                  placeholder="user@example.com"
                  type="email"
                  inputMode="email"
                  dir="ltr"
                />
              </div>
              <div className="mb-3">
                <Label>الدور</Label>
                <Select
                  value={inviteRole}
                  options={[
                    { value: "manager" as Role,    label: ROLE_LABEL.manager },
                    { value: "employee" as Role,   label: ROLE_LABEL.employee },
                    { value: "accountant" as Role, label: ROLE_LABEL.accountant },
                  ]}
                  onChange={(v) => setInviteRole(v as Role)}
                />
                <div className="text-[11px] text-muted dark:text-muted-dark mt-1.5">
                  {ROLE_DESC[inviteRole]}
                </div>
              </div>
              <Row className="gap-2">
                <Btn fullWidth onClick={() => setShowInvite(false)}>إلغاء</Btn>
                <Btn primary fullWidth disabled={!inviteEmail.trim()} onClick={sendInvite}>
                  إرسال الدعوة
                </Btn>
              </Row>
            </Card>
          </div>
        </>
      )}

      <div className="h-4" />
    </Screen>
  );
}

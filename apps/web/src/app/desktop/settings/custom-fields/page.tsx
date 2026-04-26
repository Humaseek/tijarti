"use client";

import { useState } from "react";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Label, TextInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { CustomFieldEntityType, CustomFieldType } from "@/lib/store/types";

const ENTITY_LABEL: Record<CustomFieldEntityType, string> = {
  product: "منتجات", customer: "زبائن", supplier: "موردين", expense: "مصاريف", invoice: "فواتير", debt: "ذمم",
};
const TYPE_LABEL: Record<CustomFieldType, string> = {
  text: "نص قصير", number: "رقم", date: "تاريخ", select: "خيار واحد",
  multi_select: "عدة خيارات", boolean: "نعم/لا", url: "رابط", list: "قائمة",
};

export default function Page() {
  const { state, customFieldsFor, addCustomField, updateCustomField, deleteCustomField } = useStore();
  const { toast } = useToast();
  const [entity, setEntity] = useState<CustomFieldEntityType>("product");
  const [showAdd, setShowAdd] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState("");

  const fields = customFieldsFor(entity);

  const submit = () => {
    const name = fieldName.trim(); if (!name) return;
    const needsOpts = fieldType === "select" || fieldType === "multi_select";
    const opts = needsOpts ? options.split(",").map((o) => o.trim()).filter(Boolean) : undefined;
    if (needsOpts && (!opts || opts.length === 0)) { toast("ضيفي الخيارات", "warn"); return; }
    addCustomField({
      entity_type: entity, field_key: name.replace(/\s+/g, "_").toLowerCase(), field_name: name, field_type: fieldType, is_required: isRequired, options: opts,
      sort_order: fields.length + 1, show_in_list: true, show_in_search: false, is_active: true,
    });
    toast("تم إضافة الحقل", "success");
    setFieldName(""); setFieldType("text"); setIsRequired(false); setOptions(""); setShowAdd(false);
  };

  return (
    <DesktopPage
      breadcrumb="الإعدادات"
      backHref="/desktop/settings"
      title="الحقول الديناميكية"
      subtitle="حقول إضافية تضيفيها حسب طبيعة مصلحتك"
      actions={<button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"><Ico name="plus" size={13} sw={2.4} />حقل جديد</button>}
    >
      <div className="flex gap-1.5 flex-wrap mb-4">
        {(Object.keys(ENTITY_LABEL) as CustomFieldEntityType[]).map((t) => {
          const count = state.customFields.filter((f) => f.entity_type === t && f.is_active).length;
          const active = entity === t;
          return (
            <button key={t} onClick={() => setEntity(t)} className={`px-3 py-2 text-[12px] rounded-tj border font-medium ${active ? "bg-primary text-white border-transparent font-bold" : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark"}`}>
              {ENTITY_LABEL[t]}{count > 0 && ` (${count})`}
            </button>
          );
        })}
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
        {fields.length === 0 ? (
          <div className="py-12 text-center"><Ico name="tag" size={36} className="text-muted dark:text-muted-dark mx-auto mb-3" sw={1.2} /><div className="text-[13px] text-muted dark:text-muted-dark">لا حقول مخصصة لـ {ENTITY_LABEL[entity]}</div></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">الاسم</th>
                <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">النوع</th>
                <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">إجباري</th>
                <th className="text-start px-5 py-2.5 text-[11px] font-bold text-muted dark:text-muted-dark tracking-wider">نشط</th>
                <th className="text-end px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0 hover:bg-bg dark:hover:bg-bg-dark">
                  <td className="px-5 py-3 text-[12px] font-bold text-text dark:text-text-dark">{f.field_name}{f.options && f.options.length > 0 && <span className="text-[10px] text-muted dark:text-muted-dark ms-2 font-medium">({f.options.length} خيارات)</span>}</td>
                  <td className="px-5 py-3 text-[11px] text-muted dark:text-muted-dark">{TYPE_LABEL[f.field_type]}</td>
                  <td className="px-5 py-3 text-[11px]"><span className={f.is_required ? "text-danger dark:text-danger-dark font-bold" : "text-muted dark:text-muted-dark"}>{f.is_required ? "نعم" : "لا"}</span></td>
                  <td className="px-5 py-3"><input type="checkbox" checked={f.is_active} onChange={(e) => updateCustomField(f.id, { is_active: e.target.checked })} className="w-4 h-4" /></td>
                  <td className="px-5 py-3 text-end"><button onClick={() => { if (confirm(`حذف "${f.field_name}"؟`)) deleteCustomField(f.id); }} className="text-[11px] text-danger dark:text-danger-dark font-bold hover:underline">حذف</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAdd(false)} />
          <div className="fixed top-1/2 start-1/2 z-50 w-[480px] bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-5" style={{ transform: "translate(50%, -50%)" }}>
            <h3 className="text-[14px] font-bold text-text dark:text-text-dark mb-4">حقل جديد — {ENTITY_LABEL[entity]}</h3>
            <div className="space-y-3 mb-4">
              <div><Label required>اسم الحقل</Label><TextInput value={fieldName} onChange={setFieldName} placeholder="مثال: اللون" /></div>
              <div>
                <Label>نوع الحقل</Label>
                <Select value={fieldType} options={(Object.keys(TYPE_LABEL) as CustomFieldType[]).filter(k => k !== "list").map((k) => ({ value: k, label: TYPE_LABEL[k] }))} onChange={(v) => setFieldType(v as CustomFieldType)} />
              </div>
              {(fieldType === "select" || fieldType === "multi_select") && (
                <div>
                  <Label required>الخيارات</Label>
                  <TextInput value={options} onChange={setOptions} placeholder="أحمر, أسود, أبيض" />
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-1">افصلي بفاصلة</div>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="w-4 h-4" />
                <span className="text-[12px] text-text dark:text-text-dark">إجباري</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark">إلغاء</button>
              <button onClick={submit} disabled={!fieldName.trim()} className={`flex-1 py-2 rounded-tj text-[12px] font-bold ${fieldName.trim() ? "bg-primary text-white" : "bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark"}`}>إضافة</button>
            </div>
          </div>
        </>
      )}
    </DesktopPage>
  );
}

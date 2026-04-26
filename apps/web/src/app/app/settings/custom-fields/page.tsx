"use client";

import { useMemo, useState } from "react";
import { Screen, Card, Row, Empty } from "@/components/ui/layout";
import { TopBar } from "@/components/ui/top-bar";
import { Btn, IconButton, Toggle } from "@/components/ui/controls";
import { Label, TextInput, Select } from "@/components/ui/form";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import type { CustomFieldEntityType, CustomFieldType } from "@/lib/store/types";

const ENTITY_LABEL: Record<CustomFieldEntityType, string> = {
  product:  "منتجات",
  customer: "زبائن",
  supplier: "موردين",
  expense:  "مصاريف",
  invoice:  "فواتير",
  debt:     "ذمم",
};

const TYPE_LABEL: Record<CustomFieldType, string> = {
  text:         "نص قصير",
  number:       "رقم",
  date:         "تاريخ",
  select:       "خيار واحد",
  multi_select: "عدة خيارات",
  boolean:      "نعم/لا",
  url:          "رابط",
  list:         "قائمة",
};

export default function CustomFieldsPage() {
  const { state, customFieldsFor, addCustomField, updateCustomField, deleteCustomField } = useStore();
  const { toast } = useToast();

  const [entityType, setEntityType] = useState<CustomFieldEntityType>("product");
  const [showAdd, setShowAdd] = useState(false);

  // Add-form state
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("");

  const fields = customFieldsFor(entityType);

  const resetForm = () => {
    setFieldName("");
    setFieldType("text");
    setIsRequired(false);
    setOptionsText("");
    setShowAdd(false);
  };

  const submit = () => {
    const name = fieldName.trim();
    if (!name) return;
    const key = name.replace(/\s+/g, "_").toLowerCase();
    const needsOptions = fieldType === "select" || fieldType === "multi_select";
    const options = needsOptions
      ? optionsText.split(",").map((o) => o.trim()).filter(Boolean)
      : undefined;
    if (needsOptions && (!options || options.length === 0)) {
      toast("ضيفي الخيارات (مفصولة بفاصلة)", "warn");
      return;
    }
    addCustomField({
      entity_type: entityType,
      field_key: key,
      field_name: name,
      field_type: fieldType,
      is_required: isRequired,
      options,
      sort_order: fields.length + 1,
      show_in_list: true,
      show_in_search: false,
      is_active: true,
    });
    toast("تم إضافة الحقل", "success");
    resetForm();
  };

  return (
    <Screen>
      <TopBar
        title="الحقول الديناميكية"
        trailing={
          <IconButton
            name="plus"
            size={22}
            onClick={() => setShowAdd(true)}
            label="حقل جديد"
            className="text-primary"
          />
        }
      />

      {/* Entity tabs */}
      <div className="px-4 pb-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(Object.keys(ENTITY_LABEL) as CustomFieldEntityType[]).map((t) => {
            const active = entityType === t;
            const count = state.customFields.filter((f) => f.entity_type === t && f.is_active).length;
            return (
              <div
                key={t}
                onClick={() => setEntityType(t)}
                role="tab"
                tabIndex={0}
                className={`tj-btn whitespace-nowrap px-3 py-2 text-[12px] rounded-tj border font-medium ${
                  active
                    ? "bg-primary text-white dark:text-bg-dark border-transparent font-bold"
                    : "bg-surface dark:bg-surface-dark text-text dark:text-text-dark border-divider dark:border-divider-dark"
                }`}
              >
                {ENTITY_LABEL[t]}{count > 0 && ` (${count})`}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info card */}
      <div className="px-4 pb-3.5">
        <Card className="p-3.5 bg-info-soft/50 dark:bg-info-soft-dark/50">
          <Row className="gap-2 mb-1.5">
            <Ico name="info" size={14} className="text-info dark:text-info-dark" sw={1.8} />
            <div className="text-[11px] font-bold text-info dark:text-info-dark">شو هيّ الحقول الديناميكية؟</div>
          </Row>
          <div className="text-[11px] text-text dark:text-text-dark leading-relaxed">
            حقول إضافية تضيفيها حسب طبيعة مصلحتك. مثلاً بوتيك: "اللون" و"المقاس" للمنتج. كراج: "رقم السيارة" للزبون. هاي الحقول بتظهر في الفورمات والبحث والتقارير.
          </div>
        </Card>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        {fields.length === 0 ? (
          <Empty
            icon="tag"
            title={`لا حقول مخصصة لـ ${ENTITY_LABEL[entityType]}`}
            sub="اضغطي + لإضافة حقل جديد"
          />
        ) : (
          <Card>
            {fields.map((f, i, arr) => (
              <Row
                key={f.id}
                className={`px-3.5 py-3 gap-3 ${i < arr.length - 1 ? "border-b border-divider dark:border-divider-dark" : ""}`}
              >
                <div className="w-8 h-8 rounded-tj bg-surface2 dark:bg-surface2-dark flex items-center justify-center">
                  <Ico name="tag" size={13} className="text-muted dark:text-muted-dark" sw={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <Row className="gap-1.5">
                    <div className="text-[13px] font-semibold text-text dark:text-text-dark">{f.field_name}</div>
                    {f.is_required && (
                      <span className="text-[9px] font-bold text-danger dark:text-danger-dark">*</span>
                    )}
                  </Row>
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                    {TYPE_LABEL[f.field_type]}
                    {f.options && f.options.length > 0 && ` · ${f.options.length} خيارات`}
                  </div>
                </div>
                <Row className="gap-2">
                  <Toggle on={f.is_active} onChange={(v) => updateCustomField(f.id, { is_active: v })} />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (confirm(`حذف حقل "${f.field_name}"؟`)) deleteCustomField(f.id);
                    }}
                    className="tj-btn text-danger dark:text-danger-dark"
                    aria-label="حذف"
                  >
                    <Ico name="trash" size={15} sw={1.8} />
                  </div>
                </Row>
              </Row>
            ))}
          </Card>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={resetForm} />
          <div className="fixed inset-x-4 bottom-4 top-auto z-50 max-w-[360px] mx-auto">
            <Card className="p-4">
              <div className="text-[14px] font-bold text-text dark:text-text-dark mb-3">
                حقل جديد — {ENTITY_LABEL[entityType]}
              </div>
              <div className="mb-3">
                <Label required>اسم الحقل</Label>
                <TextInput value={fieldName} onChange={setFieldName} placeholder="مثال: اللون" />
              </div>
              <div className="mb-3">
                <Label>نوع الحقل</Label>
                <Select
                  value={fieldType}
                  options={[
                    { value: "text" as CustomFieldType,         label: TYPE_LABEL.text },
                    { value: "number" as CustomFieldType,       label: TYPE_LABEL.number },
                    { value: "date" as CustomFieldType,         label: TYPE_LABEL.date },
                    { value: "select" as CustomFieldType,       label: TYPE_LABEL.select },
                    { value: "multi_select" as CustomFieldType, label: TYPE_LABEL.multi_select },
                    { value: "boolean" as CustomFieldType,      label: TYPE_LABEL.boolean },
                    { value: "url" as CustomFieldType,          label: TYPE_LABEL.url },
                  ]}
                  onChange={(v) => setFieldType(v as CustomFieldType)}
                />
              </div>
              {(fieldType === "select" || fieldType === "multi_select") && (
                <div className="mb-3">
                  <Label required>الخيارات</Label>
                  <TextInput
                    value={optionsText}
                    onChange={setOptionsText}
                    placeholder="أحمر, أسود, أبيض"
                  />
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-1.5">
                    افصلي بفاصلة بين كل خيار
                  </div>
                </div>
              )}
              <Card className="p-3 mb-3">
                <Row className="justify-between">
                  <div className="text-[12px] font-semibold text-text dark:text-text-dark">إجباري؟</div>
                  <Toggle on={isRequired} onChange={setIsRequired} />
                </Row>
              </Card>
              <Row className="gap-2">
                <Btn fullWidth onClick={resetForm}>إلغاء</Btn>
                <Btn primary fullWidth disabled={!fieldName.trim()} onClick={submit}>
                  إضافة الحقل
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

"use client";

/**
 * CategoryCombobox — searchable dropdown for expense categories with
 * inline edit + delete on every CUSTOM category row.
 *
 * Behaviour:
 *   - Trigger button shows the selected category (icon + color + name)
 *   - Click → opens a panel with a search input + filtered list
 *   - Type to filter; if no match, "+ إضافة" creates a custom on the spot
 *   - Each CUSTOM category row has a pencil button → expands inline to
 *     show: rename input + delete button. The icon+color update live as
 *     the user types the new name.
 *   - Built-in categories are read-only (they're shipped with the app).
 *   - Keyboard: ↑↓ navigate, Enter select, Esc close
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Ico } from "./icon";
import type { IconName } from "@/lib/icons";
import {
  type CustomCategory,
  BUILTIN_CATEGORIES,
  suggestIconAndColor,
  addCustomCategory,
  loadCustomCategories,
  deleteCustomCategory,
  updateCustomCategory,
} from "@/lib/custom-categories";

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

interface ResolvedOption {
  value: string;
  label: string;
  icon: IconName;
  color: string;
  /** "transient" = the current expense's category isn't in the dropdown
       (e.g. legacy data); we display it so the user sees it but it's not
       saved as a custom unless they edit it. */
  source: "builtin" | "custom" | "transient";
  /** Only set for customs — needed for edit/delete operations. */
  id?: string;
}

export function CategoryCombobox({ value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [customs, setCustoms] = useState<CustomCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCustoms(loadCustomCategories());
      setQuery("");
      setHighlight(0);
      setEditingId(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDocClick);
    return () => window.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const allOptions = useMemo<ResolvedOption[]>(() => {
    const builtins: ResolvedOption[] = BUILTIN_CATEGORIES.map((c) => ({
      value: c.name,
      label: c.name,
      icon: c.icon,
      color: c.color,
      source: "builtin",
    }));
    const custs: ResolvedOption[] = customs.map((c) => ({
      value: c.name,
      label: c.name,
      icon: c.icon,
      color: c.color,
      source: "custom",
      id: c.id,
    }));
    const list = [...builtins, ...custs];
    // If the currently-selected category isn't in the list (e.g. an old
    // expense saved with "كهرباء" before we trimmed the built-ins), show
    // it as a transient row so the user can still see and switch from it.
    if (value && !list.some((o) => o.value === value)) {
      const { icon, color } = suggestIconAndColor(value);
      list.push({ value, label: value, icon, color, source: "transient" });
    }
    return list;
  }, [customs, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    const startsWith: ResolvedOption[] = [];
    const includes: ResolvedOption[] = [];
    for (const opt of allOptions) {
      const l = opt.label.toLowerCase();
      if (l.startsWith(q)) startsWith.push(opt);
      else if (l.includes(q)) includes.push(opt);
    }
    return [...startsWith, ...includes];
  }, [allOptions, query]);

  const trimmedQuery = query.trim();
  const exactMatch = filtered.some((o) => o.label === trimmedQuery);
  const showCreate = trimmedQuery.length >= 2 && !exactMatch;
  const createPreview = useMemo(
    () => (showCreate ? suggestIconAndColor(trimmedQuery) : null),
    [showCreate, trimmedQuery]
  );

  const selected = useMemo<ResolvedOption | null>(() => {
    return allOptions.find((o) => o.value === value) ?? null;
  }, [allOptions, value]);

  // Live preview for the inline edit row (icon + color update as user types)
  const editPreview = useMemo(
    () => (editingId ? suggestIconAndColor(editName.trim() || "تصنيف") : null),
    [editingId, editName]
  );

  const pickIndex = (idx: number) => {
    if (idx < filtered.length) {
      onChange(filtered[idx].value);
      setOpen(false);
    } else if (showCreate && idx === filtered.length) {
      handleCreate();
    }
  };

  const handleCreate = () => {
    if (!showCreate) return;
    const cat = addCustomCategory(trimmedQuery);
    setCustoms(loadCustomCategories());
    onChange(cat.name);
    setOpen(false);
  };

  const startEdit = (opt: ResolvedOption) => {
    if (opt.source !== "custom" || !opt.id) return;
    setEditingId(opt.id);
    setEditName(opt.label);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (trimmed.length < 2) return;
    const updated = updateCustomCategory(editingId, trimmed);
    setCustoms(loadCustomCategories());
    setEditingId(null);
    if (updated && value === filtered.find((o) => o.id === editingId)?.value) {
      // The currently-selected category was renamed → update parent
      onChange(updated.name);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = (opt: ResolvedOption) => {
    if (opt.source !== "custom" || !opt.id) return;
    if (!confirm(`حذف التصنيف "${opt.label}"؟`)) return;
    deleteCustomCategory(opt.id);
    setCustoms(loadCustomCategories());
    setEditingId(null);
    // If the deleted category was selected, fall back to "أخرى"
    if (value === opt.value) onChange("أخرى");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const max = filtered.length + (showCreate ? 1 : 0) - 1;
    if (max < 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, max));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickIndex(highlight);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 ps-3 pe-3 py-3 rounded-tj border bg-surface dark:bg-surface-dark text-text dark:text-text-dark text-sm font-bold outline-none focus:border-primary"
        style={{ borderColor: selected?.color ?? "rgb(var(--tj-divider))" }}
      >
        {selected ? (
          <>
            <div
              className="w-7 h-7 rounded-tj flex items-center justify-center flex-shrink-0"
              style={{ background: `${selected.color}1f`, color: selected.color }}
            >
              <Ico name={selected.icon} size={14} sw={1.8} style={{ color: selected.color }} />
            </div>
            <span className="flex-1 text-start">{selected.label}</span>
          </>
        ) : (
          <span className="flex-1 text-start text-muted dark:text-muted-dark">اختاري تصنيف</span>
        )}
        <Ico
          name={open ? "chevUp" : "chevDown"}
          size={14}
          sw={1.8}
          className="text-muted dark:text-muted-dark"
        />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj shadow-2xl z-[60] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-divider dark:border-divider-dark bg-bg dark:bg-bg-dark">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj">
              <Ico name="search" size={13} className="text-muted dark:text-muted-dark" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onKey}
                placeholder="ابحثي أو اكتبي تصنيف جديد..."
                className="flex-1 bg-transparent text-[13px] text-text dark:text-text-dark outline-none border-0 font-ar"
                dir="rtl"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted dark:text-muted-dark hover:text-danger"
                  aria-label="مسح البحث"
                >
                  <Ico name="close" size={12} sw={2} />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-[280px] overflow-y-auto">
            {filtered.length === 0 && !showCreate && (
              <div className="px-3 py-4 text-[12px] text-muted dark:text-muted-dark text-center">
                لا تصنيفات مطابقة
              </div>
            )}
            {filtered.map((opt, i) => {
              const isEditing = editingId === opt.id && opt.source === "custom";
              const previewColor = isEditing && editPreview ? editPreview.color : opt.color;
              const previewIcon: IconName = isEditing && editPreview ? editPreview.icon : opt.icon;
              return (
                <div
                  key={opt.id ?? opt.value}
                  className={`border-b border-divider/30 dark:border-divider-dark/30 last:border-0 ${
                    !isEditing && highlight === i ? "bg-bg dark:bg-bg-dark" : ""
                  } ${!isEditing && opt.value === value ? "bg-primary-soft dark:bg-primary-soft/30" : ""}`}
                >
                  {/* Normal row */}
                  {!isEditing && (
                    <div
                      className="flex items-center gap-3 px-3 py-2"
                      onMouseEnter={() => setHighlight(i)}
                    >
                      <button
                        type="button"
                        onClick={() => pickIndex(i)}
                        className="flex items-center gap-3 flex-1 text-start"
                      >
                        <div
                          className="w-7 h-7 rounded-tj flex items-center justify-center flex-shrink-0"
                          style={{ background: `${opt.color}1f`, color: opt.color }}
                        >
                          <Ico name={opt.icon} size={13} sw={1.8} style={{ color: opt.color }} />
                        </div>
                        <span className="flex-1 text-[12.5px] text-text dark:text-text-dark font-bold">{opt.label}</span>
                        {opt.value === value && (
                          <Ico name="check" size={13} sw={2.4} className="text-primary" />
                        )}
                      </button>
                      {/* Transient badge (legacy/unknown category) */}
                      {opt.source === "transient" && (
                        <span className="text-[9px] font-bold text-muted dark:text-muted-dark px-1.5 py-0.5 rounded bg-bg dark:bg-bg-dark">حالي</span>
                      )}
                      {/* Edit pencil — only on customs (built-ins are read-only) */}
                      {opt.source === "custom" && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startEdit(opt); }}
                          className="w-7 h-7 rounded-tj flex items-center justify-center text-muted dark:text-muted-dark hover:bg-bg dark:hover:bg-bg-dark hover:text-primary"
                          aria-label={`تعديل ${opt.label}`}
                          title="تعديل أو حذف"
                        >
                          <Ico name="edit" size={12} sw={1.8} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="px-3 py-3 bg-bg dark:bg-bg-dark border-y-2 border-primary/40">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-9 h-9 rounded-tj flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{
                            background: `${previewColor}1f`,
                            border: `2px solid ${previewColor}`,
                            color: previewColor,
                          }}
                        >
                          <Ico name={previewIcon} size={16} sw={1.8} />
                        </div>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          className="flex-1 bg-surface dark:bg-surface-dark border border-divider dark:border-divider-dark rounded-tj px-2.5 py-2 text-[13px] text-text dark:text-text-dark outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={editName.trim().length < 2}
                          className="flex-1 px-3 py-2 rounded-tj text-white text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: editName.trim().length >= 2 ? previewColor : undefined }}
                        >
                          💾 حفظ
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[11px] font-bold text-text dark:text-text-dark"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(opt)}
                          className="px-3 py-2 rounded-tj border border-danger dark:border-danger-dark text-[11px] font-bold text-danger dark:text-danger-dark hover:bg-danger-soft dark:hover:bg-danger-soft-dark flex items-center gap-1"
                          aria-label="حذف"
                        >
                          <Ico name="trash" size={11} sw={1.8} />
                          حذف
                        </button>
                      </div>
                      <p className="text-[10px] text-muted dark:text-muted-dark mt-1.5">
                        الأيقونة واللون يتحدثان تلقائياً حسب الاسم
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Create-new row */}
            {showCreate && createPreview && !editingId && (
              <button
                type="button"
                onMouseEnter={() => setHighlight(filtered.length)}
                onClick={handleCreate}
                className={`w-full flex items-center gap-3 px-3 py-3 text-start border-t-2 border-dashed border-primary/40 ${
                  highlight === filtered.length ? "bg-primary-soft/40 dark:bg-primary-soft/20" : "bg-primary-soft/20 dark:bg-primary-soft/10"
                }`}
              >
                <div
                  className="w-7 h-7 rounded-tj flex items-center justify-center flex-shrink-0"
                  style={{ background: `${createPreview.color}1f`, color: createPreview.color }}
                >
                  <Ico name={createPreview.icon} size={13} sw={1.8} style={{ color: createPreview.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-primary flex items-center gap-1">
                    <Ico name="plus" size={11} sw={2.2} />
                    إضافة &quot;{trimmedQuery}&quot; كتصنيف جديد
                  </div>
                  <div className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                    أيقونة ولون مقترحة تلقائياً ↑
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

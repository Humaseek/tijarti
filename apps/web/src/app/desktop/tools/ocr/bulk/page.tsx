"use client";

/**
 * Bulk PDF Upload — process many invoices at once.
 *
 * UX flow:
 *   1. Drag-drop or pick multiple PDFs
 *   2. Files are queued and processed in parallel (3 at a time to keep UI responsive)
 *   3. Each row shows: file name, status (pending → reading → done/error), and
 *      editable fields (vendor, amount, date, category) once parsed
 *   4. User reviews, can deselect rows, then "حفظ المحدد" saves all to expenses
 */

import { useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DesktopPage } from "@/components/shell/desktop-page";
import { Ico } from "@/components/ui/icon";
import { useStore } from "@/lib/store/store-context";
import { useToast } from "@/components/ui/toast";
import { EXPENSE_CATEGORIES, type ExpenseCategory, type PaymentMethod } from "@/lib/store/types";
import { todayIso } from "@/lib/dates";
import { extractInvoiceFromPdf } from "@/lib/pdf-extract";

type RowStatus = "pending" | "reading" | "done" | "error";

interface BulkRow {
  id: string;
  file: File;
  fileName: string;
  status: RowStatus;
  amount: number;
  vendor: string;
  date: string;
  category: ExpenseCategory;
  source: string;
  error?: string;
  selected: boolean;
}

const MAX_PARALLEL = 3;

function newRow(file: File): BulkRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    fileName: file.name,
    status: "pending",
    amount: 0,
    vendor: file.name.replace(/\.pdf$/i, ""),
    date: todayIso(),
    category: "أخرى",
    source: "",
    selected: true,
  };
}

export default function BulkOcrPage() {
  const router = useRouter();
  const { addExpense } = useStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => r.status === "done").length;
    const errored = rows.filter((r) => r.status === "error").length;
    const selectedSum = rows
      .filter((r) => r.selected && r.status === "done")
      .reduce((s, r) => s + r.amount, 0);
    const selectedCount = rows.filter((r) => r.selected && r.status === "done").length;
    return { total, done, errored, selectedSum, selectedCount };
  }, [rows]);

  const updateRow = (id: string, patch: Partial<BulkRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const processOne = async (row: BulkRow): Promise<void> => {
    updateRow(row.id, { status: "reading" });
    try {
      const ext = await extractInvoiceFromPdf(row.file);
      updateRow(row.id, {
        status: "done",
        amount: ext.amount,
        vendor: ext.vendor,
        date: ext.date,
        category: ext.category,
        source: ext.source || "heuristic",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateRow(row.id, { status: "error", error: msg.slice(0, 120) });
    }
  };

  const processAll = async (toProcess: BulkRow[]) => {
    setRunning(true);
    // simple worker-pool: keep MAX_PARALLEL in flight at a time
    const queue = [...toProcess];
    const workers: Promise<void>[] = [];
    const next = async (): Promise<void> => {
      const item = queue.shift();
      if (!item) return;
      await processOne(item);
      return next();
    };
    for (let i = 0; i < Math.min(MAX_PARALLEL, queue.length); i++) workers.push(next());
    await Promise.all(workers);
    setRunning(false);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const pdfs = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length === 0) {
      toast("ما لقينا ملفات PDF — اختاري ملفات PDF فقط", "warn");
      return;
    }
    if (pdfs.length < files.length) {
      toast(`تم تجاهل ${files.length - pdfs.length} ملف غير PDF`, "info");
    }
    const newRows = pdfs.map(newRow);
    setRows((prev) => [...prev, ...newRows]);
    await processAll(newRows);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    await onFiles(e.dataTransfer.files);
  };

  const saveSelected = () => {
    const toSave = rows.filter((r) => r.selected && r.status === "done");
    if (toSave.length === 0) {
      toast("ما في صفوف محددة للحفظ", "warn");
      return;
    }
    for (const r of toSave) {
      addExpense({
        amount: r.amount,
        category: r.category,
        description: `فاتورة من ${r.vendor}`,
        payment_method: "نقدي" as PaymentMethod,
        expense_date: r.date,
        receipt_url: null,
      });
    }
    toast(`تم حفظ ${toSave.length} مصروف`, "success");
    router.push("/desktop/expenses");
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const retryRow = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    await processOne(row);
  };

  return (
    <DesktopPage
      breadcrumb="الأدوات"
      backHref="/desktop/tools/ocr"
      title="رفع متعدد للفواتير"
      subtitle="ارفعي عدة فواتير PDF دفعة واحدة — نقرأها كلها بالتوازي"
    >
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`bg-surface dark:bg-surface-dark rounded-tj border-2 border-dashed p-8 text-center mb-4 transition-colors ${
          dragOver
            ? "border-primary bg-primary-soft/30 dark:bg-primary-soft/10"
            : "border-divider dark:border-divider-dark"
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-primary-soft dark:bg-primary-soft/20 flex items-center justify-center mx-auto mb-3">
          <Ico name="receipt" size={28} className="text-primary" sw={1.6} />
        </div>
        <div className="text-[14px] font-bold text-text dark:text-text-dark mb-1">
          اسحبي ملفات PDF هنا
        </div>
        <div className="text-[11px] text-muted dark:text-muted-dark mb-4">
          أو اضغطي الزر لاختيار عدة ملفات (PDF فقط)
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90"
        >
          اختاري ملفات
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {/* Stats bar */}
      {rows.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark mb-0.5">إجمالي الملفات</div>
            <div className="text-[18px] font-bold text-text dark:text-text-dark tj-num">{stats.total}</div>
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark mb-0.5">جاهزة</div>
            <div className="text-[18px] font-bold text-success dark:text-success-dark tj-num">{stats.done}</div>
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark mb-0.5">فشلت</div>
            <div className="text-[18px] font-bold text-danger dark:text-danger-dark tj-num">{stats.errored}</div>
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark p-3">
            <div className="text-[10px] text-muted dark:text-muted-dark mb-0.5">مجموع المحدد</div>
            <div className="text-[18px] font-bold text-primary tj-num">
              {stats.selectedSum.toLocaleString()} ₪
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="text-[12px] text-muted dark:text-muted-dark">
            {running ? (
              <span className="inline-flex items-center gap-2 text-primary font-bold">
                <span className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
                جاري قراءة الفواتير...
              </span>
            ) : (
              <>راجعي الحقول أدناه ثم احفظي</>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRows([])}
              disabled={running}
              className="px-3 py-2 rounded-tj border border-divider dark:border-divider-dark text-[12px] font-bold text-text dark:text-text-dark hover:bg-bg dark:hover:bg-bg-dark disabled:opacity-40"
            >
              مسح الكل
            </button>
            <button
              onClick={saveSelected}
              disabled={running || stats.selectedCount === 0}
              className="px-4 py-2 rounded-tj bg-primary text-white text-[12px] font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              حفظ المحدد ({stats.selectedCount})
            </button>
          </div>
        </div>
      )}

      {/* Results table */}
      {rows.length > 0 && (
        <div className="bg-surface dark:bg-surface-dark rounded-tj border border-divider dark:border-divider-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-bg dark:bg-bg-dark border-b border-divider dark:border-divider-dark">
                <th className="px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark w-10">
                  <input
                    type="checkbox"
                    checked={rows.every((r) => r.selected)}
                    onChange={(e) => {
                      const sel = e.target.checked;
                      setRows((prev) => prev.map((r) => ({ ...r, selected: sel })));
                    }}
                  />
                </th>
                <th className="text-start px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">الملف</th>
                <th className="text-start px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">الحالة</th>
                <th className="text-start px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">المورّد</th>
                <th className="text-end px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">المبلغ</th>
                <th className="text-start px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">التاريخ</th>
                <th className="text-start px-3 py-2 text-[10px] font-bold text-muted dark:text-muted-dark">التصنيف</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-divider/50 dark:border-divider-dark/50 last:border-0">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={r.selected}
                      disabled={r.status !== "done"}
                      onChange={(e) => updateRow(r.id, { selected: e.target.checked })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-[11px] text-text dark:text-text-dark truncate max-w-[180px]" title={r.fileName}>
                      📄 {r.fileName}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} source={r.source} error={r.error} />
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "done" ? (
                      <input
                        type="text"
                        value={r.vendor}
                        onChange={(e) => updateRow(r.id, { vendor: e.target.value })}
                        className="w-full bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded px-2 py-1 text-[11px]"
                      />
                    ) : (
                      <span className="text-[11px] text-muted dark:text-muted-dark">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "done" ? (
                      <input
                        type="number"
                        value={r.amount}
                        onChange={(e) => updateRow(r.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-24 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded px-2 py-1 text-[11px] tj-num text-end"
                      />
                    ) : (
                      <span className="text-[11px] text-muted dark:text-muted-dark">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "done" ? (
                      <input
                        type="date"
                        value={r.date}
                        onChange={(e) => updateRow(r.id, { date: e.target.value })}
                        className="w-32 bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded px-2 py-1 text-[11px] tj-num"
                      />
                    ) : (
                      <span className="text-[11px] text-muted dark:text-muted-dark">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.status === "done" ? (
                      <select
                        value={r.category}
                        onChange={(e) => updateRow(r.id, { category: e.target.value as ExpenseCategory })}
                        className="bg-bg dark:bg-bg-dark border border-divider dark:border-divider-dark rounded px-2 py-1 text-[11px] max-w-[140px]"
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-muted dark:text-muted-dark">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      {r.status === "error" && (
                        <button
                          onClick={() => retryRow(r.id)}
                          className="text-[10px] text-primary font-bold hover:underline"
                          title="إعادة المحاولة"
                        >
                          ↻
                        </button>
                      )}
                      <button
                        onClick={() => removeRow(r.id)}
                        className="text-[10px] text-danger dark:text-danger-dark font-bold hover:underline"
                        title="إزالة"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DesktopPage>
  );
}

function StatusBadge({
  status,
  source,
  error,
}: {
  status: RowStatus;
  source: string;
  error?: string;
}) {
  if (status === "pending") {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-tj bg-bg dark:bg-bg-dark text-muted dark:text-muted-dark">
        في الانتظار
      </span>
    );
  }
  if (status === "reading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-tj bg-primary-soft dark:bg-primary-soft/20 text-primary">
        <span className="animate-spin w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full" />
        جاري القراءة
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-tj bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark"
        title={error}
      >
        ✕ فشل
      </span>
    );
  }
  // done
  const isHeur = !source || source === "heuristic";
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-tj ${
        isHeur
          ? "bg-warning-soft dark:bg-warning-soft-dark text-warning dark:text-warning-dark"
          : "bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark"
      }`}
      title={source}
    >
      {isHeur ? "⚠️ عام" : `✓ ${source}`}
    </span>
  );
}

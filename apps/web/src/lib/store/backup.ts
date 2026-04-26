/**
 * Backup & Restore — JSON export/import for the entire main store.
 *
 * The exported file is a single JSON object that mirrors `StoreState` plus
 * a small wrapper with version + timestamp metadata. This lets us
 * gracefully handle schema migrations later.
 */

import type { StoreState } from "./types";

export const BACKUP_VERSION = 1;

export interface BackupEnvelope {
  /** Tijarti backup format version. Increment on incompatible schema changes. */
  version: number;
  /** ISO date when the backup was created. */
  createdAt: string;
  /** Human-friendly app name to confirm the file source. */
  app: "tijarti";
  /** The actual store state — same shape as in-memory `StoreState`. */
  state: StoreState;
}

/** Pretty-print the store as a downloadable JSON envelope. */
export function serializeBackup(state: StoreState): string {
  // Strip the in-flight draft (transient UI state) before exporting.
  const exportable: StoreState = { ...state, draft: null };
  const envelope: BackupEnvelope = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    app: "tijarti",
    state: exportable,
  };
  return JSON.stringify(envelope, null, 2);
}

/** Trigger a browser download for a backup file. */
export function downloadBackup(state: StoreState, filename?: string): void {
  const json = serializeBackup(state);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `tijarti-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Allow the browser a tick to start the download before revoking the URL.
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export interface ParsedBackup {
  ok: true;
  state: StoreState;
  meta: { version: number; createdAt: string };
}
export interface FailedBackup {
  ok: false;
  error: string;
}

/** Parse a JSON string into a validated StoreState, or return an error. */
export function parseBackup(json: string): ParsedBackup | FailedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "ملف JSON غير صالح" };
  }
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "محتوى الملف ليس JSON صالحًا" };
  }
  const env = raw as Partial<BackupEnvelope>;
  if (env.app !== "tijarti") {
    return { ok: false, error: "هذا الملف ليس نسخة احتياطية لـ Tijarti" };
  }
  if (typeof env.version !== "number") {
    return { ok: false, error: "النسخة الاحتياطية غير صحيحة (لا يوجد رقم إصدار)" };
  }
  if (env.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: `هذه النسخة الاحتياطية أحدث (v${env.version}) من التطبيق الحالي (v${BACKUP_VERSION})`,
    };
  }
  const s = env.state as Partial<StoreState> | undefined;
  if (!s || typeof s !== "object") {
    return { ok: false, error: "النسخة الاحتياطية لا تحتوي على بيانات" };
  }
  // Sanity check the most important arrays
  if (
    !Array.isArray(s.expenses) ||
    !Array.isArray(s.customers) ||
    !Array.isArray(s.products) ||
    !Array.isArray(s.invoices)
  ) {
    return { ok: false, error: "بنية البيانات في الملف غير مكتملة" };
  }
  return {
    ok: true,
    state: s as StoreState,
    meta: { version: env.version, createdAt: env.createdAt ?? "" },
  };
}

/** Read a File (from <input type="file">) and parse it as a backup. */
export async function readBackupFile(file: File): Promise<ParsedBackup | FailedBackup> {
  try {
    const text = await file.text();
    return parseBackup(text);
  } catch {
    return { ok: false, error: "تعذّرت قراءة الملف" };
  }
}

/** Quick stats summary of what's in a backup — for the import preview. */
export function backupSummary(state: StoreState): {
  expenses: number;
  customers: number;
  products: number;
  invoices: number;
  checks: number;
  suppliers: number;
} {
  return {
    expenses: state.expenses?.length ?? 0,
    customers: state.customers?.length ?? 0,
    products: state.products?.length ?? 0,
    invoices: state.invoices?.length ?? 0,
    checks: state.checks?.length ?? 0,
    suppliers: state.suppliers?.length ?? 0,
  };
}

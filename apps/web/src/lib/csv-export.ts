/**
 * CSV export helpers.
 *
 * Produces UTF-8 CSV files with a BOM so Excel opens Arabic text correctly.
 * All string values are quoted to handle commas, quotes, and newlines.
 */

/** A column definition — `header` is the label, `get` extracts the value from a row. */
export interface CsvColumn<T> {
  header: string;
  get: (row: T) => string | number | null | undefined;
}

/**
 * Convert an array of rows to a CSV string with a leading UTF-8 BOM
 * so Microsoft Excel opens Arabic content correctly.
 */
export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(c.get(r))).join(",")).join("\n");
  return "\uFEFF" + header + "\n" + body;
}

/**
 * Trigger a browser download of CSV content.
 * `filename` should NOT include the extension; ".csv" is appended automatically.
 */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** One-call helper: rows + columns → file download. */
export function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  downloadCsv(filename, rowsToCsv(rows, columns));
}

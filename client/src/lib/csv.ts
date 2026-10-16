import { buildCsv, type CsvCell } from "@shared/csv";

/** Today's date as a filename-safe stamp, e.g. "2026-10-15". */
export function csvDateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Builds an RFC-4180 CSV (UTF-8 BOM, CRLF) and triggers a browser download.
 * The filename gets a "-YYYY-MM-DD" date stamp appended.
 */
export function downloadCsv(baseName: string, headers: string[], rows: CsvCell[][]): void {
  const csv = buildCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}-${csvDateStamp()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the browser has had a chance to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

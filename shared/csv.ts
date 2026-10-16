// RFC 4180-style CSV building, shared by client downloads (and server-side exports).
// Always emits a UTF-8 BOM so Excel opens non-ASCII characters correctly.

export type CsvCell = string | number | boolean | null | undefined;

export function csvEscapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(headers: string[], rows: CsvCell[][]): string {
  const lines: string[] = [headers.map(csvEscapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvEscapeCell).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

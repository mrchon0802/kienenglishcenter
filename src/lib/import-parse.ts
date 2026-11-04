import { isValidISODate } from "./month";
import { normalizeText } from "./text";

export type CellValue = string | number | boolean | Date | null | undefined;
export type SheetRows = CellValue[][];

/** Tách CSV có dấu ngoặc kép; tự nhận dấu phân cách là phẩy, chấm phẩy hoặc tab. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", "\t", ","]
    .map((d) => ({ d, n: firstLine.split(d).length }))
    .sort((a, b) => b.n - a.n)[0].d;

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Đọc file .xlsx hoặc .csv ở trình duyệt, trả về các dòng (dòng đầu là tiêu đề). */
export async function readSpreadsheet(file: File): Promise<SheetRows> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    return parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  }
  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/universal");
    return (await readSheet(await file.arrayBuffer())) as SheetRows;
  }
  throw new Error("Chỉ hỗ trợ file .xlsx hoặc .csv. File .xls cũ cần được lưu lại thành .xlsx.");
}

export function cellToString(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return "";
  return String(value).trim();
}

/** "Họ và tên" -> "hovaten": bỏ dấu, chữ thường, bỏ ký tự không phải chữ/số. */
export function compactKey(text: string): string {
  return normalizeText(text).replace(/[^a-z0-9]/g, "");
}

/** Tìm vị trí cột theo tên tiêu đề (không phân biệt dấu/hoa thường). Trả về { tênChuẩn: chỉSốCột }. */
export function mapHeaders(header: CellValue[], aliases: Record<string, string[]>): Record<string, number> {
  const result: Record<string, number> = {};
  header.forEach((cell, index) => {
    const key = compactKey(cellToString(cell));
    if (!key) return;
    for (const [field, names] of Object.entries(aliases)) {
      if (!(field in result) && names.includes(key)) result[field] = index;
    }
  });
  return result;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Chấp nhận ô ngày của Excel (Date, số seri) hoặc chuỗi dd/mm/yyyy, yyyy-mm-dd. Trả về "yyyy-mm-dd" hoặc null. */
export function cellToISODate(value: CellValue): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    // Thư viện đọc ngày Excel thành nửa đêm UTC, nên dùng các hàm UTC để không lệch ngày.
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  if (typeof value === "number") {
    if (value < 20000 || value > 80000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  const text = String(value).trim();
  let iso: string | null = null;
  const vn = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (vn) iso = `${vn[3]}-${pad(Number(vn[2]))}-${pad(Number(vn[1]))}`;
  else if (/^\d{4}-\d{2}-\d{2}$/.test(text)) iso = text;
  return iso && isValidISODate(iso) ? iso : null;
}

export function isEmptyRow(row: CellValue[]): boolean {
  return row.every((c) => cellToString(c) === "" && !(c instanceof Date));
}

/** Tải file CSV (có BOM UTF-8 để Excel hiển thị đúng tiếng Việt). */
export function downloadCsv(filename: string, rows: string[][]): void {
  const escape = (cell: string) => (/[",\n;]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
  const text = `\uFEFF${rows.map((r) => r.map(escape).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

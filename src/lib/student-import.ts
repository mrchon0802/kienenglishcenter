import { cellToISODate, cellToString, isEmptyRow, mapHeaders, type SheetRows } from "./import-parse";
import { normalizePhone, validateStudentInput, type StudentInput } from "./student-validation";

export const STUDENT_TEMPLATE_HEADER = ["Họ và tên", "Lớp", "Ngày sinh", "Tên phụ huynh", "SĐT phụ huynh", "Ngày nhập học"];
export const STUDENT_TEMPLATE_ROWS: string[][] = [
  ["Nguyễn Minh An", "3A", "07/03/2016", "Nguyễn Văn Hùng", "0912345678", "01/09/2026"],
  ["Trần Bảo Châu", "4A", "15/11/2015", "Trần Thị Lan", "0987654321", ""],
];

const HEADER_ALIASES: Record<keyof StudentInput, string[]> = {
  fullName: ["hovaten", "hoten", "tenhocsinh", "hocsinh", "ten", "fullname", "name"],
  className: ["lop", "class", "classname"],
  dateOfBirth: ["ngaysinh", "dob", "dateofbirth"],
  parentName: ["tenphuhuynh", "phuhuynh", "parentname"],
  parentPhone: ["sdtphuhuynh", "sodienthoaiphuhuynh", "sdt", "sodienthoai", "dienthoai", "phone", "parentphone"],
  enrolledDate: ["ngaynhaphoc", "enrolleddate"],
};

export interface ImportedStudent {
  rowNumber: number;
  input: StudentInput;
  errors: string[];
}

export interface StudentParseResult {
  fileError?: string;
  items: ImportedStudent[];
}

/**
 * `classNames`: tên các lớp hiện có. `existing`: học sinh đã có (để phát hiện trùng tên + số điện thoại).
 */
export function rowsToStudents(
  rows: SheetRows,
  classNames: string[],
  existing: { fullName: string; parentPhone: string }[],
): StudentParseResult {
  if (rows.length === 0) return { items: [], fileError: "File trống." };
  const header = mapHeaders(rows[0], HEADER_ALIASES);

  const required = ["fullName", "className", "parentName", "parentPhone"] as const;
  const names = { fullName: "Họ và tên", className: "Lớp", parentName: "Tên phụ huynh", parentPhone: "SĐT phụ huynh" };
  const missing = required.filter((f) => !(f in header));
  if (missing.length > 0) {
    return { items: [], fileError: `Thiếu cột bắt buộc: ${missing.map((m) => names[m]).join(", ")}. Hãy dùng đúng file mẫu.` };
  }

  const classByLower = new Map(classNames.map((c) => [c.toLowerCase(), c]));
  const seen = new Set(existing.map((s) => `${s.fullName.trim().toLowerCase()}|${s.parentPhone}`));
  const items: ImportedStudent[] = [];

  rows.slice(1).forEach((row, i) => {
    if (isEmptyRow(row)) return;
    const text = (field: keyof StudentInput) => (field in header ? cellToString(row[header[field]]) : "");
    const date = (field: "dateOfBirth" | "enrolledDate") => (field in header ? row[header[field]] : null);

    const errors: string[] = [];
    const rawClass = text("className");
    const dob = cellToISODate(date("dateOfBirth"));
    const enrolled = cellToISODate(date("enrolledDate"));
    if (cellToString(date("dateOfBirth")) && !dob && !(date("dateOfBirth") instanceof Date)) errors.push("Ngày sinh không đọc được (dùng dd/mm/yyyy).");
    if (cellToString(date("enrolledDate")) && !enrolled && !(date("enrolledDate") instanceof Date)) errors.push("Ngày nhập học không đọc được (dùng dd/mm/yyyy).");

    const input: StudentInput = {
      fullName: text("fullName").replace(/\s+/g, " "),
      className: classByLower.get(rawClass.toLowerCase()) ?? rawClass,
      parentName: text("parentName"),
      parentPhone: normalizePhone(text("parentPhone")),
      dateOfBirth: dob ?? "",
      enrolledDate: enrolled ?? "",
    };
    errors.push(...Object.values(validateStudentInput(input, classNames)));

    const key = `${input.fullName.toLowerCase()}|${input.parentPhone}`;
    if (errors.length === 0) {
      if (seen.has(key)) errors.push("Trùng tên và số điện thoại với học sinh đã có hoặc dòng khác trong file.");
      else seen.add(key);
    }
    items.push({ rowNumber: i + 2, input, errors: [...new Set(errors)] });
  });

  return { items };
}

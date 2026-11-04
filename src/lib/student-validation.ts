import { isValidISODate } from "./month";

export interface StudentInput {
  fullName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  dateOfBirth: string; // "" hoặc "yyyy-mm-dd"
  enrolledDate: string; // "" = hôm nay
}

export type StudentErrors = Partial<Record<keyof StudentInput, string>>;

/** "0912 345 678", "+84912345678", "912345678" (Excel làm mất số 0) -> "0912345678" */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+84")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("84") && digits.length === 11) digits = `0${digits.slice(2)}`;
  else if (/^[1-9]\d{8}$/.test(digits)) digits = `0${digits}`;
  return digits;
}

export function isValidPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone);
}

/** `classNames`: tên các lớp hiện có (so khớp chính xác). */
export function validateStudentInput(input: StudentInput, classNames: string[]): StudentErrors {
  const errors: StudentErrors = {};
  if (!input.fullName.trim()) errors.fullName = "Nhập họ và tên học sinh.";
  else if (input.fullName.trim().length > 80) errors.fullName = "Họ và tên tối đa 80 ký tự.";
  if (!input.className) errors.className = "Chọn lớp.";
  else if (!classNames.includes(input.className)) errors.className = `Lớp "${input.className}" không tồn tại.`;
  if (!input.parentName.trim()) errors.parentName = "Nhập tên phụ huynh.";
  if (!input.parentPhone.trim()) errors.parentPhone = "Nhập số điện thoại phụ huynh.";
  else if (!isValidPhone(normalizePhone(input.parentPhone))) errors.parentPhone = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.";
  if (input.dateOfBirth && !isValidISODate(input.dateOfBirth)) errors.dateOfBirth = "Ngày sinh không hợp lệ.";
  if (input.enrolledDate && !isValidISODate(input.enrolledDate)) errors.enrolledDate = "Ngày nhập học không hợp lệ.";
  return errors;
}

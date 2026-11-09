import type { ClassScheduleSlot } from "@/types/class";

export interface ClassInput {
  name: string; // ví dụ "3A", không đổi được sau khi tạo
  grade: number; // 1-9
  scheduleDays: number[]; // tương thích dữ liệu cũ
  scheduleSlots: ClassScheduleSlot[];
  startTime: string; // "17:30"
  endTime: string; // "18:30"
  monthlyFee: number; // VNĐ / tháng
  currentUnit: number;
  currentLesson: number;
  teacherId?: string;
  assignmentStartDate?: string;
  courseId?: string;
}

export type ClassErrors = Partial<Record<keyof ClassInput, string>>;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateClassInput(input: ClassInput, mode: "new" | "edit"): ClassErrors {
  const errors: ClassErrors = {};
  if (mode === "new" && !/^[A-Za-z0-9]{1,8}$/.test(input.name.trim())) {
    errors.name = "Tên lớp gồm chữ và số, tối đa 8 ký tự, không có dấu cách (ví dụ 3A).";
  }
  if (!Number.isInteger(input.grade) || input.grade < 1 || input.grade > 9) errors.grade = "Chọn khối lớp từ 1 đến 9.";
  const slots = input.scheduleSlots ?? [];
  if (slots.length === 0) errors.scheduleDays = "Thêm ít nhất một ngày và khung giờ học.";
  const seenDays = new Set<number>();
  for (const slot of slots) {
    if (!Number.isInteger(slot.day) || slot.day < 2 || slot.day > 8) errors.scheduleDays = "Ngày học không hợp lệ.";
    if (seenDays.has(slot.day)) errors.scheduleDays = "Mỗi ngày chỉ được cấu hình một khung giờ.";
    seenDays.add(slot.day);
    if (!TIME.test(slot.startTime) || !TIME.test(slot.endTime) || slot.endTime <= slot.startTime) {
      errors.scheduleDays = "Mỗi ngày cần có giờ bắt đầu và giờ kết thúc hợp lệ.";
    }
  }
  if (!Number.isFinite(input.monthlyFee) || input.monthlyFee < 0 || input.monthlyFee > 100_000_000) {
    errors.monthlyFee = "Học phí từ 0 đến 100.000.000 đ.";
  }
  if (!Number.isInteger(input.currentUnit) || input.currentUnit < 1 || input.currentUnit > 30) errors.currentUnit = "Unit từ 1 đến 30.";
  if (!Number.isInteger(input.currentLesson) || input.currentLesson < 1 || input.currentLesson > 30) errors.currentLesson = "Lesson từ 1 đến 30.";
  return errors;
}

interface Slot {
  id: string;
  name: string;
  scheduleDays: number[];
  startTime: string;
  endTime: string;
  scheduleSlots?: ClassScheduleSlot[];
}

/** Kiểm tra hai lớp có khung giờ cố định bị chồng lấn trong cùng ngày. */
export function findScheduleConflict(
  classes: Slot[],
  candidate: { scheduleDays: number[]; startTime: string; endTime: string; scheduleSlots?: ClassScheduleSlot[] },
  ignoreId?: string,
): Slot | undefined {
  const candidateSlots = candidate.scheduleSlots?.length
    ? candidate.scheduleSlots
    : candidate.scheduleDays.map((day) => ({ day, startTime: candidate.startTime, endTime: candidate.endTime }));
  return classes.find((c) => {
    if (c.id === ignoreId) return false;
    const existingSlots = c.scheduleSlots?.length
      ? c.scheduleSlots
      : c.scheduleDays.map((day) => ({ day, startTime: c.startTime, endTime: c.endTime }));
    return candidateSlots.some((a) => existingSlots.some((b) =>
      a.day === b.day && a.startTime < b.endTime && b.startTime < a.endTime
    ));
  });
}

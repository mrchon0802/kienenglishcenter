export interface ClassInput {
  name: string; // ví dụ "3A", không đổi được sau khi tạo
  grade: number; // 1-9
  scheduleDays: number[]; // 2 = Thứ 2 ... 7 = Thứ 7, 8 = Chủ nhật
  startTime: string; // "17:30"
  endTime: string; // "18:30"
  monthlyFee: number; // VNĐ / tháng
  currentUnit: number;
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
  if (input.scheduleDays.length === 0 || input.scheduleDays.some((d) => !Number.isInteger(d) || d < 2 || d > 8)) {
    errors.scheduleDays = "Chọn ít nhất 1 ngày học trong tuần.";
  }
  if (!TIME.test(input.startTime)) errors.startTime = "Nhập giờ bắt đầu.";
  if (!TIME.test(input.endTime)) errors.endTime = "Nhập giờ kết thúc.";
  else if (TIME.test(input.startTime) && input.endTime <= input.startTime) errors.endTime = "Giờ kết thúc phải sau giờ bắt đầu.";
  if (!Number.isFinite(input.monthlyFee) || input.monthlyFee < 0 || input.monthlyFee > 100_000_000) {
    errors.monthlyFee = "Học phí từ 0 đến 100.000.000 đ.";
  }
  if (!Number.isInteger(input.currentUnit) || input.currentUnit < 1 || input.currentUnit > 30) errors.currentUnit = "Unit từ 1 đến 30.";
  return errors;
}

interface Slot {
  id: string;
  name: string;
  scheduleDays: number[];
  startTime: string;
  endTime: string;
}

/** Trung tâm chỉ có 1 giáo viên nên hai lớp không được trùng giờ trong cùng một ngày. */
export function findScheduleConflict(
  classes: Slot[],
  candidate: { scheduleDays: number[]; startTime: string; endTime: string },
  ignoreId?: string,
): Slot | undefined {
  return classes.find(
    (c) =>
      c.id !== ignoreId &&
      c.scheduleDays.some((d) => candidate.scheduleDays.includes(d)) &&
      candidate.startTime < c.endTime &&
      c.startTime < candidate.endTime,
  );
}

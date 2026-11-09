export interface ClassScheduleSlot {
  day: number; // 2 = Thứ 2 ... 8 = Chủ nhật
  startTime: string;
  endTime: string;
}

export interface ClassInfo {
  id: string; // ví dụ "3a"
  name: string; // ví dụ "3A"
  grade: number; // khối lớp 1-9
  scheduleDays: number[]; // 2 = Thứ 2 ... 7 = Thứ 7, 8 = Chủ nhật
  startTime: string; // "17:30"
  endTime: string; // "18:30" (tương thích dữ liệu cũ; lấy theo slot đầu tiên)
  /** Lịch cố định theo từng ngày. Nếu thiếu, dùng scheduleDays/startTime/endTime cũ. */
  scheduleSlots?: ClassScheduleSlot[];
  monthlyFee: number; // VNĐ / tháng
  currentUnit: number;
  currentLesson?: number;
  courseId?: string;
}

export interface ClassWithCount extends ClassInfo {
  studentCount: number;
}

export type AttendanceStatus = "present" | "absent" | "excused";

/** studentId -> trạng thái. Học sinh chưa được điểm danh thì không có khóa. */
export type AttendanceRecord = Record<string, AttendanceStatus>;

export interface AttendanceSummary {
  present: number;
  absent: number;
  excused: number;
  total: number;
}

export type ClassSessionStatus = "scheduled" | "completed" | "cancelled";
export type ClassSessionType = "regular" | "makeup";

export interface ClassSession {
  id: string;
  classId: string;
  date: string; // ISO yyyy-mm-dd
  topic: string;
  startTime?: string;
  endTime?: string;
  teacherIds?: string[];
  type?: ClassSessionType;
  status?: ClassSessionStatus;
  originalSessionId?: string;
  changeReason?: string;
  /** Không có nghĩa là buổi này chưa điểm danh. */
  summary?: AttendanceSummary;
}

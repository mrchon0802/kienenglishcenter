export interface ClassInfo {
  id: string; // ví dụ "3a"
  name: string; // ví dụ "3A"
  grade: number; // khối lớp 1-9
  scheduleDays: number[]; // 2 = Thứ 2 ... 7 = Thứ 7, 8 = Chủ nhật
  startTime: string; // "17:30"
  endTime: string; // "18:30"
  monthlyFee: number; // VNĐ / tháng
  currentUnit: number;
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

export interface ClassSession {
  id: string;
  classId: string;
  date: string; // ISO yyyy-mm-dd
  topic: string;
  /** Không có nghĩa là buổi này chưa điểm danh. */
  summary?: AttendanceSummary;
}

import type { AttendanceStatus } from "./class";
import type { InvoiceView } from "./tuition";

export interface ClassReportStudentRow {
  studentId: string;
  studentName: string;
  testAverage: number | null; // điểm TB các bài kiểm tra đã nộp
  attendanceRate: number; // phần trăm
  owed: number; // VNĐ còn nợ
  hasOverdue: boolean;
}

export interface ClassReportAssignmentRow {
  id: string;
  title: string;
  kind: "practice" | "test";
  dueAt: string;
  submitted: number;
  total: number;
  averageScore: number | null;
}

export interface ClassReport {
  id: string;
  name: string;
  schedule: { days: number[]; startTime: string; endTime: string };
  currentUnit: number;
  studentCount: number;
  testAverage: number | null;
  attendanceAverage: number;
  totalOwed: number;
  noScoreCount: number; // số học sinh chưa có điểm kiểm tra
  distribution: { label: string; count: number }[];
  students: ClassReportStudentRow[]; // đã xếp theo điểm TB giảm dần
  assignments: ClassReportAssignmentRow[];
}

export interface StudentReportScore {
  id: string;
  title: string;
  kind: "practice" | "test";
  dueAt: string;
  score: number;
  pending: boolean; // còn câu tự luận chờ chấm
}

export interface StudentReportAttendance {
  sessionId: string;
  date: string;
  topic: string;
  status: AttendanceStatus | null; // null = buổi đó chưa điểm danh
}

export interface StudentReport {
  studentId: string;
  fullName: string;
  code: string;
  className: string;
  classId: string;
  parentName: string;
  parentPhone: string;
  enrolledDate: string;
  testAverage: number | null;
  classTestAverage: number | null;
  attendanceRate: number;
  totalOwed: number;
  scores: StudentReportScore[]; // cũ → mới, tối đa 6 bài gần nhất
  attendance: StudentReportAttendance[]; // mới → cũ, tối đa 6 buổi
  invoices: InvoiceView[]; // mới → cũ, tối đa 6 tháng
}

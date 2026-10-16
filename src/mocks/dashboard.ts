import type { DashboardData } from "@/types/dashboard";

const data: DashboardData = {
  isMock: true,
  summary: {
    studentCount: 86,
    classCount: 9,
    classesToday: 3,
    monthLabel: "tháng 10",
    monthRevenue: 48_500_000,
    paidInvoices: 79,
    totalInvoices: 86,
    debtAmount: 12_300_000,
    debtStudentCount: 7,
  },
  todos: [
    { id: "t1", count: 5, text: "bài tự luận chờ chấm (Lớp 6B)", actionLabel: "Chấm bài", href: "/admin/assignments" },
    { id: "t2", count: 1, text: "bài kiểm tra Unit 5 (Lớp 4A) hết hạn hôm nay", actionLabel: "Xem bài nộp", href: "/admin/assignments" },
    { id: "t3", count: 7, text: "hóa đơn quá hạn chưa thanh toán", actionLabel: "Xem công nợ", href: "/admin/tuition" },
    { id: "t4", count: 2, text: "học sinh vắng 3 buổi liên tiếp", actionLabel: "Xem danh sách", href: "/admin/students" },
  ],
  schedule: [
    { id: "s1", time: "17:30 - 18:30", className: "Lớp 3A", detail: "Unit 4 · 18 học sinh", attendanceHref: "/admin/classes", isNext: true },
    { id: "s2", time: "18:45 - 19:45", className: "Lớp 6B", detail: "Unit 3 · 14 học sinh", attendanceHref: "/admin/classes" },
    { id: "s3", time: "20:00 - 21:00", className: "Lớp 9A", detail: "Ôn tập giữa kỳ · 11 học sinh", attendanceHref: "/admin/classes" },
  ],
  recentAssignments: [
    { id: "a1", title: "Kiểm tra Unit 5", className: "4A", kind: "test", dueDate: "15/10", submitted: 16, total: 20, averageScore: 7.2 },
    { id: "a2", title: "Luyện từ vựng Unit 4", className: "3A", kind: "practice", dueDate: "17/10", submitted: 9, total: 18, averageScore: 8.1 },
    { id: "a3", title: "Kiểm tra Unit 3", className: "6B", kind: "test", dueDate: "12/10", submitted: 14, total: 14, averageScore: 7.5 },
    { id: "a4", title: "Ngữ pháp thì hiện tại", className: "9A", kind: "practice", dueDate: "20/10", submitted: 3, total: 11, averageScore: 6.8 },
  ],
  classScores: [
    { className: "1A", averageScore: 8.4 },
    { className: "3A", averageScore: 8.1 },
    { className: "6B", averageScore: 7.5 },
    { className: "4A", averageScore: 7.2 },
    { className: "9A", averageScore: 6.8 },
  ],
  attention: [
    { id: "n1", name: "Lê Gia Huy", className: "Lớp 9A", reason: "Điểm TB giảm 1,8 so với tháng trước", href: "/admin/students" },
    { id: "n2", name: "Trần Bảo Châu", className: "Lớp 4A", reason: "Vắng 3 buổi liên tiếp", href: "/admin/students" },
    { id: "n3", name: "Phạm Khánh Linh", className: "Lớp 6B", reason: "Nợ học phí tháng 9 và tháng 10", href: "/admin/students" },
  ],
  revenue: [
    { month: "T5", valueInMillions: 41 },
    { month: "T6", valueInMillions: 44 },
    { month: "T7", valueInMillions: 39 },
    { month: "T8", valueInMillions: 46 },
    { month: "T9", valueInMillions: 47 },
    { month: "T10", valueInMillions: 48.5 },
  ],
};

// Giữ chữ ký async để sau này thay bằng gọi API thật mà không phải sửa trang.
export async function getDashboardData(): Promise<DashboardData> {
  return data;
}

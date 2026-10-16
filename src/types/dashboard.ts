export interface DashboardSummary {
  studentCount: number;
  classCount: number;
  classesToday: number;
  monthLabel: string; // ví dụ "tháng 10"
  monthRevenue: number; // VNĐ
  paidInvoices: number;
  totalInvoices: number;
  debtAmount: number; // VNĐ
  debtStudentCount: number;
}

export interface TodoItem {
  id: string;
  count: number;
  text: string;
  actionLabel: string;
  href: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  className: string;
  detail: string;
  attendanceHref: string;
  isNext?: boolean;
}

export type AssignmentKind = "test" | "practice";

export interface AssignmentRow {
  id: string;
  title: string;
  className: string;
  kind: AssignmentKind;
  dueDate: string;
  submitted: number;
  total: number;
  averageScore: number;
}

export interface ClassScore {
  className: string;
  averageScore: number;
}

export interface AttentionStudent {
  id: string;
  name: string;
  className: string;
  reason: string;
  href: string;
}

export interface RevenuePoint {
  month: string;
  valueInMillions: number;
}

export interface DashboardData {
  isMock: boolean;
  summary: DashboardSummary;
  todos: TodoItem[];
  schedule: ScheduleItem[];
  recentAssignments: AssignmentRow[];
  classScores: ClassScore[];
  attention: AttentionStudent[];
  revenue: RevenuePoint[];
}

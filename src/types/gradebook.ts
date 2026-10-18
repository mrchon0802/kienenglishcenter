export type CellStatus = "none" | "missed" | "graded" | "pending";

export interface GradebookCell {
  status: CellStatus; // none: chưa làm | missed: kiểm tra quá hạn chưa nộp | pending: còn câu tự luận chờ chấm
  score: number | null; // điểm cao nhất (thang 10)
}

export interface GradebookAssignment {
  id: string;
  title: string;
  kind: "practice" | "test";
  dueAt: string;
}

export interface GradebookRow {
  studentId: string;
  studentName: string;
  cells: Record<string, GradebookCell>; // assignmentId -> ô điểm
  testAverage: number | null; // điểm trung bình các bài KIỂM TRA đã nộp
}

export interface GradebookClass {
  id: string;
  name: string;
  assignments: GradebookAssignment[];
  rows: GradebookRow[];
  classTestAverage: number | null;
}

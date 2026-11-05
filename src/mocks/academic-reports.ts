import { buildResult } from "@/lib/grading";
import { getAssignments, getAttempts, getStudentAssignments } from "./assignments";
import { getClasses, getClassStudents } from "./classes";
import { getInvoiceViews } from "./tuition";
import { getStudents } from "./students";

export interface AcademicRisk {
  studentId: string;
  studentName: string;
  className: string;
  reasons: string[];
  scoreAverage: number | null;
  attendanceRate: number;
  overdueAmount: number;
}

export interface AcademicCenterSummary {
  activeStudents: number;
  activeClasses: number;
  averageScore: number | null;
  attendanceRate: number;
  assignmentCompletionRate: number;
  atRiskCount: number;
  risks: AcademicRisk[];
  exportRows: Array<{
    studentCode: string;
    studentName: string;
    className: string;
    testAverage: string;
    attendanceRate: number;
    overdueAmount: number;
    riskReasons: string;
  }>;
}

/** Tổng hợp từ các kho dữ liệu hiện có. Cần gọi sau connection() trong Server Component. */
export async function getAcademicCenterSummary(now: Date): Promise<AcademicCenterSummary> {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [students, classes, assignments, invoices] = await Promise.all([
    getStudents(), getClasses(), getAssignments(), getInvoiceViews(today),
  ]);
  const activeStudents = students.filter((s) => s.status === "active");
  const studentRows = await Promise.all(activeStudents.map(async (student) => {
    const classId = student.className.toLowerCase();
    const classStudents = await getClassStudents(classId);
    const mineAssignments = assignments.filter((a) => a.classId === classId);
    const scores: number[] = [];
    for (const assignment of mineAssignments.filter((a) => a.kind === "test")) {
      const attempts = await getAttempts(assignment.id, student.id);
      if (attempts.length) {
        const results = attempts.map((attempt) => buildResult(assignment, attempt, now));
        scores.push(Math.max(...results.map((result) => result.score)));
      }
    }
    const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
    const studentInvoices = invoices.filter((invoice) => invoice.studentId === student.id && invoice.remaining > 0);
    const overdueAmount = studentInvoices
      .filter((invoice) => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + invoice.remaining, 0);
    const taskSummaries = await getStudentAssignments(student.id, now);
    const overdueTasks = taskSummaries.filter((task) => task.status === "missed").length;
    const reasons: string[] = [];
    if (student.attendanceRate < 75) reasons.push("Chuyên cần dưới 75%");
    if (average !== null && average < 5) reasons.push("Điểm kiểm tra trung bình dưới 5");
    if (overdueAmount > 0) reasons.push("Còn học phí quá hạn");
    if (overdueTasks >= 2) reasons.push("Bỏ lỡ từ 2 bài tập/kiểm tra trở lên");
    return {
      student,
      average,
      overdueAmount,
      reasons,
      overdueTasks,
      classStudentCount: classStudents.length,
    };
  }));

  const scored = studentRows.map((row) => row.average).filter((v): v is number => v !== null);
  const averageScore = scored.length ? scored.reduce((sum, value) => sum + value, 0) / scored.length : null;
  const attendanceRate = activeStudents.length
    ? Math.round(activeStudents.reduce((sum, student) => sum + student.attendanceRate, 0) / activeStudents.length)
    : 0;

  let assignedSlots = 0;
  let submittedSlots = 0;
  for (const assignment of assignments) {
    const members = await getClassStudents(assignment.classId);
    assignedSlots += members.length;
    const attempts = await getAttempts(assignment.id);
    submittedSlots += new Set(attempts.map((attempt) => attempt.studentId)).size;
  }

  const risks = studentRows
    .filter((row) => row.reasons.length > 0)
    .map((row) => ({
      studentId: row.student.id,
      studentName: row.student.fullName,
      className: row.student.className,
      reasons: row.reasons,
      scoreAverage: row.average === null ? null : Math.round(row.average * 10) / 10,
      attendanceRate: row.student.attendanceRate,
      overdueAmount: row.overdueAmount,
    }))
    .sort((a, b) => b.reasons.length - a.reasons.length || a.studentName.localeCompare(b.studentName, "vi"));

  return {
    activeStudents: activeStudents.length,
    activeClasses: classes.length,
    averageScore: averageScore === null ? null : Math.round(averageScore * 10) / 10,
    attendanceRate,
    assignmentCompletionRate: assignedSlots ? Math.round((submittedSlots / assignedSlots) * 100) : 0,
    atRiskCount: risks.length,
    risks,
    exportRows: studentRows.map((row) => ({
      studentCode: row.student.code,
      studentName: row.student.fullName,
      className: row.student.className,
      testAverage: row.average === null ? "Chưa có" : row.average.toFixed(1),
      attendanceRate: row.student.attendanceRate,
      overdueAmount: row.overdueAmount,
      riskReasons: row.reasons.join("; "),
    })),
  };
}

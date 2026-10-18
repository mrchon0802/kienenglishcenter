import { toISODate } from "@/lib/month";
import type {
  ClassReport,
  ClassReportAssignmentRow,
  ClassReportStudentRow,
  StudentReport,
  StudentReportAttendance,
} from "@/types/report";
import { getAssignmentStats, getAssignments } from "./assignments";
import { getClassById, getClassSessions, getClassStudents, getSessionById } from "./classes";
import { getGradebook } from "./gradebook";
import { getStudentById } from "./students";
import { getInvoiceViews, getStudentInvoiceViews } from "./tuition";

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

const BUCKETS = [
  { label: "Dưới 5", min: 0, max: 5 },
  { label: "5 đến dưới 6,5", min: 5, max: 6.5 },
  { label: "6,5 đến dưới 8", min: 6.5, max: 8 },
  { label: "Từ 8 trở lên", min: 8, max: 10.01 },
];

/** Báo cáo một lớp. Cần gọi SAU `await connection()`. */
export async function getClassReport(classId: string, now: Date): Promise<ClassReport | null> {
  const cls = await getClassById(classId);
  if (!cls) return null;
  const today = toISODate(now);

  const [students, gradebooks, assignments, invoices] = await Promise.all([
    getClassStudents(classId),
    getGradebook(now),
    getAssignments(),
    getInvoiceViews(today),
  ]);
  const gb = gradebooks.find((g) => g.id === classId);
  const averageByStudent = new Map((gb?.rows ?? []).map((r) => [r.studentId, r.testAverage]));

  const rows: ClassReportStudentRow[] = students
    .map((s) => {
      const mine = invoices.filter((v) => v.studentId === s.id && v.remaining > 0);
      return {
        studentId: s.id,
        studentName: s.fullName,
        testAverage: averageByStudent.get(s.id) ?? null,
        attendanceRate: s.attendanceRate,
        owed: mine.reduce((sum, v) => sum + v.remaining, 0),
        hasOverdue: mine.some((v) => v.status === "overdue"),
      };
    })
    .sort((a, b) => (b.testAverage ?? -1) - (a.testAverage ?? -1) || a.studentName.localeCompare(b.studentName, "vi"));

  const scored = rows.map((r) => r.testAverage).filter((v): v is number => v !== null);
  const distribution = BUCKETS.map((b) => ({
    label: b.label,
    count: scored.filter((v) => v >= b.min && v < b.max).length,
  }));

  const assignmentRows: ClassReportAssignmentRow[] = [];
  for (const a of assignments.filter((x) => x.classId === classId).sort((x, y) => y.dueAt.localeCompare(x.dueAt))) {
    const stats = await getAssignmentStats(a, now);
    assignmentRows.push({
      id: a.id,
      title: a.title,
      kind: a.kind,
      dueAt: a.dueAt,
      submitted: stats.submitted,
      total: stats.total,
      averageScore: stats.averageScore,
    });
  }

  return {
    id: cls.id,
    name: cls.name,
    schedule: { days: cls.scheduleDays, startTime: cls.startTime, endTime: cls.endTime },
    currentUnit: cls.currentUnit,
    studentCount: students.length,
    testAverage: gb?.classTestAverage ?? null,
    attendanceAverage: Math.round(mean(students.map((s) => s.attendanceRate)) ?? 0),
    totalOwed: rows.reduce((sum, r) => sum + r.owed, 0),
    noScoreCount: rows.length - scored.length,
    distribution,
    students: rows,
    assignments: assignmentRows,
  };
}

/** Báo cáo một học sinh. Cần gọi SAU `await connection()`. */
export async function getStudentReport(studentId: string, now: Date): Promise<StudentReport | null> {
  const student = await getStudentById(studentId);
  if (!student) return null;
  const today = toISODate(now);
  const classId = student.className.toLowerCase();

  const [gradebooks, invoices, sessions] = await Promise.all([
    getGradebook(now),
    getStudentInvoiceViews(studentId, today),
    getClassSessions(classId),
  ]);
  const gb = gradebooks.find((g) => g.id === classId);
  const row = gb?.rows.find((r) => r.studentId === studentId);

  const scores = (gb?.assignments ?? [])
    .map((a) => ({ a, cell: row?.cells[a.id] }))
    .filter(({ cell }) => cell && cell.score !== null)
    .map(({ a, cell }) => ({
      id: a.id,
      title: a.title,
      kind: a.kind,
      dueAt: a.dueAt,
      score: cell?.score ?? 0,
      pending: cell?.status === "pending",
    }))
    .sort((x, y) => x.dueAt.localeCompare(y.dueAt))
    .slice(-6);

  const attendance: StudentReportAttendance[] = [];
  for (const session of sessions.slice(0, 6)) {
    const found = await getSessionById(classId, session.id);
    attendance.push({
      sessionId: session.id,
      date: session.date,
      topic: session.topic,
      status: found?.record[studentId] ?? null,
    });
  }

  return {
    studentId: student.id,
    fullName: student.fullName,
    code: student.code,
    className: student.className,
    classId,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    enrolledDate: student.enrolledDate,
    testAverage: row?.testAverage ?? null,
    classTestAverage: gb?.classTestAverage ?? null,
    attendanceRate: student.attendanceRate,
    totalOwed: invoices.reduce((sum, v) => sum + v.remaining, 0),
    scores,
    attendance,
    invoices: invoices.slice(0, 6),
  };
}

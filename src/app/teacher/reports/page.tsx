import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getAssignments, getSubmissionRows } from "@/mocks/assignments";
import { getClassSessions } from "@/mocks/classes";
import { getTeacherAttendance } from "@/mocks/teacher-attendance";
import { getTeacherCompletionStats } from "@/mocks/teacher-session-completions";
import styles from "./reports.module.css";

export const metadata = { title: "Báo cáo giảng dạy | Giáo viên" };
async function ReportContent() {
  await connection();
  const portal = await getTeacherPortalData(DEMO_CENTER_USER.teacherId);
  const classes = portal?.classes ?? [];
  const classIds = classes.map((item) => item.id);
  const [allAssignments, completions] = await Promise.all([getAssignments(), getTeacherCompletionStats(DEMO_CENTER_USER.teacherId, classIds)]);
  const assignments = allAssignments.filter((item) => classIds.includes(item.classId));
  const assignmentStats = await Promise.all(assignments.map(async (assignment) => {
    const rows = await getSubmissionRows(assignment, new Date());
    return { assignment, total: rows.length, submitted: rows.filter((row) => row.attempts > 0).length, pending: rows.filter((row) => row.pendingManual).length };
  }));
  const attendanceStats = await Promise.all(classes.map(async (cls) => {
    const sessions = await getClassSessions(cls.id);
    const records = await Promise.all(sessions.map((session) => getTeacherAttendance(cls.id, session.id)));
    const counts = records.reduce((acc, record) => {
      acc.present += Object.values(record).filter((v) => v === "present").length;
      acc.absent += Object.values(record).filter((v) => v === "absent").length;
      acc.excused += Object.values(record).filter((v) => v === "excused").length;
      acc.marked += Object.keys(record).length;
      return acc;
    }, { present: 0, absent: 0, excused: 0, marked: 0 });
    return { cls, sessionCount: sessions.length, ...counts };
  }));
  const submitted = assignmentStats.reduce((sum, item) => sum + item.submitted, 0);
  const totalStudents = assignmentStats.reduce((sum, item) => sum + item.total, 0);
  const pending = assignmentStats.reduce((sum, item) => sum + item.pending, 0);
  const attendanceMarked = attendanceStats.reduce((sum, item) => sum + item.marked, 0);
  const completionPercent = attendanceStats.length ? Math.round(completions.length / attendanceStats.reduce((sum, item) => sum + item.sessionCount, 0) * 100) : 0;
  return <main className={styles.page}>
    <div className={styles.head}><div><p className={styles.eyebrow}>TEACHING ANALYTICS</p><h1>Báo cáo giảng dạy</h1><p className={styles.muted}>Tổng hợp hoạt động trên các lớp bạn đang phụ trách.</p></div><span className={styles.period}>Dữ liệu hiện có</span></div>
    <section className={styles.kpis}>
      <article><strong>{classes.length}</strong><span>Lớp phụ trách</span></article>
      <article><strong>{assignments.length}</strong><span>Bài tập / kiểm tra</span></article>
      <article><strong>{submitted}/{totalStudents}</strong><span>Lượt học sinh đã nộp theo bài</span></article>
      <article><strong>{pending}</strong><span>Lượt còn chờ chấm tự luận</span></article>
      <article><strong>{attendanceMarked}</strong><span>Lượt điểm danh đã ghi nhận</span></article>
      <article><strong>{completions.length}</strong><span>Biên bản buổi học</span></article>
    </section>
    <section className={styles.panel}><h2>Theo dõi từng lớp</h2>{attendanceStats.length ? <div className={styles.tableWrap}><table><thead><tr><th>Lớp</th><th>Học sinh</th><th>Buổi trong dữ liệu</th><th>Có mặt</th><th>Vắng</th><th>Có phép</th><th>Biên bản</th></tr></thead><tbody>{attendanceStats.map(({ cls, sessionCount, present, absent, excused }) => <tr key={cls.id}><td><strong>{cls.name}</strong></td><td>{cls.students.length}</td><td>{sessionCount}</td><td>{present}</td><td>{absent}</td><td>{excused}</td><td>{completions.filter((item) => item.classId === cls.id).length}</td></tr>)}</tbody></table></div> : <p className={styles.empty}>Bạn chưa được phân công lớp nào.</p>}</section>
    <section className={styles.panel}><h2>Tiến độ bài tập và kiểm tra</h2>{assignmentStats.length ? <div className={styles.tableWrap}><table><thead><tr><th>Bài</th><th>Lớp</th><th>Đã nộp</th><th>Chờ chấm</th><th>Hạn nộp</th></tr></thead><tbody>{assignmentStats.map(({ assignment, total, submitted: count, pending: wait }) => <tr key={assignment.id}><td><Link href={`/teacher/assignments/${assignment.id}`}>{assignment.title}</Link></td><td>{classes.find((item) => item.id === assignment.classId)?.name ?? assignment.classId}</td><td>{count}/{total}</td><td>{wait}</td><td>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(assignment.dueAt))}</td></tr>)}</tbody></table></div> : <p className={styles.empty}>Chưa có bài tập hoặc bài kiểm tra.</p>}</section>
    <p className={styles.note}>Lưu ý: đây là báo cáo tổng hợp từ dữ liệu mock hiện có. Chỉ số nộp bài được cộng theo từng bài, không phải số học sinh duy nhất; phần điểm danh tính theo từng lượt ghi nhận.</p>
  </main>;
}
export default function TeacherReportsPage() { return <Suspense fallback={<p>Đang tổng hợp báo cáo...</p>}><ReportContent /></Suspense>; }

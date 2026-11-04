import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getAssignmentById, getAttempts, getSubmissionRows } from "@/mocks/assignments";
import { getClassById } from "@/mocks/classes";
import { getStudentById } from "@/mocks/students";
import { buildResult } from "@/lib/grading";
import { formatDateTime } from "@/lib/format-datetime";
import styles from "../assignments.module.css";

export const metadata = { title: "Kết quả bài tập | Giáo viên" };

async function AssignmentResults({ params }: { params: Promise<{ assignmentId: string }> }) {
  await connection();
  const { assignmentId } = await params;
  const [assignment, portal] = await Promise.all([
    getAssignmentById(assignmentId),
    getTeacherPortalData(DEMO_CENTER_USER.teacherId),
  ]);
  if (!assignment || !portal?.classes.some((item) => item.id === assignment.classId)) notFound();

  const [classInfo, rows, attempts] = await Promise.all([
    getClassById(assignment.classId),
    getSubmissionRows(assignment, new Date()),
    getAttempts(assignment.id),
  ]);
  const pending = rows.filter((row) => row.pendingManual).length;
  const graded = rows.filter((row) => row.attempts > 0 && !row.pendingManual).length;
  const attemptDetails = await Promise.all(attempts.map(async (attempt) => {
    const student = await getStudentById(attempt.studentId);
    return { attempt, studentName: student?.fullName ?? attempt.studentId, result: buildResult(assignment, attempt, new Date()) };
  }));
  const hasEssay = assignment.questions.some((question) => question.type === "essay");

  return <div className={styles.package7Page}>
    <div className={styles.pageHead}>
      <div><p className={styles.eyebrow}>TEACHING TOOLS / RESULTS</p><h1>{assignment.title}</h1><p className={styles.muted}>{classInfo?.name ?? assignment.classId} · {assignment.kind === "test" ? "Bài kiểm tra" : "Bài luyện tập"} · Hạn nộp {formatDateTime(assignment.dueAt)}</p></div>
      <div className={styles.resultActions}><Link className={styles.secondaryLink} href="/teacher/assignments">← Danh sách bài</Link>{hasEssay && <Link className={styles.primaryLink} href={`/teacher/assignments/${assignment.id}/grade`}>Chấm tự luận{pending ? ` (${pending} chờ)` : ""}</Link>}</div>
    </div>

    <div className={styles.stats}>
      <div><strong>{rows.length}</strong><span>Tổng học sinh</span></div>
      <div><strong>{rows.filter((row) => row.attempts > 0).length}</strong><span>Đã nộp</span></div>
      <div><strong>{pending}</strong><span>Còn chờ chấm</span></div>
      <div><strong>{graded}</strong><span>Đã hoàn tất</span></div>
    </div>

    <section className={styles.resultPanel}>
      <h2>Tổng hợp bài nộp</h2>
      <div className={styles.tableWrap}><table><thead><tr><th>Học sinh</th><th>Trạng thái</th><th>Số lần nộp</th><th>Điểm cao nhất</th><th>Lần nộp gần nhất</th></tr></thead><tbody>
        {rows.map((row) => <tr key={row.studentId}><td><strong>{row.studentName}</strong></td><td>{row.attempts === 0 ? <span className={styles.statusPending}>Chưa nộp</span> : row.pendingManual ? <span className={styles.statusPending}>Chờ chấm tự luận</span> : <span className={styles.statusDone}>Đã chấm</span>}</td><td>{row.attempts}</td><td>{row.bestScore === null ? "—" : `${row.bestScore.toFixed(1)}/10`}</td><td>{row.lastSubmittedAt ? formatDateTime(row.lastSubmittedAt) : "—"}</td></tr>)}
      </tbody></table></div>
      {!rows.length && <p className={styles.empty}>Lớp hiện chưa có học sinh trong danh sách.</p>}
    </section>

    <section className={styles.resultPanel}>
      <h2>Chi tiết các lượt nộp</h2>
      {attemptDetails.length ? <div className={styles.attemptList}>{attemptDetails.map(({ attempt, studentName, result }) => <article className={styles.attemptCard} key={attempt.id}>
        <div className={styles.attemptHead}><div><strong>{studentName}</strong><p>Lần làm {attempt.attemptNo} · Nộp lúc {formatDateTime(attempt.submittedAt)}{attempt.late ? " · Nộp trễ" : ""}</p></div><strong className={styles.score}>{result.pendingManual ? "Đang chờ chấm" : `${result.score.toFixed(1)}/10`}</strong></div>
        <div className={styles.answerList}>{result.items.map((item, index) => <div className={styles.answerItem} key={item.questionId}><strong>Câu {index + 1}. {item.prompt}</strong><p>Trả lời: {item.yourAnswer}</p><small>{item.earned}/{item.max} điểm{item.verdict === "pending" ? " · Chờ chấm tay" : ""}</small>{item.teacherComment && <p>Nhận xét: {item.teacherComment}</p>}</div>)}</div>
      </article>)}</div> : <p className={styles.empty}>Chưa có lượt nộp nào cho bài này.</p>}
    </section>
  </div>;
}

export default function TeacherAssignmentResultsPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  return <Suspense fallback={<p>Đang tải kết quả bài làm...</p>}><AssignmentResults params={params} /></Suspense>;
}

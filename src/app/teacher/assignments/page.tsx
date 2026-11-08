import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getAssignments, getSubmissionRows } from "@/mocks/assignments";
import styles from "./assignments.module.css";

export const metadata = { title: "Bài tập & Kiểm tra | Giáo viên" };

async function AssignmentList() {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const [portal, assignments] = await Promise.all([
    getTeacherPortalData(currentTeacherId),
    getAssignments(),
  ]);
  const classes = portal?.classes ?? [];
  const classMap = new Map(classes.map((item) => [item.id, item]));
  const ownAssignments = assignments.filter((item) => classMap.has(item.classId));
  const submissionCounts = new Map(await Promise.all(ownAssignments.map(async (item) => {
    const rows = await getSubmissionRows(item, new Date());
    return [item.id, { submitted: rows.filter((row) => row.attempts > 0).length, total: rows.length }] as const;
  })));
  return <>
    <section className={styles.pageHead}><div><p className={styles.eyebrow}>TEACHING TOOLS</p><h1>Bài tập & Kiểm tra</h1><p className={styles.muted}>Tạo bài, chọn câu hỏi và giao trực tiếp cho lớp bạn đang phụ trách.</p></div><Link href="/teacher/assignments/new" className={styles.primaryLink}>+ Tạo bài mới</Link></section>
    <div className={styles.stats}><div><strong>{ownAssignments.length}</strong><span>Tổng bài đã giao</span></div><div><strong>{ownAssignments.filter((a) => a.kind === "practice").length}</strong><span>Bài luyện tập</span></div><div><strong>{ownAssignments.filter((a) => a.kind === "test").length}</strong><span>Bài kiểm tra</span></div><div><strong>{classes.length}</strong><span>Lớp được phân công</span></div></div>
    {ownAssignments.length ? <>
      <div className={styles.tableWrap}><table><thead><tr><th>Tên bài</th><th>Lớp</th><th>Loại</th><th>Số câu</th><th>Đã nộp</th><th>Hạn nộp</th><th>Thời gian</th></tr></thead><tbody>{ownAssignments.map((a) => <tr key={a.id}><td><Link href={`/teacher/assignments/${a.id}`} className={styles.assignmentTitle}><strong>{a.title}</strong></Link><small>Mã: {a.id}</small></td><td>{classMap.get(a.classId)?.name ?? a.classId}</td><td><span className={styles.pill}>{a.kind === "test" ? "Kiểm tra" : "Luyện tập"}</span></td><td>{a.questions.length}</td><td>{submissionCounts.get(a.id)?.submitted ?? 0}/{submissionCounts.get(a.id)?.total ?? 0}</td><td>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(a.dueAt))}</td><td>{a.durationMinutes ? `${a.durationMinutes} phút` : "Không giới hạn"}</td></tr>)}</tbody></table></div>
      <div className={styles.assignmentCards}>
        {ownAssignments.map((a) => <article className={styles.assignmentCard} key={`mobile-${a.id}`}>
          <div className={styles.assignmentCardHead}><Link href={`/teacher/assignments/${a.id}`}><strong>{a.title}</strong></Link><span className={styles.pill}>{a.kind === "test" ? "Kiểm tra" : "Luyện tập"}</span></div>
          <dl className={styles.assignmentMeta}>
            <div><dt>Lớp</dt><dd>{classMap.get(a.classId)?.name ?? a.classId}</dd></div>
            <div><dt>Số câu</dt><dd>{a.questions.length}</dd></div>
            <div><dt>Đã nộp</dt><dd>{submissionCounts.get(a.id)?.submitted ?? 0}/{submissionCounts.get(a.id)?.total ?? 0}</dd></div>
            <div><dt>Thời gian</dt><dd>{a.durationMinutes ? `${a.durationMinutes} phút` : "Không giới hạn"}</dd></div>
          </dl>
          <p className={styles.assignmentDue}>Hạn nộp: {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(a.dueAt))}</p>
        </article>)}
      </div>
    </> : <div className={styles.empty}>Chưa có bài tập hoặc bài kiểm tra nào trong các lớp bạn phụ trách. Hãy tạo bài đầu tiên.</div>}
  </>;
}
export default function TeacherAssignmentsPage() { return <Suspense fallback={<p>Đang tải danh sách bài tập...</p>}><AssignmentList /></Suspense>; }

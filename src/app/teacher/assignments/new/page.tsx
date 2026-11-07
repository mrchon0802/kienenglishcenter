import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getTeacherQuestions } from "@/mocks/questions";
import { getCurricula } from "@/mocks/curricula";
import AssignmentComposer from "../AssignmentComposer";
import styles from "../assignments.module.css";

export const metadata = { title: "Tạo bài tập | Giáo viên" };

async function NewAssignmentContent() {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const [portal, questions, curricula] = await Promise.all([
    getTeacherPortalData(currentTeacherId),
    getTeacherQuestions(currentTeacherId),
    getCurricula(),
  ]);
  const classes = (portal?.classes ?? []).map((item) => ({ id: item.id, name: item.name, grade: item.grade, students: item.students }));
  return <>
    <div className={styles.breadcrumb}><Link href="/teacher/assignments">← Bài tập & Kiểm tra</Link></div>
    <section className={styles.pageHead}><div><p className={styles.eyebrow}>NEW ASSIGNMENT</p><h1>Tạo bài tập / bài kiểm tra</h1><p className={styles.muted}>Câu hỏi mới sẽ được thêm vào Ngân hàng câu hỏi và được chụp bản sao khi giao bài.</p></div></section>
    {classes.length ? <AssignmentComposer classes={classes} bankQuestions={questions.map(({ id, prompt, type, points, grade, unit, status, curriculumId, unitId, lessonId }) => ({ id, prompt, type, points, grade, unit, status, curriculumId, unitId, lessonId }))} curricula={curricula.filter((item) => item.status === "active")} /> : <div className={styles.empty}>Bạn chưa được phân công lớp nào nên chưa thể giao bài.</div>}
  </>;
}
export default function NewTeacherAssignmentPage() { return <Suspense fallback={<p>Đang tải biểu mẫu...</p>}><NewAssignmentContent /></Suspense>; }

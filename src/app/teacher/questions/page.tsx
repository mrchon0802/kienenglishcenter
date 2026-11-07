import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherQuestions } from "@/mocks/questions";
import { typeLabel, skillLabel } from "@/lib/question-types";
import { CopyQuestionButton } from "./CopyQuestionButton";
import styles from "./questions.module.css";

async function TeacherQuestionList() {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const questions = await getTeacherQuestions(currentTeacherId);
  return <main className={styles.page}>
    <header className={styles.head}><div><p className={styles.eyebrow}>TEACHING RESOURCES</p><h1>Ngân hàng câu hỏi của tôi</h1><p>Câu hỏi do bạn tạo và câu hỏi Admin chia sẻ.</p></div><Link className={styles.primary} href="/teacher/questions/new">+ Tạo câu hỏi</Link></header>
    {questions.length ? <div className={styles.list}>{questions.map((q) => <article className={styles.card} key={q.id}>
      <div className={styles.meta}><span>Lớp {q.grade}</span><span>{typeLabel(q.type)}</span><span>{skillLabel(q.skill)}</span><span>{q.createdBy === currentTeacherId ? "Của tôi" : "Admin chia sẻ"}</span></div>
      <h2>{q.prompt}</h2><p>{q.unitId ? `Unit ${q.unit} · Lesson ${q.lessonId}` : `Unit ${q.unit} · Chưa liên kết Lesson`}</p>
      <div className={styles.actions}>{q.createdBy === currentTeacherId ? <Link href={`/teacher/questions/${q.id}/edit`}>Chỉnh sửa</Link> : <CopyQuestionButton questionId={q.id}/>}</div>
    </article>)}</div> : <div className={styles.empty}>Bạn chưa có câu hỏi nào. Hãy tạo câu hỏi đầu tiên.</div>}
  </main>;
}
export default function TeacherQuestionsPage() { return <Suspense fallback={<p>Đang tải ngân hàng câu hỏi...</p>}><TeacherQuestionList/></Suspense>; }

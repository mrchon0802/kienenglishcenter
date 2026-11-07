import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getSessionById } from "@/mocks/classes";
import { getTeacherSessionCompletion } from "@/mocks/teacher-session-completions";
import { getClassCurriculum } from "@/mocks/class-curriculum";
import { getQuestions } from "@/mocks/questions";
import { CompletionForm } from "./CompletionForm";
import styles from "./completion.module.css";

export const metadata = { title: "Hoàn thành buổi học | Giáo viên" };
type Params = Promise<{ classId: string; sessionId: string }>;
async function CompletionPage({ params }: { params: Params }) {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const { classId, sessionId } = await params;
  const [portal, session, completion, questions, curriculum] = await Promise.all([
    getTeacherPortalData(currentTeacherId), getSessionById(classId, sessionId),
    getTeacherSessionCompletion(classId, sessionId, currentTeacherId), getQuestions(), getClassCurriculum(classId),
  ]);
  const cls = portal?.classes.find((item) => item.id === classId);
  if (!cls || !session) notFound();
  const date = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${session.session.date}T00:00:00`));
  return <main className={styles.page}>
    <Link href={`/teacher/classes/${classId}/attendance`}>← Quay lại điểm danh lớp {cls.name}</Link>
    <p className={styles.eyebrow}>SESSION RECORD</p><h1>Hoàn thành buổi học</h1>
    <p className={styles.muted}>Lớp {cls.name} · {date} · {session.session.topic}</p>
    {completion && <p className={styles.saved}>Buổi học đã có biên bản. Bạn có thể cập nhật thông tin.</p>}
    <CompletionForm classId={classId} sessionId={sessionId} date={session.session.date} topic={session.session.topic} initial={completion} curriculum={curriculum} existingAssignmentId={completion?.autoAssignmentId} bankQuestions={questions.map(({ id, prompt, type, points, status }) => ({ id, prompt, type, points, status }))} />
  </main>;
}
export default function Page({ params }: { params: Params }) { return <Suspense fallback={<p>Đang tải thông tin buổi học...</p>}><CompletionPage params={params} /></Suspense>; }

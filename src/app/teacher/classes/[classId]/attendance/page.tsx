import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getClassSessions } from "@/mocks/classes";
import styles from "../../../teacher.module.css";
import local from "./attendance.module.css";

export const metadata = { title: "Điểm danh lớp | Giáo viên" };
type Params = Promise<{ classId: string }>;
async function AttendanceSessions({ params }: { params: Params }) {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const { classId } = await params;
  const data = await getTeacherPortalData(currentTeacherId);
  const cls = data?.classes.find((item) => item.id === classId);
  if (!cls) notFound();
  const sessions = await getClassSessions(classId);
  return <>
    <section className={styles.heading}><div><p className={styles.eyebrow}>ATTENDANCE</p><h1>Điểm danh lớp {cls.name}</h1><p className={styles.muted}>Chọn buổi học để xem danh sách và ghi nhận chuyên cần.</p></div><span className={styles.demo}>{cls.students.length} học sinh</span></section>
    <section className={local.sessionList}>
      {sessions.map((session) => <article className={local.session} key={session.id}>
        <div><strong>{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${session.date}T00:00:00`))}</strong><span>{session.topic}</span></div>
        <div className={local.sessionMeta}>{session.summary ? <span>{session.summary.present} có mặt · {session.summary.absent} vắng · {session.summary.excused} có phép</span> : <span>Chưa có dữ liệu điểm danh</span>}<div className={local.sessionLinks}><Link href={`/teacher/classes/${classId}/attendance/${session.id}`}>Mở điểm danh →</Link><Link href={`/teacher/classes/${classId}/sessions/${session.id}/complete`}>Biên bản buổi học →</Link></div></div>
      </article>)}
    </section>
    <p className={styles.back}><Link href="/teacher/classes">← Quay lại lớp phụ trách</Link></p>
  </>;
}
export default function TeacherAttendanceSessionsPage({ params }: { params: Params }) { return <Suspense fallback={<p>Đang tải các buổi học...</p>}><AttendanceSessions params={params} /></Suspense>; }

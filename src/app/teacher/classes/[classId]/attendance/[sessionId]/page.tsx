import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/lib/current-user";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import { getClassSessions } from "@/mocks/classes";
import { getTeacherAttendance } from "@/mocks/teacher-attendance";
import { AttendanceEditor } from "../AttendanceEditor";
import styles from "../../../../teacher.module.css";

type Params = Promise<{ classId: string; sessionId: string }>;
async function AttendanceContent({ params }: { params: Params }) {
  await connection();
  const currentTeacherId = await getCurrentTeacherId();
  const { classId, sessionId } = await params;
  const data = await getTeacherPortalData(currentTeacherId);
  const cls = data?.classes.find((item) => item.id === classId);
  if (!cls) notFound();
  const sessions = await getClassSessions(classId);
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) notFound();
  const initial = await getTeacherAttendance(classId, sessionId);
  return <>
    <section className={styles.heading}><div><p className={styles.eyebrow}>ATTENDANCE · LỚP {cls.name}</p><h1>Điểm danh buổi học</h1><p className={styles.muted}>{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${session.date}T00:00:00`))} · {session.topic}</p></div><span className={styles.demo}>{cls.students.length} học sinh</span></section>
    <AttendanceEditor key={sessionId} classId={classId} sessionId={sessionId} students={cls.students} initial={initial} />
    <p className={styles.back}><Link href={`/teacher/classes/${classId}/attendance`}>← Danh sách buổi học</Link></p>
  </>;
}
export default function TeacherAttendancePage({ params }: { params: Params }) { return <Suspense fallback={<p>Đang tải phiếu điểm danh...</p>}><AttendanceContent params={params} /></Suspense>; }

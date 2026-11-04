import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import styles from "../teacher.module.css";

export const metadata = { title: "Lớp phụ trách | Giáo viên" };

async function AssignedClasses() {
  await connection();
  const data = await getTeacherPortalData(DEMO_CENTER_USER.teacherId);
  if (!data) return <p>Không tìm thấy hồ sơ giáo viên.</p>;
  return <>
    <section className={styles.heading}><div><p className={styles.eyebrow}>TEACHING</p><h1>Lớp phụ trách</h1><p className={styles.muted}>Danh sách chỉ bao gồm các lớp có phân công hiện tại cho {data.teacher.fullName}.</p></div><span className={styles.demo}>{data.classes.length} lớp</span></section>
    {data.classes.length ? <div className={styles.classGrid}>{data.classes.map((cls) => <article className={styles.classCard} key={cls.id}><div className={styles.panelHead}><span className={styles.classTag}>LỚP {cls.name}</span><span className={styles.muted}>Khối {cls.grade}</span></div><h2>{cls.students.length} học sinh</h2><p>Lịch học: {cls.scheduleDays.map((day) => day === 8 ? "CN" : `T${day}`).join(", ")}</p><p>Thời gian: {cls.startTime} – {cls.endTime}</p><p>Đang học Unit {cls.currentUnit}</p><p className={styles.muted}>Phụ trách từ {new Intl.DateTimeFormat("vi-VN").format(new Date(`${cls.assignmentStartDate}T00:00:00`))}</p><p><Link href={`/teacher/classes/${cls.id}/attendance`}>Điểm danh buổi học →</Link></p><div className={styles.studentNames}><strong>Một số học sinh</strong>{cls.students.slice(0, 5).map((student) => <span key={student.id}>{student.code} · {student.fullName}</span>)}{cls.students.length > 5 ? <span>Và {cls.students.length - 5} học sinh khác</span> : null}</div></article>)}</div> : <p className={styles.empty}>Bạn chưa được phân công lớp nào. Vui lòng liên hệ Admin.</p>}
    <p className={styles.back}><Link href="/teacher">← Quay lại tổng quan</Link></p>
  </>;
}

export default function TeacherClassesPage() {
  return <Suspense fallback={<p>Đang tải danh sách lớp...</p>}><AssignedClasses /></Suspense>;
}

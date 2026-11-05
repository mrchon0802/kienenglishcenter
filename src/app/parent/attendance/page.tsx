import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { getStudentById } from "@/mocks/students";
import { getClasses, getClassSessions } from "@/mocks/classes";
import { getTeacherAttendance } from "@/mocks/teacher-attendance";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Chuyên cần | Kien English Center" };

function dateLabel(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
const statusLabel = { present: "Có mặt", absent: "Vắng không phép", excused: "Vắng có phép" } as const;

async function AttendanceContent() {
  await connection();
  const student = await getStudentById(CURRENT_STUDENT_ID);
  if (!student) return <section className={styles.notice}><h1>Không tìm thấy hồ sơ học sinh</h1><p>Vui lòng liên hệ trung tâm.</p></section>;
  if (!student.parentAccessEnabled) return <section className={styles.notice}><h1>Quyền truy cập chưa được kích hoạt</h1><p>Trung tâm chưa bật Parent Portal cho {student.fullName}.</p></section>;

  const classes = await getClasses();
  const cls = classes.find((item) => item.name === student.className);
  if (!cls) return <section className={styles.notice}><h1>Chưa tìm thấy lớp học</h1><p>Vui lòng liên hệ trung tâm để kiểm tra lớp của học sinh.</p></section>;

  const sessions = await getClassSessions(cls.id);
  const records = await Promise.all(sessions.map(async (session) => {
    const record = await getTeacherAttendance(cls.id, session.id);
    return { session, status: record[student.id] ?? null };
  }));
  const marked = records.filter((item) => item.status !== null);
  const present = marked.filter((item) => item.status === "present").length;
  const excused = marked.filter((item) => item.status === "excused").length;
  const absent = marked.filter((item) => item.status === "absent").length;
  const rate = marked.length ? Math.round((present / marked.length) * 100) : null;

  return <div className={styles.page}>
    <header className={styles.heading}><div><span className={styles.eyebrow}>PARENT PORTAL</span><h1>Lịch sử chuyên cần</h1><p>Theo dõi tình trạng tham gia các buổi học của học sinh.</p></div><div className={styles.student}><strong>{student.fullName}</strong><span>Lớp {cls.name}</span></div></header>
    <section className={styles.stats}>
      <article className={styles.stat}><span>Tỷ lệ có mặt</span><strong>{rate === null ? "—" : `${rate}%`}</strong><small>Trên các buổi đã điểm danh</small></article>
      <article className={styles.stat}><span>Có mặt</span><strong>{present}</strong><small>Buổi</small></article>
      <article className={styles.stat}><span>Vắng có phép</span><strong>{excused}</strong><small>Buổi</small></article>
      <article className={styles.stat}><span>Vắng không phép</span><strong>{absent}</strong><small>Buổi</small></article>
    </section>
    <section className={styles.panel}>
      <div className={styles.panelHead}><div><h2>Chi tiết điểm danh</h2><p>{marked.length} buổi đã có trạng thái · {records.length - marked.length} buổi chưa được điểm danh</p></div></div>
      {records.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Ngày học</th><th>Nội dung buổi học</th><th>Trạng thái</th></tr></thead><tbody>{records.map(({session,status}) => <tr key={session.id}><td>{dateLabel(session.date)}</td><td>{session.topic}</td><td><span className={`${styles.pill} ${status === "absent" ? styles.danger : status === "excused" ? styles.warning : status === "present" ? "" : styles.muted}`}>{status ? statusLabel[status] : "Chưa điểm danh"}</span></td></tr>)}</tbody></table></div> : <p className={styles.empty}>Chưa có lịch sử buổi học.</p>}
    </section>
    <p className={styles.disclaimer}>Buổi học chưa được điểm danh không được tính là có mặt hoặc vắng mặt. Tỷ lệ chuyên cần chỉ tính trên các buổi đã có trạng thái điểm danh.</p>
  </div>;
}

export default function ParentAttendancePage() {
  return <Suspense fallback={<div className={styles.loading}>Đang tải lịch sử chuyên cần...</div>}><AttendanceContent /></Suspense>;
}

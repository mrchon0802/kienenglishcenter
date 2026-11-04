import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherPortalData } from "@/mocks/teacher-portal";
import styles from "./teacher.module.css";

export const metadata = { title: "Tổng quan | Giáo viên" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

async function TeacherDashboard() {
  await connection();
  const data = await getTeacherPortalData(DEMO_CENTER_USER.teacherId);
  if (!data) return <p>Không tìm thấy hồ sơ giáo viên.</p>;
  const firstName = data.teacher.fullName.split(" ").slice(-1)[0];
  return (
    <>
      <section className={styles.heading}>
        <div><p className={styles.eyebrow}>TEACHER WORKSPACE</p><h1>Xin chào, {firstName}!</h1><p className={styles.muted}>Đây là tổng quan công việc và các lớp bạn đang phụ trách.</p></div>
        <span className={styles.demo}>Dữ liệu mô phỏng</span>
      </section>
      <section className={styles.stats} aria-label="Thống kê giảng dạy">
        <article className={styles.stat}><span>Lớp đang phụ trách</span><strong>{data.stats.classCount}</strong><small>Chỉ tính phân công hiện tại</small></article>
        <article className={styles.stat}><span>Học sinh</span><strong>{data.stats.studentCount}</strong><small>Tổng số ở các lớp được giao</small></article>
        <article className={styles.stat}><span>Buổi học 7 ngày tới</span><strong>{data.stats.upcomingSessions}</strong><small>Dựa trên lịch cố định của lớp</small></article>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Lịch dạy sắp tới</h2><p className={styles.muted}>Trong 7 ngày tính từ hôm nay</p></div><Link href="/teacher/classes">Xem lớp phụ trách</Link></div>
        {data.schedule.length ? <div className={styles.schedule}>{data.schedule.map((item) => <article className={styles.scheduleRow} key={`${item.classId}-${item.date}`}><div className={styles.date}><strong>{formatDate(item.date)}</strong><span>{item.dayLabel}</span></div><div className={styles.classInfo}><strong>Lớp {item.className}</strong><span>{item.studentCount} học sinh</span></div><div className={styles.time}>{item.startTime} – {item.endTime}</div></article>)}</div> : <p className={styles.empty}>Bạn chưa có lịch dạy trong 7 ngày tới.</p>}
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><h2>Lớp đang phụ trách</h2><Link href="/teacher/classes">Xem tất cả</Link></div>
        {data.classes.length ? <div className={styles.classGrid}>{data.classes.map((cls) => <article className={styles.classCard} key={cls.id}><div><span className={styles.classTag}>LỚP {cls.name}</span><h3>Khối {cls.grade}</h3></div><p>{cls.students.length} học sinh · Unit {cls.currentUnit}</p><p className={styles.muted}>{cls.startTime} – {cls.endTime}</p></article>)}</div> : <p className={styles.empty}>Hiện chưa có lớp được phân công.</p>}
      </section>
    </>
  );
}

export default function TeacherHomePage() {
  return (
    <Suspense fallback={<p>Đang tải tổng quan giáo viên...</p>}>
      <TeacherDashboard />
    </Suspense>
  );
}

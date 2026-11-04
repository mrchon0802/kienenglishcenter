import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { DEMO_CENTER_USER } from "@/mocks/teacher-session";
import { getTeacherById } from "@/mocks/teachers";
import styles from "./layout.module.css";

async function TeacherLayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const teacher = await getTeacherById(DEMO_CENTER_USER.teacherId);
  const initials = teacher?.fullName.split(" ").slice(-2).map((word) => word[0]).join("") ?? "GV";
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandBlock}><Link href="/teacher" className={styles.brand}>Kien English Center</Link><span className={styles.role}>Khu vực giáo viên</span></div>
        <nav className={styles.nav} aria-label="Menu giáo viên">
          <Link href="/teacher" className={styles.navLink}>Tổng quan</Link>
          <Link href="/teacher/classes" className={styles.navLink}>Lớp phụ trách</Link>
          <Link href="/teacher/lesson-plans" className={styles.navLink}>Giáo án</Link>
          <Link href="/teacher/assignments" className={styles.navLink}>Bài tập & Kiểm tra</Link>
          <Link href="/teacher/reports" className={styles.navLink}>Báo cáo</Link>
          <Link href="/teacher/profile" className={styles.navLink}>Hồ sơ</Link>
        </nav>
        <div className={styles.account}><span className={styles.avatar}>{initials}</span><span>{teacher?.fullName ?? "Giáo viên"}</span><Link href="/admin" className={styles.switch}>Chuyển sang Admin ↗</Link></div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
export default function TeacherLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<div className={styles.shell}><main className={styles.main}>Đang tải khu vực giáo viên...</main></div>}><TeacherLayoutContent>{children}</TeacherLayoutContent></Suspense>;
}

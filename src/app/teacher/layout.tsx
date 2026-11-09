import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentTeacher } from "@/lib/current-user";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { href: "/teacher", label: "Tổng quan" },
  { href: "/teacher/schedule", label: "Lịch dạy" },
  { href: "/teacher/classes", label: "Lớp học" },
  { href: "/teacher/students", label: "Học viên" },
  { href: "/teacher/assignments", label: "Bài tập" },
  { href: "/teacher/lesson-plans", label: "Giáo án" },
  { href: "/teacher/assessments", label: "Đánh giá" },
  { href: "/teacher/questions", label: "Ngân hàng câu hỏi" },
  { href: "/teacher/tasks", label: "Công việc" },
  { href: "/teacher/reports", label: "Báo cáo" },
  { href: "/teacher/profile", label: "Hồ sơ" },
];

export default function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<div className={styles.main}>Đang tải Teacher Portal...</div>}>
      <TeacherLayoutContent>{children}</TeacherLayoutContent>
    </Suspense>
  );
}

async function TeacherLayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const teacher = await getCurrentTeacher();
  const initials = teacher?.fullName
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("") ?? "GV";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/teacher" className={styles.brand}>
          <span className={styles.brandName}>Kien English Center</span>
          <span className={styles.role}>TEACHER PORTAL</span>
        </Link>

        <nav className={styles.nav} aria-label="Điều hướng giáo viên">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              aria-current={item.href === "/teacher" ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">{initials}</span>
          <span className={styles.accountName}>{teacher?.fullName ?? "Giáo viên"}</span>
          <Link href="/admin" className={styles.switch}>Khu vực Admin</Link>
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
}

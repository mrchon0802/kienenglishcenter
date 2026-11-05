import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { getStudentById } from "@/mocks/students";
import styles from "./layout.module.css";

export default function ParentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<div>Đang tải Parent Portal...</div>}>
      <ParentLayoutContent>{children}</ParentLayoutContent>
    </Suspense>
  );
}

async function ParentLayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const student = await getStudentById(CURRENT_STUDENT_ID);
  const initials = student?.fullName.split(" ").slice(-2).map((part) => part[0]).join("") ?? "PH";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/parent" className={styles.brand}>Kien English Center <span>PHỤ HUYNH</span></Link>
        <nav className={styles.nav} aria-label="Điều hướng phụ huynh">
          <Link href="/parent">Tổng quan</Link>
          <Link href="/parent/progress">Tiến độ</Link>
          <Link href="/parent/assessments">Đánh giá</Link>
          <Link href="/parent/attendance">Chuyên cần</Link>
          <Link href="/parent/homework">Bài tập</Link>
          <Link href="/parent/tuition">Học phí</Link>
          <Link href="/parent/notifications">Thông báo</Link>
        </nav>
        <div className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">{initials}</span>
          <span className={styles.accountText}>{student?.parentName || "Phụ huynh"}<small>Đang xem: {student?.fullName ?? "Học sinh"}</small></span>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>Kien English Center · Cổng thông tin phụ huynh</footer>
    </div>
  );
}

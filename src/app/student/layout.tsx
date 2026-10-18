import { Suspense } from "react";
import { StudentTopNav } from "@/components/layout/StudentTopNav";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { getStudentById } from "@/mocks/students";
import styles from "./layout.module.css";

// TODO (khi có backend): kiểm tra phiên đăng nhập và vai trò student tại đây.
export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const student = await getStudentById(CURRENT_STUDENT_ID);
  const initials = student
    ? student.fullName.split(" ").slice(-2).map((w) => w.charAt(0)).join("")
    : "HS";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.brand}>Kien English Center</p>
        <Suspense fallback={<div className={styles.navFallback} aria-hidden="true" />}>
          <StudentTopNav />
        </Suspense>
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">{initials}</span>
          <span className={styles.userText}>
            {student?.fullName ?? "Học sinh"}
            <span className={styles.userClass}> · Lớp {student?.className}</span>
          </span>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

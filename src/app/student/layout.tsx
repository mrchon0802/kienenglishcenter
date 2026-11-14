import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentStudent } from "@/lib/current-user";
import { PortalMenu } from "@/components/layout/PortalMenu";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { href: "/student", label: "Trang chủ" },
  { href: "/student/assignments", label: "Bài tập" },
  { href: "/student/notifications", label: "Thông báo" },
  { href: "/student/scores", label: "Điểm số" },
  { href: "/student/progress", label: "Tiến độ học tập" },
  { href: "/student/goals", label: "Mục tiêu" },
  { href: "/student/materials", label: "Học liệu" },
  { href: "/student/tuition", label: "Học phí" },
  { href: "/student/schedule", label: "Lịch học" },
] as const;

export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<div className={styles.navFallback} aria-hidden="true" />}>
      <StudentLayoutContent>{children}</StudentLayoutContent>
    </Suspense>
  );
}

async function StudentLayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const student = await getCurrentStudent();
  const initials = student
    ? student.fullName.split(" ").slice(-2).map((word) => word.charAt(0)).join("")
    : "HS";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <p className={styles.brand}>Kien English Center</p>
          <div className={styles.rolePicker}><RoleSwitcher currentRole="student" variant="header" /></div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.user}>
            <span className={styles.avatar} aria-hidden="true">{initials}</span>
            <span className={styles.userText}>
              {student?.fullName ?? "Học sinh demo"}
              <span className={styles.userClass}> · Lớp {student?.className ?? ""}</span>
            </span>
          </div>
          <Suspense fallback={<div className={styles.navFallback} aria-hidden="true" />}>
            <PortalMenu role="student" items={NAV_ITEMS} />
          </Suspense>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

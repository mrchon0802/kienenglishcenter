import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentStudent } from "@/lib/current-user";
import { PortalMenu } from "@/components/layout/PortalMenu";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { href: "/parent", label: "Tổng quan" },
  { href: "/parent/progress", label: "Tiến độ học tập" },
  { href: "/parent/assessments", label: "Đánh giá" },
  { href: "/parent/attendance", label: "Chuyên cần" },
  { href: "/parent/schedule", label: "Lịch học" },
  { href: "/parent/homework", label: "Bài tập" },
  { href: "/parent/tuition", label: "Học phí" },
  { href: "/parent/notifications", label: "Thông báo" },
] as const;

export default function ParentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<div>Đang tải Parent Portal...</div>}>
      <ParentLayoutContent>{children}</ParentLayoutContent>
    </Suspense>
  );
}

async function ParentLayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const student = await getCurrentStudent();
  const initials = student?.fullName.split(" ").slice(-2).map((part) => part[0]).join("") ?? "PH";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <Link href="/parent" className={styles.brand}>Kien English Center</Link>
          <div className={styles.rolePicker}><RoleSwitcher currentRole="parent" variant="header" /></div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">{initials}</span>
            <span className={styles.accountText}>
              {student?.parentName || "Phụ huynh demo"}
              <small>Đang xem: {student?.fullName ?? "Học sinh"}</small>
            </span>
          </div>
          <PortalMenu role="parent" items={NAV_ITEMS} />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>Kien English Center · Cổng thông tin phụ huynh</footer>
    </div>
  );
}

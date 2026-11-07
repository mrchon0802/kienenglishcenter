import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentStudent } from "@/lib/current-user";
import { StudentTopNav } from "@/components/layout/StudentTopNav";
import styles from "./layout.module.css";

export default function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense
      fallback={<div className={styles.navFallback} aria-hidden="true" />}
    >
      <StudentLayoutContent>{children}</StudentLayoutContent>
    </Suspense>
  );
}

async function StudentLayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();

  const student = await getCurrentStudent();

  const initials = student
    ? student.fullName
        .split(" ")
        .slice(-2)
        .map((word) => word.charAt(0))
        .join("")
    : "HS";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.brand}>Kien English Center</p>

        <Suspense
          fallback={<div className={styles.navFallback} aria-hidden="true" />}
        >
          <StudentTopNav />
        </Suspense>

        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">
            {initials}
          </span>

          <span className={styles.userText}>
            {student?.fullName ?? "Học sinh demo"}
            <span className={styles.userClass}>
              {" "}
              · Lớp {student?.className ?? ""}
            </span>
          </span>
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
}

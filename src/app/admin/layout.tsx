import { Suspense } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import styles from "./layout.module.css";

// TODO (khi có backend): kiểm tra phiên đăng nhập và vai trò admin tại đây.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.shell}>
      <Suspense
        fallback={<div className={styles.sidebarFallback} aria-hidden="true" />}
      >
        <AdminSidebar />
      </Suspense>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
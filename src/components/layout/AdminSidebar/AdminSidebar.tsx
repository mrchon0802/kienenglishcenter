"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/students", label: "Học sinh" },
  { href: "/admin/classes", label: "Lớp học & điểm danh" },
  { href: "/admin/question-bank", label: "Ngân hàng câu hỏi" },
  { href: "/admin/assignments", label: "Bài tập & kiểm tra" },
  { href: "/admin/gradebook", label: "Bảng điểm" },
  { href: "/admin/tuition", label: "Học phí & công nợ" },
  { href: "/admin/reports", label: "Báo cáo" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <p className={styles.name}>Kien English Center</p>
        <p className={styles.role}>Khu vực quản trị</p>
      </div>
      <nav aria-label="Menu chính">
        <ul className={styles.list}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.link} ${active ? styles.active : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

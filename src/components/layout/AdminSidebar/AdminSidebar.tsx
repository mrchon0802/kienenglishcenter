"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/students", label: "Học sinh" },
  { href: "/admin/teachers", label: "Giáo viên" },
  { href: "/admin/classes", label: "Lớp học & điểm danh" },
  { href: "/admin/courses", label: "Khóa học" },
  { href: "/admin/curriculum", label: "Giáo trình" },
  { href: "/admin/lesson-plans", label: "Quản lý giáo án" },
  { href: "/admin/teaching-progress", label: "Tiến độ giảng dạy" },
  { href: "/admin/assessments", label: "Đánh giá năng lực" },
  { href: "/admin/enrollments", label: "Đăng ký khóa học" },
  { href: "/admin/question-bank", label: "Ngân hàng câu hỏi" },
  { href: "/admin/assignments", label: "Bài tập & kiểm tra" },
  { href: "/admin/gradebook", label: "Bảng điểm" },
  { href: "/admin/tuition", label: "Học phí & công nợ" },
  { href: "/admin/schedule", label: "Thời khóa biểu" },
  { href: "/admin/reports", label: "Báo cáo" },
  { href: "/admin/settings", label: "Cài đặt" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={styles.mobileBar}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={open ? "Đóng menu quản trị" : "Mở menu quản trị"}
          aria-expanded={open}
          aria-controls="admin-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          <span>Menu</span>
        </button>
        <div className={styles.mobileBrand}>
          <strong>Kien English Center</strong>
          <span>Khu vực quản trị</span>
        </div>
      </div>

      {open && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="admin-navigation"
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
      >
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
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={styles.modeSwitch}>
          <Link
            href="/teacher"
            className={styles.modeLink}
            onClick={() => setOpen(false)}
          >
            Chuyển sang Teacher ↗
          </Link>
        </div>
      </aside>
    </>
  );
}

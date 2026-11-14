"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
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
        <Link
          href="/admin"
          className={styles.mobileBrand}
          aria-label="Kien English Center - Trang tổng quan"
        >
          <strong>Kien English Center</strong>
          <span>Khu vực quản trị</span>
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={open ? "Đóng menu quản trị" : "Mở menu quản trị"}
          aria-expanded={open}
          aria-controls="admin-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">☰</span>
          <span>Menu</span>
        </button>
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
          <div className={styles.brandCopy}>
            <Link
              href="/admin"
              className={styles.brandHome}
              onClick={() => setOpen(false)}
            >
              <span className={styles.name}>Kien English Center</span>
            </Link>
            <p className={styles.role}>Khu vực quản trị</p>
          </div>
          <button
            type="button"
            className={styles.mobileClose}
            aria-label="Đóng menu quản trị"
            onClick={() => setOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
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
          <RoleSwitcher currentRole="admin" />
        </div>
      </aside>
    </>
  );
}

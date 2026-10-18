"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./StudentTopNav.module.css";

const NAV_ITEMS = [
  { href: "/student", label: "Trang chủ" },
  { href: "/student/assignments", label: "Bài tập" },
  { href: "/student/scores", label: "Điểm số" },
  { href: "/student/tuition", label: "Học phí" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/student") return pathname === "/student";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentTopNav() {
  const pathname = usePathname();

  return (
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
  );
}

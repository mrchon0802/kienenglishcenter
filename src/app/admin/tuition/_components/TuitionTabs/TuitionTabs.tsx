"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TuitionTabs.module.css";

const TABS = [
  { href: "/admin/tuition", label: "Hóa đơn theo tháng" },
  { href: "/admin/tuition/debts", label: "Công nợ" },
  { href: "/admin/tuition/revenue", label: "Doanh thu" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin/tuition") return pathname === href || pathname.startsWith("/admin/tuition/invoices");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TuitionTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Học phí">
      <ul className={styles.list}>
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`${styles.tab} ${active ? styles.active : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

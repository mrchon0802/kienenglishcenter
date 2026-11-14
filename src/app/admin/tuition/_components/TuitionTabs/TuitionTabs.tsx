"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TuitionTabs.module.css";

const TABS = [
  { href: "/admin/tuition", label: "Hóa đơn theo tháng", icon: "receipt" },
  { href: "/admin/tuition/debts", label: "Công nợ", icon: "coins" },
  { href: "/admin/tuition/debt-report", label: "Báo cáo công nợ", icon: "chart" },
  { href: "/admin/tuition/reminders", label: "Thông báo", icon: "bell" },
  { href: "/admin/tuition/revenue", label: "Doanh thu", icon: "trend" },
  { href: "/admin/tuition/transactions", label: "Giao dịch thu", icon: "transfer" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin/tuition")
    return pathname === href || pathname.startsWith("/admin/tuition/invoices");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabIcon({ name }: { name: (typeof TABS)[number]["icon"] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "receipt":
      return <svg {...common}><path d="M6 3h9l4 4v14l-2-1.5L14 21l-2-1.5L9 21l-3-1.5L4 21V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 12h8M8 16h6" /></svg>;
    case "coins":
      return <svg {...common}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3 1 0 1.9-.1 2.7-.4M3 12v5c0 1.7 2.7 3 6 3 1.2 0 2.3-.2 3.2-.6" /><ellipse cx="17" cy="13" rx="4" ry="2.2" /><path d="M13 13v5c0 1.2 1.8 2.2 4 2.2s4-1 4-2.2v-5" /></svg>;
    case "chart":
      return <svg {...common}><path d="M4 20V12h4v8H4ZM10 20V7h4v13h-4ZM16 20V3h4v17h-4Z" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>;
    case "trend":
      return <svg {...common}><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></svg>;
    case "transfer":
      return <svg {...common}><path d="M4 7h15l-3-3M20 17H5l3 3" /><path d="M19 7v4M5 13v4" /></svg>;
  }
}

export function TuitionTabs() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Học phí">
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
                <span className={styles.icon}><TabIcon name={tab.icon} /></span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

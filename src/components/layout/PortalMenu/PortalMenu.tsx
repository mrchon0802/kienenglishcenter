"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type PortalRole } from "@/components/layout/RoleSwitcher";
import styles from "./PortalMenu.module.css";

type NavItem = { href: string; label: string };

export function PortalMenu({ role, items }: { role: Exclude<PortalRole, "admin">; items: readonly NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => href === `/${role}` ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <button type="button" className={styles.menuButton} aria-expanded={open} aria-controls={`${role}-portal-menu`} onClick={() => setOpen(true)}>
        <span aria-hidden="true">☰</span><span>Menu</span>
      </button>
      {open && (
        <>
          <button type="button" className={styles.backdrop} aria-label="Đóng menu" onClick={() => setOpen(false)} />
          <aside id={`${role}-portal-menu`} className={styles.drawer} aria-label="Menu chính">
            <div className={styles.drawerHeader}>
              <div>
                <strong>Kien English Center</strong>
                <span>{role === "teacher" ? "Khu vực giáo viên" : role === "student" ? "Khu vực học sinh" : "Khu vực phụ huynh"}</span>
              </div>
              <button type="button" className={styles.closeButton} aria-label="Đóng menu" onClick={() => setOpen(false)}>×</button>
            </div>
            <nav aria-label="Các chức năng">
              <ul className={styles.list}>
                {items.map((item) => {
                  const active = isActive(item.href);
                  return <li key={item.href}>
                    <Link href={item.href} className={`${styles.drawerLink} ${active ? styles.drawerActive : ""}`} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                      {item.label}{active && <span className={styles.currentMark}>Đang xem</span>}
                    </Link>
                  </li>;
                })}
              </ul>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

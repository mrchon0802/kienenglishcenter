"use client";

import { useRouter } from "next/navigation";
import styles from "./RoleSwitcher.module.css";

export type PortalRole = "admin" | "teacher" | "student" | "parent";

const ROLE_OPTIONS: { value: PortalRole; label: string; href: string }[] = [
  { value: "admin", label: "Admin", href: "/admin" },
  { value: "teacher", label: "Teacher", href: "/teacher" },
  { value: "student", label: "Student", href: "/student" },
  { value: "parent", label: "Parent", href: "/parent" },
];

export function RoleSwitcher({
  currentRole,
  variant = "default",
}: {
  currentRole: PortalRole;
  variant?: "default" | "header";
}) {
  const router = useRouter();

  function handleChange(value: string) {
    const selectedRole = ROLE_OPTIONS.find((role) => role.value === value);
    if (selectedRole && selectedRole.value !== currentRole) router.push(selectedRole.href);
  }

  return (
    <label className={variant === "header" ? styles.headerWrapper : styles.wrapper}>
      {variant === "default" && <span className={styles.label}>Đang xem vai trò</span>}
      <select
        className={variant === "header" ? styles.headerSelect : styles.select}
        aria-label="Chuyển đổi vai trò"
        value={currentRole}
        onChange={(event) => handleChange(event.target.value)}
      >
        {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
      </select>
    </label>
  );
}

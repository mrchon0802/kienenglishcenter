import type { ReactNode } from "react";
import styles from "./Badge.module.css";

interface BadgeProps {
  tone?: "teal" | "amber";
  children: ReactNode;
}

export function Badge({ tone = "teal", children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

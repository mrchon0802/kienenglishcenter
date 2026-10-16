import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  title?: string;
  /** Dùng "div" cho thẻ không có tiêu đề (ví dụ ô số liệu). */
  as?: "section" | "div";
  children: ReactNode;
}

export function Card({ title, as: Tag = "section", children }: CardProps) {
  return (
    <Tag className={styles.card}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {children}
    </Tag>
  );
}

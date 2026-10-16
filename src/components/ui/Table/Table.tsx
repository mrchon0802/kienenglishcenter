import type { ReactNode } from "react";
import styles from "./Table.module.css";

/** Khung bảng cuộn ngang trên màn hình nhỏ. Truyền <thead> và <tbody> vào children. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

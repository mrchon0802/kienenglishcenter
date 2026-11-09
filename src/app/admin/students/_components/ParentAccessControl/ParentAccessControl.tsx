"use client";

import styles from "./ParentAccessControl.module.css";

interface ParentAccessControlProps {
  studentCode: string;
  /** Kept optional for compatibility with older callers. Parent Portal is always available. */
  enabled?: boolean;
  studentActive?: boolean;
  studentId?: string;
}

/**
 * Parent Portal access is not an individually switchable student setting.
 * This legacy component now communicates the current policy without exposing
 * a toggle that would contradict the portal access rules.
 */
export function ParentAccessControl({ studentCode }: ParentAccessControlProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.description}>
        <p>
          Phụ huynh sử dụng chung tài khoản học sinh <strong>{studentCode}</strong>.
          Parent Portal luôn khả dụng ở chế độ chỉ xem.
        </p>
        <p className={styles.note}>
          Quyền truy cập không được bật/tắt riêng theo hồ sơ học sinh và không tạo tài khoản hoặc mật khẩu phụ huynh riêng.
        </p>
      </div>
      <div className={styles.actions}>
        <span className={`${styles.status} ${styles.enabled}`}>Luôn khả dụng</span>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateParentAccessAction } from "../../actions";
import styles from "./ParentAccessControl.module.css";

interface ParentAccessControlProps {
  studentId: string;
  studentCode: string;
  enabled: boolean;
  studentActive: boolean;
}

export function ParentAccessControl({
  studentId,
  studentCode,
  enabled,
  studentActive,
}: ParentAccessControlProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleToggle() {
    const nextValue = !enabled;
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateParentAccessAction(studentId, nextValue);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(nextValue ? "Đã bật quyền Parent Portal." : "Đã tắt quyền Parent Portal.");
      router.refresh();
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.description}>
        <p>
          Phụ huynh sử dụng chung tài khoản học sinh <strong>{studentCode}</strong>.
          Khi bật quyền, tài khoản được phép truy cập giao diện Parent Portal ở chế độ chỉ xem.
        </p>
        <p className={styles.note}>
          Đây là quyền truy cập theo hồ sơ học sinh, không tạo tài khoản hoặc mật khẩu phụ huynh riêng.
        </p>
      </div>

      <div className={styles.actions}>
        <span className={`${styles.status} ${enabled ? styles.enabled : styles.disabled}`}>
          {enabled ? "Đang bật" : "Đang tắt"}
        </span>
        <Button
          variant={enabled ? "secondary" : "primary"}
          disabled={pending || (!enabled && !studentActive)}
          onClick={handleToggle}
        >
          {pending ? "Đang cập nhật..." : enabled ? "Tắt Parent Portal" : "Bật Parent Portal"}
        </Button>
      </div>

      {!studentActive && !enabled ? (
        <p className={styles.note}>Học sinh đã nghỉ học nên không thể bật Parent Portal.</p>
      ) : null}
      {message ? <p className={styles.success} role="status">{message}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  );
}

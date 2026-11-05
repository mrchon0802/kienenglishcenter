"use client";

import { useTransition } from "react";
import { markNotificationReadAction } from "./actions";
import styles from "./notifications.module.css";

export function NotificationReadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return <button className={styles.readButton} type="button" disabled={pending} onClick={() => startTransition(() => { void markNotificationReadAction(id); })}>{pending ? "Đang cập nhật..." : "Đánh dấu đã đọc"}</button>;
}

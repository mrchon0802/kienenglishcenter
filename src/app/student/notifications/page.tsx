import { toISODate } from "@/lib/month";
import { syncTuitionReminderNotifications } from "@/mocks/tuition-notifications";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentStudentId } from "@/lib/current-user";
import { getStudentNotifications } from "@/mocks/student-notifications";
import styles from "./notifications.module.css";
import { NotificationReadButton } from "./NotificationReadButton";
export const metadata = { title: "Thông báo | Học sinh" };
async function NotificationContent() {
  await connection();
  const currentStudentId = await getCurrentStudentId();
  await syncTuitionReminderNotifications(toISODate(new Date()));
  const items = await getStudentNotifications(currentStudentId);
  return <section className={styles.page}><p className={styles.eyebrow}>STUDENT PORTAL</p><h1>Thông báo</h1><p className={styles.subtitle}>Thông tin bài tập và hoạt động mới của lớp bạn.</p>{items.length ? <ul className={styles.list}>{items.map((item) => <li key={item.id} className={item.readAt ? styles.read : styles.unread}><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))} · {item.readAt ? "Đã đọc" : "Chưa đọc"}</small></div><div className={styles.actions}><Link href={item.href}>Mở nội dung →</Link>{!item.readAt ? <NotificationReadButton id={item.id} /> : null}</div></li>)}</ul> : <div className={styles.empty}>Bạn chưa có thông báo mới.</div>}</section>;
}
export default function StudentNotificationsPage() { return <Suspense fallback={<p>Đang tải thông báo...</p>}><NotificationContent /></Suspense>; }

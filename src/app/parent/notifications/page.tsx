import { toISODate } from "@/lib/month";
import { syncTuitionReminderNotifications } from "@/mocks/tuition-notifications";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentStudentId } from "@/lib/current-user";
import { getStudentById } from "@/mocks/students";
import { getStudentNotifications } from "@/mocks/student-notifications";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Thông báo | Kien English Center" };

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(date);
}
const categoryLabel = { assignment:"Bài tập", tuition:"Học phí", schedule:"Lịch học", general:"Chung" } as const;

function getParentNotificationHref(category: keyof typeof categoryLabel | undefined): string | null {
  switch (category ?? "general") {
    case "assignment": return "/parent/homework";
    case "tuition": return "/parent/tuition";
    // Parent Portal chưa có trang lịch học riêng; không điều hướng phụ huynh sang Student Portal.
    case "schedule": return null;
    case "general": return null;
  }
}

async function NotificationsContent() {
  await connection();
  const currentStudentId = await getCurrentStudentId();
  await syncTuitionReminderNotifications(toISODate(new Date()));
  const student = await getStudentById(currentStudentId);
  if (!student) return <section className={styles.notice}><h1>Không tìm thấy hồ sơ học sinh</h1><p>Vui lòng liên hệ trung tâm.</p></section>;

  const notifications = await getStudentNotifications(student.id);
  const unread = notifications.filter((item) => !item.readAt).length;

  return <div className={styles.page}>
    <header className={styles.heading}><div><span className={styles.eyebrow}>PARENT PORTAL</span><h1>Thông báo</h1><p>Các thông tin được gửi đến tài khoản học sinh mà phụ huynh đang theo dõi.</p></div><div className={styles.student}><strong>{student.fullName}</strong><span>{student.className} · {student.code}</span></div></header>
    <section className={styles.stats}>
      <article className={styles.stat}><span>Tổng thông báo</span><strong>{notifications.length}</strong><small>Tất cả thông báo</small></article>
      <article className={styles.stat}><span>Chưa đọc</span><strong>{unread}</strong><small>Trạng thái theo tài khoản học sinh</small></article>
      <article className={styles.stat}><span>Đã đọc</span><strong>{notifications.length - unread}</strong><small>Đã xem trong Student Portal</small></article>
      <article className={styles.stat}><span>Thông báo mới nhất</span><strong>{notifications[0] ? dateLabel(notifications[0].createdAt).split(" ")[0] : "—"}</strong><small>{notifications[0] ? categoryLabel[notifications[0].category ?? "general"] : "Chưa có dữ liệu"}</small></article>
    </section>
    <section className={styles.panel}>
      <div className={styles.panelHead}><div><h2>Hộp thư thông báo</h2><p>Thông báo mới được hiển thị trước.</p></div></div>
      {notifications.length ? <ul className={styles.list}>{notifications.map((item) => <li key={item.id}><span className={`${styles.dot} ${item.readAt ? styles.dotRead : styles.dotUnread}`} aria-hidden="true"/><span className={styles.info}><strong>{item.title}</strong><small>{item.message}</small><small>{dateLabel(item.createdAt)} · {categoryLabel[item.category ?? "general"]}</small>{getParentNotificationHref(item.category) ? <Link href={getParentNotificationHref(item.category)!} className={styles.link}>Mở nội dung liên quan</Link> : null}</span><span className={`${styles.pill} ${item.readAt ? styles.muted : styles.warning}`}>{item.readAt ? "Đã đọc" : "Chưa đọc"}</span></li>)}</ul> : <p className={styles.empty}>Chưa có thông báo nào.</p>}
    </section>
    <p className={styles.disclaimer}>Thông báo dùng chung dữ liệu với tài khoản học sinh. Phụ huynh có thể xem trạng thái đọc nhưng không thay đổi trạng thái thông báo.</p>
  </div>;
}

export default function ParentNotificationsPage() {
  return <Suspense fallback={<div className={styles.loading}>Đang tải thông báo...</div>}><NotificationsContent /></Suspense>;
}

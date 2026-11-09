import styles from "./PublishedScheduleList.module.css";

export interface PublishedScheduleItem {
  id: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  teacherNames: string[];
  type: "regular" | "makeup";
}

export function PublishedScheduleList({ items, title, empty = "Chưa có lịch học được công bố." }: { items: PublishedScheduleItem[]; title: string; empty?: string }) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  return <section className={styles.wrap} aria-label={title}>
    <h2>{title}</h2>
    {sorted.length ? <ul>{sorted.map((item) => <li key={item.id}>
      <div className={styles.date}><strong>{new Date(`${item.date}T12:00:00`).toLocaleDateString("vi-VN", { weekday: "long" })}</strong><span>{new Date(`${item.date}T12:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span></div>
      <div className={styles.main}><strong>{item.className}{item.type === "makeup" ? " · Học bù" : ""}</strong><span>{item.startTime} – {item.endTime}</span><small>{item.teacherNames.length ? item.teacherNames.join(", ") : "Chưa cập nhật giáo viên"}</small></div>
    </li>)}</ul> : <p className={styles.empty}>{empty}</p>}
    <p className={styles.note}>Chỉ hiển thị các buổi học trong lịch tuần đã được Admin công bố.</p>
  </section>;
}

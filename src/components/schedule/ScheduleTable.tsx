import type { ClassWithCount } from "@/types/class";
import styles from "./ScheduleTable.module.css";

const DAYS = [
  { value: 2, label: "Thứ 2" }, { value: 3, label: "Thứ 3" },
  { value: 4, label: "Thứ 4" }, { value: 5, label: "Thứ 5" },
  { value: 6, label: "Thứ 6" }, { value: 7, label: "Thứ 7" },
  { value: 8, label: "Chủ nhật" },
];

type ScheduleClass = ClassWithCount & { teacherName?: string };

export function ScheduleTable({
  classes,
  title = "Thời khóa biểu",
}: {
  classes: ScheduleClass[];
  title?: string;
}) {
  const rows = classes.flatMap((item) =>
    item.scheduleDays.map((day) => ({ ...item, day })),
  ).sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));

  return (
    <section className={styles.wrap} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      {rows.length === 0 ? (
        <p className={styles.empty}>Chưa có lịch học được phân công.</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead><tr><th>Ngày</th><th>Giờ học</th><th>Lớp</th><th>Giáo viên</th><th>Sĩ số</th><th>Phòng</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.id}-${row.day}`}>
                  <td><strong>{DAYS.find((day) => day.value === row.day)?.label ?? `Thứ ${row.day}`}</strong></td>
                  <td>{row.startTime} – {row.endTime}</td>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.teacherName ?? "Chưa phân công"}</td>
                  <td>{row.studentCount}</td>
                  <td>Chưa phân phòng</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.note}>Lịch học lấy từ cấu hình ngày và giờ của từng lớp. Thay đổi lịch tại Quản trị → Lớp học & điểm danh → Sửa lớp. Hệ thống hiện chưa quản lý danh sách phòng học.</p>
    </section>
  );
}

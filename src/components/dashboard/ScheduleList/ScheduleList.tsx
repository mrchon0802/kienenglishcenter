import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ScheduleItem } from "@/types/dashboard";
import styles from "./ScheduleList.module.css";

export function ScheduleList({ items }: { items: ScheduleItem[] }) {
  return (
    <Card title="Lịch dạy hôm nay">
      {items.length === 0 ? (
        <p className={styles.empty}>Hôm nay không có lớp nào.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.row}>
              <div>
                <p className={styles.heading}>
                  {item.time} · {item.className}
                </p>
                <p className={styles.detail}>{item.detail}</p>
              </div>
              <Button
                href={item.attendanceHref}
                variant={item.isNext ? "primary" : "secondary"}
              >
                Điểm danh
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

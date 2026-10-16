import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatSessionDate } from "@/lib/schedule";
import type { ClassSession } from "@/types/class";
import styles from "./SessionList.module.css";

export function SessionList({ sessions }: { sessions: ClassSession[] }) {
  return (
    <ul className={styles.list}>
      {sessions.map((session) => {
        const { summary } = session;
        return (
          <li key={session.id} className={styles.row}>
            <div>
              <p className={styles.date}>{formatSessionDate(session.date)}</p>
              <p className={styles.meta}>
                {session.topic}
                {summary
                  ? ` · ${summary.present} / ${summary.total} có mặt`
                  : ""}
              </p>
              {summary ? null : <Badge tone="amber">Chưa điểm danh</Badge>}
            </div>
            <Button
              href={`/admin/classes/${session.classId}/attendance/${session.id}`}
              variant={summary ? "secondary" : "primary"}
            >
              {summary ? "Xem / sửa" : "Điểm danh"}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

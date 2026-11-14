import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatSessionDate } from "@/lib/schedule";
import type { ClassSession } from "@/types/class";
import styles from "./SessionList.module.css";

export function SessionList({ sessions }: { sessions: ClassSession[] }) {
  if (sessions.length === 0) {
    return <p className={styles.empty}>Chưa có buổi học nào được ghi nhận.</p>;
  }

  return (
    <ul className={styles.list}>
      {sessions.map((session) => {
        const { summary } = session;
        const isCancelled = session.status === "cancelled";
        const isMakeup = session.type === "makeup";

        return (
          <li key={session.id} className={`${styles.row} ${isCancelled ? styles.cancelled : ""}`}>
            <div className={styles.sessionInfo}>
              <div className={styles.dateLine}>
                <p className={styles.date}>{formatSessionDate(session.date)}</p>
                {isMakeup ? <Badge tone="teal">Học bù</Badge> : null}
                {isCancelled ? <Badge tone="amber">Đã hủy</Badge> : null}
              </div>
              <p className={styles.meta}>
                {session.topic}
                {session.startTime ? ` · ${session.startTime}${session.endTime ? `–${session.endTime}` : ""}` : ""}
              </p>
              {isCancelled ? (
                <span className={styles.statusNote}>Buổi học đã hủy, không thực hiện điểm danh.</span>
              ) : summary ? (
                <span className={styles.attendance}>
                  {summary.present}/{summary.total} học sinh có mặt
                  {summary.absent > 0 ? ` · ${summary.absent} vắng` : ""}
                  {summary.excused > 0 ? ` · ${summary.excused} có phép` : ""}
                </span>
              ) : (
                <span className={styles.pending}><Badge tone="amber">Chưa điểm danh</Badge></span>
              )}
            </div>

            {isCancelled ? (
              <span className={styles.noAction}>Không có thao tác</span>
            ) : (
              <Button
                href={`/admin/classes/${session.classId}/attendance/${session.id}`}
                variant={summary ? "secondary" : "primary"}
              >
                {summary ? "Xem điểm danh" : "Điểm danh"}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

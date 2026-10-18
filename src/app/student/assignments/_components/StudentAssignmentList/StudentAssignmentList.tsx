import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format-datetime";
import { formatScore } from "@/lib/format";
import type { StudentAssignmentSummary } from "@/types/quiz";
import styles from "./StudentAssignmentList.module.css";

interface Props {
  items: StudentAssignmentSummary[];
  emptyTitle: string;
}

function details(item: StudentAssignmentSummary): string {
  const parts = [`${item.questionCount} câu`];
  parts.push(item.durationMinutes ? `${item.durationMinutes} phút` : "không giới hạn thời gian");
  parts.push(item.kind === "test" ? "chỉ được làm 1 lần" : "làm lại thoải mái");
  return parts.join(" · ");
}

export function StudentAssignmentList({ items, emptyTitle }: Props) {
  if (items.length === 0) return <EmptyState title={emptyTitle} />;

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.row}>
          <div className={styles.info}>
            <p className={styles.title}>
              {item.title}{" "}
              <Badge tone={item.kind === "test" ? "amber" : "teal"}>
                {item.kind === "test" ? "Kiểm tra" : "Luyện tập"}
              </Badge>
            </p>
            <p className={styles.meta}>{details(item)}</p>
            <p className={styles.meta}>
              Hạn: {formatDateTime(item.dueAt)}
              {item.bestScore !== null ? ` · Điểm cao nhất: ${formatScore(item.bestScore)}` : ""}
              {item.status === "missed" ? " · Đã quá hạn" : ""}
            </p>
          </div>
          {item.status === "todo" ? (
            <Button href={`/student/assignments/${item.id}`} variant="primary">
              {item.kind === "test" ? "Bắt đầu làm bài" : "Làm bài luyện tập"}
            </Button>
          ) : item.status === "done" ? (
            <Button href={`/student/assignments/${item.id}`}>
              {item.kind === "practice" ? "Xem kết quả / làm lại" : "Xem kết quả"}
            </Button>
          ) : (
            <Button href={`/student/assignments/${item.id}`}>Xem</Button>
          )}
        </li>
      ))}
    </ul>
  );
}

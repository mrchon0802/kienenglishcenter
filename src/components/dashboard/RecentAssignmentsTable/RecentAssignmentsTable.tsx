import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { formatScore } from "@/lib/format";
import type { AssignmentRow } from "@/types/dashboard";
import styles from "./RecentAssignmentsTable.module.css";

function AssignmentKind({ kind }: { kind: AssignmentRow["kind"] }) {
  return (
    <Badge tone={kind === "test" ? "amber" : "teal"}>
      {kind === "test" ? "Kiểm tra" : "Luyện tập"}
    </Badge>
  );
}

export function RecentAssignmentsTable({ rows }: { rows: AssignmentRow[] }) {
  return (
    <Card title="Bài tập & kiểm tra gần đây">
      <div className={styles.desktopTable}>
        <Table>
          <thead>
            <tr>
              <th scope="col">Tên bài</th>
              <th scope="col">Lớp</th>
              <th scope="col">Loại</th>
              <th scope="col">Hạn nộp</th>
              <th scope="col">Đã nộp</th>
              <th scope="col">Điểm TB</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.className}</td>
                <td><AssignmentKind kind={row.kind} /></td>
                <td>{row.dueDate}</td>
                <td>{row.submitted} / {row.total}</td>
                <td>{row.averageScore === null ? "-" : formatScore(row.averageScore)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className={styles.mobileCards} aria-label="Bài tập và kiểm tra gần đây">
        {rows.length === 0 ? (
          <p className={styles.empty}>Chưa có bài tập hoặc bài kiểm tra gần đây.</p>
        ) : rows.map((row) => (
          <article className={styles.assignmentCard} key={`mobile-${row.id}`}>
            <div className={styles.cardHeading}>
              <div className={styles.cardTitle}>{row.title}</div>
              <AssignmentKind kind={row.kind} />
            </div>
            <div className={styles.cardMeta}>
              <span>Lớp <strong>{row.className}</strong></span>
              <span>Hạn nộp <strong>{row.dueDate}</strong></span>
            </div>
            <div className={styles.cardFooter}>
              <span>Đã nộp <strong>{row.submitted}/{row.total}</strong></span>
              <span>Điểm TB <strong>{row.averageScore === null ? "—" : formatScore(row.averageScore)}</strong></span>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { formatScore } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import type { Assignment } from "@/types/assignment";
import styles from "./AssignmentTable.module.css";

export interface AssignmentRowData {
  assignment: Assignment;
  className: string;
  submitted: number;
  total: number;
  averageScore: number | null;
}

export function AssignmentTable({ rows }: { rows: AssignmentRowData[] }) {
  if (rows.length === 0) {
    return <EmptyState title="Chưa có bài tập nào" description="Bấm “+ Tạo bài tập” để giao bài đầu tiên." />;
  }

  return (
    <>
    <div className={styles.desktopTable}>
    <Table>
      <thead>
        <tr>
          <th scope="col">Tên bài</th>
          <th scope="col">Lớp</th>
          <th scope="col">Loại</th>
          <th scope="col">Hạn nộp</th>
          <th scope="col">Số câu</th>
          <th scope="col">Đã nộp</th>
          <th scope="col">Điểm TB</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ assignment: a, className, submitted, total, averageScore }) => (
          <tr key={a.id}>
            <td>
              <Link href={`/admin/assignments/${a.id}`}>{a.title}</Link>
            </td>
            <td>{className}</td>
            <td>
              <Badge tone={a.kind === "test" ? "amber" : "teal"}>
                {a.kind === "test" ? "Kiểm tra" : "Luyện tập"}
              </Badge>
            </td>
            <td>{formatDateTime(a.dueAt)}</td>
            <td>{a.questions.length}</td>
            <td>
              {submitted} / {total}
            </td>
            <td>{averageScore === null ? "-" : formatScore(averageScore)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
    </div>
    <div className={styles.mobileCards}>
      {rows.map(({ assignment: a, className, submitted, total, averageScore }) => (
        <article className={styles.assignmentCard} key={`mobile-${a.id}`}>
          <div className={styles.cardHead}>
            <Link href={`/admin/assignments/${a.id}`}>{a.title}</Link>
            <Badge tone={a.kind === "test" ? "amber" : "teal"}>{a.kind === "test" ? "Kiểm tra" : "Luyện tập"}</Badge>
          </div>
          <dl className={styles.cardMeta}>
            <div><dt>Lớp</dt><dd>{className}</dd></div>
            <div><dt>Số câu</dt><dd>{a.questions.length}</dd></div>
            <div><dt>Đã nộp</dt><dd>{submitted} / {total}</dd></div>
            <div><dt>Điểm TB</dt><dd>{averageScore === null ? "-" : formatScore(averageScore)}</dd></div>
          </dl>
          <p className={styles.due}>Hạn nộp: {formatDateTime(a.dueAt)}</p>
        </article>
      ))}
    </div>
    </>
  );
}

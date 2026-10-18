"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { LOW_SCORE_THRESHOLD } from "@/lib/constants";
import { formatScore } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import type { GradebookCell, GradebookClass } from "@/types/gradebook";
import styles from "./GradebookView.module.css";

function Cell({ cell }: { cell: GradebookCell }) {
  if (cell.score === null) {
    return cell.status === "missed" ? <Badge tone="amber">Chưa nộp</Badge> : <span className={styles.none}>-</span>;
  }
  const low = cell.score < LOW_SCORE_THRESHOLD;
  return (
    <span className={styles.score}>
      {low ? <Badge tone="amber">{formatScore(cell.score)}</Badge> : <strong>{formatScore(cell.score)}</strong>}
      {cell.status === "pending" ? <span className={styles.pending}> tạm tính</span> : null}
    </span>
  );
}

export function GradebookView({ classes }: { classes: GradebookClass[] }) {
  const [classId, setClassId] = useState(() => classes.find((c) => c.assignments.length > 0)?.id ?? classes[0]?.id ?? "");
  const current = classes.find((c) => c.id === classId);

  return (
    <div className={styles.wrap}>
      <Card>
        <div className={styles.toolbar}>
          <Select
            label="Lớp"
            value={classId}
            options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
            onChange={(e) => setClassId(e.target.value)}
          />
          {current ? (
            <p className={styles.summary} role="status">
              Điểm trung bình bài kiểm tra của lớp:{" "}
              <strong>{current.classTestAverage === null ? "chưa có" : formatScore(current.classTestAverage)}</strong>
            </p>
          ) : null}
        </div>
        <p className={styles.note}>
          Điểm chính thức là điểm bài kiểm tra. Bài luyện tập hiển thị điểm cao nhất để theo dõi tiến độ.
          Điểm trung bình chỉ tính các bài kiểm tra đã nộp. Màu cam là dưới {formatScore(LOW_SCORE_THRESHOLD)}.
        </p>
      </Card>

      <Card>
        {!current || current.assignments.length === 0 ? (
          <EmptyState title="Lớp này chưa có bài tập nào" description="Điểm sẽ hiện ở đây sau khi bạn giao bài." />
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col" className={styles.sticky}>Học sinh</th>
                  {current.assignments.map((a) => (
                    <th key={a.id} scope="col">
                      <Link href={`/admin/assignments/${a.id}`}>{a.title}</Link>
                      <span className={styles.sub}>
                        {a.kind === "test" ? "Kiểm tra" : "Luyện tập"} · {formatDate(a.dueAt.split("T")[0])}
                      </span>
                    </th>
                  ))}
                  <th scope="col">TB kiểm tra</th>
                </tr>
              </thead>
              <tbody>
                {current.rows.map((row) => (
                  <tr key={row.studentId}>
                    <th scope="row" className={styles.sticky}>
                      <Link href={`/admin/students/${row.studentId}`}>{row.studentName}</Link>
                    </th>
                    {current.assignments.map((a) => (
                      <td key={a.id}>
                        <Cell cell={row.cells[a.id]} />
                      </td>
                    ))}
                    <td>
                      {row.testAverage === null ? (
                        <span className={styles.none}>-</span>
                      ) : (
                        <strong>{formatScore(row.testAverage)}</strong>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { formatScore } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import { typeLabel } from "@/lib/question-types";
import { getAssignmentById, getSubmissionRows } from "@/mocks/assignments";
import { getClassById } from "@/mocks/classes";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Chi tiết bài tập | Quản trị" };

const SHOW_LABEL = {
  immediately: "Ngay sau khi nộp",
  after_deadline: "Sau hạn nộp của cả lớp",
  never: "Không hiện đáp án",
} as const;

async function AssignmentDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const assignment = await getAssignmentById(id);
  if (!assignment) notFound();

  const now = new Date();
  const [cls, rows] = await Promise.all([getClassById(assignment.classId), getSubmissionRows(assignment, now)]);
  const totalPoints = assignment.questions.reduce((sum, q) => sum + q.points, 0);
  const isTest = assignment.kind === "test";
  const hasEssay = assignment.questions.some((q) => q.type === "essay");
  const pendingCount = rows.filter((r) => r.pendingManual).length;

  return (
    <>
      <PageHeader
        title={assignment.title}
        subtitle={`Lớp ${cls?.name ?? assignment.classId} · Hạn nộp ${formatDateTime(assignment.dueAt)}`}
        actions={
          <>
            {hasEssay ? (
              <Button
                href={`/admin/assignments/${assignment.id}/grade`}
                variant={pendingCount > 0 ? "primary" : "secondary"}
              >
                {pendingCount > 0 ? `Chấm bài tự luận (${pendingCount} bài chờ)` : "Xem bài tự luận"}
              </Button>
            ) : null}
            <Button href="/admin/assignments">Về danh sách</Button>
          </>
        }
      />

      <Card title="Cài đặt">
        <dl className={styles.info}>
          <div><dt>Loại bài</dt><dd><Badge tone={isTest ? "amber" : "teal"}>{isTest ? "Kiểm tra" : "Luyện tập"}</Badge></dd></div>
          <div><dt>Thời gian làm bài</dt><dd>{assignment.durationMinutes ? `${assignment.durationMinutes} phút` : "Không giới hạn"}</dd></div>
          <div><dt>Số lần làm</dt><dd>{assignment.maxAttempts ?? "Không giới hạn"}</dd></div>
          <div><dt>Hiện đáp án</dt><dd>{SHOW_LABEL[assignment.showAnswers]}</dd></div>
          <div><dt>Số câu</dt><dd>{assignment.questions.length}</dd></div>
          <div><dt>Tổng điểm gốc</dt><dd>{totalPoints}</dd></div>
        </dl>
      </Card>

      <div className={styles.grid}>
        <Card title="Bài nộp của học sinh">
          <Table>
            <thead>
              <tr>
                <th scope="col">Học sinh</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Số lần</th>
                <th scope="col">Điểm cao nhất</th>
                <th scope="col">Nộp lúc</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.studentId}>
                  <td>{row.studentName}</td>
                  <td>
                    {row.attempts === 0 ? (
                      <Badge tone="amber">Chưa làm</Badge>
                    ) : row.pendingManual ? (
                      <Badge tone="amber">Chờ chấm tay</Badge>
                    ) : (
                      <Badge>Đã nộp</Badge>
                    )}
                  </td>
                  <td>{row.attempts}</td>
                  <td>{row.bestScore === null ? "-" : formatScore(row.bestScore)}</td>
                  <td>{row.lastSubmittedAt ? formatDateTime(row.lastSubmittedAt) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card title="Câu hỏi trong bài">
          <ol className={styles.questions}>
            {assignment.questions.map((q) => (
              <li key={q.id} className={styles.question}>
                <span>{q.prompt}</span>
                <Badge>{typeLabel(q.type)}</Badge>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải chi tiết bài...</p>}>
      <AssignmentDetail params={params} />
    </Suspense>
  );
}

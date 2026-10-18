import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { formatScore } from "@/lib/format";
import { formatDateTime } from "@/lib/format-datetime";
import { getStudentAssignments } from "@/mocks/assignments";
import { CURRENT_STUDENT_ID } from "@/mocks/session";

export const metadata: Metadata = { title: "Điểm số | Học sinh" };

async function ScoresContent() {
  await connection();
  const all = await getStudentAssignments(CURRENT_STUDENT_ID, new Date());
  const scored = all.filter((a) => a.bestScore !== null);
  const tests = scored.filter((a) => a.kind === "test");
  const average = tests.length ? tests.reduce((sum, a) => sum + (a.bestScore ?? 0), 0) / tests.length : null;

  return (
    <>
      <StatCard
        label="Điểm trung bình bài kiểm tra"
        value={average === null ? "Chưa có" : formatScore(average)}
        hint={`${tests.length} bài kiểm tra đã nộp`}
      />
      <Card title="Điểm từng bài">
        {scored.length === 0 ? (
          <EmptyState title="Em chưa có điểm nào" description="Làm bài xong, điểm sẽ hiện ở đây." />
        ) : (
          <Table>
            <thead>
              <tr>
                <th scope="col">Bài</th>
                <th scope="col">Loại</th>
                <th scope="col">Hạn nộp</th>
                <th scope="col">Điểm cao nhất</th>
              </tr>
            </thead>
            <tbody>
              {scored.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>
                    <Badge tone={a.kind === "test" ? "amber" : "teal"}>
                      {a.kind === "test" ? "Kiểm tra" : "Luyện tập"}
                    </Badge>
                  </td>
                  <td>{formatDateTime(a.dueAt)}</td>
                  <td>
                    <strong>{formatScore(a.bestScore ?? 0)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--color-muted)" }}>
          Điểm chính thức là điểm bài kiểm tra. Bài có câu tự luận chưa chấm sẽ có điểm tạm tính.
        </p>
      </Card>
    </>
  );
}

export default function StudentScoresPage() {
  return (
    <>
      <PageHeader title="Điểm số" subtitle="Kết quả các bài em đã làm" />
      <Suspense fallback={<p>Đang tải điểm số...</p>}>
        <ScoresContent />
      </Suspense>
    </>
  );
}

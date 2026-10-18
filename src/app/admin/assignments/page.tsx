import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAssignmentStats, getAssignments } from "@/mocks/assignments";
import { getClasses } from "@/mocks/classes";
import { AssignmentTable } from "./_components/AssignmentTable";

export const metadata: Metadata = { title: "Bài tập & kiểm tra | Quản trị" };

async function AssignmentsContent() {
  await connection(); // dữ liệu thay đổi khi học sinh nộp bài
  const now = new Date();
  const [assignments, classes] = await Promise.all([getAssignments(), getClasses()]);
  const rows = await Promise.all(
    assignments.map(async (assignment) => {
      const stats = await getAssignmentStats(assignment, now);
      return {
        assignment,
        className: classes.find((c) => c.id === assignment.classId)?.name ?? assignment.classId,
        submitted: stats.submitted,
        total: stats.total,
        averageScore: stats.averageScore,
      };
    }),
  );

  return (
    <Card>
      <AssignmentTable rows={rows} />
    </Card>
  );
}

export default function AssignmentsPage() {
  return (
    <>
      <PageHeader
        title="Bài tập & kiểm tra"
        subtitle="Dữ liệu mẫu (lưu trong bộ nhớ server, mất khi khởi động lại)"
        actions={
          <Button href="/admin/assignments/new" variant="primary">
            + Tạo bài tập
          </Button>
        }
      />
      <Suspense fallback={<p>Đang tải danh sách bài...</p>}>
        <AssignmentsContent />
      </Suspense>
    </>
  );
}

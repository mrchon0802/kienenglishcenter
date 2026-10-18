import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { getStudentAssignments } from "@/mocks/assignments";
import { CURRENT_STUDENT_ID } from "@/mocks/session";
import { StudentAssignmentList } from "./_components/StudentAssignmentList";

export const metadata: Metadata = { title: "Bài tập | Học sinh" };

async function AssignmentsContent() {
  await connection();
  const all = await getStudentAssignments(CURRENT_STUDENT_ID, new Date());
  const todo = all.filter((a) => a.status === "todo");
  const rest = all.filter((a) => a.status !== "todo");

  return (
    <>
      <Card title="Cần làm">
        <StudentAssignmentList items={todo} emptyTitle="Bạn không còn bài nào cần làm." />
      </Card>
      <Card title="Đã làm hoặc đã quá hạn">
        <StudentAssignmentList items={rest} emptyTitle="Chưa có bài nào." />
      </Card>
    </>
  );
}

export default function StudentAssignmentsPage() {
  return (
    <>
      <PageHeader title="Bài tập" subtitle="Bài luyện tập và bài kiểm tra của lớp bạn" />
      <Suspense fallback={<p>Đang tải danh sách bài...</p>}>
        <AssignmentsContent />
      </Suspense>
    </>
  );
}

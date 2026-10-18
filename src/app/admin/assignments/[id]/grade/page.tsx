import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getAssignmentById, getEssayGradingItems } from "@/mocks/assignments";
import { GradingList } from "../../_components/GradingList";

export const metadata: Metadata = { title: "Chấm bài tự luận | Quản trị" };

async function GradeContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const assignment = await getAssignmentById(id);
  if (!assignment) notFound();

  const items = await getEssayGradingItems(assignment);

  return (
    <>
      <PageHeader
        title="Chấm bài tự luận"
        subtitle={assignment.title}
        actions={<Button href={`/admin/assignments/${id}`}>Về chi tiết bài</Button>}
      />
      <GradingList items={items} />
    </>
  );
}

export default function GradePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải các bài cần chấm...</p>}>
      <GradeContent params={params} />
    </Suspense>
  );
}

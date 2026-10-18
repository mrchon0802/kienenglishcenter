import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Button } from "@/components/ui/Button";
import { getStudentAssignmentView } from "@/mocks/student-view";
import { CURRENT_STUDENT_ID } from "@/mocks/session";

export const metadata: Metadata = { title: "Làm bài | Học sinh" };

async function AssignmentContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const view = await getStudentAssignmentView(id, CURRENT_STUDENT_ID, new Date());
  if (!view) notFound();

  return (
    <>
      <PageHeader
        title={view.info.title}
        actions={<Button href="/student/assignments">Về danh sách bài</Button>}
      />
      <QuizRunner
        key={id}
        info={view.info}
        questions={view.questions}
        lastResult={view.lastResult}
        canAttempt={view.canAttempt}
        blockedReason={view.blockedReason}
      />
    </>
  );
}

export default function StudentAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải bài...</p>}>
      <AssignmentContent params={params} />
    </Suspense>
  );
}

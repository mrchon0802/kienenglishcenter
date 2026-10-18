import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuestionEditor } from "@/components/question-editor/QuestionEditor";
import { getQuestionById } from "@/mocks/questions";

export const metadata: Metadata = { title: "Sửa câu hỏi | Quản trị" };

async function EditQuestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await getQuestionById(id);
  if (!question) notFound();

  return (
    <>
      <PageHeader title="Sửa câu hỏi" subtitle={`Mã ${question.id}`} />
      <QuestionEditor key={question.id} mode="edit" initial={question} />
    </>
  );
}

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải câu hỏi...</p>}>
      <EditQuestion params={params} />
    </Suspense>
  );
}

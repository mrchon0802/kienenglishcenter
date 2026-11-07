import type { Metadata } from "next";
import { QuestionEditor } from "@/components/question-editor/QuestionEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCurricula } from "@/mocks/curricula";
import { createEmptyQuestion } from "@/lib/question-types";

export const metadata: Metadata = { title: "Tạo câu hỏi | Quản trị" };

export default async function NewQuestionPage() {
  const curricula = await getCurricula();
  return (
    <>
      <PageHeader title="Tạo câu hỏi" subtitle="Soạn câu hỏi và xem trước đúng như học sinh sẽ thấy" />
      <QuestionEditor mode="new" initial={createEmptyQuestion("mcq")} curricula={curricula} />
    </>
  );
}

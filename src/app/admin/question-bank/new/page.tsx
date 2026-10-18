import type { Metadata } from "next";
import { QuestionEditor } from "@/components/question-editor/QuestionEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { createEmptyQuestion } from "@/lib/question-types";

export const metadata: Metadata = { title: "Tạo câu hỏi | Quản trị" };

export default function NewQuestionPage() {
  return (
    <>
      <PageHeader title="Tạo câu hỏi" subtitle="Soạn câu hỏi và xem trước đúng như học sinh sẽ thấy" />
      <QuestionEditor mode="new" initial={createEmptyQuestion("mcq")} />
    </>
  );
}

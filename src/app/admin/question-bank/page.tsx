import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getQuestions } from "@/mocks/questions";
import { QuestionBankView } from "./_components/QuestionBankView";

export const metadata: Metadata = { title: "Ngân hàng câu hỏi | Quản trị" };

export default async function QuestionBankPage() {
  const questions = await getQuestions();

  return (
    <>
      <PageHeader
        title="Ngân hàng câu hỏi"
        subtitle={`${questions.length} câu hỏi · Dữ liệu mẫu`}
        actions={
          <Button href="/admin/question-bank/new" variant="primary">
            + Tạo câu hỏi
          </Button>
        }
      />
      <QuestionBankView questions={questions} />
    </>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getQuestions } from "@/mocks/questions";
import { getTeachers } from "@/mocks/teachers";
import { QuestionBankView } from "./_components/QuestionBankView";

export const metadata: Metadata = { title: "Ngân hàng câu hỏi | Quản trị" };

export default async function QuestionBankPage() {
  const [questions, teachers] = await Promise.all([getQuestions(), getTeachers()]);

  return (
    <>
      <PageHeader
        title="Ngân hàng câu hỏi"
        subtitle={`${questions.length} câu hỏi · Kho học liệu trung tâm; Admin xem toàn bộ câu hỏi.`}
        actions={
          <>
            <Button href="/admin/question-bank/import">Nhập từ Excel</Button>
            <Button href="/admin/question-bank/new" variant="primary">
              + Tạo câu hỏi
            </Button>
          </>
        }
      />
      <QuestionBankView questions={questions} teachers={teachers} />
    </>
  );
}

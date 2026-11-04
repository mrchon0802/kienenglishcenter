import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { QuestionImport } from "../_components/QuestionImport";

export const metadata: Metadata = { title: "Nhập câu hỏi từ Excel | Quản trị" };

export default function ImportQuestionsPage() {
  return (
    <>
      <PageHeader
        title="Nhập câu hỏi từ Excel"
        subtitle="Thêm nhiều câu hỏi cùng lúc từ file .xlsx hoặc .csv"
        actions={<Button href="/admin/question-bank">Về ngân hàng câu hỏi</Button>}
      />
      <QuestionImport />
    </>
  );
}

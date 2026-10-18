import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClasses } from "@/mocks/classes";
import { getQuestions } from "@/mocks/questions";
import { AssignmentForm } from "../_components/AssignmentForm";

export const metadata: Metadata = { title: "Tạo bài tập | Quản trị" };

export default async function NewAssignmentPage() {
  const [classes, questions] = await Promise.all([getClasses(), getQuestions()]);

  return (
    <>
      <PageHeader title="Tạo bài tập" subtitle="Chọn câu hỏi từ ngân hàng, bằng tay hoặc rút ngẫu nhiên" />
      <AssignmentForm
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        questions={questions.filter((q) => q.status === "active")}
      />
    </>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClasses } from "@/mocks/classes";
import { getQuestions } from "@/mocks/questions";
import { getCurricula } from "@/mocks/curricula";
import { AssignmentForm } from "../_components/AssignmentForm";

export const metadata: Metadata = { title: "Tạo bài tập | Quản trị" };

export default async function NewAssignmentPage() {
  const [classes, questions, curricula] = await Promise.all([getClasses(), getQuestions(), getCurricula()]);

  return (
    <>
      <PageHeader title="Tạo bài tập" subtitle="Chọn câu hỏi từ ngân hàng, bằng tay hoặc rút ngẫu nhiên" />
      <AssignmentForm
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        questions={questions.filter((q) => q.status === "active")}
        curricula={curricula.filter((item) => item.status === "active")}
      />
    </>
  );
}

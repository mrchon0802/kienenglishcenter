import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getGradebook } from "@/mocks/gradebook";
import { GradebookView } from "./_components/GradebookView";

export const metadata: Metadata = { title: "Bảng điểm | Quản trị" };

async function GradebookContent() {
  await connection(); // điểm thay đổi khi học sinh nộp bài hoặc giáo viên chấm tay
  const classes = await getGradebook(new Date());
  return <GradebookView classes={classes} />;
}

export default function GradebookPage() {
  return (
    <>
      <PageHeader title="Bảng điểm" subtitle="Điểm của học sinh theo từng lớp · Dữ liệu mẫu" />
      <Suspense fallback={<p>Đang tải bảng điểm...</p>}>
        <GradebookContent />
      </Suspense>
    </>
  );
}

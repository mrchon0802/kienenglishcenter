import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCourses } from "@/mocks/courses";
import { getCurriculumById } from "@/mocks/curricula";
import { CurriculumForm } from "../../_components/CurriculumForm";

export const metadata = { title: "Chỉnh sửa giáo trình | Quản trị" };

async function EditCurriculum({ id }: { id: string }) {
  await connection();
  const [curriculum, courses] = await Promise.all([getCurriculumById(id), getCourses()]);
  if (!curriculum) notFound();
  return <>
    <PageHeader title={`Chỉnh sửa ${curriculum.title}`} subtitle="Cập nhật Unit, Lesson, mục tiêu và tài liệu giảng dạy." />
    <CurriculumForm curriculum={curriculum} courses={courses} />
  </>;
}

async function EditCurriculumParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditCurriculum id={id} />;
}

export default function EditCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p>Đang tải giáo trình...</p>}><EditCurriculumParams params={params} /></Suspense>;
}

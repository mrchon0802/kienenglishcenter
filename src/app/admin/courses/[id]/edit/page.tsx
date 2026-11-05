import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCourseById } from "@/mocks/courses";
import { CourseForm } from "../../_components/CourseForm";

export const metadata = { title: "Chỉnh sửa khóa học | Quản trị" };

async function EditCourse({ id }: { id: string }) {
  await connection();
  const course = await getCourseById(id);
  if (!course) notFound();
  return <><PageHeader title={`Chỉnh sửa ${course.name}`} subtitle="Cập nhật thông tin và chương trình học." /><CourseForm course={course} /></>;
}

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense fallback={<p>Đang tải khóa học...</p>}><EditCourse id={id} /></Suspense>;
}

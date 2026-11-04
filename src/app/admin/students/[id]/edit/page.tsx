import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getClassOptions, getStudentById } from "@/mocks/students";
import { StudentForm } from "../../_components/StudentForm";

export const metadata: Metadata = { title: "Sửa học sinh | Quản trị" };

async function EditStudent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [student, classes] = await Promise.all([getStudentById(id), getClassOptions()]);
  if (!student) notFound();

  return (
    <>
      <PageHeader title={`Sửa: ${student.fullName}`} subtitle={`Mã ${student.code}`} />
      <StudentForm key={student.id} mode="edit" student={student} classes={classes} />
    </>
  );
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Đang tải thông tin học sinh...</p>}>
      <EditStudent params={params} />
    </Suspense>
  );
}
